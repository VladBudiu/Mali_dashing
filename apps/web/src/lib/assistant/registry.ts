/**
 * The assistant's tool whitelist — the ONLY operations it can perform.
 *
 * Each entry pairs a Zod schema (runtime validation of the model's tool input)
 * with a hand-written JSON Schema (what we send to Anthropic as `input_schema`).
 * Pure data + no DB imports, so it is unit-tested and safe to ship in the cached
 * prompt prefix. Handlers live in `tools.ts`; `dispatch.ts` wires the two.
 *
 * Every tool is read-only over business data. The single write is `save_note`,
 * which only touches the assistant's own `ai_notes` table.
 */
import { z } from "zod";

export type ToolDef = {
  name: string;
  description: string;
  /** Validates the model's tool input before any handler runs. */
  inputSchema: z.ZodType;
  /** JSON Schema sent to Anthropic. */
  jsonSchema: Record<string, unknown>;
  /** True for the one tool that writes (to ai_notes). */
  mutates?: boolean;
};

const obj = (
  properties: Record<string, unknown>,
  required: string[] = [],
): Record<string, unknown> => ({
  type: "object",
  properties,
  required,
  additionalProperties: false,
});

const ENTITY_TYPES = ["event", "client", "collaborator", "inventory_item", "global"] as const;

export const TOOL_REGISTRY: ToolDef[] = [
  {
    name: "get_dashboard_stats",
    description:
      "High-level snapshot of the business: cash totals (income, expense, net), number of upcoming events, low-stock item count, and pending expense-claim count.",
    inputSchema: z.object({}).strict(),
    jsonSchema: obj({}),
  },
  {
    name: "get_finance_summary",
    description:
      "Totals of income, expense and net balance in RON over an optional date range (ISO yyyy-mm-dd). Omit dates for all-time.",
    inputSchema: z
      .object({ from: z.string().optional(), to: z.string().optional() })
      .strict(),
    jsonSchema: obj({
      from: { type: "string", description: "Start date yyyy-mm-dd (inclusive)" },
      to: { type: "string", description: "End date yyyy-mm-dd (inclusive)" },
    }),
  },
  {
    name: "list_transactions",
    description:
      "Recent financial transactions, newest first. Optionally filter by type (income/expense) and date range.",
    inputSchema: z
      .object({
        type: z.enum(["income", "expense"]).optional(),
        from: z.string().optional(),
        to: z.string().optional(),
        limit: z.number().int().min(1).max(50).optional(),
      })
      .strict(),
    jsonSchema: obj({
      type: { type: "string", enum: ["income", "expense"] },
      from: { type: "string", description: "yyyy-mm-dd" },
      to: { type: "string", description: "yyyy-mm-dd" },
      limit: { type: "integer", minimum: 1, maximum: 50 },
    }),
  },
  {
    name: "search_events",
    description:
      "Find events by title/city/venue text and/or status, newest first. Use upcoming=true for future events only.",
    inputSchema: z
      .object({
        query: z.string().optional(),
        status: z.string().optional(),
        upcoming: z.boolean().optional(),
        limit: z.number().int().min(1).max(50).optional(),
      })
      .strict(),
    jsonSchema: obj({
      query: { type: "string" },
      status: { type: "string" },
      upcoming: { type: "boolean" },
      limit: { type: "integer", minimum: 1, maximum: 50 },
    }),
  },
  {
    name: "get_event_overview",
    description:
      "Full picture of one event: details, its quotes, assigned collaborators, and linked financial transactions.",
    inputSchema: z.object({ event_id: z.string().uuid() }).strict(),
    jsonSchema: obj(
      { event_id: { type: "string", description: "Event UUID" } },
      ["event_id"],
    ),
  },
  {
    name: "get_inventory_status",
    description:
      "Inventory items with on-hand, reserved and available quantities. Set low_stock_only=true to return only low/out-of-stock items.",
    inputSchema: z
      .object({ low_stock_only: z.boolean().optional() })
      .strict(),
    jsonSchema: obj({ low_stock_only: { type: "boolean" } }),
  },
  {
    name: "search_clients",
    description: "Find clients by name/email/phone text. Omit query to list recent clients.",
    inputSchema: z
      .object({ query: z.string().optional(), limit: z.number().int().min(1).max(50).optional() })
      .strict(),
    jsonSchema: obj({
      query: { type: "string" },
      limit: { type: "integer", minimum: 1, maximum: 50 },
    }),
  },
  {
    name: "list_collaborators",
    description: "List collaborators (vendors/freelancers), optionally filtered by name/specialty text.",
    inputSchema: z
      .object({ query: z.string().optional() })
      .strict(),
    jsonSchema: obj({ query: { type: "string" } }),
  },
  {
    name: "list_notes",
    description:
      "Read previously saved assistant notes (org memory). Optionally filter by entity_type and entity_id.",
    inputSchema: z
      .object({
        entity_type: z.enum(ENTITY_TYPES).optional(),
        entity_id: z.string().uuid().optional(),
      })
      .strict(),
    jsonSchema: obj({
      entity_type: { type: "string", enum: ENTITY_TYPES as unknown as string[] },
      entity_id: { type: "string", description: "Entity UUID" },
    }),
  },
  {
    name: "save_note",
    description:
      "Remember a fact for later (shared org memory). Optionally attach it to an entity, e.g. entity_type='event' with that event's id.",
    inputSchema: z
      .object({
        note: z.string().min(1).max(2000),
        entity_type: z.enum(ENTITY_TYPES).optional(),
        entity_id: z.string().uuid().optional(),
      })
      .strict(),
    jsonSchema: obj(
      {
        note: { type: "string", description: "The fact to remember" },
        entity_type: { type: "string", enum: ENTITY_TYPES as unknown as string[] },
        entity_id: { type: "string", description: "Entity UUID this note is about" },
      },
      ["note"],
    ),
    mutates: true,
  },
];

export const TOOL_NAMES = TOOL_REGISTRY.map((t) => t.name);

/** Anthropic `tools` payload (stable → belongs in the cached prompt prefix). */
export const ANTHROPIC_TOOLS = TOOL_REGISTRY.map((t) => ({
  name: t.name,
  description: t.description,
  input_schema: t.jsonSchema,
}));

export function getToolDef(name: string): ToolDef | undefined {
  return TOOL_REGISTRY.find((t) => t.name === name);
}
