"use client";

import type { EditableElement } from "./types";
import { ContentSection } from "./inspector-sections/content-section";
import { TypographySection } from "./inspector-sections/typography-section";
import { ColorSection } from "./inspector-sections/color-section";
import { DecorationSection } from "./inspector-sections/decoration-section";
import { LayoutSection } from "./inspector-sections/layout-section";
import { VisibilitySection } from "./inspector-sections/visibility-section";
import {
  Type,
  Image,
  MousePointerClick,
  Gem,
} from "lucide-react";

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
      {/* Element header */}
      <div className="px-4 py-2.5 border-b border-border/60 bg-muted/20">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground shrink-0">
            {TYPE_ICONS[element.type] ?? <Type className="h-3.5 w-3.5" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold truncate">
              {element.label ?? element.id}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {TYPE_LABELS[element.type] ?? element.type}
              {element.slot ? ` · ${element.slot}` : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Inspector sections */}
      <ContentSection element={element} onChange={onChange} />
      <TypographySection element={element} onChange={onChange} />
      <ColorSection element={element} onChange={onChange} />
      <DecorationSection element={element} onChange={onChange} />
      <LayoutSection element={element} onChange={onChange} />
      <VisibilitySection element={element} onChange={onChange} />
    </div>
  );
}
