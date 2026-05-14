"use client";

import { useEffect, useMemo, useState } from "react";
import type { EditableElement } from "./types";
import { getVisualEditorDef } from "./adapters/registry";
import { updateElement } from "./utils";
import { ElementInspector } from "./element-inspector";
import {
  Type,
  Image,
  MousePointerClick,
  Gem,
  ChevronLeft,
} from "lucide-react";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  text: <Type className="h-3 w-3" />,
  image: <Image className="h-3 w-3" />,
  button: <MousePointerClick className="h-3 w-3" />,
  logo: <Gem className="h-3 w-3" />,
};

/**
 * Visual editor panel — shows element list + element inspector.
 *
 * Replaces the form tab in the block edit panel when an adapter exists.
 * Manages local draft of editable elements and converts back to block data on change.
 *
 * Supports bidirectional element selection with preview iframe:
 * - `externalSelectedElementId` — set from outside (e.g. from preview click)
 * - `onElementSelect` — called when user selects an element in this panel
 */
export function VisualEditorPanel({
  blockId,
  type,
  variant,
  draft,
  onChange,
  externalSelectedElementId,
  onElementSelect,
}: {
  blockId?: string;
  type: string;
  variant: string;
  draft: any;
  onChange: (next: any) => void;
  externalSelectedElementId?: string | null;
  onElementSelect?: (elementId: string | null) => void;
}) {
  const def = useMemo(() => getVisualEditorDef(type, variant), [type, variant]);

  // Convert block data → elements
  const elements = useMemo(() => {
    if (!def) return [];
    return def.adapter.toEditableElements(draft);
  }, [def, draft]);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Sync external selection
  useEffect(() => {
    if (externalSelectedElementId !== undefined && externalSelectedElementId !== selectedId) {
      setSelectedId(externalSelectedElementId);
    }
  }, [externalSelectedElementId]);

  const selected = selectedId ? elements.find((el) => el.id === selectedId) : null;

  if (!def) return null;

  function handleSelect(id: string | null) {
    setSelectedId(id);
    onElementSelect?.(id);
  }

  function handleElementChange(updated: EditableElement) {
    const newElements = updateElement(elements, updated.id, updated);
    const newData = def!.adapter.applyEditableElements(draft, newElements);
    onChange(newData);
  }

  function requestHeroAbsoluteConversion() {
    if (!blockId) return;
    window.dispatchEvent(new CustomEvent("hero-slider-convert-to-absolute", {
      detail: { blockId },
    }));
  }

  // Show element inspector for selected element
  if (selected) {
    return (
      <div className="min-h-full">
        {/* Back to elements list */}
        <button
          type="button"
          onClick={() => handleSelect(null)}
          className="flex h-9 w-full items-center gap-1.5 border-b border-border/60 px-3 text-xs text-muted-foreground transition-colors hover:bg-muted/35 hover:text-foreground"
        >
          <ChevronLeft className="h-3 w-3" />
          All Elements
        </button>

        <ElementInspector
          element={selected}
          onChange={handleElementChange}
        />
      </div>
    );
  }

  // Elements list
  return (
    <div className="p-2.5">
      {type === "hero" && variant === "slider-v1" && (
        <div className="mb-2 rounded-md border border-red-500/40 bg-red-500/10 p-2">
          <button
            type="button"
            onClick={requestHeroAbsoluteConversion}
            className="w-full rounded-md bg-red-600 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-white shadow-sm hover:bg-red-700"
          >
            Перенести на absolute
          </button>
          <p className="mt-1.5 text-[10px] leading-snug text-red-700">
            Бере реальні координати з live preview і вмикає незалежний drag.
          </p>
        </div>
      )}
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-[10px] font-semibold uppercase text-muted-foreground">
          Elements
        </span>
        <span className="text-[10px] tabular-nums text-muted-foreground/70">
          {elements.length}
        </span>
      </div>
      <div className="space-y-1">
        {elements.map((el) => (
          <button
            key={el.id}
            type="button"
            onClick={() => handleSelect(el.id)}
            className="group flex h-8 w-full items-center gap-2 rounded-md border border-transparent px-2 text-left transition-colors hover:border-border/60 hover:bg-muted/45"
          >
            <span className="text-muted-foreground shrink-0">
              {TYPE_ICONS[el.type] ?? <Type className="h-3 w-3" />}
            </span>
            <span className="flex-1 truncate text-xs text-foreground/85 group-hover:text-foreground">
              {el.label ?? el.id}
            </span>
            <span className="shrink-0 rounded bg-muted/55 px-1.5 py-0.5 text-[9px] uppercase text-muted-foreground/70">
              {el.type}
            </span>
          </button>
        ))}

        {elements.length === 0 && (
          <div className="py-6 text-center text-xs text-muted-foreground">
            No editable elements
          </div>
        )}
      </div>
    </div>
  );
}
