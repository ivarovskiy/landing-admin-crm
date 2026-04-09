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
  type,
  variant,
  draft,
  onChange,
  externalSelectedElementId,
  onElementSelect,
}: {
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

  // Show element inspector for selected element
  if (selected) {
    return (
      <div>
        {/* Back to elements list */}
        <button
          type="button"
          onClick={() => handleSelect(null)}
          className="w-full flex items-center gap-1.5 px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 border-b transition-colors"
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
    <div className="p-2">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5 mb-1">
        Elements ({elements.length})
      </div>
      <div className="space-y-px">
        {elements.map((el) => (
          <button
            key={el.id}
            type="button"
            onClick={() => handleSelect(el.id)}
            className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted/50 transition-colors group"
          >
            <span className="text-muted-foreground shrink-0">
              {TYPE_ICONS[el.type] ?? <Type className="h-3 w-3" />}
            </span>
            <span className="flex-1 text-xs truncate text-foreground/80 group-hover:text-foreground">
              {el.label ?? el.id}
            </span>
            <span className="text-[10px] text-muted-foreground/50 shrink-0 uppercase">
              {el.type}
            </span>
          </button>
        ))}

        {elements.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-6">
            No editable elements
          </div>
        )}
      </div>
    </div>
  );
}
