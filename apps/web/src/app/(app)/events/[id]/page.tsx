import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { resolveCurrentOrg } from "@/lib/org/membership";
import { getEvent, getEventAssignments } from "@/lib/events/queries";
import { deleteEvent } from "@/lib/events/actions";
import { EVENT_STATUS_LABELS, EVENT_STATUS_COLOR } from "@/lib/events/status";
import { listQuotesForEvent } from "@/lib/quotes/queries";

export const metadata: Metadata = { title: "Event" };

type Props = { params: Promise<{ id: string }> };

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const currentOrg = await resolveCurrentOrg();
  if (!currentOrg) notFound();

  const [event, assignments, quotes] = await Promise.all([
    getEvent(currentOrg.organizationId, id),
    getEventAssignments(id),
    listQuotesForEvent(id),
  ]);
  if (!event) notFound();

  const canDelete = currentOrg.role === "owner";

  return (
    <Box sx={{ p: 3, maxWidth: 760 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="h5" component="h1">{event.title}</Typography>
        <Chip
          label={EVENT_STATUS_LABELS[event.status]}
          color={EVENT_STATUS_COLOR[event.status]}
          size="small"
        />
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {new Date(event.event_date).toLocaleString("ro-RO", { dateStyle: "long", timeStyle: "short" })}
        {event.clients?.name ? ` · ${event.clients.name}` : ""}
      </Typography>

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 1.5, mb: 3 }}>
        {event.venue_name && (
          <>
            <Typography variant="body2" color="text.secondary">Venue</Typography>
            <Typography variant="body2">{event.venue_name}</Typography>
          </>
        )}
        {event.venue_address && (
          <>
            <Typography variant="body2" color="text.secondary">Address</Typography>
            <Typography variant="body2">{event.venue_address}</Typography>
          </>
        )}
        {event.city && (
          <>
            <Typography variant="body2" color="text.secondary">City</Typography>
            <Typography variant="body2">{event.city}</Typography>
          </>
        )}
        <Typography variant="body2" color="text.secondary">Currency</Typography>
        <Typography variant="body2">{event.pricing_currency}</Typography>
        {event.estimated_revenue_total != null && (
          <>
            <Typography variant="body2" color="text.secondary">Est. revenue</Typography>
            <Typography variant="body2">
              {event.estimated_revenue_total.toLocaleString("ro-RO", {
                style: "currency",
                currency: event.pricing_currency,
              })}
            </Typography>
          </>
        )}
        {event.notes && (
          <>
            <Typography variant="body2" color="text.secondary">Notes</Typography>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{event.notes}</Typography>
          </>
        )}
      </Box>

      {assignments.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Team</Typography>
          <Table size="small" sx={{ mb: 3 }}>
            <TableHead>
              <TableRow>
                <TableCell>Collaborator</TableCell>
                <TableCell>Role</TableCell>
                <TableCell align="right">Fee</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assignments.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.collaborators.name}</TableCell>
                  <TableCell>{a.role ?? "—"}</TableCell>
                  <TableCell align="right">
                    {a.fee != null
                      ? a.fee.toLocaleString("ro-RO", { style: "currency", currency: a.fee_currency })
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      {quotes.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Quotes</Typography>
          <Table size="small" sx={{ mb: 3 }}>
            <TableHead>
              <TableRow>
                <TableCell>Version</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {quotes.map((q) => (
                <TableRow key={q.id}>
                  <TableCell>v{q.version_no}</TableCell>
                  <TableCell>{q.status}</TableCell>
                  <TableCell align="right">
                    {q.total_gross.toLocaleString("ro-RO", { style: "currency", currency: q.currency })}
                  </TableCell>
                  <TableCell>
                    <Button size="small" component={Link} href={`/events/${event.id}/quotes/${q.id}`}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Button variant="outlined" component={Link} href={`/events/${event.id}/edit`}>
          Edit
        </Button>
        <Button variant="outlined" component={Link} href={`/events/${event.id}/quotes/new`}>
          New quote
        </Button>
        <Button variant="outlined" component={Link} href="/events">
          Back
        </Button>
        {canDelete && (
          <form action={deleteEvent.bind(null, event.id)}>
            <Button type="submit" variant="outlined" color="error">Delete</Button>
          </form>
        )}
      </Box>
    </Box>
  );
}
