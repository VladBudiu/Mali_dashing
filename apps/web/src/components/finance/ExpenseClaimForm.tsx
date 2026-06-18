"use client";

import { useActionState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { createExpenseClaim, type FinanceFormState } from "@/lib/finance/actions";

const INITIAL: FinanceFormState = { status: "idle" };
const CURRENCIES = ["RON", "EUR"] as const;

export default function ExpenseClaimForm() {
  const [state, formAction, isPending] = useActionState(createExpenseClaim, INITIAL);

  return (
    <Box
      component="form"
      action={formAction}
      sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 560 }}
    >
      {state.status === "error" && <Alert severity="error">{state.message}</Alert>}

      <TextField
        label="Description"
        name="description"
        required
        disabled={isPending}
        placeholder="e.g. Taxi to venue, supplies bought on site"
        slotProps={{ htmlInput: { maxLength: 500 } }}
      />

      <Box sx={{ display: "flex", gap: 2 }}>
        <TextField
          label="Amount"
          name="amount"
          type="number"
          required
          disabled={isPending}
          sx={{ flex: 1 }}
          slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}
        />
        <TextField
          select
          label="Currency"
          name="currency"
          defaultValue="RON"
          disabled={isPending}
          sx={{ width: 140 }}
        >
          {CURRENCIES.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <Typography variant="caption" color="text.secondary">
        For non-RON claims, add the RON equivalent for reporting.
      </Typography>
      <Box sx={{ display: "flex", gap: 2 }}>
        <TextField
          label="Amount in RON"
          name="amount_ron"
          type="number"
          disabled={isPending}
          sx={{ flex: 1 }}
          slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}
          placeholder="Leave blank for RON claims"
        />
        <TextField
          label="Exchange rate"
          name="exchange_rate"
          type="number"
          disabled={isPending}
          sx={{ flex: 1 }}
          slotProps={{ htmlInput: { min: 0.000001, step: 0.000001 } }}
        />
      </Box>

      <TextField
        label="Notes"
        name="notes"
        multiline
        minRows={2}
        disabled={isPending}
        slotProps={{ htmlInput: { maxLength: 2000 } }}
      />

      <Box sx={{ display: "flex", gap: 1 }}>
        <Button type="submit" variant="contained" disabled={isPending}>
          {isPending ? "Submitting…" : "Submit claim"}
        </Button>
        <Button variant="outlined" href="/finance" disabled={isPending}>
          Cancel
        </Button>
      </Box>
    </Box>
  );
}
