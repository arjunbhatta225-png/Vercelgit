-- ─────────────────────────────────────────────────────────────────────
--  Tradexa — profiles table
--  Run this ONCE in Supabase: SQL Editor → New Query → paste → Run
--
--  Creates:
--    1. profiles table (id, email, role, plan)
--    2. Row Level Security policies (users see own profile; admins see all)
--    3. Trigger that auto-creates a profile row on auth.users INSERT
--    4. Promotes arjunbhatta225@gmail.com to role='admin' if it already exists
-- ─────────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text unique not null,
  role        text not null default 'user'    check (role in ('user','admin')),
  plan        text not null default 'free'    check (plan in ('free','premium')),
  full_name   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles(email);

-- ── RLS ────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

drop policy if exists "profiles_self_select"  on public.profiles;
drop policy if exists "profiles_self_update"  on public.profiles;
drop policy if exists "profiles_admin_all"    on public.profiles;

-- ── Admin check helper ────────────────────────────────────────────────
-- security definer means it bypasses RLS when reading profiles —
-- this is what avoids the infinite-recursion trap of querying the
-- same table from inside its own policy.
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = uid),
    false
  );
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated, anon;

-- A user can SELECT their own row.
create policy "profiles_self_select"
  on public.profiles for select
  using (auth.uid() = id);

-- A user can UPDATE their own row, but cannot change role/plan
-- (those columns are blocked by a trigger below — RLS alone can't filter columns).
create policy "profiles_self_update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- An admin (role='admin') can SELECT/UPDATE/DELETE every row.
create policy "profiles_admin_all"
  on public.profiles for all
  using       (public.is_admin(auth.uid()))
  with check  (public.is_admin(auth.uid()));

-- ── Block role/plan self-escalation ───────────────────────────────────
create or replace function public.profiles_block_self_escalation()
returns trigger
language plpgsql
security definer
as $$
begin
  -- If the caller is not an admin, prevent role/plan changes.
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ) then
    new.role := old.role;
    new.plan := old.plan;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_block_escalation on public.profiles;
create trigger profiles_block_escalation
  before update on public.profiles
  for each row execute function public.profiles_block_self_escalation();

-- ── Auto-create profile on signup ─────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, plan)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    case when new.email = 'arjunbhatta225@gmail.com' then 'admin' else 'user' end,
    'free'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Promote arjunbhatta225@gmail.com if account already exists ────────
update public.profiles
   set role = 'admin'
 where email = 'arjunbhatta225@gmail.com';
