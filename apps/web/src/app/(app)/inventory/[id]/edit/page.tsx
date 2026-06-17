import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Typography from "@mui/material/Typography";
import { resolveCurrentOrg } from "@/lib/org/membership";
import { getInventoryItem } from "@/lib/inventory/queries";
import { updateInventoryItem } from "@/lib/inventory/actions";
import InventoryItemForm from "@/components/inventory/InventoryItemForm";
import { NavLink } from "@/components/ui/NavLink";

export const metadata: Metadata = { title: "Edit Inventory Item" };

type PageProps = { params: Promise<{ id: string }> };

export default async function EditInventoryItemPage({ params }: PageProps) {
  const { id } = await params;
  const currentOrg = await resolveCurrentOrg();
  if (!currentOrg) return null;

  const item = await getInventoryItem(currentOrg.organizationId, id);
  if (!item) notFound();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Breadcrumbs>
        <NavLink href="/inventory" underline="hover" color="inherit">
          Inventory
        </NavLink>
        <NavLink href={`/inventory/${item.id}`} underline="hover" color="inherit">
          {item.name}
        </NavLink>
        <Typography color="text.primary">Edit</Typography>
      </Breadcrumbs>

      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Edit item
      </Typography>

      <InventoryItemForm
        action={updateInventoryItem}
        item={item}
        cancelHref={`/inventory/${item.id}`}
      />
    </Box>
  );
}
