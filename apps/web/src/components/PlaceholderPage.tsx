import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";

export type PlaceholderPageProps = {
  title: string;
  subtitle?: string;
  phaseNote: string;
};

/**
 * Standard scaffold page: a titled header above an empty-state card describing
 * which roadmap phase will deliver the real feature. Used across MVP routes.
 */
export default function PlaceholderPage({
  title,
  subtitle,
  phaseNote,
}: PlaceholderPageProps) {
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <EmptyState title="Coming soon" description={phaseNote} />
    </>
  );
}
