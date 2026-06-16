import type { Metadata } from "next";
import PlaceholderPage from "@/components/PlaceholderPage";

export const metadata: Metadata = { title: "Collaborators" };

export default function CollaboratorsPage() {
  return (
    <PlaceholderPage
      title="Collaborators"
      subtitle="People, roles, rates, and availability."
      phaseNote="Collaborator management arrives in Phase 3."
    />
  );
}
