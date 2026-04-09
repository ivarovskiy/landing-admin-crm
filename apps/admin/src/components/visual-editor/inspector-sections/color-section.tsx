"use client";

import type { EditableElement, ColorStyle } from "../types";
import {
  InspectorSection,
  InspectorField,
  InspectorColorInput,
} from "@/components/inspector";
import { Palette } from "lucide-react";

export function ColorSection({
  element,
  onChange,
}: {
  element: EditableElement;
  onChange: (el: EditableElement) => void;
}) {
  const color = element.style?.color ?? {};

  function updateColor(patch: Partial<ColorStyle>) {
    onChange({
      ...element,
      style: {
        ...element.style,
        color: { ...color, ...patch },
      },
    } as EditableElement);
  }

  // Show relevant fields based on element type
  const showText = element.type === "text" || element.type === "button";
  const showFill = element.type === "text";
  const showStroke = element.type === "text";
  const showShadow = element.type === "text";
  const showBackground = element.type === "button";
  const showBorder = element.type === "button";

  if (!showText && !showBackground) return null;

  return (
    <InspectorSection
      title="Colors"
      icon={<Palette className="h-3 w-3" />}
      defaultOpen={false}
    >
      {showText && (
        <InspectorField label="Text">
          <InspectorColorInput
            value={color.text ?? ""}
            onChange={(v) => updateColor({ text: v || undefined })}
          />
        </InspectorField>
      )}

      {showFill && (
        <InspectorField label="Fill">
          <InspectorColorInput
            value={color.fill ?? ""}
            onChange={(v) => updateColor({ fill: v || undefined })}
            placeholder="Fill color"
          />
        </InspectorField>
      )}

      {showStroke && (
        <InspectorField label="Stroke">
          <InspectorColorInput
            value={color.stroke ?? ""}
            onChange={(v) => updateColor({ stroke: v || undefined })}
            placeholder="Stroke color"
          />
        </InspectorField>
      )}

      {showShadow && (
        <InspectorField label="Shadow">
          <InspectorColorInput
            value={color.shadow ?? ""}
            onChange={(v) => updateColor({ shadow: v || undefined })}
            placeholder="Shadow color"
          />
        </InspectorField>
      )}

      {showBackground && (
        <InspectorField label="BG">
          <InspectorColorInput
            value={color.background ?? ""}
            onChange={(v) => updateColor({ background: v || undefined })}
          />
        </InspectorField>
      )}

      {showBorder && (
        <InspectorField label="Border">
          <InspectorColorInput
            value={color.border ?? ""}
            onChange={(v) => updateColor({ border: v || undefined })}
            placeholder="Border color"
          />
        </InspectorField>
      )}
    </InspectorSection>
  );
}
