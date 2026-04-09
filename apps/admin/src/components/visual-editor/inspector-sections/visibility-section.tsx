"use client";

import type { EditableElement } from "../types";
import {
  InspectorSection,
  InspectorToggle,
} from "@/components/inspector";
import { Eye, Smartphone, Monitor, Tablet } from "lucide-react";

export function VisibilitySection({
  element,
  onChange,
}: {
  element: EditableElement;
  onChange: (el: EditableElement) => void;
}) {
  const hide = element.visibility?.hide ?? {};

  function updateHide(patch: Record<string, boolean>) {
    onChange({
      ...element,
      visibility: {
        ...element.visibility,
        hide: { ...hide, ...patch },
      },
    } as EditableElement);
  }

  return (
    <InspectorSection
      title="Visibility"
      icon={<Eye className="h-3 w-3" />}
      defaultOpen={false}
    >
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Smartphone className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">Mobile</span>
          </div>
          <InspectorToggle
            checked={!hide.base}
            onChange={(visible) => updateHide({ base: !visible })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Tablet className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">Tablet</span>
          </div>
          <InspectorToggle
            checked={!hide.md}
            onChange={(visible) => updateHide({ md: !visible })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Monitor className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">Desktop</span>
          </div>
          <InspectorToggle
            checked={!hide.lg}
            onChange={(visible) => updateHide({ lg: !visible })}
          />
        </div>
      </div>
    </InspectorSection>
  );
}
