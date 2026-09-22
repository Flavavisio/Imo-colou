-- Vigia Cloud: allow reseller operators to write tenant-scoped activity.
-- Applied to Supabase project tegwpmtylwivktuuktpo on 2026-09-22.

drop policy if exists activity_log_insert on public.activity_log;
create policy activity_log_insert
on public.activity_log for insert to authenticated
with check (
  actor_user_id = (select auth.uid())
  and (
    private.is_platform_admin()
    or (
      reseller_id is not null
      and private.reseller_role(reseller_id) in ('owner','admin','operator')
    )
  )
);
