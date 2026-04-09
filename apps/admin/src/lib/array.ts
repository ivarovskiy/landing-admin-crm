/**
 * Shared immutable array helpers used across block-form components.
 * All functions return a new array without mutating the original.
 */

/** Safely cast an unknown value to a typed array, falling back to []. */
export function arr<T = unknown>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

/** Return a new array with the item at `idx` replaced by `next`. */
export function setAt<T>(items: T[], idx: number, next: T): T[] {
  const copy = items.slice();
  copy[idx] = next;
  return copy;
}

/** Return a new array with the item at `idx` removed. */
export function removeAt<T>(items: T[], idx: number): T[] {
  const copy = items.slice();
  copy.splice(idx, 1);
  return copy;
}

/** Return a new array with the item at `idx` swapped with the item above/below it. */
export function moveAt<T>(items: T[], idx: number, dir: "up" | "down"): T[] {
  const copy = items.slice();
  const j = dir === "up" ? idx - 1 : idx + 1;
  if (j < 0 || j >= copy.length) return copy;
  [copy[idx], copy[j]] = [copy[j], copy[idx]];
  return copy;
}
