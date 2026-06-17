"use client";

import NextLink from "next/link";
import TableRow, { type TableRowProps } from "@mui/material/TableRow";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RowLink = TableRow as any;

type Props = Omit<TableRowProps, "component"> & { href: string };

export function LinkRow({ href, ...props }: Props) {
  return <RowLink {...props} component={NextLink} href={href} />;
}
