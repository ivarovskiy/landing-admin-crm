"use client";

import { useEffect, useState } from "react";
import { TYPO_OPTIONS, customPresetClass } from "@/components/block-forms/hero-slider-presets";
import type { FontPreset } from "@/lib/admin-api";

/** Fetches custom font presets from settings and merges them into TYPO_OPTIONS. */
export function useCustomTypoOptions(): { value: string; label: string }[] {
  const [extra, setExtra] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        const presets: FontPreset[] = data?.typography?.customPresets ?? [];
        setExtra(
          presets.map((p) => ({
            value: customPresetClass(p.id),
            label: `${p.name} (${p.fontSize}px)`,
          })),
        );
      })
      .catch(() => {});
  }, []);

  if (!extra.length) return TYPO_OPTIONS;
  return [...TYPO_OPTIONS, ...extra];
}
