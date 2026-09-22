-- Vigia Cloud Supabase foundation
-- This file documents the schema already applied to project tegwpmtylwivktuuktpo.
-- It intentionally contains no application seed data.

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon, authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists profiles_email_lower_idx on public.profiles (lower(email));

create table if not exists public.platform_admins (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.resellers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  primary_color text,
  secondary_color text,
  currency text not null default 'EUR' check (char_length(currency) = 3),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reseller_members (
  reseller_id uuid not null references public.resellers(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'admin' check (role in ('owner','admin','operator','viewer')),
  created_at timestamptz not null default now(),
  primary key (reseller_id, user_id)
);
create index if not exists reseller_members_user_idx on public.reseller_members(user_id);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  reseller_id uuid not null references public.resellers(id) on delete cascade,
  name text not null,
  code text,
  email text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, reseller_id)
);
create index if not exists clients_reseller_idx on public.clients(reseller_id);

create table if not exists public.client_members (
  client_id uuid not null,
  reseller_id uuid not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'viewer' check (role in ('owner','admin','viewer')),
  created_at timestamptz not null default now(),
  primary key (client_id, user_id),
  foreign key (client_id, reseller_id)
    references public.clients(id, reseller_id)
    on delete cascade
);
create index if not exists client_members_user_idx on public.client_members(user_id);
create index if not exists client_members_reseller_idx on public.client_members(reseller_id);
create index if not exists client_members_client_reseller_idx on public.client_members(client_id, reseller_id);

create table if not exists public.installations (
  id uuid primary key default gen_random_uuid(),
  reseller_id uuid not null,
  client_id uuid not null,
  name text not null,
  address text,
  postal_code text,
  city text,
  country text not null default 'PT',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, reseller_id, client_id),
  foreign key (client_id, reseller_id)
    references public.clients(id, reseller_id)
    on delete cascade
);
create index if not exists installations_reseller_idx on public.installations(reseller_id);
create index if not exists installations_client_idx on public.installations(client_id);
create index if not exists installations_client_reseller_idx on public.installations(client_id, reseller_id);

create table if not exists public.cameras (
  id uuid primary key default gen_random_uuid(),
  reseller_id uuid not null,
  client_id uuid not null,
  installation_id uuid not null,
  name text not null,
  provider text not null default 'other' check (provider in ('imou','rtsp','onvif','other')),
  external_device_id text,
  external_channel_id text,
  model text,
  serial_number text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (installation_id, reseller_id, client_id)
    references public.installations(id, reseller_id, client_id)
    on delete cascade
);
create index if not exists cameras_reseller_idx on public.cameras(reseller_id);
create index if not exists cameras_client_idx on public.cameras(client_id);
create index if not exists cameras_installation_idx on public.cameras(installation_id);
create index if not exists cameras_installation_hierarchy_idx
  on public.cameras(installation_id, reseller_id, client_id);

create table if not exists private.bootstrap_admin_emails (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);
insert into private.bootstrap_admin_emails(email)
values ('flavio.rosa87@icloud.com')
on conflict (email) do nothing;

