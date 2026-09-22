-- Vigia Cloud: secure Imou callbacks and event ingestion.
-- Applied to Supabase project tegwpmtylwivktuuktpo on 2026-09-22.

create table if not exists public.imou_callback_configs (
  reseller_id uuid primary key references public.resellers(id) on delete cascade,
  token_hash text not null unique,
  app_id text not null,
  region text not null check (region in ('eu','us','sg')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.imou_event_tokens (
  event_id uuid primary key references public.events(id) on delete cascade,
  record_token text not null,
  created_at timestamptz not null default now()
);

alter table public.imou_callback_configs enable row level security;
alter table public.imou_event_tokens enable row level security;
revoke all on table public.imou_callback_configs from public, anon, authenticated;
revoke all on table public.imou_event_tokens from public, anon, authenticated;

alter table public.cameras
  add column if not exists online_status text not null default 'unknown'
    check (online_status in ('online','offline','unknown')),
  add column if not exists provider_status_at timestamptz,
  add column if not exists last_event_at timestamptz;

create index if not exists cameras_online_status_idx on public.cameras(reseller_id,online_status);
create index if not exists cameras_last_event_idx on public.cameras(reseller_id,last_event_at desc);
drop index if exists public.imou_callback_configs_app_idx;
create unique index if not exists imou_callback_configs_app_uidx on public.imou_callback_configs(app_id);

drop policy if exists plans_select on public.plans;
create policy plans_select on public.plans for select to authenticated
using (
  private.is_platform_admin()
  or exists (
    select 1 from public.resellers r
    join public.reseller_members rm on rm.reseller_id=r.id
    where r.plan_id=plans.id and rm.user_id=(select auth.uid())
  )
);

drop policy if exists camera_plans_select on public.camera_plans;
create policy camera_plans_select on public.camera_plans for select to authenticated
using (
  private.is_platform_admin()
  or exists (
    select 1 from public.reseller_members rm
    where rm.user_id=(select auth.uid())
  )
);
