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

/** Generate a <style> block for all custom presets. */
export function buildCustomPresetsCSS(presets: FontPreset[]): string {
  if (!presets.length) return "";
  return presets
    .map((p) => {
      const cls = presetClassName(p.id);
      const fontVar = p.fontFamily === "maru-oblique"
        ? "var(--font-maru-oblique, Arial, sans-serif)"
        : "var(--font-maru, Arial, sans-serif)";
      const transform = p.textTransform && p.textTransform !== "none" ? p.textTransform : "none";
      const stroke = p.strokeEnabled ? `${p.strokeWidthPx}px ${p.stroke}` : "0";
      const shadow = p.shadowEnabled ? `${p.shadowX}px ${p.shadowY}px 0 ${p.shadowColor}` : "none";
      return [
        `.${cls} {`,
        `  font-family: ${fontVar};`,
        `  font-size: ${p.fontSize}px;`,
        `  font-weight: ${p.fontWeight};`,
        `  letter-spacing: ${p.letterSpacing};`,
        `  text-transform: ${transform};`,
        `  color: ${p.fill};`,
        `  -webkit-text-stroke: ${stroke};`,
        `  text-shadow: ${shadow};`,
        `}`,
      ].join("\n");
    })
    .join("\n");
}

/** Convert FontPreset[] to typo option objects for TipTap / dropdowns. */
export function presetsToTypoOptions(presets: FontPreset[]): { value: string; label: string }[] {
  return presets.map((p) => ({
    value: presetClassName(p.id),
    label: `${p.name} (${p.fontSize}px)`,
  }));
}
