-- Vigia Cloud: change bootstrap Super Admin email
-- Applied to Supabase project tegwpmtylwivktuuktpo on 2026-09-22.

delete from private.bootstrap_admin_emails
where email in ('flavio.rosa87@gmail.com','flavio.a.rosa87@gmail.com');

insert into private.bootstrap_admin_emails(email)
values ('flavio.rosa87@icloud.com')
on conflict (email) do nothing;

insert into public.platform_admins(user_id)
select id
from public.profiles
where lower(email) = 'flavio.rosa87@icloud.com'
on conflict (user_id) do nothing;

delete from public.platform_admins pa
using public.profiles p
where pa.user_id = p.id
  and lower(p.email) in ('flavio.rosa87@gmail.com','flavio.a.rosa87@gmail.com');
