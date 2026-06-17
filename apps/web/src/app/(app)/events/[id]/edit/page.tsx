import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { resolveCurrentOrg } from "@/lib/org/membership";
import { getEvent } from "@/lib/events/queries";
import { listClients } from "@/lib/clients/queries";
import { updateEvent } from "@/lib/events/actions";
import EventForm from "@/components/events/EventForm";

export const metadata: Metadata = { title: "Edit Event" };

type Props = { params: Promise<{ id: string }> };

export default async function EditEventPage({ params }: Props) {
  const { id } = await params;
  const currentOrg = await resolveCurrentOrg();
  if (!currentOrg) notFound();

  const [event, clients] = await Promise.all([
    getEvent(currentOrg.organizationId, id),
    listClients(currentOrg.organizationId),
  ]);
  if (!event) notFound();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" component="h1" sx={{ mb: 3 }}>
        Edit — {event.title}
      </Typography>
      <EventForm
        action={updateEvent}
        event={event}
        clients={clients}
        cancelHref={`/events/${event.id}`}
      />
    </Box>
  );
}
