-- Vigia Cloud: performance/RLS follow-up
-- Applied to Supabase project tegwpmtylwivktuuktpo on 2026-09-21.

create index if not exists activity_log_actor_idx
  on public.activity_log(actor_user_id);

create index if not exists events_installation_hierarchy_idx
  on public.events(installation_id, reseller_id, client_id);

drop policy if exists resellers_select on public.resellers;
create policy resellers_select
on public.resellers for select to authenticated
using (
  private.is_platform_admin()
  or private.reseller_role(id) is not null
  or exists (
    select 1
    from public.client_members cm
    where cm.reseller_id = resellers.id
      and cm.user_id = (select auth.uid())
  )
);

drop policy if exists reseller_members_select on public.reseller_members;
create policy reseller_members_select
on public.reseller_members for select to authenticated
using (
  private.is_platform_admin()
  or user_id = (select auth.uid())
  or private.reseller_role(reseller_id) in ('owner','admin')
);

drop policy if exists client_members_select on public.client_members;
create policy client_members_select
on public.client_members for select to authenticated
using (
  private.is_platform_admin()
  or user_id = (select auth.uid())
  or private.reseller_role(reseller_id) in ('owner','admin')
  or private.client_role(client_id) in ('owner','admin')
);
