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
import { getEvent } from "@/lib/events/queries";
import { getQuote, getQuoteLines } from "@/lib/quotes/queries";
import { deleteQuoteLine, updateQuoteStatus } from "@/lib/quotes/actions";
import AddLineForm from "@/components/quotes/AddLineForm";

export const metadata: Metadata = { title: "Quote" };

type Props = { params: Promise<{ id: string; quoteId: string }> };

const QUOTE_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ["sent"],
  sent: ["accepted", "rejected"],
  accepted: [],
  rejected: ["draft"],
  expired: ["draft"],
};

export default async function QuoteDetailPage({ params }: Props) {
  const { id: eventId, quoteId } = await params;
  const currentOrg = await resolveCurrentOrg();
  if (!currentOrg) notFound();

  const [event, quote, lines] = await Promise.all([
    getEvent(currentOrg.organizationId, eventId),
    getQuote(quoteId),
    getQuoteLines(quoteId),
  ]);
  if (!event || !quote) notFound();

  const isDraft = quote.status === "draft";
  const transitions = QUOTE_STATUS_TRANSITIONS[quote.status] ?? [];

  const formatMoney = (value: number) =>
    value.toLocaleString("ro-RO", { style: "currency", currency: quote.currency });

  return (
    <Box sx={{ p: 3, maxWidth: 760 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
        <Typography variant="h5" component="h1">
          Quote v{quote.version_no}
        </Typography>
        <Chip label={quote.status} size="small" variant="outlined" />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        <Link href={`/events/${eventId}`}>{event.title}</Link>
        {" · "}
        Created {new Date(quote.created_at).toLocaleDateString("ro-RO")}
      </Typography>

      <Table size="small" sx={{ mb: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell>Description</TableCell>
            <TableCell align="right">Qty</TableCell>
            <TableCell align="right">Unit price</TableCell>
            <TableCell align="right">Total net</TableCell>
            {isDraft && <TableCell />}
          </TableRow>
        </TableHead>
        <TableBody>
          {lines.map((line) => (
            <TableRow key={line.id}>
              <TableCell>{line.description}</TableCell>
              <TableCell align="right">{line.quantity}</TableCell>
              <TableCell align="right">{formatMoney(line.unit_price_net)}</TableCell>
              <TableCell align="right">{formatMoney(line.line_total_net)}</TableCell>
              {isDraft && (
                <TableCell>
                  <form action={deleteQuoteLine.bind(null, quoteId, line.id)}>
                    <Button type="submit" size="small" color="error">×</Button>
                  </form>
                </TableCell>
              )}
            </TableRow>
          ))}
          {lines.length === 0 && (
            <TableRow>
              <TableCell colSpan={isDraft ? 5 : 4}>
                <Typography variant="body2" color="text.secondary">No lines yet.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "180px 120px", gap: 0.5, textAlign: "right" }}>
          <Typography variant="body2" color="text.secondary">Subtotal (net)</Typography>
          <Typography variant="body2">{formatMoney(quote.subtotal_net)}</Typography>
          {quote.discount_net > 0 && (
            <>
              <Typography variant="body2" color="text.secondary">Discount</Typography>
              <Typography variant="body2">−{formatMoney(quote.discount_net)}</Typography>
            </>
          )}
          <Typography variant="body2" color="text.secondary">Net after discount</Typography>
          <Typography variant="body2">{formatMoney(quote.net_after_discount)}</Typography>
          <Typography variant="body2" color="text.secondary">
            VAT ({(quote.vat_rate * 100).toFixed(0)}%)
          </Typography>
          <Typography variant="body2">{formatMoney(quote.vat_amount)}</Typography>
          <Divider sx={{ gridColumn: "1 / -1", my: 0.5 }} />
          <Typography variant="subtitle2">Total</Typography>
          <Typography variant="subtitle2">{formatMoney(quote.total_gross)}</Typography>
        </Box>
      </Box>

      {isDraft && (
        <>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Add line</Typography>
          <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 2, mb: 3 }}>
            <AddLineForm quoteId={quoteId} />
          </Box>
        </>
      )}

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        {transitions.map((nextStatus) => (
          <form key={nextStatus} action={updateQuoteStatus.bind(null, quoteId, nextStatus, eventId)}>
            <Button type="submit" variant="contained" size="small">
              Mark as {nextStatus}
            </Button>
          </form>
        ))}
        <Button variant="outlined" component={Link} href={`/events/${eventId}`}>
          Back to event
        </Button>
      </Box>
    </Box>
  );
}
