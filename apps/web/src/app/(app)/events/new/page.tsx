import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import EventForm from "@/components/events/EventForm";
import { createEvent } from "@/lib/events/actions";
import { resolveCurrentOrg } from "@/lib/org/membership";
import { listClients } from "@/lib/clients/queries";

export const metadata: Metadata = { title: "New Event" };

export default async function NewEventPage() {
  const currentOrg = await resolveCurrentOrg();
  const clients = currentOrg ? await listClients(currentOrg.organizationId) : [];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" component="h1" sx={{ mb: 3 }}>
        New event
      </Typography>
      <EventForm action={createEvent} clients={clients} cancelHref="/events" />
    </Box>
  );
}