create or replace function private.sync_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is null then
    return new;
  end if;

  insert into public.profiles(id, email, display_name)
  values (
    new.id,
    lower(new.email),
    nullif(coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name'), '')
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(excluded.display_name, public.profiles.display_name),
        updated_at = now();

  if new.email_confirmed_at is not null
     and exists (
       select 1 from private.bootstrap_admin_emails b
       where b.email = lower(new.email)
     ) then
    insert into public.platform_admins(user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;
revoke all on function private.sync_auth_user() from public, anon, authenticated;

drop trigger if exists vigia_sync_auth_user on auth.users;
create trigger vigia_sync_auth_user
after insert or update of email, email_confirmed_at, raw_user_meta_data
on auth.users
for each row execute function private.sync_auth_user();

alter table public.profiles enable row level security;
alter table public.platform_admins enable row level security;
alter table public.resellers enable row level security;
alter table public.reseller_members enable row level security;
alter table public.clients enable row level security;
alter table public.client_members enable row level security;
alter table public.installations enable row level security;
alter table public.cameras enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.platform_admins from anon, authenticated;
revoke all on table public.resellers from anon, authenticated;
revoke all on table public.reseller_members from anon, authenticated;
revoke all on table public.clients from anon, authenticated;
revoke all on table public.client_members from anon, authenticated;
revoke all on table public.installations from anon, authenticated;
revoke all on table public.cameras from anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (display_name, updated_at) on table public.profiles to authenticated;
grant select on table public.platform_admins to authenticated;
grant select, insert, update, delete on table public.resellers to authenticated;
grant select on table public.reseller_members to authenticated;
grant select, insert, update, delete on table public.clients to authenticated;
grant select on table public.client_members to authenticated;
grant select, insert, update, delete on table public.installations to authenticated;
grant select, insert, update, delete on table public.cameras to authenticated;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or exists (select 1 from public.platform_admins pa where pa.user_id = (select auth.uid()))
);

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
using (
  id = (select auth.uid())
  or exists (select 1 from public.platform_admins pa where pa.user_id = (select auth.uid()))
)
with check (
  id = (select auth.uid())
  or exists (select 1 from public.platform_admins pa where pa.user_id = (select auth.uid()))
);

drop policy if exists platform_admins_select_self on public.platform_admins;
create policy platform_admins_select_self on public.platform_admins for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists resellers_select on public.resellers;
create policy resellers_select on public.resellers for select to authenticated
using (
  exists (select 1 from public.platform_admins pa where pa.user_id = (select auth.uid()))
  or exists (
    select 1 from public.reseller_members rm
    where rm.reseller_id = resellers.id and rm.user_id = (select auth.uid())
  )
  or exists (
    select 1 from public.client_members cm
    where cm.reseller_id = resellers.id and cm.user_id = (select auth.uid())
  )
);

drop policy if exists resellers_insert on public.resellers;
create policy resellers_insert on public.resellers for insert to authenticated
with check (
  exists (select 1 from public.platform_admins pa where pa.user_id = (select auth.uid()))
);

drop policy if exists resellers_update on public.resellers;
create policy resellers_update on public.resellers for update to authenticated
using (
  exists (select 1 from public.platform_admins pa where pa.user_id = (select auth.uid()))
  or exists (
    select 1 from public.reseller_members rm
    where rm.reseller_id = resellers.id
      and rm.user_id = (select auth.uid())
      and rm.role in ('owner','admin')
  )
)
with check (
  exists (select 1 from public.platform_admins pa where pa.user_id = (select auth.uid()))
  or exists (
    select 1 from public.reseller_members rm
    where rm.reseller_id = resellers.id
      and rm.user_id = (select auth.uid())
      and rm.role in ('owner','admin')
  )
);

drop policy if exists resellers_delete on public.resellers;
create policy resellers_delete on public.resellers for delete to authenticated
using (exists (select 1 from public.platform_admins pa where pa.user_id = (select auth.uid())));

drop policy if exists reseller_members_select_self on public.reseller_members;
create policy reseller_members_select_self on public.reseller_members for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists clients_select on public.clients;
create policy clients_select on public.clients for select to authenticated
using (
  exists (select 1 from public.platform_admins pa where pa.user_id = (select auth.uid()))
  or exists (
    select 1 from public.reseller_members rm
    where rm.reseller_id = clients.reseller_id and rm.user_id = (select auth.uid())
  )
  or exists (
    select 1 from public.client_members cm
    where cm.client_id = clients.id and cm.user_id = (select auth.uid())
  )
);

drop policy if exists clients_insert on public.clients;
create policy clients_insert on public.clients for insert to authenticated
with check (
  exists (select 1 from public.platform_admins pa where pa.user_id = (select auth.uid()))
  or exists (
    select 1 from public.reseller_members rm
    where rm.reseller_id = clients.reseller_id
      and rm.user_id = (select auth.uid())
      and rm.role in ('owner','admin')
  )
);

drop policy if exists clients_update on public.clients;
create policy clients_update on public.clients for update to authenticated
using (
  exists (select 1 from public.platform_admins pa where pa.user_id = (select auth.uid()))
  or exists (
    select 1 from public.reseller_members rm
    where rm.reseller_id = clients.reseller_id
      and rm.user_id = (select auth.uid())
      and rm.role in ('owner','admin')
  )
)
with check (
  exists (select 1 from public.platform_admins pa where pa.user_id = (select auth.uid()))
  or exists (
    select 1 from public.reseller_members rm
    where rm.reseller_id = clients.reseller_id
      and rm.user_id = (select auth.uid())
      and rm.role in ('owner','admin')
  )
);

drop policy if exists clients_delete on public.clients;
create policy clients_delete on public.clients for delete to authenticated
using (
  exists (select 1 from public.platform_admins pa where pa.user_id = (select auth.uid()))
  or exists (
    select 1 from public.reseller_members rm
    where rm.reseller_id = clients.reseller_id
      and rm.user_id = (select auth.uid())
      and rm.role in ('owner','admin')
  )
);

drop policy if exists client_members_select_self on public.client_members;
create policy client_members_select_self on public.client_members for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists installations_select on public.installations;
create policy installations_select on public.installations for select to authenticated
using (
  exists (select 1 from public.platform_admins pa where pa.user_id = (select auth.uid()))
  or exists (
    select 1 from public.reseller_members rm
    where rm.reseller_id = installations.reseller_id and rm.user_id = (select auth.uid())
  )
  or exists (
    select 1 from public.client_members cm
    where cm.client_id = installations.client_id and cm.user_id = (select auth.uid())
  )
);

drop policy if exists installations_insert on public.installations;
create policy installations_insert on public.installations for insert to authenticated
with check (
  exists (select 1 from public.platform_admins pa where pa.user_id = (select auth.uid()))
  or exists (
    select 1 from public.reseller_members rm
    where rm.reseller_id = installations.reseller_id
      and rm.user_id = (select auth.uid())
      and rm.role in ('owner','admin','operator')
  )
);

drop policy if exists installations_update on public.installations;
create policy installations_update on public.installations for update to authenticated
using (
  exists (select 1 from public.platform_admins pa where pa.user_id = (select auth.uid()))
  or exists (
    select 1 from public.reseller_members rm
    where rm.reseller_id = installations.reseller_id
      and rm.user_id = (select auth.uid())
      and rm.role in ('owner','admin','operator')
  )
)
with check (
  exists (select 1 from public.platform_admins pa where pa.user_id = (select auth.uid()))
  or exists (
    select 1 from public.reseller_members rm
    where rm.reseller_id = installations.reseller_id
      and rm.user_id = (select auth.uid())
      and rm.role in ('owner','admin','operator')
  )
);

drop policy if exists installations_delete on public.installations;
create policy installations_delete on public.installations for delete to authenticated
using (
  exists (select 1 from public.platform_admins pa where pa.user_id = (select auth.uid()))
  or exists (
    select 1 from public.reseller_members rm
    where rm.reseller_id = installations.reseller_id
      and rm.user_id = (select auth.uid())
      and rm.role in ('owner','admin')
  )
);

drop policy if exists cameras_select on public.cameras;
create policy cameras_select on public.cameras for select to authenticated
using (
  exists (select 1 from public.platform_admins pa where pa.user_id = (select auth.uid()))
  or exists (
    select 1 from public.reseller_members rm
    where rm.reseller_id = cameras.reseller_id and rm.user_id = (select auth.uid())
  )
  or exists (
    select 1 from public.client_members cm
    where cm.client_id = cameras.client_id and cm.user_id = (select auth.uid())
  )
);

drop policy if exists cameras_insert on public.cameras;
create policy cameras_insert on public.cameras for insert to authenticated
with check (
  exists (select 1 from public.platform_admins pa where pa.user_id = (select auth.uid()))
  or exists (
    select 1 from public.reseller_members rm
    where rm.reseller_id = cameras.reseller_id
      and rm.user_id = (select auth.uid())
      and rm.role in ('owner','admin','operator')
  )
);

drop policy if exists cameras_update on public.cameras;
create policy cameras_update on public.cameras for update to authenticated
using (
  exists (select 1 from public.platform_admins pa where pa.user_id = (select auth.uid()))
  or exists (
    select 1 from public.reseller_members rm
    where rm.reseller_id = cameras.reseller_id
      and rm.user_id = (select auth.uid())
      and rm.role in ('owner','admin','operator')
  )
)
with check (
  exists (select 1 from public.platform_admins pa where pa.user_id = (select auth.uid()))
  or exists (
    select 1 from public.reseller_members rm
    where rm.reseller_id = cameras.reseller_id
      and rm.user_id = (select auth.uid())
      and rm.role in ('owner','admin','operator')
  )
);

drop policy if exists cameras_delete on public.cameras;
create policy cameras_delete on public.cameras for delete to authenticated
using (
  exists (select 1 from public.platform_admins pa where pa.user_id = (select auth.uid()))
  or exists (
    select 1 from public.reseller_members rm
    where rm.reseller_id = cameras.reseller_id
      and rm.user_id = (select auth.uid())
      and rm.role in ('owner','admin')
  )
);
