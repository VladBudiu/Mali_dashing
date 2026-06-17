-- Phase 3: collaborators and collaborator_rates tables

create table public.collaborators (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  specialty text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_collaborators_org on public.collaborators (organization_id);
create index idx_collaborators_org_active on public.collaborators (organization_id, is_active);

create trigger set_collaborators_updated_at
  before update on public.collaborators
  for each row execute function public.set_updated_at();

create table public.collaborator_rates (
  id uuid primary key default gen_random_uuid(),
  collaborator_id uuid not null references public.collaborators(id) on delete cascade,
  pricing_mode text not null default 'per_day' check (pricing_mode in ('per_day', 'per_hour', 'fixed')),
  rate numeric(14,2) not null,
  currency char(3) not null default 'RON',
  valid_from date not null default current_date,
  valid_until date,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_collaborator_rates_collaborator on public.collaborator_rates (collaborator_id, valid_from desc);

-- RLS

alter table public.collaborators enable row level security;
alter table public.collaborator_rates enable row level security;

create policy "org members can read collaborators"
  on public.collaborators for select
  using (public.is_org_member(organization_id));

create policy "org members can insert collaborators"
  on public.collaborators for insert
  with check (public.is_org_member(organization_id));

create policy "org members can update collaborators"
  on public.collaborators for update
  using (public.is_org_member(organization_id));

create policy "owners can delete collaborators"
  on public.collaborators for delete
  using (public.has_org_role(organization_id, 'owner'));

create policy "org members can read collaborator rates"
  on public.collaborator_rates for select
  using (
    exists (
      select 1 from public.collaborators c
      where c.id = collaborator_id
        and public.is_org_member(c.organization_id)
    )
  );

create policy "org members can manage collaborator rates"
  on public.collaborator_rates for insert
  with check (
    exists (
      select 1 from public.collaborators c
      where c.id = collaborator_id
        and public.is_org_member(c.organization_id)
    )
  );

create policy "org members can update collaborator rates"
  on public.collaborator_rates for update
  using (
    exists (
      select 1 from public.collaborators c
      where c.id = collaborator_id
        and public.is_org_member(c.organization_id)
    )
  );

create policy "owners can delete collaborator rates"
  on public.collaborator_rates for delete
  using (
    exists (
      select 1 from public.collaborators c
      where c.id = collaborator_id
        and public.has_org_role(c.organization_id, 'owner')
    )
  );
