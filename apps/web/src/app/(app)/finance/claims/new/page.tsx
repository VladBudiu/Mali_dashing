import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Typography from "@mui/material/Typography";
import ExpenseClaimForm from "@/components/finance/ExpenseClaimForm";
import { NavLink } from "@/components/ui/NavLink";

export const metadata: Metadata = { title: "Submit Expense Claim" };
export const dynamic = "force-dynamic";

export default function NewExpenseClaimPage() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Breadcrumbs>
        <NavLink href="/finance" underline="hover" color="inherit">
          Finance
        </NavLink>
        <Typography color="text.primary">Submit expense claim</Typography>
      </Breadcrumbs>

      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Submit expense claim
      </Typography>

      <ExpenseClaimForm />
    </Box>
  );
}
