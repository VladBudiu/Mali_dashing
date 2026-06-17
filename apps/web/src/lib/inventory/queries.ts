import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MovementType } from "./stock";

export type InventoryItemRow = {
  id: string;
  organization_id: string;
  name: string;
  sku: string | null;
  category: string | null;
  unit: string;
  quantity: number;
  reserved_quantity: number;
  reorder_threshold: number | null;
  unit_cost_ron: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type InventoryMovementRow = {
  id: string;
  organization_id: string;
  item_id: string;
  event_id: string | null;
  movement_type: MovementType;
  quantity: number;
  note: string | null;
  created_by: string | null;
  created_at: string;
  events: { title: string } | null;
};

export async function listInventoryItems(
  organizationId: string,
): Promise<InventoryItemRow[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true })
    .returns<InventoryItemRow[]>();

  if (error || !data) return [];
  return data;
}

export async function getInventoryItem(
  organizationId: string,
  itemId: string,
): Promise<InventoryItemRow | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", itemId)
    .single()
    .returns<InventoryItemRow>();

  if (error || !data) return null;
  return data;
}

export async function listItemMovements(
  itemId: string,
): Promise<InventoryMovementRow[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("inventory_movements")
    .select("*, events(title)")
    .eq("item_id", itemId)
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<InventoryMovementRow[]>();

  if (error || !data) return [];
  return data;
}
