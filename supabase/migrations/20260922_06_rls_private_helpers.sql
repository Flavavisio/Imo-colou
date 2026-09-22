-- Vigia Cloud: allow authenticated RLS policies to call private role helpers.
-- Applied to Supabase project tegwpmtylwivktuuktpo on 2026-09-22.

grant usage on schema private to authenticated;
grant execute on function private.is_platform_admin(uuid) to authenticated;
grant execute on function private.reseller_role(uuid,uuid) to authenticated;
grant execute on function private.client_role(uuid,uuid) to authenticated;
grant execute on function private.effective_camera_limit(uuid) to authenticated;
grant execute on function private.reseller_license_allows_camera(uuid,uuid) to authenticated;

revoke all on function private.sync_auth_user() from public, anon, authenticated;
