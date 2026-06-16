-- Initial migration: organizations and the auth bridge (organization_users).
-- Establishes the multi-tenant foundation with RLS enabled by default.
-- Role-specific write policies are layered in during Phase 2.

create extension if not exists "pgcrypto";

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  base_currency char(3) not null default 'RON',
  vat_mode text not null default 'non_payer' check (vat_mode in ('payer', 'non_payer')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_users (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'partner', 'collaborator', 'accountant', 'client')),
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index if not exists idx_organization_users_user on public.organization_users (user_id);

-- Maintains updated_at on row mutation.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_organizations_updated_at on public.organizations;
create trigger trg_organizations_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

-- Membership check used by RLS policies. SECURITY DEFINER prevents recursive
-- RLS evaluation when checking organization_users from other tables' policies.
create or replace function public.is_org_member(target_org uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.organization_users ou
    where ou.organization_id = target_org
      and ou.user_id = auth.uid()
  );
$$;

alter table public.organizations enable row level security;
alter table public.organization_users enable row level security;

drop policy if exists "org members can read organizations" on public.organizations;
create policy "org members can read organizations"
on public.organizations for select
to authenticated
using (public.is_org_member(id));

drop policy if exists "users read own memberships" on public.organization_users;
create policy "users read own memberships"
on public.organization_users for select
to authenticated
using (user_id = (select auth.uid()));
