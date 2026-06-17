-- Phase 6: inventory_items + inventory_movements
--
-- Stock model:
--   quantity           = physical units on hand
--   reserved_quantity  = portion committed to events (informational hold)
--   available          = quantity - reserved_quantity (derived in app/queries)
-- CHECK constraints guarantee stock never goes negative and reservations
-- never exceed what is physically on hand.

-- inventory_items (org-scoped)
create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  sku text,
  category text,
  unit text not null default 'buc',
  quantity numeric(14,2) not null default 0 check (quantity >= 0),
  reserved_quantity numeric(14,2) not null default 0
    check (reserved_quantity >= 0 and reserved_quantity <= quantity),
  reorder_threshold numeric(14,2),
  unit_cost_ron numeric(14,2),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_inventory_items_org on public.inventory_items (organization_id, name);
-- SKU is optional, but unique within an organization when present
create unique index idx_inventory_items_org_sku
  on public.inventory_items (organization_id, sku)
  where sku is not null;

create trigger set_inventory_items_updated_at
  before update on public.inventory_items
  for each row execute function public.set_updated_at();

alter table public.inventory_items enable row level security;

create policy "org members can read inventory items"
  on public.inventory_items for select
  using (public.is_org_member(organization_id));

create policy "org members can insert inventory items"
  on public.inventory_items for insert
  with check (public.is_org_member(organization_id));

create policy "org members can update inventory items"
  on public.inventory_items for update
  using (public.is_org_member(organization_id));

create policy "owners can delete inventory items"
  on public.inventory_items for delete
  using (public.has_org_role(organization_id, 'owner'));

-- inventory_movements (audit trail of every stock change)
create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  movement_type text not null
    check (movement_type in ('in', 'out', 'reserve', 'release')),
  quantity numeric(14,2) not null check (quantity > 0),
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_inventory_movements_item
  on public.inventory_movements (item_id, created_at desc);
create index idx_inventory_movements_org
  on public.inventory_movements (organization_id, created_at desc);
create index idx_inventory_movements_event
  on public.inventory_movements (event_id);

alter table public.inventory_movements enable row level security;

create policy "org members can read inventory movements"
  on public.inventory_movements for select
  using (public.is_org_member(organization_id));

create policy "org members can insert inventory movements"
  on public.inventory_movements for insert
  with check (public.is_org_member(organization_id));

-- Movements are an immutable audit trail: no update/delete policies (deny-by-default).
