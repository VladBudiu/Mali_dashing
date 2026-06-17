"use client";

import NextLink from "next/link";
import ListItemButton, {
  type ListItemButtonProps,
} from "@mui/material/ListItemButton";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ItemButtonLink = ListItemButton as any;

type Props = Omit<ListItemButtonProps, "component"> & { href: string };

export function LinkListItemButton({ href, ...props }: Props) {
  return <ItemButtonLink {...props} component={NextLink} href={href} />;
}
