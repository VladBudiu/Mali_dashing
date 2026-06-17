-- Phase 4: documents, document_extractions, document_fields tables
-- Storage bucket and base policies already created in 0002_phase2_auth_rls.sql

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  expense_claim_id uuid references public.expense_claims(id) on delete set null,
  file_path text not null,
  file_name text not null,
  mime_type text not null,
  file_size_bytes integer,
  doc_type text not null default 'other'
    check (doc_type in ('invoice', 'receipt', 'contract', 'other')),
  ocr_status text not null default 'pending'
    check (ocr_status in ('pending', 'processing', 'done', 'failed', 'skipped')),
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_documents_org on public.documents (organization_id, created_at desc);
create index idx_documents_event on public.documents (event_id);
create index idx_documents_ocr_status on public.documents (organization_id, ocr_status);

create trigger set_documents_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

alter table public.documents enable row level security;

create policy "org members can read documents"
  on public.documents for select
  using (public.is_org_member(organization_id));

create policy "org members can insert documents"
  on public.documents for insert
  with check (public.is_org_member(organization_id));

create policy "org members can update documents"
  on public.documents for update
  using (public.is_org_member(organization_id));

create policy "owners can delete documents"
  on public.documents for delete
  using (public.has_org_role(organization_id, 'owner'));

-- document_extractions
create table public.document_extractions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  engine text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'done', 'failed')),
  confidence numeric(5,4),
  raw_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_document_extractions_document
  on public.document_extractions (document_id);

create trigger set_document_extractions_updated_at
  before update on public.document_extractions
  for each row execute function public.set_updated_at();

alter table public.document_extractions enable row level security;

create policy "org members can read document extractions"
  on public.document_extractions for select
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_id
        and public.is_org_member(d.organization_id)
    )
  );

create policy "org members can insert document extractions"
  on public.document_extractions for insert
  with check (
    exists (
      select 1 from public.documents d
      where d.id = document_id
        and public.is_org_member(d.organization_id)
    )
  );

create policy "org members can update document extractions"
  on public.document_extractions for update
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_id
        and public.is_org_member(d.organization_id)
    )
  );

-- document_fields
create table public.document_fields (
  id uuid primary key default gen_random_uuid(),
  extraction_id uuid not null references public.document_extractions(id) on delete cascade,
  field_name text not null,
  field_value text,
  confidence numeric(5,4),
  is_validated boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_document_fields_extraction
  on public.document_fields (extraction_id, field_name);

alter table public.document_fields enable row level security;

create policy "org members can read document fields"
  on public.document_fields for select
  using (
    exists (
      select 1
      from public.document_extractions de
      join public.documents d on d.id = de.document_id
      where de.id = extraction_id
        and public.is_org_member(d.organization_id)
    )
  );

create policy "org members can insert document fields"
  on public.document_fields for insert
  with check (
    exists (
      select 1
      from public.document_extractions de
      join public.documents d on d.id = de.document_id
      where de.id = extraction_id
        and public.is_org_member(d.organization_id)
    )
  );

create policy "org members can validate document fields"
  on public.document_fields for update
  using (
    exists (
      select 1
      from public.document_extractions de
      join public.documents d on d.id = de.document_id
      where de.id = extraction_id
        and public.is_org_member(d.organization_id)
    )
  );
