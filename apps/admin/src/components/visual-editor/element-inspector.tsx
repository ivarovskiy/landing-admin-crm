"use client";

import type { EditableElement } from "./types";
import { ColorSection } from "./inspector-sections/color-section";
import { ContentSection } from "./inspector-sections/content-section";
import { DecorationSection } from "./inspector-sections/decoration-section";
import { LayoutSection } from "./inspector-sections/layout-section";
import { TypographySection } from "./inspector-sections/typography-section";
import { VisibilitySection } from "./inspector-sections/visibility-section";
import { Gem, Image, MousePointerClick, Type } from "lucide-react";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  text: <Type className="h-3.5 w-3.5" />,
  image: <Image className="h-3.5 w-3.5" />,
  button: <MousePointerClick className="h-3.5 w-3.5" />,
  logo: <Gem className="h-3.5 w-3.5" />,
};

const TYPE_LABELS: Record<string, string> = {
  text: "Text",
  image: "Image",
  button: "Button",
  logo: "Logo",
};

export function ElementInspector({
  element,
  onChange,
}: {
  element: EditableElement;
  onChange: (el: EditableElement) => void;
}) {
  return (
    <div>
      <div className="border-b border-border/60 bg-muted/20 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-muted-foreground">
            {TYPE_ICONS[element.type] ?? <Type className="h-3.5 w-3.5" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold">
              {element.label ?? element.id}
            </div>
            <div className="truncate text-[10px] text-muted-foreground">
              {TYPE_LABELS[element.type] ?? element.type}
              {element.slot ? ` / ${element.slot}` : ""}
            </div>
          </div>
        </div>
      </div>

      <ContentSection element={element} onChange={onChange} />
      <TypographySection element={element} onChange={onChange} />
      <ColorSection element={element} onChange={onChange} />
      <DecorationSection element={element} onChange={onChange} />
      <LayoutSection element={element} onChange={onChange} />
      <VisibilitySection element={element} onChange={onChange} />
    </div>
  );
}
