"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  AUTH_CALLBACK_PATH,
  LOGIN_PATH,
  REDIRECT_QUERY_PARAM,
} from "./constants";

const signInSchema = z.object({
  email: z.string().email(),
  redirectTo: z.string().startsWith("/").optional(),
});

export type SignInState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "error"; message: string };

const GENERIC_ERROR =
  "Could not send the sign-in link. Check the email and try again.";

async function resolveOrigin(): Promise<string> {
  const headerList = await headers();
  const origin = headerList.get("origin");
  if (origin) {
    return origin;
  }
  const host = headerList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host ?? "localhost:3000"}`;
}

/**
 * Sends a passwordless magic-link email to the submitted address. Designed for
 * use with useActionState: returns a discriminated state the form renders.
 * Never reveals whether the email maps to an existing account.
 */
export async function signInWithEmail(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    redirectTo: formData.get("redirectTo") || undefined,
  });

  if (!parsed.success) {
    return { status: "error", message: "Enter a valid email address." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { status: "error", message: GENERIC_ERROR };
  }

  const origin = await resolveOrigin();
  const callbackUrl = new URL(AUTH_CALLBACK_PATH, origin);
  if (parsed.data.redirectTo) {
    callbackUrl.searchParams.set(REDIRECT_QUERY_PARAM, parsed.data.redirectTo);
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: callbackUrl.toString() },
  });

  if (error) {
    return { status: "error", message: GENERIC_ERROR };
  }

  return { status: "sent", email: parsed.data.email };
}

/**
 * Ends the current session and returns the user to the login page.
 */
export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect(LOGIN_PATH);
}
