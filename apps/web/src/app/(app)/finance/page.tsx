import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { resolveCurrentOrg } from "@/lib/org/membership";
import {
  listTransactions,
  getCashSummary,
  listExpenseClaims,
} from "@/lib/finance/queries";
import { formatMoney } from "@/lib/money/format";
import { deleteTransaction, updateExpenseClaimStatus } from "@/lib/finance/actions";
import { LinkButton } from "@/components/ui/LinkButton";
import { NavLink } from "@/components/ui/NavLink";

export const metadata: Metadata = { title: "Finance" };

const CLAIM_STATUS_COLOR: Record<
  string,
  "default" | "warning" | "success" | "error" | "info"
> = {
  pending: "warning",
  approved: "info",
  rejected: "error",
  paid: "success",
};

export default async function FinancePage() {
  const currentOrg = await resolveCurrentOrg();
  if (!currentOrg) return null;

  const [transactions, summary, claims] = await Promise.all([
    listTransactions(currentOrg.organizationId),
    getCashSummary(currentOrg.organizationId),
    listExpenseClaims(currentOrg.organizationId),
  ]);

  const isOwner = currentOrg.role === "owner";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, flex: 1 }}>
          Finance
        </Typography>
        <LinkButton href="/finance/new" variant="contained" size="small">
          Add transaction
        </LinkButton>
      </Box>

      {/* Cash summary */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Card sx={{ flex: 1, minWidth: 160 }}>
          <CardContent>
            <Typography variant="caption" color="text.secondary">
              Total income
            </Typography>
            <Typography variant="h6" color="success.main" sx={{ fontWeight: 700 }}>
              {formatMoney(summary.totalIncome)}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 160 }}>
          <CardContent>
            <Typography variant="caption" color="text.secondary">
              Total expenses
            </Typography>
            <Typography variant="h6" color="error.main" sx={{ fontWeight: 700 }}>
              {formatMoney(summary.totalExpense)}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 160 }}>
          <CardContent>
            <Typography variant="caption" color="text.secondary">
              Net balance
            </Typography>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700 }}
              color={
                summary.netBalance >= 0 ? "primary.main" : "error.main"
              }
            >
              {formatMoney(summary.netBalance)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Transactions */}
      <Box>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Transactions
        </Typography>
        {transactions.length === 0 ? (
          <Typography color="text.secondary">
            No transactions yet.{" "}
            <NavLink href="/finance/new">Add the first one.</NavLink>
          </Typography>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Event</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  {isOwner && <TableCell />}
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id} hover>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {tx.transaction_date}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tx.type}
                        size="small"
                        color={tx.type === "income" ? "success" : "error"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{tx.description}</TableCell>
                    <TableCell>
                      {tx.expense_categories?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      {tx.events?.title ? (
                        <NavLink href={`/events/${tx.event_id}`} underline="hover">
                          {tx.events.title}
                        </NavLink>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      <Typography
                        variant="body2"
                        color={tx.type === "income" ? "success.main" : "error.main"}
                        sx={{ fontWeight: 600 }}
                      >
                        {tx.type === "expense" ? "−" : "+"}
                        {formatMoney(tx.amount_ron ?? tx.amount)}
                      </Typography>
                      {tx.currency !== "RON" && (
                        <Typography variant="caption" color="text.secondary">
                          {formatMoney(tx.amount, tx.currency)}
                        </Typography>
                      )}
                    </TableCell>
                    {isOwner && (
                      <TableCell>
                        <form
                          action={deleteTransaction.bind(null, tx.id)}
                        >
                          <button
                            type="submit"
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "#d32f2f",
                              fontSize: 12,
                            }}
                          >
                            Delete
                          </button>
                        </form>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Box>

      {/* Expense claims */}
      {claims.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Expense claims
          </Typography>
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  {isOwner && <TableCell>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {claims.map((claim) => (
                  <TableRow key={claim.id} hover>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {claim.submitted_at.slice(0, 10)}
                    </TableCell>
                    <TableCell>{claim.description}</TableCell>
                    <TableCell>
                      <Chip
                        label={claim.status}
                        size="small"
                        color={CLAIM_STATUS_COLOR[claim.status] ?? "default"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {formatMoney(claim.amount_ron ?? claim.amount)}
                    </TableCell>
                    {isOwner && claim.status === "pending" && (
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <form
                            action={updateExpenseClaimStatus.bind(
                              null,
                              claim.id,
                              "approved",
                            )}
                          >
                            <button
                              type="submit"
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "#2e7d32",
                                fontSize: 12,
                              }}
                            >
                              Approve
                            </button>
                          </form>
                          <form
                            action={updateExpenseClaimStatus.bind(
                              null,
                              claim.id,
                              "rejected",
                            )}
                          >
                            <button
                              type="submit"
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "#d32f2f",
                                fontSize: 12,
                              }}
                            >
                              Reject
                            </button>
                          </form>
                        </Box>
                      </TableCell>
                    )}
                    {isOwner && claim.status !== "pending" && (
                      <TableCell>—</TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Box>
      )}
    </Box>
  );
}
