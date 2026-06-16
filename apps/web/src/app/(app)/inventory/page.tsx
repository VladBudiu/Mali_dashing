import type { Metadata } from "next";
import PlaceholderPage from "@/components/PlaceholderPage";

export const metadata: Metadata = { title: "Inventory" };

export default function InventoryPage() {
  return (
    <PlaceholderPage
      title="Inventory"
      subtitle="Assets, consumables, and stock movements."
      phaseNote="Inventory tracking arrives in a later phase of the roadmap."
    />
  );
}
