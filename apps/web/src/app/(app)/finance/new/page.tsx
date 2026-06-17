import type { Metadata } from "next";
import Link from "next/link";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import MuiLink from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { createTransaction } from "@/lib/finance/actions";
import TransactionForm from "@/components/finance/TransactionForm";

export const metadata: Metadata = { title: "Add Transaction" };

export default function NewTransactionPage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Breadcrumbs>
        <MuiLink component={Link} href="/finance" underline="hover" color="inherit">
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
