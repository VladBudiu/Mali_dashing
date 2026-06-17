-- Phase 3: quotes and quote_lines tables

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  version_no integer not null default 1,
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  currency char(3) not null default 'RON',
  vat_rate numeric(5,4) not null default 0.19,
  discount_pct numeric(5,4) not null default 0,
  fixed_discount_net numeric(14,2) not null default 0,
  subtotal_net numeric(14,2) not null default 0,
  discount_net numeric(14,2) not null default 0,
  net_after_discount numeric(14,2) not null default 0,
  vat_amount numeric(14,2) not null default 0,
  total_gross numeric(14,2) not null default 0,
  notes text,
  sent_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, version_no)
);

create index idx_quotes_event on public.quotes (event_id);
create index idx_quotes_org_status on public.quotes (organization_id, status);

create trigger set_quotes_updated_at
  before update on public.quotes
  for each row execute function public.set_updated_at();

create table public.quote_lines (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  sort_order integer not null default 0,
  description text not null,
  quantity numeric(10,3) not null default 1,
  unit_price_net numeric(14,2) not null,
  unit_cost_net numeric(14,2),
  vat_rate numeric(5,4) not null default 0.19,
  line_total_net numeric(14,2) generated always as (
    round(quantity * unit_price_net, 2)
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_quote_lines_quote on public.quote_lines (quote_id, sort_order);

create trigger set_quote_lines_updated_at
  before update on public.quote_lines
  for each row execute function public.set_updated_at();

-- RLS

alter table public.quotes enable row level security;
alter table public.quote_lines enable row level security;

create policy "org members can read their quotes"
  on public.quotes for select
  using (public.is_org_member(organization_id));

create policy "org members can insert quotes"
  on public.quotes for insert
  with check (public.is_org_member(organization_id));

create policy "org members can update their quotes"
  on public.quotes for update
  using (public.is_org_member(organization_id));

create policy "owners can delete quotes"
  on public.quotes for delete
  using (public.has_org_role(organization_id, 'owner'));

create policy "org members can read quote lines"
  on public.quote_lines for select
  using (
    exists (
      select 1 from public.quotes q
      where q.id = quote_id
        and public.is_org_member(q.organization_id)
    )
  );

create policy "org members can insert quote lines"
  on public.quote_lines for insert
  with check (
    exists (
      select 1 from public.quotes q
      where q.id = quote_id
        and public.is_org_member(q.organization_id)
    )
  );

create policy "org members can update quote lines"
  on public.quote_lines for update
  using (
    exists (
      select 1 from public.quotes q
      where q.id = quote_id
        and public.is_org_member(q.organization_id)
    )
  );

create policy "owners can delete quote lines"
  on public.quote_lines for delete
  using (
    exists (
      select 1 from public.quotes q
      where q.id = quote_id
        and public.has_org_role(q.organization_id, 'owner')
    )
  );
