import type { Metadata } from "next";
import PlaceholderPage from "@/components/PlaceholderPage";

export const metadata: Metadata = { title: "Documents" };

export default function DocumentsPage() {
  return (
    <PlaceholderPage
      title="Documents"
      subtitle="Invoices and receipts archive with OCR review."
      phaseNote="Document upload and OCR review arrive in Phase 6."
    />
  );
}
