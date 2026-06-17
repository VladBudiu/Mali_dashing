-- Perf: wrap auth.uid() in a scalar subselect so the planner evaluates it once
-- per statement instead of once per row (Supabase advisor 0003_auth_rls_initplan).
-- Behaviour is identical; only the evaluation plan changes.

drop policy if exists "submitter or owner can update expense claims" on public.expense_claims;

create policy "submitter or owner can update expense claims"
  on public.expense_claims for update
  using (
    public.is_org_member(organization_id)
    and (
      submitted_by = (select auth.uid())
      or public.has_org_role(organization_id, 'owner')
    )
  );
