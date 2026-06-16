import type { Metadata } from "next";
import PlaceholderPage from "@/components/PlaceholderPage";

export const metadata: Metadata = { title: "Event detail" };

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PlaceholderPage
      title="Event detail"
      subtitle={`Event ${id}`}
      phaseNote="Event timeline, quote, costs, documents, and profit land in Phase 3."
    />
  );
}
