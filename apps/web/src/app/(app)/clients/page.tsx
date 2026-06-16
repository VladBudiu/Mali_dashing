import type { Metadata } from "next";
import PlaceholderPage from "@/components/PlaceholderPage";

export const metadata: Metadata = { title: "Clients" };

export default function ClientsPage() {
  return (
    <PlaceholderPage
      title="Clients"
      subtitle="Leads, contacts, and client relationships."
      phaseNote="The CRM module arrives in Phase 3."
    />
  );
}
