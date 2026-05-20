"use client";

import { createContext, useContext } from "react";
import type { FontPreset } from "./api-public";

const CustomPresetsContext = createContext<FontPreset[]>([]);

export const CustomPresetsProvider = CustomPresetsContext.Provider;

export function useCustomPresets(): FontPreset[] {
  return useContext(CustomPresetsContext);
}

/** CSS class name for a custom preset. */
export function presetClassName(id: string): string {
  return `typo-custom-${id.replace(/[^a-zA-Z0-9-]/g, "-")}`;
}

/** Convert FontPreset[] to typo option objects for TipTap / dropdowns. */
export function presetsToTypoOptions(presets: FontPreset[]): { value: string; label: string }[] {
  return presets.map((p) => ({
    value: presetClassName(p.id),
    label: `${p.name} (${p.fontSize}px)`,
  }));
}
