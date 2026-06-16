import type { Metadata } from "next";
import PlaceholderPage from "@/components/PlaceholderPage";

export const metadata: Metadata = { title: "Events" };

export default function EventsPage() {
  return (
    <PlaceholderPage
      title="Events"
      subtitle="Plan and operate every event end to end."
      phaseNote="The events module — list, detail, tasks, and status flow — arrives in Phase 3."
    />
  );
}
