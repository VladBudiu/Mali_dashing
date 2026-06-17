import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { resolveCurrentOrg } from "@/lib/org/membership";
import {
  getInventoryItem,
  listItemMovements,
} from "@/lib/inventory/queries";
import { deleteInventoryItem } from "@/lib/inventory/actions";
import { availableStock, getStockStatus, MOVEMENT_TYPE_LABELS } from "@/lib/inventory/stock";
import { listEvents } from "@/lib/events/queries";
import { formatMoney } from "@/lib/money/format";
import { LinkButton } from "@/components/ui/LinkButton";
import { NavLink } from "@/components/ui/NavLink";
import MovementForm from "@/components/inventory/MovementForm";

export const metadata: Metadata = { title: "Inventory Item" };

const STATUS_CHIP: Record<
  "out" | "low" | "ok",
  { label: string; color: "default" | "warning" | "error" | "success" }
> = {
  out: { label: "Out of stock", color: "error" },
  low: { label: "Low", color: "warning" },
  ok: { label: "In stock", color: "success" },
};

type PageProps = { params: Promise<{ id: string }> };

export default async function InventoryItemPage({ params }: PageProps) {
  const { id } = await params;
  const currentOrg = await resolveCurrentOrg();
  if (!currentOrg) return null;

  const item = await getInventoryItem(currentOrg.organizationId, id);
  if (!item) notFound();

  const [movements, events] = await Promise.all([
    listItemMovements(id),
    listEvents(currentOrg.organizationId),
  ]);

  const levels = {
    quantity: item.quantity,
    reserved_quantity: item.reserved_quantity,
  };
  const status = getStockStatus(levels, item.reorder_threshold);
  const chip = STATUS_CHIP[status];
  const isOwner = currentOrg.role === "owner";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Breadcrumbs>
        <NavLink href="/inventory" underline="hover" color="inherit">
          Inventory
        </NavLink>
        <Typography color="text.primary">{item.name}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {item.name}
          </Typography>
          <Chip
            label={chip.label}
            size="small"
            color={chip.color}
            variant="outlined"
            sx={{ mt: 1 }}
          />
        </Box>
        <LinkButton
          href={`/inventory/${item.id}/edit`}
          variant="outlined"
          size="small"
        >
          Edit
        </LinkButton>
        {isOwner && (
          <form action={deleteInventoryItem.bind(null, item.id)}>
            <Button type="submit" color="error" variant="outlined" size="small">
              Delete
            </Button>
          </form>
        )}
      </Box>

      {/* Stock summary */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Paper variant="outlined" sx={{ p: 2, flex: 1, minWidth: 140 }}>
          <Typography variant="caption" color="text.secondary">
            On hand
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {item.quantity} {item.unit}
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2, flex: 1, minWidth: 140 }}>
          <Typography variant="caption" color="text.secondary">
            Reserved
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {item.reserved_quantity} {item.unit}
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2, flex: 1, minWidth: 140 }}>
          <Typography variant="caption" color="text.secondary">
            Available
          </Typography>
          <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700 }}>
            {availableStock(levels)} {item.unit}
          </Typography>
        </Paper>
      </Box>

      {/* Metadata */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "160px 1fr",
            rowGap: 1.5,
            columnGap: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">SKU</Typography>
          <Typography variant="body2">{item.sku ?? "—"}</Typography>

          <Typography variant="body2" color="text.secondary">Category</Typography>
          <Typography variant="body2">{item.category ?? "—"}</Typography>

          <Typography variant="body2" color="text.secondary">Reorder threshold</Typography>
          <Typography variant="body2">
            {item.reorder_threshold != null
              ? `${item.reorder_threshold} ${item.unit}`
              : "—"}
          </Typography>

          <Typography variant="body2" color="text.secondary">Unit cost</Typography>
          <Typography variant="body2">
            {item.unit_cost_ron != null ? formatMoney(item.unit_cost_ron) : "—"}
          </Typography>

          {item.notes && (
            <>
              <Typography variant="body2" color="text.secondary">Notes</Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {item.notes}
              </Typography>
            </>
          )}
        </Box>
      </Paper>

      {/* Record a movement */}
      <Box>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Record stock movement
        </Typography>
        <MovementForm
          itemId={item.id}
          unit={item.unit}
          events={events.map((e) => ({ id: e.id, title: e.title }))}
        />
      </Box>

      <Divider />

      {/* Movement history */}
      <Box>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Movement history
        </Typography>
        {movements.length === 0 ? (
          <Typography color="text.secondary">No movements recorded yet.</Typography>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell>Event</TableCell>
                  <TableCell>Note</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {movements.map((m) => (
                  <TableRow key={m.id} hover>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {new Date(m.created_at).toLocaleString("ro-RO")}
                    </TableCell>
                    <TableCell>{MOVEMENT_TYPE_LABELS[m.movement_type]}</TableCell>
                    <TableCell align="right">
                      {m.quantity} {item.unit}
                    </TableCell>
                    <TableCell>
                      {m.events?.title && m.event_id ? (
                        <NavLink href={`/events/${m.event_id}`} underline="hover">
                          {m.events.title}
                        </NavLink>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{m.note ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Box>
    </Box>
  );
}
