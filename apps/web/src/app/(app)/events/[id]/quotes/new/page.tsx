import { notFound, redirect } from "next/navigation";
import { resolveCurrentOrg } from "@/lib/org/membership";
import { getEvent } from "@/lib/events/queries";
import { createQuote } from "@/lib/quotes/actions";

type Props = { params: Promise<{ id: string }> };

export default async function NewQuotePage({ params }: Props) {
  const { id } = await params;
  const currentOrg = await resolveCurrentOrg();
  if (!currentOrg) notFound();

  const event = await getEvent(currentOrg.organizationId, id);
  if (!event) notFound();

  await createQuote(event.id, currentOrg.organizationId);

  redirect(`/events/${id}`);
}
