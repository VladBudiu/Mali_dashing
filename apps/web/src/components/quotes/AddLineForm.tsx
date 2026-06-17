"use client";

import { useActionState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import type { QuoteFormState } from "@/lib/quotes/actions";
import { addQuoteLine } from "@/lib/quotes/actions";

const INITIAL_STATE: QuoteFormState = { status: "idle" };

type Props = { quoteId: string };

export default function AddLineForm({ quoteId }: Props) {
  const [state, formAction, isPending] = useActionState(addQuoteLine, INITIAL_STATE);

  return (
    <Box component="form" action={formAction} sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {state.status === "error" && (
        <Alert severity="error" sx={{ mb: 1 }}>{state.message}</Alert>
      )}
      <input type="hidden" name="quote_id" value={quoteId} />
      <TextField
        label="Description"
        name="description"
        required
        size="small"
        disabled={isPending}
        placeholder="e.g. Aranjament floral masă"
      />
      <Box sx={{ display: "flex", gap: 1 }}>
        <TextField
          label="Qty"
          name="quantity"
          type="number"
          required
          size="small"
          defaultValue="1"
          disabled={isPending}
          sx={{ width: 80 }}
          slotProps={{ htmlInput: { min: 0, step: 0.001 } }}
        />
        <TextField
          label="Unit price (net)"
          name="unit_price_net"
          type="number"
          required
          size="small"
          disabled={isPending}
          sx={{ flex: 1 }}
          slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
        />
        <TextField
          label="Unit cost (net)"
          name="unit_cost_net"
          type="number"
          size="small"
          disabled={isPending}
          sx={{ flex: 1 }}
          slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
        />
      </Box>
      <Box>
        <Button type="submit" variant="contained" size="small" disabled={isPending}>
          {isPending ? "Adding…" : "Add line"}
        </Button>
      </Box>
    </Box>
  );
}
