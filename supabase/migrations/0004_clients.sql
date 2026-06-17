-- Phase 3: clients and client_contacts tables

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  type text not null default 'individual' check (type in ('individual', 'company')),
  tax_id text,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_clients_org on public.clients (organization_id);
create index idx_clients_org_name on public.clients (organization_id, name);

create trigger set_clients_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

create table public.client_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  role text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_client_contacts_client on public.client_contacts (client_id);

-- RLS

alter table public.clients enable row level security;
alter table public.client_contacts enable row level security;

create policy "org members can read their clients"
  on public.clients for select
  using (public.is_org_member(organization_id));

create policy "org members can insert clients"
  on public.clients for insert
  with check (public.is_org_member(organization_id));

create policy "org members can update their clients"
  on public.clients for update
  using (public.is_org_member(organization_id));

create policy "owners can delete clients"
  on public.clients for delete
  using (public.has_org_role(organization_id, 'owner'));

create policy "org members can read client contacts"
  on public.client_contacts for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_id
        and public.is_org_member(c.organization_id)
    )
  );

create policy "org members can manage client contacts"
  on public.client_contacts for insert
  with check (
    exists (
      select 1 from public.clients c
      where c.id = client_id
        and public.is_org_member(c.organization_id)
    )
  );

create policy "org members can update client contacts"
  on public.client_contacts for update
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_id
        and public.is_org_member(c.organization_id)
    )
  );

create policy "owners can delete client contacts"
  on public.client_contacts for delete
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_id
        and public.has_org_role(c.organization_id, 'owner')
    )
  );
