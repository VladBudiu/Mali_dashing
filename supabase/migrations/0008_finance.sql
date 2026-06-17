-- Phase 4: expense_categories, exchange_rates, financial_transactions, expense_claims

-- expense_categories (org-scoped, hierarchical)
create table public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  name text not null,
  parent_id uuid references public.expense_categories(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (organization_id, code)
);

create index idx_expense_categories_org on public.expense_categories (organization_id);

alter table public.expense_categories enable row level security;

create policy "org members can read expense categories"
  on public.expense_categories for select
  using (public.is_org_member(organization_id));

create policy "owners can insert expense categories"
  on public.expense_categories for insert
  with check (public.has_org_role(organization_id, 'owner'));

create policy "owners can update expense categories"
  on public.expense_categories for update
  using (public.has_org_role(organization_id, 'owner'));

create policy "owners can delete expense categories"
  on public.expense_categories for delete
  using (public.has_org_role(organization_id, 'owner'));

-- exchange_rates (global, service-role managed, authenticated can read)
create table public.exchange_rates (
  id bigserial primary key,
  source text not null check (source in ('BNR', 'ECB', 'MANUAL')),
  rate_date date not null,
  base_currency char(3) not null,
  quote_currency char(3) not null,
  rate numeric(18,8) not null,
  inverse_rate numeric(18,8) generated always as (
    case when rate <> 0 then round(1.0 / rate, 8) else null end
  ) stored,
  published_at timestamptz,
  fetched_at timestamptz not null default now(),
  is_final boolean not null default true,
  notes text,
  unique (source, rate_date, base_currency, quote_currency)
);

create index idx_exchange_rates_lookup
  on public.exchange_rates (rate_date desc, source, base_currency, quote_currency);

alter table public.exchange_rates enable row level security;

-- authenticated users may read; insert/update/delete restricted to service role
create policy "authenticated can read exchange rates"
  on public.exchange_rates for select
  to authenticated
  using (true);

-- financial_transactions
create table public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  category_id uuid references public.expense_categories(id) on delete set null,
  type text not null check (type in ('income', 'expense')),
  amount numeric(14,2) not null,
  currency char(3) not null default 'RON',
  amount_ron numeric(14,2),
  exchange_rate numeric(18,8),
  exchange_rate_source text check (exchange_rate_source in ('BNR', 'ECB', 'MANUAL')),
  exchange_rate_date date,
  description text not null,
  transaction_date date not null,
  reference_no text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_financial_transactions_org_date
  on public.financial_transactions (organization_id, transaction_date desc);
create index idx_financial_transactions_org_type
  on public.financial_transactions (organization_id, type);
create index idx_financial_transactions_event
  on public.financial_transactions (event_id);

create trigger set_financial_transactions_updated_at
  before update on public.financial_transactions
  for each row execute function public.set_updated_at();

alter table public.financial_transactions enable row level security;

create policy "org members can read transactions"
  on public.financial_transactions for select
  using (public.is_org_member(organization_id));

create policy "org members can insert transactions"
  on public.financial_transactions for insert
  with check (public.is_org_member(organization_id));

create policy "org members can update transactions"
  on public.financial_transactions for update
  using (public.is_org_member(organization_id));

create policy "owners can delete transactions"
  on public.financial_transactions for delete
  using (public.has_org_role(organization_id, 'owner'));

-- expense_claims
create table public.expense_claims (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  category_id uuid references public.expense_categories(id) on delete set null,
  submitted_by uuid not null references auth.users(id) on delete restrict,
  amount numeric(14,2) not null,
  currency char(3) not null default 'RON',
  amount_ron numeric(14,2),
  exchange_rate numeric(18,8),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'paid')),
  description text not null,
  receipt_url text,
  submitted_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_expense_claims_org_status
  on public.expense_claims (organization_id, status);
create index idx_expense_claims_event
  on public.expense_claims (event_id);
create index idx_expense_claims_submitted_by
  on public.expense_claims (submitted_by);

create trigger set_expense_claims_updated_at
  before update on public.expense_claims
  for each row execute function public.set_updated_at();

alter table public.expense_claims enable row level security;

create policy "org members can read expense claims"
  on public.expense_claims for select
  using (public.is_org_member(organization_id));

create policy "org members can submit expense claims"
  on public.expense_claims for insert
  with check (public.is_org_member(organization_id));

create policy "submitter or owner can update expense claims"
  on public.expense_claims for update
  using (
    public.is_org_member(organization_id)
    and (
      submitted_by = auth.uid()
      or public.has_org_role(organization_id, 'owner')
    )
  );

create policy "owners can delete expense claims"
  on public.expense_claims for delete
  using (public.has_org_role(organization_id, 'owner'));
