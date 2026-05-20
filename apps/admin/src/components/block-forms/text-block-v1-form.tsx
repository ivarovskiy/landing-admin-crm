"use client";

import type { BlockFormProps } from "./index";
import {
  InspectorSection,
  InspectorField,
  InspectorInput,
  InspectorTextarea,
  InspectorSelect,
  InspectorSegment,
  BlockLayoutSection,
} from "@/components/inspector";
import { Type, AlignLeft } from "lucide-react";
import { TYPO_OPTIONS } from "./hero-slider-presets";
import { useCustomTypoOptions } from "@/hooks/use-custom-typo-options";
import { AdvancedPanel, FieldGrid, PresetButton, PresetRow, SectionNote } from "./admin-control-kit";

const ALIGN_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

const WIDTH_PRESETS = [
  { label: "Readable", value: "720px" },
  { label: "Narrow", value: "560px" },
  { label: "Wide", value: "960px" },
  { label: "Full", value: "100%" },
];

const SPACE_PRESETS = [
  { label: "Tight", value: "clamp(32px, 4vw, 56px)" },
  { label: "Normal", value: "clamp(48px, 6vw, 88px)" },
  { label: "Roomy", value: "clamp(72px, 8vw, 120px)" },
];

function h(value: string | undefined): string {
  if (!value) return "";
  if (!value.trimStart().startsWith("<")) return value;
  return value
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ")
    .replace(/&[a-z0-9]+;/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function PresetButtons({
  value,
  presets,
  onChange,
}: {
  value?: string;
  presets: { label: string; value: string }[];
  onChange: (next: string) => void;
}) {
  return (
    <>
      {presets.map((preset) => (
        <PresetButton
          key={preset.value}
          active={value === preset.value}
          onClick={() => onChange(preset.value)}
        >
          {preset.label}
        </PresetButton>
      ))}
    </>
  );
}

export function TextBlockV1Form({ value, onChange }: BlockFormProps) {
  const typoOptions = useCustomTypoOptions();
  return (
    <div>
      <InspectorSection title="Content" icon={<Type className="h-3 w-3" />}>
        <SectionNote>Use the live preview for rich formatting. These fields stay plain for quick copy edits.</SectionNote>

        <InspectorField label="Kicker">
          <InspectorInput
            value={h(value?.kicker)}
            onChange={(v) => onChange({ ...value, kicker: v })}
            placeholder="PARENT PORTAL"
          />
        </InspectorField>

        <InspectorField label="Heading">
          <InspectorInput
            value={h(value?.heading)}
            onChange={(v) => onChange({ ...value, heading: v })}
            placeholder="Section title"
          />
        </InspectorField>

        <InspectorField label="Body">
          <InspectorTextarea
            value={h(value?.body)}
            onChange={(v) => onChange({ ...value, body: v })}
            placeholder="Paragraph text... (blank line = new paragraph)"
            rows={5}
          />
        </InspectorField>

        <InspectorField label="CTA label">
          <InspectorInput
            value={value?.cta?.label ?? ""}
            onChange={(v) => onChange({ ...value, cta: { ...value?.cta, label: v } })}
            placeholder="Learn more"
          />
        </InspectorField>

        <InspectorField label="CTA href">
          <InspectorInput
            value={value?.cta?.href ?? ""}
            onChange={(v) => onChange({ ...value, cta: { ...value?.cta, href: v } })}
            placeholder="#"
          />
        </InspectorField>
      </InspectorSection>

      <InspectorSection title="Layout" icon={<AlignLeft className="h-3 w-3" />}>
        <InspectorField label="Align">
          <InspectorSegment
            value={value?.align ?? "left"}
            onChange={(v) => onChange({ ...value, align: v })}
            options={ALIGN_OPTIONS}
          />
        </InspectorField>

        <PresetRow label="Content width">
          <PresetButtons
            value={value?.contentMaxWidth ?? value?.maxWidth}
            presets={WIDTH_PRESETS}
            onChange={(v) => onChange({ ...value, contentMaxWidth: v, maxWidth: v })}
          />
        </PresetRow>

        <InspectorField label="Content max W">
          <InspectorInput
            value={value?.contentMaxWidth ?? value?.maxWidth ?? ""}
            onChange={(v) => onChange({ ...value, contentMaxWidth: v || undefined, maxWidth: v || undefined })}
            placeholder="720px"
          />
        </InspectorField>

        <PresetRow label="Vertical padding">
          <PresetButtons
            value={value?.paddingTop}
            presets={SPACE_PRESETS}
            onChange={(v) => onChange({ ...value, paddingTop: v, paddingBottom: v })}
          />
        </PresetRow>

        <InspectorField label="Padding top">
          <InspectorInput
            value={value?.paddingTop ?? ""}
            onChange={(v) => onChange({ ...value, paddingTop: v })}
            placeholder="clamp(40px, 5vw, 80px)"
          />
        </InspectorField>

        <InspectorField label="Padding bottom">
          <InspectorInput
            value={value?.paddingBottom ?? ""}
            onChange={(v) => onChange({ ...value, paddingBottom: v })}
            placeholder="clamp(40px, 5vw, 80px)"
          />
        </InspectorField>

        <AdvancedPanel title="Typography">
          <FieldGrid>
            <InspectorField label="Kick typo">
              <InspectorSelect
                value={value?.kickerTypo ?? ""}
                onChange={(v) => onChange({ ...value, kickerTypo: v || undefined })}
                options={typoOptions}
              />
            </InspectorField>
            <InspectorField label="Kick line">
              <InspectorInput
                value={value?.kickerStrokeW ?? ""}
                onChange={(v) => onChange({ ...value, kickerStrokeW: v || undefined })}
                placeholder="2px"
              />
            </InspectorField>
            <InspectorField label="Head typo">
              <InspectorSelect
                value={value?.headingTypo ?? ""}
                onChange={(v) => onChange({ ...value, headingTypo: v || undefined })}
                options={typoOptions}
              />
            </InspectorField>
            <InspectorField label="Head line">
              <InspectorInput
                value={value?.headingStrokeW ?? ""}
                onChange={(v) => onChange({ ...value, headingStrokeW: v || undefined })}
                placeholder="2.6px"
              />
            </InspectorField>
            <InspectorField label="Body typo">
              <InspectorSelect
                value={value?.bodyTypo ?? ""}
                onChange={(v) => onChange({ ...value, bodyTypo: v || undefined })}
                options={typoOptions}
              />
            </InspectorField>
            <InspectorField label="Body line">
              <InspectorInput
                value={value?.bodyStrokeW ?? ""}
                onChange={(v) => onChange({ ...value, bodyStrokeW: v || undefined })}
                placeholder="0px"
              />
            </InspectorField>
          </FieldGrid>
        </AdvancedPanel>

        <AdvancedPanel title="Element widths and gaps">
          <FieldGrid>
            <InspectorField label="Kick W">
              <InspectorInput
                value={value?.kickerMaxWidth ?? ""}
                onChange={(v) => onChange({ ...value, kickerMaxWidth: v || undefined })}
                placeholder="320px"
              />
            </InspectorField>
            <InspectorField label="Kick gap">
              <InspectorInput
                value={value?.kickerGap ?? ""}
                onChange={(v) => onChange({ ...value, kickerGap: v || undefined })}
                placeholder="0px"
              />
            </InspectorField>
            <InspectorField label="Head W">
              <InspectorInput
                value={value?.headingMaxWidth ?? ""}
                onChange={(v) => onChange({ ...value, headingMaxWidth: v || undefined })}
                placeholder="720px"
              />
            </InspectorField>
            <InspectorField label="Head gap">
              <InspectorInput
                value={value?.headingGap ?? ""}
                onChange={(v) => onChange({ ...value, headingGap: v || undefined })}
                placeholder="12px"
              />
            </InspectorField>
            <InspectorField label="Body W">
              <InspectorInput
                value={value?.bodyMaxWidth ?? value?.maxWidth ?? ""}
                onChange={(v) => onChange({ ...value, bodyMaxWidth: v || undefined })}
                placeholder="72ch / 720px"
              />
            </InspectorField>
            <InspectorField label="Body gap">
              <InspectorInput
                value={value?.bodyGap ?? ""}
                onChange={(v) => onChange({ ...value, bodyGap: v || undefined })}
                placeholder="16px"
              />
            </InspectorField>
            <InspectorField label="CTA gap">
              <InspectorInput
                value={value?.ctaGap ?? ""}
                onChange={(v) => onChange({ ...value, ctaGap: v || undefined })}
                placeholder="32px"
              />
            </InspectorField>
          </FieldGrid>
        </AdvancedPanel>
      </InspectorSection>

      <BlockLayoutSection value={value} onChange={onChange} />
    </div>
  );
}
