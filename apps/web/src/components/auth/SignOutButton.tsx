"use client";

import Button, { type ButtonProps } from "@mui/material/Button";
import { signOut } from "@/lib/auth/actions";

/**
 * Submits the sign-out server action. Rendered as a plain form so it works
 * without client-side JavaScript.
 */
export default function SignOutButton({
  size = "small",
  variant = "outlined",
}: Pick<ButtonProps, "size" | "variant">) {
  return (
    <form action={signOut}>
      <Button type="submit" size={size} variant={variant} color="inherit">
        Sign out
      </Button>
    </form>
  );
}
