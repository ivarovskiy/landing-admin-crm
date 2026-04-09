/**
 * Shared utilities used across section renderers.
 */

/** Logo source descriptor */
export type LogoSource =
  | { kind: "asset"; name: string }
  | { kind: "url"; src: string };

/** Validate and normalize a logo value into a typed LogoSource or null. */
export function pickLogoSource(v: unknown): LogoSource | null {
  if (!v || typeof v !== "object") return null;
  const obj = v as Record<string, unknown>;
  if (obj.kind === "asset" && typeof obj.name === "string") return obj as LogoSource;
  if (obj.kind === "url" && typeof obj.src === "string") return obj as LogoSource;
  return null;
}

/** Normalize a US-format phone string into a tel: URI (e.g. "(610) 883-0878" → "+16108830878"). */
export function normalizeTel(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith("+")) return trimmed.replace(/[^\d+]/g, "");
  const digits = trimmed.replace(/[^\d]/g, "");
  if (digits.length === 10) return `+1${digits}`;
  return digits ? `+${digits}` : "";
}
