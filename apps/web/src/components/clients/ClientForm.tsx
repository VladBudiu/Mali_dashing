"use client";

import { useActionState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import type { ClientRow } from "@/lib/clients/queries";
import type { ClientFormState } from "@/lib/clients/actions";

const INITIAL_STATE: ClientFormState = { status: "idle" };

type Props = {
  action: (prevState: ClientFormState, formData: FormData) => Promise<ClientFormState>;
  client?: ClientRow;
  cancelHref: string;
};

export default function ClientForm({ action, client, cancelHref }: Props) {
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);

  return (
    <Box component="form" action={formAction} sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 560 }}>
      {state.status === "error" && (
        <Alert severity="error">{state.message}</Alert>
      )}
      {client && (
        <input type="hidden" name="client_id" value={client.id} />
      )}
      <TextField
        label="Name"
        name="name"
        required
        defaultValue={client?.name ?? ""}
        disabled={isPending}
      />
      <TextField
        select
        label="Type"
        name="type"
        defaultValue={client?.type ?? "individual"}
        disabled={isPending}
      >
        <MenuItem value="individual">Individual</MenuItem>
        <MenuItem value="company">Company</MenuItem>
      </TextField>
      <TextField
        label="Tax ID (CIF / CNP)"
        name="tax_id"
        defaultValue={client?.tax_id ?? ""}
        disabled={isPending}
      />
      <TextField
        label="Phone"
        name="phone"
        defaultValue={client?.phone ?? ""}
        disabled={isPending}
      />
      <TextField
        label="Email"
        name="email"
        type="email"
        defaultValue={client?.email ?? ""}
        disabled={isPending}
      />
      <TextField
        label="Notes"
        name="notes"
        multiline
        minRows={3}
        defaultValue={client?.notes ?? ""}
        disabled={isPending}
      />
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button type="submit" variant="contained" disabled={isPending}>
          {isPending ? "Saving…" : client ? "Save changes" : "Create client"}
        </Button>
        <Button variant="outlined" href={cancelHref} disabled={isPending}>
          Cancel
        </Button>
      </Box>
    </Box>
  );
}
