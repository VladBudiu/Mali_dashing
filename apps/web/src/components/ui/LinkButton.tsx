"use client";

import NextLink from "next/link";
import Button, { type ButtonProps } from "@mui/material/Button";

// MUI v9 polymorphic types don't resolve cleanly with component= via spread;
// cast through any to preserve all ButtonProps at the call sites.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ButtonLink = Button as any;

type Props = Omit<ButtonProps, "component"> & { href: string };

export function LinkButton({ href, ...props }: Props) {
  return <ButtonLink {...props} component={NextLink} href={href} />;
}
