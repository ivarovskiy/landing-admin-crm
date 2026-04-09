"use client";

import { useState, useRef, useCallback } from "react";
import { Smartphone, Monitor, Layout } from "lucide-react";
import {
  InspectorSection,
  InspectorField,
  InspectorInput,
  InspectorToggle,
} from "./section";

type LayoutData = {
  _layout?: {
    anchor?: string;
    container?: string;
    spacingAfter?: number;
    hide?: {
      base?: boolean;
      md?: boolean;
      lg?: boolean;
    };
  };
};

/**
 * Shared Layout & Visibility section for all block inspector forms.
 * Manages _layout.anchor, _layout.hide (responsive visibility).
 */
export function BlockLayoutSection({
  value,
  onChange,
}: {
  value: any;
  onChange: (next: any) => void;
}) {
  const layout = value?._layout ?? {};
  const hide = layout.hide ?? {};

  function updateLayout(patch: Record<string, any>) {
    onChange({
      ...value,
      _layout: { ...layout, ...patch },
    });
  }

  function updateHide(patch: Record<string, boolean>) {
    updateLayout({
      hide: { ...hide, ...patch },
    });
  }

  return (
    <InspectorSection
      title="Layout"
      icon={<Layout className="h-3 w-3" />}
      defaultOpen={false}
    >
      <InspectorField label="Anchor">
        <InspectorInput
          value={layout.anchor ?? ""}
          onChange={(v) => updateLayout({ anchor: v || undefined })}
          placeholder="e.g. about, contact"
        />
      </InspectorField>

      <InspectorField label="Container">
        <select
          value={layout.container ?? "contained"}
          onChange={(e) =>
            updateLayout({
              container:
                e.target.value === "contained" ? undefined : e.target.value,
            })
          }
          className="w-full h-7 rounded-md border bg-muted text-foreground px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="contained">Contained</option>
          <option value="full">Full width</option>
        </select>
      </InspectorField>

      {/* Spacing after — interactive drag area */}
      <SpacingAfterControl
        value={layout.spacingAfter ?? 0}
        onChange={(v) => updateLayout({ spacingAfter: v || undefined })}
      />

      <div className="pt-1">
        <div className="text-[11px] font-medium text-muted-foreground mb-2">
          Visibility
        </div>
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
              <Monitor className="h-3 w-3 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">
                Desktop
              </span>
            </div>
            <InspectorToggle
              checked={!hide.md && !hide.lg}
              onChange={(visible) =>
                updateHide({ md: !visible, lg: !visible })
              }
            />
          </div>
        </div>
      </div>
    </InspectorSection>
  );
}

/* ================================================================
   SpacingAfterControl — visual spacing editor (Figma-like)
   ================================================================ */

function SpacingAfterControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [dragStart, setDragStart] = useState<{ y: number; initial: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const previewHeight = Math.max(8, Math.min(value, 80));

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setDragStart({ y: e.clientY, initial: value });

      const handleMove = (ev: MouseEvent) => {
        if (!dragStart && e) {
          const dy = ev.clientY - e.clientY;
          onChange(Math.max(0, value + dy));
        }
      };

      const startY = e.clientY;
      const startVal = value;

      const onMove = (ev: MouseEvent) => {
        const dy = ev.clientY - startY;
        onChange(Math.max(0, startVal + dy));
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        setDragStart(null);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [value, onChange],
  );

  return (
    <div className="pt-1">
      <div className="text-[11px] font-medium text-muted-foreground mb-1.5">
        Spacing after
      </div>

      {/* Visual preview area */}
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={() => {
          setEditing(true);
          setTimeout(() => inputRef.current?.select(), 0);
        }}
        className="relative group cursor-ns-resize select-none"
        title="Drag to resize or double-click to edit"
      >
        {/* Top section edge */}
        <div className="h-2.5 rounded-t border border-b-0 border-border/40 bg-muted/20" />

        {/* Spacing area */}
        <div
          className="relative border-x border-dashed border-primary/30 bg-primary/5 transition-[height] duration-75 flex items-center justify-center"
          style={{ height: `${previewHeight}px`, minHeight: "8px" }}
        >
          {/* Dimension lines */}
          <div className="absolute inset-x-0 top-0 border-t border-dashed border-primary/40" />
          <div className="absolute inset-x-0 bottom-0 border-b border-dashed border-primary/40" />

          {/* Value label */}
          {editing ? (
            <input
              ref={inputRef}
              type="number"
              min={0}
              defaultValue={value}
              onBlur={(e) => {
                setEditing(false);
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v)) onChange(Math.max(0, v));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setEditing(false);
                  const v = parseInt((e.target as HTMLInputElement).value, 10);
                  if (!isNaN(v)) onChange(Math.max(0, v));
                }
                if (e.key === "Escape") setEditing(false);
              }}
              className="w-14 h-5 text-center text-[10px] font-mono bg-background border rounded px-1 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          ) : (
            <span className="text-[10px] font-mono text-primary/70 group-hover:text-primary transition-colors">
              {value}px
            </span>
          )}
        </div>

        {/* Bottom section edge */}
        <div className="h-2.5 rounded-b border border-t-0 border-border/40 bg-muted/20" />
      </div>
    </div>
  );
}
