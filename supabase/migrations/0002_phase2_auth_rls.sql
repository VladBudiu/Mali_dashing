-- Phase 2: auth hardening, role-based write policies, and document storage.
-- Builds on 0001 (organizations, organization_users, is_org_member helper).

-- 1. Hardening flagged by the database linter ------------------------------

-- set_updated_at had a mutable search_path. Pin it; now() resolves from
-- pg_catalog regardless, so an empty search_path is safe.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- These SECURITY DEFINER functions must not be invokable via the public REST
-- surface. is_org_member is only needed inside policies (authenticated);
-- rls_auto_enable is an event-trigger function and should be callable by nobody.
revoke execute on function public.is_org_member(uuid) from public;
grant execute on function public.is_org_member(uuid) to authenticated;
revoke execute on function public.rls_auto_enable() from public;

-- 2. Role helpers ----------------------------------------------------------

-- True when the current user holds a specific role in the target organization.
-- SECURITY DEFINER avoids recursive RLS evaluation against organization_users.
create or replace function public.has_org_role(target_org uuid, target_role text)
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
      and ou.role = target_role
  );
$$;

revoke execute on function public.has_org_role(uuid, text) from public;
grant execute on function public.has_org_role(uuid, text) to authenticated;

-- Membership check for a storage path segment. Returns false (never errors) for
-- a non-uuid segment, so malformed object names are denied rather than aborting.
create or replace function public.is_org_member_path(path_org text)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  org_id uuid;
begin
  begin
    org_id := path_org::uuid;
  exception
    when others then
      return false;
  end;
  return public.is_org_member(org_id);
end;
$$;

revoke execute on function public.is_org_member_path(text) from public;
grant execute on function public.is_org_member_path(text) to authenticated;

-- 3. Write policies on the tenant tables -----------------------------------
-- INSERT/DELETE on organizations and the initial owner bootstrap stay
-- server-side (service role) and are denied by default here.

drop policy if exists "owners update their organization" on public.organizations;
create policy "owners update their organization"
on public.organizations for update
to authenticated
using (public.has_org_role(id, 'owner'))
with check (public.has_org_role(id, 'owner'));

drop policy if exists "owners manage memberships" on public.organization_users;
create policy "owners manage memberships"
on public.organization_users for all
to authenticated
using (public.has_org_role(organization_id, 'owner'))
with check (public.has_org_role(organization_id, 'owner'));

-- 4. Document storage: private bucket, deny-by-default, org-scoped ----------
-- Object paths are namespaced as <organization_id>/<...>. Access requires the
-- caller to be a member of the organization in the first path segment.

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists "org members read documents" on storage.objects;
create policy "org members read documents"
on storage.objects for select
to authenticated
using (
  bucket_id = 'documents'
  and public.is_org_member_path((storage.foldername(name))[1])
);

drop policy if exists "org members upload documents" on storage.objects;
create policy "org members upload documents"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'documents'
  and public.is_org_member_path((storage.foldername(name))[1])
);

drop policy if exists "org members update documents" on storage.objects;
create policy "org members update documents"
on storage.objects for update
to authenticated
using (
  bucket_id = 'documents'
  and public.is_org_member_path((storage.foldername(name))[1])
)
with check (
  bucket_id = 'documents'
  and public.is_org_member_path((storage.foldername(name))[1])
);

drop policy if exists "org members delete documents" on storage.objects;
create policy "org members delete documents"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'documents'
  and public.is_org_member_path((storage.foldername(name))[1])
);
