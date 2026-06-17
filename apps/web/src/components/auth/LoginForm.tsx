"use client";

import { useActionState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { signInWithEmail, type SignInState } from "@/lib/auth/actions";

const INITIAL_STATE: SignInState = { status: "idle" };

/**
 * Passwordless sign-in form. Submits the email to the magic-link server action
 * and renders the resulting state (sent / error). Pure presentation: all auth
 * logic lives in the server action.
 */
export default function LoginForm({
  redirectTo,
  initialError,
}: {
  redirectTo?: string;
  initialError?: string;
}) {
  const [state, formAction, isPending] = useActionState(
    signInWithEmail,
    INITIAL_STATE,
  );

  if (state.status === "sent") {
    return (
      <Alert severity="success">
        Check <strong>{state.email}</strong> for a sign-in link.
      </Alert>
    );
  }

  return (
    <form action={formAction}>
      <Stack spacing={2}>
        {initialError ? (
          <Alert severity="error">
            That sign-in link is invalid or has expired. Request a new one.
          </Alert>
        ) : null}
        {state.status === "error" ? (
          <Alert severity="error">{state.message}</Alert>
        ) : null}
        {redirectTo ? (
          <input type="hidden" name="redirectTo" value={redirectTo} />
        ) : null}
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          fullWidth
          disabled={isPending}
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={isPending}
        >
          {isPending ? "Sending link…" : "Continue"}
        </Button>
        <Typography variant="caption" color="text.secondary">
          We&apos;ll email you a secure link to sign in. No password needed.
        </Typography>
      </Stack>
    </form>
  );
}
