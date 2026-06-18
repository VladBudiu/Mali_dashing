import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { resolveCurrentOrg } from "@/lib/org/membership";
import { getDashboardData } from "@/lib/dashboard/stats";
import { formatMoney } from "@/lib/money/format";
import { EVENT_STATUS_LABELS, EVENT_STATUS_COLOR } from "@/lib/events/status";
import type { EventStatus } from "@mali/types";
import { NavLink } from "@/components/ui/NavLink";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const currentOrg = await resolveCurrentOrg();
  if (!currentOrg) return null;

  const today = new Date().toISOString().slice(0, 10);
  const data = await getDashboardData(currentOrg.organizationId, today);

  const stats = [
    { label: "Upcoming events", value: String(data.upcomingEvents), hint: "Today onward" },
    { label: "Cash balance", value: formatMoney(data.cashBalanceRON), hint: "Income − expense" },
    { label: "Pending claims", value: String(data.pendingClaims), hint: "Awaiting approval" },
    { label: "Low / out of stock", value: String(data.lowStockItems), hint: "Items needing attention" },
  ];

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Your business at a glance." />

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
        }}
      >
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          mt: 3,
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        }}
      >
        {/* Upcoming events */}
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1 }}>
              Upcoming events
            </Typography>
            <NavLink href="/events" underline="hover" sx={{ fontSize: 13 }}>
              All events
            </NavLink>
          </Box>
          {data.nextEvents.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No upcoming events. <NavLink href="/events/new">Create one.</NavLink>
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {data.nextEvents.map((e) => (
                <Box key={e.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <NavLink href={`/events/${e.id}`} underline="hover">
                      {e.title}
                    </NavLink>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      {new Date(e.event_date).toLocaleDateString("ro-RO")}
                    </Typography>
                  </Box>
                  <Chip
                    label={EVENT_STATUS_LABELS[e.status as EventStatus] ?? e.status}
                    color={EVENT_STATUS_COLOR[e.status as EventStatus] ?? "default"}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              ))}
            </Box>
          )}
        </Paper>

        {/* Recent transactions */}
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1 }}>
              Recent transactions
            </Typography>
            <NavLink href="/finance" underline="hover" sx={{ fontSize: 13 }}>
              All finance
            </NavLink>
          </Box>
          {data.recentTransactions.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No transactions yet. <NavLink href="/finance/new">Add one.</NavLink>
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {data.recentTransactions.map((t) => (
                <Box key={t.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" noWrap>
                      {t.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t.transaction_date}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, whiteSpace: "nowrap" }}
                    color={t.type === "income" ? "success.main" : "error.main"}
                  >
                    {t.type === "expense" ? "−" : "+"}
                    {formatMoney(t.amount_ron)}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      </Box>

      {data.docsInReview > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
          {data.docsInReview} document{data.docsInReview === 1 ? "" : "s"} still processing OCR.{" "}
          <NavLink href="/documents">View documents</NavLink>
        </Typography>
      )}
    </>
  );
}
