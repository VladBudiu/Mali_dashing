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
import type { DocumentFormState } from "@/lib/documents/actions";

const DOC_TYPES = [
  { value: "invoice", label: "Invoice" },
  { value: "receipt", label: "Receipt" },
  { value: "contract", label: "Contract" },
  { value: "other", label: "Other" },
] as const;

const ACCEPTED_TYPES = ".pdf,.jpg,.jpeg,.png,.webp";

type EventOption = { id: string; title: string };

type Props = {
  action: (
    prevState: DocumentFormState,
    formData: FormData,
  ) => Promise<DocumentFormState>;
  events?: EventOption[];
};

export default function UploadForm({ action, events = [] }: Props) {
  const [state, formAction, isPending] = useActionState(action, {
    status: "idle",
  });

  return (
    <Box
      component="form"
      action={formAction}
      encType="multipart/form-data"
      sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 560 }}
    >
      {state.status === "error" && (
        <Alert severity="error">{state.message}</Alert>
      )}

      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          File (PDF, JPEG, PNG, WebP — max 10 MB)
        </Typography>
        <input
          type="file"
          name="file"
          accept={ACCEPTED_TYPES}
          required
          style={{ display: "block" }}
        />
      </Box>

      <TextField
        select
        label="Document type"
        name="doc_type"
        defaultValue="other"
        required
      >
        {DOC_TYPES.map((t) => (
          <MenuItem key={t.value} value={t.value}>
            {t.label}
          </MenuItem>
        ))}
      </TextField>

      {events.length > 0 && (
        <TextField select label="Linked event (optional)" name="event_id" defaultValue="">
          <MenuItem value="">— No event —</MenuItem>
          {events.map((e) => (
            <MenuItem key={e.id} value={e.id}>
              {e.title}
            </MenuItem>
          ))}
        </TextField>
      )}

      <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
        <Button
          type="submit"
          variant="contained"
          disabled={isPending}
          sx={{ minWidth: 140 }}
        >
          {isPending ? "Uploading…" : "Upload document"}
        </Button>
        <Button
          component={NextLink}
          href="/documents"
          variant="outlined"
          LinkComponent={Link}
        >
          Cancel
        </Button>
      </Box>
    </Box>
  );
}
