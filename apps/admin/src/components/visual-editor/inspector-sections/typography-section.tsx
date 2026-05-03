"use client";

import type { EditableElement, TypographyStyle } from "../types";
import {
  InspectorSection,
  InspectorField,
  InspectorInput,
  InspectorSelect,
  InspectorNumber,
  InspectorSegment,
} from "@/components/inspector";
import { Type, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

const FONT_FAMILIES = [
  { value: "", label: "Default" },
  { value: "serif", label: "Serif" },
  { value: "sans-serif", label: "Sans-serif" },
  { value: "monospace", label: "Monospace" },
];

const TEXT_TRANSFORM_OPTIONS = [
  { value: "none", label: "None" },
  { value: "uppercase", label: "UPPER" },
  { value: "lowercase", label: "lower" },
  { value: "capitalize", label: "Title" },
];

export function TypographySection({
  element,
  onChange,
}: {
  element: EditableElement;
  onChange: (el: EditableElement) => void;
}) {
  // Only show for text elements
  if (element.type !== "text" && element.type !== "button") return null;

  const typo = element.style?.typography ?? {};

  function updateTypography(patch: Partial<TypographyStyle>) {
    onChange({
      ...element,
      style: {
        ...element.style,
        typography: { ...typo, ...patch },
      },
    } as EditableElement);
  }

  return (
    <InspectorSection
      title="Typography"
      icon={<Type className="h-3 w-3" />}
      defaultOpen={false}
    >
      <InspectorField label="Font">
        <InspectorSelect
          value={typo.fontFamily ?? ""}
          onChange={(v) => updateTypography({ fontFamily: v || undefined })}
          options={FONT_FAMILIES}
        />
      </InspectorField>

      <InspectorField label="Size">
        <InspectorInput
          value={typo.fontSize ?? ""}
          onChange={(v) => updateTypography({ fontSize: v || undefined })}
          placeholder="16px"
        />
      </InspectorField>

      <InspectorField label="Weight">
        <InspectorNumber
          value={typo.fontWeight}
          onChange={(v) => updateTypography({ fontWeight: v })}
          min={100}
          max={900}
          step={100}
          placeholder="400"
        />
      </InspectorField>

      <InspectorField label="Line H.">
        <InspectorInput
          value={typo.lineHeight ?? ""}
          onChange={(v) => updateTypography({ lineHeight: v || undefined })}
          placeholder="1.5"
        />
      </InspectorField>

      <InspectorField label="Spacing">
        <InspectorInput
          value={typo.letterSpacing ?? ""}
          onChange={(v) => updateTypography({ letterSpacing: v || undefined })}
          placeholder="0.02em"
        />
      </InspectorField>

      <InspectorField label="Transform">
        <InspectorSelect
          value={typo.textTransform ?? "none"}
          onChange={(v) =>
            updateTypography({
              textTransform: v as TypographyStyle["textTransform"],
            })
          }
          options={TEXT_TRANSFORM_OPTIONS}
        />
      </InspectorField>

      <InspectorField label="Align">
        <InspectorSegment
          value={typo.textAlign ?? "left"}
          onChange={(v) =>
            updateTypography({ textAlign: v as TypographyStyle["textAlign"] })
          }
          options={[
            {
              value: "left" as const,
              label: <AlignLeft className="h-3 w-3" />,
              title: "Left",
            },
            {
              value: "center" as const,
              label: <AlignCenter className="h-3 w-3" />,
              title: "Center",
            },
            {
              value: "right" as const,
              label: <AlignRight className="h-3 w-3" />,
              title: "Right",
            },
          ]}
        />
      </InspectorField>
    </InspectorSection>
  );
}
