"use client";

import { useActionState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import type { FinanceFormState } from "@/lib/finance/actions";

const TRANSACTION_TYPES = [
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
] as const;

const CURRENCIES = [
  { value: "RON", label: "RON – Romanian Leu" },
  { value: "EUR", label: "EUR – Euro" },
] as const;

type Props = {
  action: (
    prevState: FinanceFormState,
    formData: FormData,
  ) => Promise<FinanceFormState>;
  defaultDate?: string;
};

export default function TransactionForm({ action, defaultDate }: Props) {
  const [state, formAction, isPending] = useActionState(action, {
    status: "idle",
  });

  return (
    <Box
      component="form"
      action={formAction}
      sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 560 }}
    >
      {state.status === "error" && (
        <Alert severity="error">{state.message}</Alert>
      )}

      <TextField select label="Type" name="type" defaultValue="income" required>
        {TRANSACTION_TYPES.map((t) => (
          <MenuItem key={t.value} value={t.value}>
            {t.label}
          </MenuItem>
        ))}
      </TextField>

      <Box sx={{ display: "flex", gap: 2 }}>
        <TextField
          label="Amount"
          name="amount"
          type="number"
          required
          slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}
          sx={{ flex: 1 }}
        />
        <TextField
          select
          label="Currency"
          name="currency"
          defaultValue="RON"
          sx={{ width: 160 }}
        >
          {CURRENCIES.map((c) => (
            <MenuItem key={c.value} value={c.value}>
              {c.value}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <TextField
        label="Description"
        name="description"
        required
        slotProps={{ htmlInput: { maxLength: 500 } }}
        placeholder="e.g. Payment received from client for Spring Wedding"
      />

      <TextField
        label="Date"
        name="transaction_date"
        type="date"
        required
        defaultValue={defaultDate}
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <TextField
        label="Reference number"
        name="reference_no"
        placeholder="Invoice #, receipt #, etc."
        slotProps={{ htmlInput: { maxLength: 100 } }}
      />

      <TextField
        label="Notes"
        name="notes"
        multiline
        minRows={2}
        slotProps={{ htmlInput: { maxLength: 2000 } }}
      />

      <Typography variant="caption" color="text.secondary">
        For non-RON transactions, add the RON equivalent below for reporting.
      </Typography>

      <Box sx={{ display: "flex", gap: 2 }}>
        <TextField
          label="Amount in RON"
          name="amount_ron"
          type="number"
          slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}
          sx={{ flex: 1 }}
          placeholder="Leave blank for RON transactions"
        />
        <TextField
          label="Exchange rate"
          name="exchange_rate"
          type="number"
          slotProps={{ htmlInput: { min: 0.000001, step: 0.000001 } }}
          sx={{ flex: 1 }}
          placeholder="e.g. 4.97"
        />
      </Box>

      <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
        <Button
          type="submit"
          variant="contained"
          disabled={isPending}
          sx={{ minWidth: 140 }}
        >
          {isPending ? "Saving…" : "Save transaction"}
        </Button>
        <Button
          component={NextLink}
          href="/finance"
          variant="outlined"
          LinkComponent={Link}
        >
          Cancel
        </Button>
      </Box>
    </Box>
  );
}
