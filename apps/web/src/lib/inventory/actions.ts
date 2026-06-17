"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveCurrentOrg } from "@/lib/org/membership";
import { getCurrentUser } from "@/lib/auth/session";
import { computeStockAfterMovement, MOVEMENT_TYPES } from "./stock";

export type InventoryFormState =
  | { status: "idle" }
  | { status: "error"; message: string };

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined));

const ItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  sku: optionalText(100),
  category: optionalText(100),
  unit: z.string().min(1).max(32).default("buc"),
  reorder_threshold: z.coerce.number().min(0).nullable().optional(),
  unit_cost_ron: z.coerce.number().min(0).nullable().optional(),
  notes: optionalText(2000),
});

function parseItem(formData: FormData) {
  return ItemSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku") || undefined,
    category: formData.get("category") || undefined,
    unit: formData.get("unit") || "buc",
    reorder_threshold: formData.get("reorder_threshold") || undefined,
    unit_cost_ron: formData.get("unit_cost_ron") || undefined,
    notes: formData.get("notes") || undefined,
  });
}

export async function createInventoryItem(
  _prevState: InventoryFormState,
  formData: FormData,
): Promise<InventoryFormState> {
  const parsed = parseItem(formData);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const [currentOrg, user] = await Promise.all([resolveCurrentOrg(), getCurrentUser()]);
  if (!currentOrg) return { status: "error", message: "No active organization" };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error", message: "Database unavailable" };

  const { data, error } = await supabase
    .from("inventory_items")
    .insert({
      organization_id: currentOrg.organizationId,
      created_by: user?.id ?? null,
      name: parsed.data.name,
      sku: parsed.data.sku ?? null,
      category: parsed.data.category ?? null,
      unit: parsed.data.unit,
      reorder_threshold: parsed.data.reorder_threshold ?? null,
      unit_cost_ron: parsed.data.unit_cost_ron ?? null,
      notes: parsed.data.notes ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    const message = error?.code === "23505"
      ? "An item with this SKU already exists."
      : "Failed to create item.";
    return { status: "error", message };
  }

  redirect(`/inventory/${data.id}`);
}

export async function updateInventoryItem(
  _prevState: InventoryFormState,
  formData: FormData,
): Promise<InventoryFormState> {
  const itemId = formData.get("item_id");
  if (!itemId || typeof itemId !== "string") {
    return { status: "error", message: "Missing item ID" };
  }

  const parsed = parseItem(formData);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const currentOrg = await resolveCurrentOrg();
  if (!currentOrg) return { status: "error", message: "No active organization" };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error", message: "Database unavailable" };

  const { error } = await supabase
    .from("inventory_items")
    .update({
      name: parsed.data.name,
      sku: parsed.data.sku ?? null,
      category: parsed.data.category ?? null,
      unit: parsed.data.unit,
      reorder_threshold: parsed.data.reorder_threshold ?? null,
      unit_cost_ron: parsed.data.unit_cost_ron ?? null,
      notes: parsed.data.notes ?? null,
    })
    .eq("id", itemId)
    .eq("organization_id", currentOrg.organizationId);

  if (error) {
    const message = error.code === "23505"
      ? "An item with this SKU already exists."
      : "Failed to update item.";
    return { status: "error", message };
  }

  redirect(`/inventory/${itemId}`);
}

export async function deleteInventoryItem(itemId: string): Promise<void> {
  const currentOrg = await resolveCurrentOrg();
  if (!currentOrg) return;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return;

  await supabase
    .from("inventory_items")
    .delete()
    .eq("id", itemId)
    .eq("organization_id", currentOrg.organizationId);

  redirect("/inventory");
}

const MovementSchema = z.object({
  item_id: z.string().uuid(),
  movement_type: z.enum(MOVEMENT_TYPES),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  event_id: z.string().uuid().optional().or(z.literal("")),
  note: optionalText(500),
});

export async function recordMovement(
  _prevState: InventoryFormState,
  formData: FormData,
): Promise<InventoryFormState> {
  const parsed = MovementSchema.safeParse({
    item_id: formData.get("item_id"),
    movement_type: formData.get("movement_type"),
    quantity: formData.get("quantity"),
    event_id: formData.get("event_id") || undefined,
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const [currentOrg, user] = await Promise.all([resolveCurrentOrg(), getCurrentUser()]);
  if (!currentOrg) return { status: "error", message: "No active organization" };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error", message: "Database unavailable" };

  // Read current levels (RLS scopes to the caller's org)
  const { data: item, error: readErr } = await supabase
    .from("inventory_items")
    .select("quantity, reserved_quantity")
    .eq("id", parsed.data.item_id)
    .eq("organization_id", currentOrg.organizationId)
    .single<{ quantity: number; reserved_quantity: number }>();

  if (readErr || !item) {
    return { status: "error", message: "Item not found" };
  }

  const result = computeStockAfterMovement(
    { quantity: item.quantity, reserved_quantity: item.reserved_quantity },
    parsed.data.movement_type,
    parsed.data.quantity,
  );

  if (!result.ok) {
    return { status: "error", message: result.error };
  }

  // Apply the new levels. The DB CHECK constraints are the final guard against
  // a concurrent move that slipped past the in-memory check above.
  const { error: updateErr } = await supabase
    .from("inventory_items")
    .update({
      quantity: result.levels.quantity,
      reserved_quantity: result.levels.reserved_quantity,
    })
    .eq("id", parsed.data.item_id)
    .eq("organization_id", currentOrg.organizationId);

  if (updateErr) {
    return { status: "error", message: "Stock update rejected — please retry." };
  }

  await supabase.from("inventory_movements").insert({
    organization_id: currentOrg.organizationId,
    item_id: parsed.data.item_id,
    event_id: parsed.data.event_id || null,
    movement_type: parsed.data.movement_type,
    quantity: parsed.data.quantity,
    note: parsed.data.note ?? null,
    created_by: user?.id ?? null,
  });

  redirect(`/inventory/${parsed.data.item_id}`);
}
