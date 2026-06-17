import type { Metadata } from "next";
import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Chip from "@mui/material/Chip";
import { resolveCurrentOrg } from "@/lib/org/membership";
import { listEvents } from "@/lib/events/queries";
import { EVENT_STATUS_LABELS, EVENT_STATUS_COLOR } from "@/lib/events/status";

export const metadata: Metadata = { title: "Events" };

export default async function EventsPage() {
  const currentOrg = await resolveCurrentOrg();
  const events = currentOrg ? await listEvents(currentOrg.organizationId) : [];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" component="h1">Events</Typography>
        <Button variant="contained" component={Link} href="/events/new">
          New event
        </Button>
      </Box>

      {events.length === 0 ? (
        <Typography color="text.secondary">
          No events yet. Create your first event to get started.
        </Typography>
      ) : (
        <List disablePadding sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
          {events.map((event, index) => (
            <ListItem
              key={event.id}
              disablePadding
              divider={index < events.length - 1}
            >
              <ListItemButton component={Link} href={`/events/${event.id}`}>
                <ListItemText
                  primary={event.title}
                  secondary={[
                    new Date(event.event_date).toLocaleDateString("ro-RO"),
                    event.clients?.name,
                    event.city,
                  ].filter(Boolean).join(" · ")}
                />
                <Chip
                  label={EVENT_STATUS_LABELS[event.status]}
                  color={EVENT_STATUS_COLOR[event.status]}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
