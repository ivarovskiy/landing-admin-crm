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

export type TypoOffsetConfig = {
  paddingLeft?: string;
  paddingRight?: string;
  paddingTop?: string;
  paddingBottom?: string;
};

/** Per-font optional padding offsets. Only fonts listed here expose the "Apply offset" toggle. */
export const TYPO_OFFSET_MAP: Partial<Record<string, TypoOffsetConfig>> = {
  "typo-content-header": { paddingLeft: "20px" },
  // "typo-homepage-header": TBD with client
};

export function getTypoOffset(typoClass?: string): TypoOffsetConfig | undefined {
  if (!typoClass) return undefined;
  return TYPO_OFFSET_MAP[typoClass];
}
