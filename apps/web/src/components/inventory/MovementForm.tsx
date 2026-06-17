"use client";

import { useActionState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import { recordMovement, type InventoryFormState } from "@/lib/inventory/actions";
import { MOVEMENT_TYPES, MOVEMENT_TYPE_LABELS } from "@/lib/inventory/stock";

const INITIAL_STATE: InventoryFormState = { status: "idle" };

type EventOption = { id: string; title: string };

type Props = {
  itemId: string;
  unit: string;
  events: EventOption[];
};

export default function MovementForm({ itemId, unit, events }: Props) {
  const [state, formAction, isPending] = useActionState(
    recordMovement,
    INITIAL_STATE,
  );

  return (
    <Box
      component="form"
      action={formAction}
      sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 480 }}
    >
      {state.status === "error" && <Alert severity="error">{state.message}</Alert>}
      <input type="hidden" name="item_id" value={itemId} />

      <Box sx={{ display: "flex", gap: 2 }}>
        <TextField
          select
          label="Movement"
          name="movement_type"
          defaultValue="in"
          disabled={isPending}
          sx={{ flex: 1 }}
        >
          {MOVEMENT_TYPES.map((t) => (
            <MenuItem key={t} value={t}>
              {MOVEMENT_TYPE_LABELS[t]}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label={`Quantity (${unit})`}
          name="quantity"
          type="number"
          required
          disabled={isPending}
          sx={{ flex: 1 }}
          slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
        />
      </Box>

      <TextField
        select
        label="Linked event"
        name="event_id"
        defaultValue=""
        disabled={isPending}
        helperText="Optional — tie this movement to an event"
      >
        <MenuItem value="">— None —</MenuItem>
        {events.map((e) => (
          <MenuItem key={e.id} value={e.id}>
            {e.title}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        label="Note"
        name="note"
        disabled={isPending}
        placeholder="optional"
      />

      <Box>
        <Button type="submit" variant="contained" disabled={isPending}>
          {isPending ? "Recording…" : "Record movement"}
        </Button>
      </Box>
    </Box>
  );
}
