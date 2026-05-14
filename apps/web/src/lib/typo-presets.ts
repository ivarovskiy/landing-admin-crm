export const TYPO_PRESETS: { value: string; label: string }[] = [
  { value: "", label: "Default" },
  { value: "typo-homepage-header", label: "Block Title (104px)" },
  { value: "typo-content-header", label: "Page / Slider Header (78px)" },
  { value: "typo-subtitle", label: "Tagline (47px italic)" },
  { value: "typo-promo-header", label: "Slider Promo Header (26px)" },
  { value: "typo-section-header", label: "Section Title (22px)" },
  { value: "typo-teachers-header", label: "Teachers Names (22px)" },
  { value: "typo-text-header", label: "Pull-Out Quote (22px)" },
  { value: "typo-body-text", label: "Column Text (20px)" },
];

/**
 * Returns the configured bottom offset for a font, or undefined if none set.
 * Reads the CSS variable `--{typoClass}-bottom-offset` from the root element
 * (set by layout.tsx from Typography admin settings). Client-side only.
 */
export function getTypoOffset(typoClass?: string): string | undefined {
  if (!typoClass || typeof window === "undefined") return undefined;
  const val = getComputedStyle(document.documentElement)
    .getPropertyValue(`--${typoClass}-bottom-offset`)
    .trim();
  return val || undefined;
}
