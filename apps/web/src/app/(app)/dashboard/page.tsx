import type { Metadata } from "next";
import Box from "@mui/material/Box";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";

export const metadata: Metadata = {
  title: "Dashboard",
};

const PLACEHOLDER_STATS = [
  { label: "Upcoming events", value: "—", hint: "Next 30 days" },
  { label: "Cash balance", value: "—", hint: "RON" },
  { label: "Awaiting invoice", value: "—", hint: "RON" },
  { label: "Documents in review", value: "—", hint: "Unvalidated" },
];

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Business snapshot. Live data arrives with the finance and events modules."
      />
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)",
          },
        }}
      >
        {PLACEHOLDER_STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </Box>
    </>
  );
}
