import type { BlockHide } from "@/types/block";

/**
 * Extract a normalized Hide object from a block's data payload.
 * Returns an empty object if the data is missing or malformed.
 */
export function readHide(data: unknown): BlockHide {
  const raw = (data as Record<string, unknown>)?._layout as Record<string, unknown> | undefined;
  const hide = raw?.hide;
  if (!hide || typeof hide !== "object") return {};
  const h = hide as Record<string, unknown>;
  return {
    base: h.base === true,
    md: h.md === true,
    lg: h.lg === true,
  };
}

/** Toggle mobile (< md) visibility. */
export function toggleHideMobile(hide: BlockHide): BlockHide {
  return { ...hide, base: !hide.base };
}

/**
 * Toggle desktop (≥ md = md + lg together) visibility.
 * - If currently hidden (md && lg both true) → show
 * - Otherwise → hide both
 */
export function toggleHideDesktop(hide: BlockHide): BlockHide {
  const shouldHide = !(hide.md === true && hide.lg === true);
  return { ...hide, md: shouldHide, lg: shouldHide };
}

/** Compute the aggregate desktop visibility state. */
export function desktopVisibilityState(hide: BlockHide): "visible" | "hidden" | "mixed" {
  if (!hide.md && !hide.lg) return "visible";
  if (hide.md && hide.lg) return "hidden";
  return "mixed";
}
