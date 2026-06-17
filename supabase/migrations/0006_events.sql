-- Phase 3: events and event_assignments tables

create table public.events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  title text not null,
  status text not null default 'draft' check (
    status in (
      'draft', 'inquiry', 'quoted', 'accepted', 'deposit_pending',
      'scheduled', 'in_preparation', 'in_progress', 'completed',
      'invoiced_final', 'paid', 'archived', 'cancelled', 'postponed',
      'requires_review', 'over_budget', 'documents_missing'
    )
  ),
  event_date timestamptz not null,
  venue_name text,
  venue_address text,
  city text,
  country_code char(2) not null default 'RO',
  pricing_currency char(3) not null default 'RON',
  notes text,
  estimated_cost_total numeric(14,2),
  estimated_revenue_total numeric(14,2),
  final_cost_total numeric(14,2),
  final_revenue_total numeric(14,2),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_events_org_date on public.events (organization_id, event_date desc);
create index idx_events_org_status on public.events (organization_id, status);
create index idx_events_client on public.events (client_id);

create trigger set_events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

create table public.event_assignments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  collaborator_id uuid not null references public.collaborators(id) on delete cascade,
  role text,
  fee numeric(14,2),
  fee_currency char(3) not null default 'RON',
  notes text,
  created_at timestamptz not null default now(),
  unique (event_id, collaborator_id)
);

create index idx_event_assignments_event on public.event_assignments (event_id);
create index idx_event_assignments_collaborator on public.event_assignments (collaborator_id);

-- RLS

alter table public.events enable row level security;
alter table public.event_assignments enable row level security;

create policy "org members can read their events"
  on public.events for select
  using (public.is_org_member(organization_id));

create policy "org members can insert events"
  on public.events for insert
  with check (public.is_org_member(organization_id));

create policy "org members can update their events"
  on public.events for update
  using (public.is_org_member(organization_id));

create policy "owners can delete events"
  on public.events for delete
  using (public.has_org_role(organization_id, 'owner'));

create policy "org members can read event assignments"
  on public.event_assignments for select
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and public.is_org_member(e.organization_id)
    )
  );

create policy "org members can manage event assignments"
  on public.event_assignments for insert
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and public.is_org_member(e.organization_id)
    )
  );

create policy "org members can update event assignments"
  on public.event_assignments for update
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and public.is_org_member(e.organization_id)
    )
  );

create policy "owners can delete event assignments"
  on public.event_assignments for delete
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and public.has_org_role(e.organization_id, 'owner')
    )
  );
