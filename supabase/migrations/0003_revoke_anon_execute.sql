-- Phase 2 follow-up: revoke anon EXECUTE on SECURITY DEFINER functions.
--
-- Supabase grants EXECUTE to the anon and authenticated roles directly (not via
-- PUBLIC), so the `revoke ... from public` in 0002 did not remove it. Revoke
-- from anon explicitly.
--
-- The three membership predicates keep EXECUTE for authenticated: RLS policies
-- scoped `to authenticated` must be able to call them. They only ever read the
-- caller's own membership (auth.uid()) and return a boolean, so authenticated
-- RPC access discloses nothing about other users.
--
-- rls_auto_enable is an event-trigger function used by no policy, so it is
-- revoked from every API role.

revoke execute on function public.is_org_member(uuid) from anon;
revoke execute on function public.has_org_role(uuid, text) from anon;
revoke execute on function public.is_org_member_path(text) from anon;

revoke execute on function public.rls_auto_enable() from anon, authenticated;
