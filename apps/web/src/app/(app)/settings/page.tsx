import type { Metadata } from "next";
import PlaceholderPage from "@/components/PlaceholderPage";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <PlaceholderPage
      title="Settings"
      subtitle="Organization, members, and fiscal configuration."
      phaseNote="Org settings and membership management arrive in Phase 2."
    />
  );
}
