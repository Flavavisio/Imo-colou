-- Vigia Cloud v6 normalized domain model.
-- Applies on top of the initial tenant/auth foundation in supabase/schema.sql.

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'active' check (status in ('active','paused')),
  retention integer not null check (retention between 1 and 365),
  camera_limit integer not null check (camera_limit between 1 and 100000),
  price numeric not null default 0 check (price between 0 and 100000),
  original boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.camera_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'active' check (status in ('active','paused')),
  retention integer not null check (retention between 1 and 365),
  price numeric not null default 0 check (price between 0 and 100000),
  max_resolution text not null check (max_resolution in ('1080p','2K','4K')),
  max_clip_seconds integer not null check (max_clip_seconds between 5 and 600),
  monthly_gb numeric not null check (monthly_gb between 0.1 and 10000),
  original boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.resellers
  add column if not exists email text,
  add column if not exists phone text not null default '',
  add column if not exists plan_id uuid references public.plans(id) on delete restrict,
  add column if not exists brand text,
  add column if not exists color text not null default '#2563eb',
  add column if not exists support text not null default '',
  add column if not exists logo_id uuid,
  add column if not exists wallet_limit integer,
  add column if not exists license_mode text not null default 'paid',
  add column if not exists valid_until date,
  add column if not exists trial_camera_limit integer not null default 2,
  add column if not exists status text not null default 'active';

alter table public.clients
  add column if not exists phone text not null default '',
  add column if not exists status text not null default 'active';

alter table public.installations
  add column if not exists status text not null default 'active';

alter table public.cameras
  add column if not exists status text not null default 'active',
  add column if not exists manufacturer text not null default '',
  add column if not exists codec text not null default 'auto',
  add column if not exists event_type text not null default 'motion',
  add column if not exists notes text not null default '',
  add column if not exists camera_plan_id uuid references public.camera_plans(id) on delete restrict,
  add column if not exists sale_price numeric,
  add column if not exists connection_mode text not null default 'imou',
  add column if not exists local_host text not null default '',
  add column if not exists rtsp_port integer not null default 554,
  add column if not exists rtsp_path text not null default '',
  add column if not exists local_test jsonb;

-- The existing external_device_id/external_channel_id columns are the normalized
-- equivalents of v6 imouDeviceId/imouChannelId.
create unique index if not exists cameras_imou_device_channel_uidx
  on public.cameras(external_device_id, external_channel_id)
  where connection_mode='imou' and external_device_id is not null and external_device_id <> '';
create index if not exists cameras_camera_plan_idx on public.cameras(camera_plan_id);
create index if not exists resellers_plan_idx on public.resellers(plan_id);

