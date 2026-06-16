import type { Metadata } from "next";
import PlaceholderPage from "@/components/PlaceholderPage";

export const metadata: Metadata = { title: "Assistant" };

export default function AssistantPage() {
  return (
    <PlaceholderPage
      title="Assistant"
      subtitle="Ask questions and get explained, permission-aware answers."
      phaseNote="The read-only AI assistant arrives in Phase 7."
    />
  );
}
