-- Phase 8a: AI assistant — chat history, audit trail, and shared memory.
-- The assistant is READ-ONLY over business data (it queries through the user's
-- RLS session). These four tables are its own write surface only.

-- ai_sessions — one chat thread, owned by the user who started it
create table public.ai_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_ai_sessions_org_user on public.ai_sessions (organization_id, user_id, updated_at desc);

create trigger set_ai_sessions_updated_at
  before update on public.ai_sessions
  for each row execute function public.set_updated_at();

alter table public.ai_sessions enable row level security;

-- A user sees and manages only their own chats (scoped to their org).
create policy "users read own ai sessions"
  on public.ai_sessions for select
  using (is_org_member(organization_id) and user_id = (select auth.uid()));

create policy "users create own ai sessions"
  on public.ai_sessions for insert
  with check (is_org_member(organization_id) and user_id = (select auth.uid()));

create policy "users update own ai sessions"
  on public.ai_sessions for update
  using (is_org_member(organization_id) and user_id = (select auth.uid()));

create policy "users delete own ai sessions"
  on public.ai_sessions for delete
  using (is_org_member(organization_id) and user_id = (select auth.uid()));

-- ai_messages — turns within a session (user / assistant / tool)
create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.ai_sessions(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'tool')),
  content text not null default '',
  tool_name text,
  tool_payload jsonb,
  token_usage jsonb,
  created_at timestamptz not null default now()
);

create index idx_ai_messages_session on public.ai_messages (session_id, created_at);

alter table public.ai_messages enable row level security;

-- Visible/insertable only through a session the caller owns.
create policy "read messages in own session"
  on public.ai_messages for select
  using (exists (
    select 1 from public.ai_sessions s
    where s.id = ai_messages.session_id
      and s.user_id = (select auth.uid())
      and is_org_member(s.organization_id)
  ));

create policy "insert messages in own session"
  on public.ai_messages for insert
  with check (exists (
    select 1 from public.ai_sessions s
    where s.id = ai_messages.session_id
      and s.user_id = (select auth.uid())
      and is_org_member(s.organization_id)
  ));

-- ai_audit_logs — every answer that touched org data, linked back to source rows
create table public.ai_audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  session_id uuid references public.ai_sessions(id) on delete set null,
  message_id uuid references public.ai_messages(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  question text not null,
  answer_summary text,
  tools_used jsonb not null default '[]'::jsonb,
  sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_ai_audit_org on public.ai_audit_logs (organization_id, created_at desc);

alter table public.ai_audit_logs enable row level security;

-- The asker sees their own audit entries; owners see the whole org's trail.
create policy "read own or owner ai audit"
  on public.ai_audit_logs for select
  using (
    is_org_member(organization_id)
    and (user_id = (select auth.uid()) or has_org_role(organization_id, 'owner'))
  );

create policy "members insert ai audit"
  on public.ai_audit_logs for insert
  with check (is_org_member(organization_id));

-- ai_notes — shared org memory the assistant can persist ("remember this event…")
create table public.ai_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text check (entity_type in ('event', 'client', 'collaborator', 'inventory_item', 'global')),
  entity_id uuid,
  note text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_ai_notes_org on public.ai_notes (organization_id, created_at desc);
create index idx_ai_notes_entity on public.ai_notes (entity_type, entity_id);

create trigger set_ai_notes_updated_at
  before update on public.ai_notes
  for each row execute function public.set_updated_at();

alter table public.ai_notes enable row level security;

create policy "org members read ai notes"
  on public.ai_notes for select
  using (is_org_member(organization_id));

create policy "org members insert ai notes"
  on public.ai_notes for insert
  with check (is_org_member(organization_id));

create policy "org members update ai notes"
  on public.ai_notes for update
  using (is_org_member(organization_id));

create policy "owners delete ai notes"
  on public.ai_notes for delete
  using (has_org_role(organization_id, 'owner'));
