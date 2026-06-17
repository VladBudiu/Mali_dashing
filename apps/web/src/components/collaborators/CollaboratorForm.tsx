"use client";

import { useActionState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import type { CollaboratorRow } from "@/lib/collaborators/queries";
import type { CollaboratorFormState } from "@/lib/collaborators/actions";

const INITIAL_STATE: CollaboratorFormState = { status: "idle" };

type Props = {
  action: (prevState: CollaboratorFormState, formData: FormData) => Promise<CollaboratorFormState>;
  collaborator?: CollaboratorRow;
  cancelHref: string;
};

export default function CollaboratorForm({ action, collaborator, cancelHref }: Props) {
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);

  return (
    <Box component="form" action={formAction} sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 560 }}>
      {state.status === "error" && (
        <Alert severity="error">{state.message}</Alert>
      )}
      {collaborator && (
        <input type="hidden" name="collaborator_id" value={collaborator.id} />
      )}
      <TextField
        label="Name"
        name="name"
        required
        defaultValue={collaborator?.name ?? ""}
        disabled={isPending}
      />
      <TextField
        label="Specialty"
        name="specialty"
        defaultValue={collaborator?.specialty ?? ""}
        disabled={isPending}
        placeholder="e.g. Floral arrangements, Lighting, Photography"
      />
      <TextField
        label="Phone"
        name="phone"
        defaultValue={collaborator?.phone ?? ""}
        disabled={isPending}
      />
      <TextField
        label="Email"
        name="email"
        type="email"
        defaultValue={collaborator?.email ?? ""}
        disabled={isPending}
      />
      <TextField
        label="Notes"
        name="notes"
        multiline
        minRows={3}
        defaultValue={collaborator?.notes ?? ""}
        disabled={isPending}
      />
      <FormControlLabel
        control={
          <Switch
            name="is_active"
            value="true"
            defaultChecked={collaborator?.is_active ?? true}
            disabled={isPending}
          />
        }
        label="Active"
      />
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button type="submit" variant="contained" disabled={isPending}>
          {isPending ? "Saving…" : collaborator ? "Save changes" : "Add collaborator"}
        </Button>
        <Button variant="outlined" href={cancelHref} disabled={isPending}>
          Cancel
        </Button>
      </Box>
    </Box>
  );
}
