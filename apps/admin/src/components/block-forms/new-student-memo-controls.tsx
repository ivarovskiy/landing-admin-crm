"use client";

import type { ReactNode } from "react";
import {
  InspectorField,
  InspectorInput,
  InspectorSelect,
  InspectorToggle,
} from "@/components/inspector";
import { TYPO_OPTIONS } from "./hero-slider-presets";

export type MemoScope = "default" | "ipadPro" | "mobile";

export type MemoElementStyle = {
  typo?: string;
  mt?: string;
  mb?: string;
  ml?: string;
  mr?: string;
  width?: string;
  size?: string;
  lineHeight?: string;
  letterSpacing?: string;
  weight?: string;
  align?: "left" | "center" | "right";
  maxWidth?: string;
  minHeight?: string;
  padding?: string;
  strokeW?: string;
};

export const TEXT_ALIGN_OPTIONS = [
  { value: "", label: "Inherit" },
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

export const TARGET_OPTIONS = [
  { value: "text-box", label: "Text box" },
  { value: "image", label: "Image frame" },
  { value: "none", label: "Hidden" },
];

export const ASPECT_RATIO_OPTIONS = [
  { value: "", label: "Auto" },
  { value: "3/4", label: "3:4 - Portrait" },
  { value: "4/3", label: "4:3 - Landscape" },
  { value: "1/1", label: "1:1 - Square" },
  { value: "2/3", label: "2:3 - Tall" },
  { value: "3/2", label: "3:2 - Photo" },
];

export const FIT_OPTIONS = [
  { value: "cover", label: "Cover" },
  { value: "contain", label: "Contain" },
  { value: "fill", label: "Fill" },
];

export const ANIMATION_OPTIONS = [
  { value: "none", label: "None" },
  { value: "fade-in", label: "Fade in" },
  { value: "slide-up", label: "Slide up" },
];

export function scopeLabel(scope: MemoScope) {
  if (scope === "ipadPro") return "iPad Pro";
  if (scope === "mobile") return "Mobile";
  return "Desktop/default";
}

export function getScopedGroup<T extends Record<string, unknown>>(
  group: T | undefined,
  scope: MemoScope,
): Partial<T> {
  if (scope === "default") return group ?? {};
  return ((group as any)?.viewportProfiles?.[scope] ?? {}) as Partial<T>;
}

export function patchScopedGroup<T extends Record<string, unknown>>(
  group: T | undefined,
  scope: MemoScope,
  patch: Partial<T>,
): T {
  const base = (group ?? {}) as any;

  if (scope === "default") {
    return { ...base, ...patch } as T;
  }

  return {
    ...base,
    viewportProfiles: {
      ...(base.viewportProfiles ?? {}),
      [scope]: {
        ...(base.viewportProfiles?.[scope] ?? {}),
        ...patch,
      },
    },
  } as T;
}

export function CompactGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-1.5">{children}</div>;
}

export function MiniLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </span>
  );
}

export function StyleEditor({
  label,
  style,
  onChange,
  showTypography = true,
  showBox = true,
}: {
  label: string;
  style?: MemoElementStyle;
  onChange: (next: MemoElementStyle) => void;
  showTypography?: boolean;
  showBox?: boolean;
}) {
  const patch = (key: keyof MemoElementStyle, value: string) =>
    onChange({ ...(style ?? {}), [key]: value || undefined });

  return (
    <div className="space-y-1.5 rounded-md border border-border/70 bg-muted/10 p-2">
      <MiniLabel>{label}</MiniLabel>

      {showTypography ? (
        <>
          <InspectorField label="Typo">
            <InspectorSelect
              value={style?.typo ?? ""}
              onChange={(v) => patch("typo", v)}
              options={TYPO_OPTIONS}
            />
          </InspectorField>
          <CompactGrid>
            <InspectorField label="Size">
              <InspectorInput
                value={style?.size ?? ""}
                onChange={(v) => patch("size", v)}
                placeholder="clamp(...) / 22px"
              />
            </InspectorField>
            <InspectorField label="Line">
              <InspectorInput
                value={style?.lineHeight ?? ""}
                onChange={(v) => patch("lineHeight", v)}
                placeholder="1.35"
              />
            </InspectorField>
            <InspectorField label="Track">
              <InspectorInput
                value={style?.letterSpacing ?? ""}
                onChange={(v) => patch("letterSpacing", v)}
                placeholder="0.18em"
              />
            </InspectorField>
            <InspectorField label="Weight">
              <InspectorInput
                value={style?.weight ?? ""}
                onChange={(v) => patch("weight", v)}
                placeholder="700"
              />
            </InspectorField>
            <InspectorField label="Align">
              <InspectorSelect
                value={style?.align ?? ""}
                onChange={(v) => patch("align", v)}
                options={TEXT_ALIGN_OPTIONS}
              />
            </InspectorField>
            <InspectorField label="Stroke">
              <InspectorInput
                value={style?.strokeW ?? ""}
                onChange={(v) => patch("strokeW", v)}
                placeholder="2.6px"
              />
            </InspectorField>
          </CompactGrid>
        </>
      ) : null}

      {showBox ? (
        <>
          <CompactGrid>
            <InspectorField label="Top">
              <InspectorInput value={style?.mt ?? ""} onChange={(v) => patch("mt", v)} placeholder="0" />
            </InspectorField>
            <InspectorField label="Bottom">
              <InspectorInput value={style?.mb ?? ""} onChange={(v) => patch("mb", v)} placeholder="0" />
            </InspectorField>
            <InspectorField label="Left">
              <InspectorInput value={style?.ml ?? ""} onChange={(v) => patch("ml", v)} placeholder="0" />
            </InspectorField>
            <InspectorField label="Right">
              <InspectorInput value={style?.mr ?? ""} onChange={(v) => patch("mr", v)} placeholder="0" />
            </InspectorField>
            <InspectorField label="Width">
              <InspectorInput
                value={style?.width ?? ""}
                onChange={(v) => patch("width", v)}
                placeholder="auto / 680px"
              />
            </InspectorField>
            <InspectorField label="Min H">
              <InspectorInput
                value={style?.minHeight ?? ""}
                onChange={(v) => patch("minHeight", v)}
                placeholder="0 / 320px"
              />
            </InspectorField>
          </CompactGrid>
          <InspectorField label="Max W">
            <InspectorInput
              value={style?.maxWidth ?? ""}
              onChange={(v) => patch("maxWidth", v)}
              placeholder="none / 680px"
            />
          </InspectorField>
          <InspectorField label="Padding">
            <InspectorInput
              value={style?.padding ?? ""}
              onChange={(v) => patch("padding", v)}
              placeholder="0 / 24px 32px"
            />
          </InspectorField>
        </>
      ) : null}
    </div>
  );
}

export function SwitchRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <InspectorToggle checked={checked} onChange={onChange} />
    </div>
  );
}
