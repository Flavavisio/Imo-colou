-- Vigia Cloud: event-only recorder queue, Vault credentials and private clip storage.
-- Applied to Supabase project tegwpmtylwivktuuktpo on 2026-09-22.

create table if not exists public.clip_jobs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references public.events(id) on delete cascade,
  reseller_id uuid not null references public.resellers(id) on delete cascade,
  camera_id uuid not null references public.cameras(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','processing','done','failed')),
  clip_seconds integer not null default 30 check (clip_seconds between 5 and 120),
  attempts integer not null default 0 check (attempts between 0 and 20),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  worker_id text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clip_jobs enable row level security;
revoke all on table public.clip_jobs from public, anon, authenticated;
grant select, insert, update, delete on table public.clip_jobs to service_role;

create index if not exists clip_jobs_pending_idx
  on public.clip_jobs(status,available_at,created_at)
  where status in ('pending','failed');

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('event-clips','event-clips',false,104857600,array['video/mp4'])
on conflict (id) do update
set public=false,file_size_limit=104857600,allowed_mime_types=array['video/mp4'];

create or replace function public.vigia_upsert_imou_secret(p_reseller_id uuid,p_secret text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_name text := 'vigia_imou_' || p_reseller_id::text; v_id uuid;
begin
  if p_secret is null or length(p_secret)<1 or length(p_secret)>300 then raise exception 'invalid secret'; end if;
  select s.id into v_id from vault.secrets s where s.name=v_name limit 1;
  if v_id is null then
    select vault.create_secret(p_secret,v_name,'Vigia Cloud Imou App Secret') into v_id;
  else
    perform vault.update_secret(v_id,p_secret,v_name,'Vigia Cloud Imou App Secret');
  end if;
  return v_id;
end $$;

create or replace function public.vigia_delete_imou_secret(p_reseller_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
  select s.id into v_id from vault.secrets s where s.name='vigia_imou_'||p_reseller_id::text limit 1;
  if v_id is not null then delete from vault.secrets where id=v_id; end if;
end $$;

create or replace function public.vigia_claim_clip_job(p_worker_id text)
returns table(job_id uuid,event_id uuid,reseller_id uuid,camera_id uuid,device_id text,channel_id text,app_id text,region text,app_secret text,clip_seconds integer)
language plpgsql security definer set search_path='' as $$
declare v_job public.clip_jobs%rowtype;
begin
  if p_worker_id is null or length(p_worker_id)<1 or length(p_worker_id)>120 then raise exception 'invalid worker'; end if;
  select * into v_job from public.clip_jobs j
  where (
    j.status='pending'
    or (j.status='failed' and j.attempts<5 and j.available_at<=now())
    or (j.status='processing' and j.locked_at<now()-interval '5 minutes' and j.attempts<5)
  )
  and j.available_at<=now()
  order by j.created_at
  for update skip locked limit 1;
  if v_job.id is null then return; end if;
  update public.clip_jobs set status='processing',attempts=attempts+1,locked_at=now(),worker_id=p_worker_id,updated_at=now(),last_error=null where id=v_job.id;
  return query
  select j.id,j.event_id,j.reseller_id,j.camera_id,c.external_device_id,coalesce(c.external_channel_id,'0'),
         cfg.app_id,cfg.region,ds.decrypted_secret,j.clip_seconds
  from public.clip_jobs j
  join public.cameras c on c.id=j.camera_id
  join public.imou_callback_configs cfg on cfg.reseller_id=j.reseller_id and cfg.active=true
  left join vault.decrypted_secrets ds on ds.name='vigia_imou_'||j.reseller_id::text
  where j.id=v_job.id;
end $$;

create or replace function public.vigia_finish_clip_job(p_job_id uuid,p_worker_id text,p_ok boolean,p_clip_path text default null,p_error text default null)
returns void language plpgsql security definer set search_path='' as $$
declare v_event_id uuid; v_attempts integer;
begin
  select event_id,attempts into v_event_id,v_attempts from public.clip_jobs
  where id=p_job_id and worker_id=p_worker_id and status='processing' for update;
  if v_event_id is null then raise exception 'job not owned'; end if;
  if p_ok then
    update public.clip_jobs set status='done',updated_at=now(),locked_at=null,last_error=null where id=p_job_id;
    update public.events set status='clip_ready',clip_path=p_clip_path where id=v_event_id;
  else
    update public.clip_jobs
    set status='failed',available_at=now()+make_interval(secs=>least(300,15*greatest(1,v_attempts))),updated_at=now(),locked_at=null,last_error=left(coalesce(p_error,'unknown error'),1000)
    where id=p_job_id;
    update public.events set status=case when v_attempts>=5 then 'failed' else 'clip_pending' end where id=v_event_id;
  end if;
end $$;

revoke all on function public.vigia_upsert_imou_secret(uuid,text) from public,anon,authenticated;
revoke all on function public.vigia_delete_imou_secret(uuid) from public,anon,authenticated;
revoke all on function public.vigia_claim_clip_job(text) from public,anon,authenticated;
revoke all on function public.vigia_finish_clip_job(uuid,text,boolean,text,text) from public,anon,authenticated;
grant execute on function public.vigia_upsert_imou_secret(uuid,text) to service_role;
grant execute on function public.vigia_delete_imou_secret(uuid) to service_role;
grant execute on function public.vigia_claim_clip_job(text) to service_role;
grant execute on function public.vigia_finish_clip_job(uuid,text,boolean,text,text) to service_role;
