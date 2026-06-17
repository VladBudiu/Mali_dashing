import type { Metadata } from "next";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import MuiLink from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { createTransaction } from "@/lib/finance/actions";
import TransactionForm from "@/components/finance/TransactionForm";

export const metadata: Metadata = { title: "Add Transaction" };
// This page has no async server calls, so we force dynamic to prevent static
// prerendering — which can't serialize next/link as a client component prop.
export const dynamic = "force-dynamic";

export default function NewTransactionPage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Breadcrumbs>
        <MuiLink component={NextLink} href="/finance" underline="hover" color="inherit">
          Finance
        </MuiLink>
        <Typography color="text.primary">Add transaction</Typography>
      </Breadcrumbs>

      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Add transaction
      </Typography>

      <TransactionForm action={createTransaction} defaultDate={today} />
    </Box>
  );
}
