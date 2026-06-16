/**
 * Framework-agnostic pure utilities shared across Mali Dash workspaces.
 * Keep this module free of side effects, I/O, and environment access.
 */

export function assertNever(value: never, message?: string): never {
  throw new Error(message ?? `Unhandled value: ${String(value)}`);
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    throw new RangeError(`clamp: min (${min}) must not exceed max (${max})`);
  }
  return Math.min(Math.max(value, min), max);
}
