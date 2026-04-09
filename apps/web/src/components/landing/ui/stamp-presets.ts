import type { OutlineStampStyle } from "./typography";

/**
 * Shared stamp style presets used across section renderers.
 * All share the same base (fill, stroke, weight, tracking) —
 * only shadow offset varies by visual weight.
 */

const BASE: Omit<OutlineStampStyle, "shadow"> = {
  fill: "var(--color-outline-fill)",
  stroke: "var(--color-primary)",
  strokeWidthPx: 1,
  tracking: "0.02em",
  weight: 500,
};

function withShadow(size: number): OutlineStampStyle {
  return {
    ...BASE,
    shadow: { x: size, y: size, color: "var(--color-primary)", enabled: true },
  };
}

/** Section titles (features, studio-address, scrapbook) — shadow 2.6 */
export const STAMP_SECTION_TITLE = withShadow(4.15);

/** Hero / slide titles — shadow 2.6 */
export const STAMP_HERO_TITLE = withShadow(4.15);

/** Kicker-sized stamp text — shadow 2.2 */
export const STAMP_KICKER = withShadow(2.2);

/** Subtitle-sized stamp text — shadow 2 */
export const STAMP_SUBTITLE = withShadow(2);
