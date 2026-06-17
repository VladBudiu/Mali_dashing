"use client";

import { useActionState, useId } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { OrgMembership } from "@/lib/org/membership";
import { setCurrentOrg, type SetCurrentOrgResult } from "@/lib/org/actions";

const INITIAL_STATE: SetCurrentOrgResult = { status: "ok" };

/**
 * Lets a multi-org user pick their active organization. Submits the choice to
 * the setCurrentOrg server action; membership is verified server-side.
 */
export default function OrgSwitcher({
  memberships,
  currentOrgId,
}: {
  memberships: OrgMembership[];
  currentOrgId: string;
}) {
  const selectId = useId();
  const [state, formAction, isPending] = useActionState(
    setCurrentOrg,
    INITIAL_STATE,
  );

  const [primaryMembership] = memberships;

  if (!primaryMembership) {
    return (
      <Typography variant="body2" color="text.secondary">
        You do not belong to any organization yet.
      </Typography>
    );
  }

  if (memberships.length === 1) {
    return (
      <Typography variant="body2" color="text.secondary">
        {primaryMembership.organizationName} ({primaryMembership.role})
      </Typography>
    );
  }

  return (
    <form action={formAction}>
      <Stack spacing={2}>
        {state.status === "error" ? (
          <Alert severity="error">{state.message}</Alert>
        ) : null}
        <FormControl fullWidth size="small">
          <InputLabel id={selectId}>Active organization</InputLabel>
          <Select
            labelId={selectId}
            name="organizationId"
            label="Active organization"
            defaultValue={currentOrgId}
            disabled={isPending}
          >
            {memberships.map((membership) => (
              <MenuItem
                key={membership.organizationId}
                value={membership.organizationId}
              >
                {membership.organizationName} ({membership.role})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button type="submit" variant="contained" disabled={isPending}>
          {isPending ? "Switching…" : "Switch organization"}
        </Button>
      </Stack>
    </form>
  );
}
