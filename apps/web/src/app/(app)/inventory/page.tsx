import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { resolveCurrentOrg } from "@/lib/org/membership";
import { listInventoryItems } from "@/lib/inventory/queries";
import { availableStock, getStockStatus } from "@/lib/inventory/stock";
import { formatMoney } from "@/lib/money/format";
import { LinkButton } from "@/components/ui/LinkButton";
import { NavLink } from "@/components/ui/NavLink";

export const metadata: Metadata = { title: "Inventory" };

const STATUS_CHIP: Record<
  "out" | "low" | "ok",
  { label: string; color: "default" | "warning" | "error" | "success" }
> = {
  out: { label: "Out of stock", color: "error" },
  low: { label: "Low", color: "warning" },
  ok: { label: "In stock", color: "success" },
};

export default async function InventoryPage() {
  const currentOrg = await resolveCurrentOrg();
  const items = currentOrg
    ? await listInventoryItems(currentOrg.organizationId)
    : [];

  const lowOrOut = items.filter(
    (i) =>
      getStockStatus(
        { quantity: i.quantity, reserved_quantity: i.reserved_quantity },
        i.reorder_threshold,
      ) !== "ok",
  ).length;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 700, flex: 1 }}>
          Inventory
        </Typography>
        <LinkButton href="/inventory/new" variant="contained" size="small">
          New item
        </LinkButton>
      </Box>

      {lowOrOut > 0 && (
        <Typography color="warning.main" variant="body2">
          {lowOrOut} item{lowOrOut === 1 ? "" : "s"} need attention (low or out of stock).
        </Typography>
      )}

      {items.length === 0 ? (
        <Typography color="text.secondary">
          No inventory items yet.{" "}
          <NavLink href="/inventory/new">Add the first one.</NavLink>
        </Typography>
      ) : (
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">On hand</TableCell>
                <TableCell align="right">Reserved</TableCell>
                <TableCell align="right">Available</TableCell>
                <TableCell align="right">Unit cost</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => {
                const levels = {
                  quantity: item.quantity,
                  reserved_quantity: item.reserved_quantity,
                };
                const status = getStockStatus(levels, item.reorder_threshold);
                const chip = STATUS_CHIP[status];
                return (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <NavLink href={`/inventory/${item.id}`} underline="hover">
                        {item.name}
                      </NavLink>
                    </TableCell>
                    <TableCell>{item.sku ?? "—"}</TableCell>
                    <TableCell>{item.category ?? "—"}</TableCell>
                    <TableCell align="right">
                      {item.quantity} {item.unit}
                    </TableCell>
                    <TableCell align="right">{item.reserved_quantity}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {availableStock(levels)}
                    </TableCell>
                    <TableCell align="right">
                      {item.unit_cost_ron != null
                        ? formatMoney(item.unit_cost_ron)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={chip.label}
                        size="small"
                        color={chip.color}
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
}
