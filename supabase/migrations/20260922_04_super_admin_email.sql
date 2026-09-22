-- Vigia Cloud: change bootstrap Super Admin email
-- Applied to Supabase project tegwpmtylwivktuuktpo on 2026-09-22.

delete from private.bootstrap_admin_emails
where email = 'flavio.rosa87@gmail.com';

insert into private.bootstrap_admin_emails(email)
values ('flavio.a.rosa87@gmail.com')
on conflict (email) do nothing;
