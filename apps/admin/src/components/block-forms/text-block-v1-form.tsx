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
import { Type, AlignLeft } from "lucide-react";

const ALIGN_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

export function TextBlockV1Form({ value, onChange }: BlockFormProps) {
  return (
    <div>
      <InspectorSection title="Content" icon={<Type className="h-3 w-3" />}>
        <InspectorField label="Kicker">
          <InspectorInput
            value={value?.kicker ?? ""}
            onChange={(v) => onChange({ ...value, kicker: v })}
            placeholder="PARENT PORTAL"
          />
        </InspectorField>

        <InspectorField label="Heading">
          <InspectorInput
            value={value?.heading ?? ""}
            onChange={(v) => onChange({ ...value, heading: v })}
            placeholder="Section title"
          />
        </InspectorField>

        <InspectorField label="Body">
          <InspectorTextarea
            value={value?.body ?? ""}
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
          <InspectorSelect
            value={value?.align ?? "left"}
            onChange={(v) => onChange({ ...value, align: v })}
            options={ALIGN_OPTIONS}
          />
        </InspectorField>

        <InspectorField label="Max width">
          <InspectorInput
            value={value?.maxWidth ?? ""}
            onChange={(v) => onChange({ ...value, maxWidth: v })}
            placeholder="720px"
          />
        </InspectorField>

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
      </InspectorSection>

      <BlockLayoutSection value={value} onChange={onChange} />
    </div>
  );
}
