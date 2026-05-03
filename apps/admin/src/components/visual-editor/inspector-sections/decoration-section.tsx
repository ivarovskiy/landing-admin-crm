"use client";

import type { EditableElement, DecorationStyle } from "../types";
import {
  InspectorSection,
  InspectorField,
  InspectorInput,
  InspectorSelect,
} from "@/components/inspector";
import { Sparkles } from "lucide-react";

const TITLE_VARIANTS = [
  { value: "", label: "None" },
  { value: "outline", label: "Outline" },
  { value: "outline-stamp", label: "Outline Stamp" },
  { value: "filled", label: "Filled" },
  { value: "gradient", label: "Gradient" },
];

export function DecorationSection({
  element,
  onChange,
}: {
  element: EditableElement;
  onChange: (el: EditableElement) => void;
}) {
  const dec = element.style?.decoration ?? {};

  // Only show if element has decoration potential
  const hasTitleVariant = element.type === "text";
  const hasPillVariant = element.type === "button";

  if (!hasTitleVariant && !hasPillVariant) return null;

  function updateDecoration(patch: Partial<DecorationStyle>) {
    onChange({
      ...element,
      style: {
        ...element.style,
        decoration: { ...dec, ...patch },
      },
    } as EditableElement);
  }

  return (
    <InspectorSection
      title="Decoration"
      icon={<Sparkles className="h-3 w-3" />}
      defaultOpen={false}
    >
      {hasTitleVariant && (
        <InspectorField label="Variant">
          <InspectorSelect
            value={dec.titleVariant ?? ""}
            onChange={(v) => updateDecoration({ titleVariant: v || undefined })}
            options={TITLE_VARIANTS}
          />
        </InspectorField>
      )}

      {hasPillVariant && (
        <InspectorField label="Pill">
          <InspectorInput
            value={dec.pillVariant ?? ""}
            onChange={(v) => updateDecoration({ pillVariant: v || undefined })}
            placeholder="Pill style"
          />
        </InspectorField>
      )}

      {hasTitleVariant && (
        <InspectorField label="Stroke W">
          <InspectorInput
            value={dec.borderWidth ?? ""}
            onChange={(v) => updateDecoration({ borderWidth: v || undefined })}
            placeholder="3.6px"
          />
        </InspectorField>
      )}

      <InspectorField label="Radius">
        <InspectorInput
          value={dec.radius ?? ""}
          onChange={(v) => updateDecoration({ radius: v || undefined })}
          placeholder="4px"
        />
      </InspectorField>
    </InspectorSection>
  );
}
