/**
 * Model registry + pricing for the assistant. Pure data so cost maths is unit-
 * tested. Prices are USD per *million* tokens (Anthropic public pricing, 2026).
 * Cache reads bill at 10% of input; 5-minute cache writes at 125% of input.
 */

export type ModelTier = "fast" | "balanced" | "powerful";

export type ModelInfo = {
  id: string;
  label: string;
  tier: ModelTier;
  /** USD per million tokens. */
  inputPerM: number;
  outputPerM: number;
};

export const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

export const MODELS: ModelInfo[] = [
  { id: "claude-haiku-4-5-20251001", label: "Haiku 4.5", tier: "fast", inputPerM: 1, outputPerM: 5 },
  { id: "claude-sonnet-4-6", label: "Sonnet 4.6", tier: "balanced", inputPerM: 3, outputPerM: 15 },
  { id: "claude-opus-4-8", label: "Opus 4.8", tier: "powerful", inputPerM: 5, outputPerM: 25 },
];

const CACHE_READ_MULTIPLIER = 0.1;
const CACHE_WRITE_MULTIPLIER = 1.25;

export function getModelInfo(id: string): ModelInfo | undefined {
  return MODELS.find((m) => m.id === id);
}

/** Display label for a model id, falling back to the raw id. */
export function modelLabel(id: string | undefined | null): string {
  if (!id) return "Unknown";
  return getModelInfo(id)?.label ?? id;
}

/** Per-token USD rates derived from the per-million pricing. */
export function rates(id: string): {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
} {
  const info = getModelInfo(id) ?? MODELS[0]!;
  const input = info.inputPerM / 1_000_000;
  return {
    input,
    output: info.outputPerM / 1_000_000,
    cacheRead: input * CACHE_READ_MULTIPLIER,
    cacheWrite: input * CACHE_WRITE_MULTIPLIER,
  };
}

/** Resolve the model to use from an optional override (env), else the default. */
export function resolveModel(override?: string | null): string {
  const candidate = override?.trim();
  if (candidate && getModelInfo(candidate)) return candidate;
  // Unknown ids are still allowed (forward-compat with new releases).
  return candidate || DEFAULT_MODEL;
}
