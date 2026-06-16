import type { Metadata } from "next";
import PlaceholderPage from "@/components/PlaceholderPage";

export const metadata: Metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <PlaceholderPage
      title="Pricing"
      subtitle="Cost and price lines, margin, discount, and deposit."
      phaseNote="The pricing calculator and quotes arrive in Phase 4."
    />
  );
}
