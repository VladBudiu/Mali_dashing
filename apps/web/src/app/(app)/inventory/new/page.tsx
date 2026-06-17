import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Typography from "@mui/material/Typography";
import { createInventoryItem } from "@/lib/inventory/actions";
import InventoryItemForm from "@/components/inventory/InventoryItemForm";
import { NavLink } from "@/components/ui/NavLink";

export const metadata: Metadata = { title: "New Inventory Item" };
// No async server calls — force dynamic so the link wrappers are not statically prerendered.
export const dynamic = "force-dynamic";

export default function NewInventoryItemPage() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Breadcrumbs>
        <NavLink href="/inventory" underline="hover" color="inherit">
          Inventory
        </NavLink>
        <Typography color="text.primary">New item</Typography>
      </Breadcrumbs>

      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        New inventory item
      </Typography>

      <InventoryItemForm action={createInventoryItem} cancelHref="/inventory" />
    </Box>
  );
}
