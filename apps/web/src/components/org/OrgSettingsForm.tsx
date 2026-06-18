"use client";

import { useActionState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { updateOrganization, type OrgSettingsState } from "@/lib/org/actions";
import { VAT_MODES, ORG_CURRENCIES } from "@/lib/org/settings";

const INITIAL: OrgSettingsState = { status: "idle" };

type Props = {
  defaults: { name: string; vat_mode: string; base_currency: string };
  disabled?: boolean;
};

export default function OrgSettingsForm({ defaults, disabled }: Props) {
  const [state, formAction, isPending] = useActionState(updateOrganization, INITIAL);

  return (
    <Box
      component="form"
      action={formAction}
      sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 460 }}
    >
      {state.status === "error" && <Alert severity="error">{state.message}</Alert>}
      {state.status === "success" && <Alert severity="success">Settings saved.</Alert>}

      <TextField
        label="Organization name"
        name="name"
        required
        defaultValue={defaults.name}
        disabled={disabled || isPending}
      />
      <TextField
        select
        label="VAT mode"
        name="vat_mode"
        defaultValue={defaults.vat_mode}
        disabled={disabled || isPending}
      >
        {VAT_MODES.map((m) => (
          <MenuItem key={m.value} value={m.value}>
            {m.label}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        label="Base currency"
        name="base_currency"
        defaultValue={defaults.base_currency}
        disabled={disabled || isPending}
      >
        {ORG_CURRENCIES.map((c) => (
          <MenuItem key={c} value={c}>
            {c}
          </MenuItem>
        ))}
      </TextField>

      <Box>
        <Button type="submit" variant="contained" disabled={disabled || isPending}>
          {isPending ? "Saving…" : "Save settings"}
        </Button>
      </Box>
    </Box>
  );
}