create table if not exists public.reseller_sale_prices (
  reseller_id uuid not null references public.resellers(id) on delete cascade,
  camera_plan_id uuid not null references public.camera_plans(id) on delete restrict,
  price numeric not null check (price between 0 and 100000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (reseller_id,camera_plan_id)
);
create index if not exists reseller_sale_prices_plan_idx on public.reseller_sale_prices(camera_plan_id);

create table if not exists public.activity_log (
  id bigint generated always as identity primary key,
  reseller_id uuid references public.resellers(id) on delete cascade,
  actor_user_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  detail text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists activity_log_reseller_created_idx on public.activity_log(reseller_id,created_at desc);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  reseller_id uuid not null,
  client_id uuid not null,
  installation_id uuid not null,
  camera_id uuid not null references public.cameras(id) on delete cascade,
  event_type text not null check (event_type in ('motion','person','vehicle','other')),
  provider text not null check (provider in ('imou','local','other')),
  provider_event_id text,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  status text not null default 'metadata_only' check (status in ('metadata_only','clip_pending','clip_ready','failed')),
  clip_path text,
  thumbnail_path text,
  clip_seconds integer,
  metadata jsonb not null default '{}'::jsonb,
  foreign key (installation_id,reseller_id,client_id)
    references public.installations(id,reseller_id,client_id) on delete cascade
);
create index if not exists events_camera_occurred_idx on public.events(camera_id,occurred_at desc);
create index if not exists events_reseller_occurred_idx on public.events(reseller_id,occurred_at desc);
create unique index if not exists events_provider_event_uidx on public.events(provider,provider_event_id) where provider_event_id is not null;

create or replace function private.is_platform_admin(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.platform_admins pa where pa.user_id=uid); $$;

create or replace function private.reseller_role(rid uuid,uid uuid default auth.uid())
returns text language sql stable security definer set search_path=''
as $$ select rm.role from public.reseller_members rm where rm.reseller_id=rid and rm.user_id=uid limit 1; $$;

create or replace function private.client_role(cid uuid,uid uuid default auth.uid())
returns text language sql stable security definer set search_path=''
as $$ select cm.role from public.client_members cm where cm.client_id=cid and cm.user_id=uid limit 1; $$;

create or replace function private.effective_camera_limit(rid uuid)
returns integer language sql stable security definer set search_path=''
as $$
  select case when r.license_mode='trial' then r.trial_camera_limit else coalesce(r.wallet_limit,p.camera_limit) end
  from public.resellers r left join public.plans p on p.id=r.plan_id where r.id=rid;
$$;

create or replace function private.reseller_license_allows_camera(rid uuid,existing_camera uuid default null)
returns boolean language sql stable security definer set search_path=''
as $$
  select r.status='active'
    and (r.valid_until is null or r.valid_until>=current_date)
    and (private.effective_camera_limit(rid) is null or (
      select count(*) from public.cameras c where c.reseller_id=rid and (existing_camera is null or c.id<>existing_camera)
    ) < private.effective_camera_limit(rid))
  from public.resellers r where r.id=rid;
$$;

revoke all on function private.is_platform_admin(uuid) from public,anon,authenticated;
revoke all on function private.reseller_role(uuid,uuid) from public,anon,authenticated;
revoke all on function private.client_role(uuid,uuid) from public,anon,authenticated;
revoke all on function private.effective_camera_limit(uuid) from public,anon,authenticated;
revoke all on function private.reseller_license_allows_camera(uuid,uuid) from public,anon,authenticated;

alter table public.plans enable row level security;
alter table public.camera_plans enable row level security;
alter table public.reseller_sale_prices enable row level security;
alter table public.activity_log enable row level security;
alter table public.events enable row level security;

grant select,insert,update,delete on public.plans to authenticated;
grant select,insert,update,delete on public.camera_plans to authenticated;
grant select,insert,update,delete on public.reseller_sale_prices to authenticated;
grant select on public.activity_log to authenticated;
grant select on public.events to authenticated;

create policy plans_select on public.plans for select to authenticated using (true);
create policy plans_insert on public.plans for insert to authenticated with check (private.is_platform_admin());
create policy plans_update on public.plans for update to authenticated using (private.is_platform_admin()) with check (private.is_platform_admin());
create policy plans_delete on public.plans for delete to authenticated using (private.is_platform_admin());

create policy camera_plans_select on public.camera_plans for select to authenticated using (true);
create policy camera_plans_insert on public.camera_plans for insert to authenticated with check (private.is_platform_admin());
create policy camera_plans_update on public.camera_plans for update to authenticated using (private.is_platform_admin()) with check (private.is_platform_admin());
create policy camera_plans_delete on public.camera_plans for delete to authenticated using (private.is_platform_admin());

create policy reseller_sale_prices_select on public.reseller_sale_prices for select to authenticated
using (private.is_platform_admin() or private.reseller_role(reseller_id) is not null);
create policy reseller_sale_prices_insert on public.reseller_sale_prices for insert to authenticated
with check (private.is_platform_admin() or private.reseller_role(reseller_id) in ('owner','admin'));
create policy reseller_sale_prices_update on public.reseller_sale_prices for update to authenticated
using (private.is_platform_admin() or private.reseller_role(reseller_id) in ('owner','admin'))
with check (private.is_platform_admin() or private.reseller_role(reseller_id) in ('owner','admin'));
create policy reseller_sale_prices_delete on public.reseller_sale_prices for delete to authenticated
using (private.is_platform_admin() or private.reseller_role(reseller_id) in ('owner','admin'));

create policy activity_log_select on public.activity_log for select to authenticated
using (private.is_platform_admin() or (reseller_id is not null and private.reseller_role(reseller_id) is not null));
create policy events_select on public.events for select to authenticated
using (private.is_platform_admin() or private.reseller_role(reseller_id) is not null or private.client_role(client_id) is not null);
