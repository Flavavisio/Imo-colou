-- Transitional persistence layer for a zero-break D1 -> Supabase cutover.
-- It keeps the exact v6 workspace JSON contract while normalized tables are migrated module-by-module.

create table if not exists public.workspace_snapshots (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  records jsonb not null default '{"cameraPlans":[],"plans":[],"resellers":[],"clients":[],"locations":[],"cameras":[]}'::jsonb,
  activity jsonb not null default '[]'::jsonb,
  revision bigint not null default 0 check (revision>=0),
  updated_at timestamptz not null default now(),
  constraint workspace_snapshots_records_object check (jsonb_typeof(records)='object'),
  constraint workspace_snapshots_activity_array check (jsonb_typeof(activity)='array')
);

alter table public.workspace_snapshots enable row level security;
revoke all on public.workspace_snapshots from anon,authenticated;
grant select,insert,update on public.workspace_snapshots to authenticated;

create policy workspace_snapshots_select on public.workspace_snapshots for select to authenticated
using (user_id=(select auth.uid()) and private.is_platform_admin());
create policy workspace_snapshots_insert on public.workspace_snapshots for insert to authenticated
with check (user_id=(select auth.uid()) and private.is_platform_admin());
create policy workspace_snapshots_update on public.workspace_snapshots for update to authenticated
using (user_id=(select auth.uid()) and private.is_platform_admin()) with check (user_id=(select auth.uid()) and private.is_platform_admin());
