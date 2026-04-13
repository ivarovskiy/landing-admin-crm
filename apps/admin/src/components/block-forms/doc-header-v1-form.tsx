"use client";

import type { BlockFormProps } from "./index";
import {
  BlockLayoutSection,
  InspectorField,
  InspectorInput,
  InspectorSection,
  InspectorSelect,
} from "@/components/inspector";
import { FileText, Link } from "lucide-react";
import {
  TYPO_OPTIONS,
  ALIGN_OPTIONS,
} from "./hero-slider-presets";

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
        <InspectorField label="Margin left">
          <InspectorInput
            value={style?.ml ?? ""}
            onChange={(v) => onChange({ ...style, ml: v || undefined })}
            placeholder="e.g. 0px"
          />
        </InspectorField>
      </div>
    </InspectorSection>
  );
}

export function DocHeaderV1Form({ value, onChange }: BlockFormProps) {
  function setStyle(field: string, patch: any) {
    onChange({ ...value, [field]: patch });
  }

  return (
    <div>
      <InspectorSection title="Content" icon={<FileText className="h-3 w-3" />}>
        <InspectorField label="Kicker">
          <InspectorInput
            value={value?.kicker ?? ""}
            onChange={(v) => onChange({ ...value, kicker: v })}
            placeholder="Parent Portal"
          />
        </InspectorField>
        <ElementStyleFields
          label="Kicker"
          style={value?.kickerStyle}
          onChange={(patch) => setStyle("kickerStyle", patch)}
        />

        <InspectorField label="Title">
          <InspectorInput
            value={value?.title ?? ""}
            onChange={(v) => onChange({ ...value, title: v })}
            placeholder="New Student Memo"
          />
        </InspectorField>
        <ElementStyleFields
          label="Title"
          style={value?.titleStyle}
          onChange={(patch) => setStyle("titleStyle", patch)}
        />

        <InspectorField label="Subtitle">
          <InspectorInput
            value={value?.subtitle ?? ""}
            onChange={(v) => onChange({ ...value, subtitle: v })}
            placeholder="Welcome to Simply Dance!"
          />
        </InspectorField>
        <ElementStyleFields
          label="Subtitle"
          style={value?.subtitleStyle}
          onChange={(patch) => setStyle("subtitleStyle", patch)}
        />
      </InspectorSection>

      <InspectorSection title="Button (CTA)" icon={<Link className="h-3 w-3" />}>
        <InspectorField label="Button href">
          <InspectorInput
            value={value?.cta?.href ?? ""}
            onChange={(v) =>
              onChange({ ...value, cta: { ...value?.cta, href: v || undefined } })
            }
            placeholder="https://... (leave empty to hide)"
          />
        </InspectorField>
        <div className="grid grid-cols-2 gap-1.5">
          <InspectorField label="Button size">
            <InspectorInput
              value={value?.cta?.size ?? ""}
              onChange={(v) =>
                onChange({ ...value, cta: { ...value?.cta, size: v || undefined } })
              }
              placeholder="e.g. 80px"
            />
          </InspectorField>
          <InspectorField label="Gap to title">
            <InspectorInput
              value={value?.cta?.gap ?? ""}
              onChange={(v) =>
                onChange({ ...value, cta: { ...value?.cta, gap: v || undefined } })
              }
              placeholder="e.g. 32px"
            />
          </InspectorField>
        </div>
      </InspectorSection>

      <BlockLayoutSection value={value} onChange={onChange} />
    </div>
  );
}
