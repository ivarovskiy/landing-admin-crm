"use client";

import type { BlockFormProps } from "./index";
import {
  InspectorSection,
  InspectorField,
  InspectorInput,
  InspectorTextarea,
  InspectorSelect,
  BlockLayoutSection,
} from "@/components/inspector";
import { AlignLeft, Image, Plus, Trash2 } from "lucide-react";
import { TYPO_OPTIONS, ALIGN_OPTIONS } from "./hero-slider-presets";

const ALIGN_WITH_INHERIT = [
  { value: "", label: "Default" },
  ...ALIGN_OPTIONS,
];

function ElementStyleFields({
  label,
  style,
  onChange,
}: {
  label: string;
  style: any;
  onChange: (patch: any) => void;
}) {
  return (
    <InspectorSection title={`${label} style`} defaultOpen={false}>
      <div className="grid grid-cols-2 gap-1.5">
        <InspectorField label="Typography">
          <InspectorSelect
            value={style?.typo ?? ""}
            onChange={(v) => onChange({ ...style, typo: v || undefined })}
            options={TYPO_OPTIONS}
          />
        </InspectorField>
        <InspectorField label="Align">
          <InspectorSelect
            value={style?.align ?? ""}
            onChange={(v) => onChange({ ...style, align: v || undefined })}
            options={ALIGN_WITH_INHERIT}
          />
        </InspectorField>
        <InspectorField label="Font size">
          <InspectorInput
            value={style?.size ?? ""}
            onChange={(v) => onChange({ ...style, size: v || undefined })}
            placeholder="e.g. 14px"
          />
        </InspectorField>
        <InspectorField label="Margin top">
          <InspectorInput
            value={style?.mt ?? ""}
            onChange={(v) => onChange({ ...style, mt: v || undefined })}
            placeholder="e.g. 8px"
          />
        </InspectorField>
        <InspectorField label="Margin bottom">
          <InspectorInput
            value={style?.mb ?? ""}
            onChange={(v) => onChange({ ...style, mb: v || undefined })}
            placeholder="e.g. 8px"
          />
        </InspectorField>
      </div>
    </InspectorSection>
  );
}

export function DocBodyV1Form({ value, onChange }: BlockFormProps) {
  const sections: any[] = Array.isArray(value?.sections) ? value.sections : [];
  const image = value?.image ?? {};

  function updateSection(i: number, patch: object) {
    const next = sections.map((s, idx) => (idx === i ? { ...s, ...patch } : s));
    onChange({ ...value, sections: next });
  }

  function addSection() {
    onChange({
      ...value,
      sections: [...sections, { id: crypto.randomUUID(), heading: "", body: "" }],
    });
  }

  function removeSection(i: number) {
    onChange({ ...value, sections: sections.filter((_, idx) => idx !== i) });
  }

  return (
    <div>
      {/* Sections */}
      <InspectorSection title="Text sections" icon={<AlignLeft className="h-3 w-3" />}>
        {sections.map((s, i) => (
          <div key={s.id ?? i} className="space-y-1.5 pb-3 mb-3 border-b border-[oklch(1_0_0/8%)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[oklch(0.45_0_0)]">
                Section {i + 1}
              </span>
              <button
                type="button"
                onClick={() => removeSection(i)}
                className="text-[oklch(0.4_0_0)] hover:text-red-400 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>

            <InspectorField label="Heading">
              <InspectorInput
                value={s.heading ?? ""}
                onChange={(v) => updateSection(i, { heading: v })}
                placeholder="We Believe in Classical Ballet"
              />
            </InspectorField>
            <ElementStyleFields
              label="Heading"
              style={s.headingStyle}
              onChange={(patch) => updateSection(i, { headingStyle: patch })}
            />

            <InspectorField label="Body">
              <InspectorTextarea
                value={s.body ?? ""}
                onChange={(v) => updateSection(i, { body: v })}
                placeholder="Paragraph text... (blank line = new paragraph)"
                rows={4}
              />
            </InspectorField>
            <ElementStyleFields
              label="Body"
              style={s.bodyStyle}
              onChange={(patch) => updateSection(i, { bodyStyle: patch })}
            />
          </div>
        ))}

        <button
          type="button"
          onClick={addSection}
          className="w-full flex items-center justify-center gap-1.5 h-7 rounded-lg border border-dashed border-[oklch(1_0_0/15%)] text-[10px] text-[oklch(0.45_0_0)] hover:text-[oklch(0.7_0_0)] hover:border-[oklch(1_0_0/30%)] transition-colors"
        >
          <Plus className="h-3 w-3" />
          Add section
        </button>
      </InspectorSection>

      {/* Image */}
      <InspectorSection title="Image" icon={<Image className="h-3 w-3" />}>
        <InspectorField label="URL">
          <InspectorInput
            value={image?.src ?? ""}
            onChange={(v) => onChange({ ...value, image: { ...image, src: v } })}
            placeholder="https://..."
          />
        </InspectorField>

        <InspectorField label="Alt text">
          <InspectorInput
            value={image?.alt ?? ""}
            onChange={(v) => onChange({ ...value, image: { ...image, alt: v } })}
            placeholder="Ballet dancer portrait"
          />
        </InspectorField>
      </InspectorSection>

      <BlockLayoutSection value={value} onChange={onChange} />
    </div>
  );
}
