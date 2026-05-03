"use client";

import type { EditableElement, ElementLayout } from "../types";
import {
  InspectorSection,
  InspectorField,
  InspectorSelect,
  InspectorNumber,
  InspectorSegment,
} from "@/components/inspector";
import {
  Layout,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
} from "lucide-react";

const AREA_OPTIONS = [
  { value: "", label: "Auto" },
  { value: "top", label: "Top" },
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
  { value: "bottom", label: "Bottom" },
];

const WIDTH_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "xs", label: "XS" },
  { value: "sm", label: "SM" },
  { value: "md", label: "MD" },
  { value: "lg", label: "LG" },
  { value: "full", label: "Full" },
];

export function LayoutSection({
  element,
  onChange,
}: {
  element: EditableElement;
  onChange: (el: EditableElement) => void;
}) {
  const layout = element.layout ?? {};

  function updateLayout(patch: Partial<ElementLayout>) {
    onChange({
      ...element,
      layout: { ...layout, ...patch },
    } as EditableElement);
  }

  return (
    <InspectorSection
      title="Layout"
      icon={<Layout className="h-3 w-3" />}
      defaultOpen={false}
    >
      <InspectorField label="Area">
        <InspectorSelect
          value={layout.area ?? ""}
          onChange={(v) =>
            updateLayout({ area: (v || undefined) as ElementLayout["area"] })
          }
          options={AREA_OPTIONS}
        />
      </InspectorField>

      <InspectorField label="Justify">
        <InspectorSegment
          value={layout.justify ?? "start"}
          onChange={(v) =>
            updateLayout({ justify: v as ElementLayout["justify"] })
          }
          options={[
            {
              value: "start" as const,
              label: <AlignStartVertical className="h-3 w-3" />,
              title: "Start",
            },
            {
              value: "center" as const,
              label: <AlignCenterVertical className="h-3 w-3" />,
              title: "Center",
            },
            {
              value: "end" as const,
              label: <AlignEndVertical className="h-3 w-3" />,
              title: "End",
            },
          ]}
        />
      </InspectorField>

      <InspectorField label="Width">
        <InspectorSelect
          value={layout.width ?? "auto"}
          onChange={(v) =>
            updateLayout({ width: v as ElementLayout["width"] })
          }
          options={WIDTH_OPTIONS}
        />
      </InspectorField>

      {/* Offset — simplified: base breakpoint only for now */}
      <InspectorField label="X">
        <InspectorNumber
          value={layout.offset?.base?.x}
          onChange={(v) =>
            updateLayout({
              offset: {
                ...layout.offset,
                base: { ...(layout.offset?.base ?? {}), x: v },
              },
            })
          }
          min={-200}
          max={200}
          step={1}
          placeholder="0"
        />
      </InspectorField>

      <InspectorField label="Y">
        <InspectorNumber
          value={layout.offset?.base?.y}
          onChange={(v) =>
            updateLayout({
              offset: {
                ...layout.offset,
                base: { ...(layout.offset?.base ?? {}), y: v },
              },
            })
          }
          min={-200}
          max={200}
          step={1}
          placeholder="0"
        />
      </InspectorField>
    </InspectorSection>
  );
}
