-- Vigia Cloud: normalized frontend activity logging
-- Applied to Supabase project tegwpmtylwivktuuktpo on 2026-09-22.

grant insert on table public.activity_log to authenticated;

drop policy if exists activity_log_insert on public.activity_log;
create policy activity_log_insert
on public.activity_log for insert to authenticated
with check (
  actor_user_id = (select auth.uid())
  and private.is_platform_admin()
);
