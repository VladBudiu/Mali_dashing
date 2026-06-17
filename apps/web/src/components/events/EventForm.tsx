"use client";

import { useActionState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import type { EventRow } from "@/lib/events/queries";
import type { EventFormState } from "@/lib/events/actions";
import type { ClientRow } from "@/lib/clients/queries";
import { ALL_EVENT_STATUSES, EVENT_STATUS_LABELS } from "@/lib/events/status";

const INITIAL_STATE: EventFormState = { status: "idle" };

const CURRENCIES = ["RON", "EUR"];

type Props = {
  action: (prevState: EventFormState, formData: FormData) => Promise<EventFormState>;
  event?: EventRow;
  clients: ClientRow[];
  cancelHref: string;
};

export default function EventForm({ action, event, clients, cancelHref }: Props) {
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);

  const defaultDate = event?.event_date
    ? new Date(event.event_date).toISOString().slice(0, 16)
    : "";

  return (
    <Box component="form" action={formAction} sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 560 }}>
      {state.status === "error" && (
        <Alert severity="error">{state.message}</Alert>
      )}
      {event && <input type="hidden" name="event_id" value={event.id} />}

      <TextField
        label="Title"
        name="title"
        required
        defaultValue={event?.title ?? ""}
        disabled={isPending}
        placeholder="e.g. Nuntă Popescu — Sala Regal"
      />
      <TextField
        label="Event date & time"
        name="event_date"
        type="datetime-local"
        required
        defaultValue={defaultDate}
        disabled={isPending}
        slotProps={{ inputLabel: { shrink: true } }}
      />
      <TextField
        select
        label="Status"
        name="status"
        defaultValue={event?.status ?? "draft"}
        disabled={isPending}
      >
        {ALL_EVENT_STATUSES.map((s) => (
          <MenuItem key={s} value={s}>{EVENT_STATUS_LABELS[s]}</MenuItem>
        ))}
      </TextField>
      <TextField
        select
        label="Client"
        name="client_id"
        defaultValue={event?.client_id ?? ""}
        disabled={isPending}
      >
        <MenuItem value="">— No client —</MenuItem>
        {clients.map((c) => (
          <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
        ))}
      </TextField>
      <TextField
        label="Venue name"
        name="venue_name"
        defaultValue={event?.venue_name ?? ""}
        disabled={isPending}
      />
      <TextField
        label="Venue address"
        name="venue_address"
        defaultValue={event?.venue_address ?? ""}
        disabled={isPending}
      />
      <TextField
        label="City"
        name="city"
        defaultValue={event?.city ?? ""}
        disabled={isPending}
      />
      <TextField
        select
        label="Currency"
        name="pricing_currency"
        defaultValue={event?.pricing_currency ?? "RON"}
        disabled={isPending}
      >
        {CURRENCIES.map((c) => (
          <MenuItem key={c} value={c}>{c}</MenuItem>
        ))}
      </TextField>
      <TextField
        label="Notes"
        name="notes"
        multiline
        minRows={3}
        defaultValue={event?.notes ?? ""}
        disabled={isPending}
      />
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button type="submit" variant="contained" disabled={isPending}>
          {isPending ? "Saving…" : event ? "Save changes" : "Create event"}
        </Button>
        <Button variant="outlined" href={cancelHref} disabled={isPending}>
          Cancel
        </Button>
      </Box>
    </Box>
  );
}
