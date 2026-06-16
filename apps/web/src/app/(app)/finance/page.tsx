import type { Metadata } from "next";
import PlaceholderPage from "@/components/PlaceholderPage";

export const metadata: Metadata = { title: "Finance" };

export default function FinancePage() {
  return (
    <PlaceholderPage
      title="Finance"
      subtitle="Income, payments, expenses, and per-event profit."
      phaseNote="Transactions and exchange rates arrive in Phase 5."
    />
  );
}
