"use client";

import NextLink from "next/link";
import MuiLink, { type LinkProps } from "@mui/material/Link";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnchorLink = MuiLink as any;

type Props = Omit<LinkProps, "component"> & { href: string };

export function NavLink({ href, ...props }: Props) {
  return <AnchorLink {...props} component={NextLink} href={href} />;
}
