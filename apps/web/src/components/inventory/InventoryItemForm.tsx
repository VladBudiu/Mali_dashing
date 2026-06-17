"use client";

import { useActionState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import type { InventoryItemRow } from "@/lib/inventory/queries";
import type { InventoryFormState } from "@/lib/inventory/actions";

const INITIAL_STATE: InventoryFormState = { status: "idle" };

type Props = {
  action: (
    prevState: InventoryFormState,
    formData: FormData,
  ) => Promise<InventoryFormState>;
  item?: InventoryItemRow;
  cancelHref: string;
};

export default function InventoryItemForm({ action, item, cancelHref }: Props) {
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);

  return (
    <Box
      component="form"
      action={formAction}
      sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 560 }}
    >
      {state.status === "error" && <Alert severity="error">{state.message}</Alert>}
      {item && <input type="hidden" name="item_id" value={item.id} />}

      <TextField
        label="Name"
        name="name"
        required
        defaultValue={item?.name ?? ""}
        disabled={isPending}
        placeholder="e.g. Față de masă albă 220cm"
      />
      <Box sx={{ display: "flex", gap: 2 }}>
        <TextField
          label="SKU"
          name="sku"
          defaultValue={item?.sku ?? ""}
          disabled={isPending}
          sx={{ flex: 1 }}
          placeholder="optional"
        />
        <TextField
          label="Category"
          name="category"
          defaultValue={item?.category ?? ""}
          disabled={isPending}
          sx={{ flex: 1 }}
          placeholder="e.g. Textile"
        />
      </Box>
      <Box sx={{ display: "flex", gap: 2 }}>
        <TextField
          label="Unit"
          name="unit"
          defaultValue={item?.unit ?? "buc"}
          disabled={isPending}
          sx={{ flex: 1 }}
          helperText="e.g. buc, set, m"
        />
        <TextField
          label="Reorder threshold"
          name="reorder_threshold"
          type="number"
          defaultValue={item?.reorder_threshold ?? ""}
          disabled={isPending}
          sx={{ flex: 1 }}
          slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
          helperText="Warn when available ≤ this"
        />
        <TextField
          label="Unit cost (RON)"
          name="unit_cost_ron"
          type="number"
          defaultValue={item?.unit_cost_ron ?? ""}
          disabled={isPending}
          sx={{ flex: 1 }}
          slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
        />
      </Box>
      <TextField
        label="Notes"
        name="notes"
        multiline
        minRows={3}
        defaultValue={item?.notes ?? ""}
        disabled={isPending}
      />
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button type="submit" variant="contained" disabled={isPending}>
          {isPending ? "Saving…" : item ? "Save changes" : "Create item"}
        </Button>
        <Button variant="outlined" href={cancelHref} disabled={isPending}>
          Cancel
        </Button>
      </Box>
    </Box>
  );
}
