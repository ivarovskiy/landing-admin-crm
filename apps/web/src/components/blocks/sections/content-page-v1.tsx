"use client";

import type React from "react";
import { useState, useCallback, useRef } from "react";
import { DndContext, DragOverlay, useDraggable, useDroppable, pointerWithin, type DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Container, Kicker, OutlineStampText, STAMP_TITLE } from "@/components/landing/ui";
import { MediaImage } from "@/components/media-image";
import ClipIcon from "@/assets/icons/clip.svg";
import { ScrollProgressDot } from "./scroll-progress-dot";
import { TipTapInline, renderRichText } from "@/components/tiptap-inline";

type ResponsiveItemLayout = {
  width?: string;
  offsetX?: string;
  gapBefore?: string;
  align?: "start" | "center" | "end";
};

type GridPlacement = {
  col?: number;
  row?: number;
  colSpan?: number;
  rowSpan?: number;
};

type ContentGridConfig = {
  enabled?: boolean;
  columns?: number;
  rows?: number;
  rowHeight?: string;
  gap?: string;
};

type TextAlign = "left" | "center" | "right";

type ContentItem = {
  kind: "image" | "text";
  // image
  src?: string;
  alt?: string;
  aspectRatio?: string; // e.g. "4/3", "1/1", "3/4"
  imageWidth?: string;  // e.g. "420px"
  imageHeight?: string; // e.g. "253px"
  imagePadding?: string; // e.g. "0 113px 33px 0"
  // text
  heading?: string;
  body?: string;
  textMaxWidth?: string;
  textAlign?: TextAlign;
  headingTypo?: string;
  bodyTypo?: string;
  headingStrokeW?: string;
  bodyStrokeW?: string;
  // mobile
  mobileOrder?: number;
  // free-flow layout per breakpoint
  layout?: {
    md?: ResponsiveItemLayout;
    lg?: ResponsiveItemLayout;
  };
  grid?: GridPlacement;
};

function normalize(raw: unknown): ContentItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (x: any) => x && typeof x === "object" && (x.kind === "image" || x.kind === "text"),
  ) as ContentItem[];
}

function mapAlign(value?: "start" | "center" | "end") {
  if (value === "center") return "center";
  if (value === "end") return "flex-end";
  return "flex-start";
}

function applyLayoutVars(
  out: Record<string, string>,
  bp: "md" | "lg",
  layout?: ResponsiveItemLayout,
) {
  if (!layout) return;

  if (layout.width) {
    out[`--cp-width-${bp}`] = layout.width;
  }

  if (layout.offsetX) {
    out[`--cp-offset-${bp}`] = layout.offsetX;
  }

  if (layout.gapBefore) {
    out[`--cp-gap-${bp}`] = layout.gapBefore;
  }

  if (layout.align) {
    out[`--cp-align-${bp}`] = mapAlign(layout.align);
  }
}

function itemStyle(item: ContentItem): React.CSSProperties {
  const s: Record<string, string> = {};

  if (typeof item.mobileOrder === "number") {
    s["--mobile-order"] = String(item.mobileOrder);
  }

  if (item.kind === "image") {
    if (item.aspectRatio) s["--aspect"] = item.aspectRatio;
    if (item.imageWidth) s["--img-w"] = item.imageWidth;
    if (item.imageHeight) s["--img-h"] = item.imageHeight;
    if (item.imagePadding) s["--img-padding"] = item.imagePadding;
  }

  if (item.kind === "text") {
    if (item.textMaxWidth) s["--cp-text-max-w"] = item.textMaxWidth;
    if (item.textAlign) s.textAlign = item.textAlign;
  }

  applyLayoutVars(s, "md", item.layout?.md);
  applyLayoutVars(s, "lg", item.layout?.lg);

  if (item.grid) {
    if (item.grid.col) s["--cp-grid-col"] = String(item.grid.col);
    if (item.grid.row) s["--cp-grid-row"] = String(item.grid.row);
    if (item.grid.colSpan) s["--cp-grid-col-span"] = String(item.grid.colSpan);
    if (item.grid.rowSpan) s["--cp-grid-row-span"] = String(item.grid.rowSpan);
  }

  return s as React.CSSProperties;
}

// ── dnd-kit primitives ────────────────────────────────────────────────────────

function DroppableCell({ id, col, row }: { id: string; col: number; row: number }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        gridColumn: String(col),
        gridRow: String(row),
        border: "1px dashed rgba(99,102,241,0.35)",
        borderRadius: 3,
        backgroundColor: isOver ? "rgba(99,102,241,0.18)" : "transparent",
        transition: "background-color 0.08s",
      }}
    />
  );
}

// Resize handle — bottom-right corner, drags to change colSpan / rowSpan
function ResizeHandle({
  colSpan,
  rowSpan,
  grid,
  containerRef,
  onResize,
}: {
  colSpan: number;
  rowSpan: number;
  grid?: ContentGridConfig;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onResize: (colSpan: number, rowSpan: number) => void;
}) {
  const startRef = useRef<{ x: number; y: number; cs: number; rs: number } | null>(null);
  return (
    <div
      title="Drag to resize"
      style={{
        position: "absolute",
        bottom: 3,
        right: 3,
        width: 14,
        height: 14,
        background: "rgba(99,102,241,0.75)",
        borderRadius: 3,
        cursor: "se-resize",
        zIndex: 20,
        touchAction: "none",
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        startRef.current = { x: e.clientX, y: e.clientY, cs: colSpan, rs: rowSpan };
      }}
      onPointerMove={(e) => {
        if (!startRef.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const cols = Number(grid?.columns) || 12;
        const gap = parseFloat(grid?.gap ?? "8") || 8;
        const rowH = parseFloat(grid?.rowHeight ?? "44") || 44;
        const colW = (rect.width - gap * (cols - 1)) / cols;
        const dx = e.clientX - startRef.current.x;
        const dy = e.clientY - startRef.current.y;
        const newCs = Math.max(1, Math.round(startRef.current.cs + dx / (colW + gap)));
        const newRs = Math.max(1, Math.round(startRef.current.rs + dy / (rowH + gap)));
        onResize(newCs, newRs);
      }}
      onPointerUp={() => { startRef.current = null; }}
      onPointerCancel={() => { startRef.current = null; }}
    />
  );
}

function DraggableGridItem({
  id,
  item,
  idx,
  col,
  grid,
  containerRef,
  isDraggingThis,
  onItemChange,
}: {
  id: string;
  item: ContentItem;
  idx: number;
  col: "left" | "right";
  grid?: ContentGridConfig;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isDraggingThis: boolean;
  onItemChange?: (changes: Partial<ContentItem>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });

  const editOverlay = (
    <>
      {/* Drag handle — only this element activates drag, text stays clickable */}
      <div
        {...attributes}
        {...listeners}
        title="Drag to move"
        style={{
          position: "absolute",
          top: 3,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "2px 8px",
          background: "rgba(99,102,241,0.45)",
          borderRadius: 4,
          cursor: isDraggingThis ? "grabbing" : "grab",
          zIndex: 10,
          touchAction: "none",
          fontSize: 10,
          color: "rgba(255,255,255,0.9)",
          userSelect: "none",
          lineHeight: 1.2,
        }}
      >
        ⠿⠿
      </div>
      {/* Resize handle — bottom-right corner */}
      {onItemChange && (
        <ResizeHandle
          colSpan={item.grid?.colSpan ?? 1}
          rowSpan={item.grid?.rowSpan ?? 1}
          grid={grid}
          containerRef={containerRef}
          onResize={(cs, rs) =>
            onItemChange({ grid: { ...(item.grid ?? {}), colSpan: cs, rowSpan: rs } })
          }
        />
      )}
    </>
  );

  return renderItem(
    item,
    idx,
    col,
    {
      ref: setNodeRef as React.Ref<HTMLDivElement>,
      style: {
        transform: CSS.Translate.toString(transform),
        opacity: isDraggingThis ? 0 : 1,
        position: "relative",
        zIndex: 1,
      },
    },
    onItemChange,
    editOverlay,
  );
}

function DndGrid({
  items,
  grid,
  style,
  className,
  onMoveItem,
  onUpdateItem,
}: {
  items: { item: ContentItem; col: "left" | "right" }[];
  grid?: ContentGridConfig;
  style?: React.CSSProperties;
  className: string;
  onMoveItem: (idx: number, toCol: number, toRow: number) => void;
  onUpdateItem: (idx: number, changes: Partial<ContentItem>) => void;
}) {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cols = Number(grid?.columns) || 12;
  const rows = Number(grid?.rows) || 6;

  const activeIdx = activeDragId !== null ? parseInt(activeDragId.replace("gi-", "")) : -1;
  const activeItem = activeIdx >= 0 ? items[activeIdx] : null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over) return;
    const idx = parseInt(String(active.id).replace("gi-", ""));
    const [, cStr, rStr] = String(over.id).split("-");
    const toCol = parseInt(cStr);
    const toRow = parseInt(rStr);
    if (!isNaN(idx) && !isNaN(toCol) && !isNaN(toRow)) {
      onMoveItem(idx, toCol, toRow);
    }
  };

  return (
    <DndContext
      collisionDetection={pointerWithin}
      onDragStart={({ active }) => setActiveDragId(String(active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveDragId(null)}
    >
      <div ref={containerRef} className={className} style={{ ...(style ?? {}), position: "relative" }}>
        {/* Drop-target overlay — absolutely positioned, never enters cp__grid flow */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, ${grid?.rowHeight ?? "44px"})`,
            gap: grid?.gap ?? "8px",
            zIndex: 0,
            pointerEvents: "none",
          }}
        >
          {Array.from({ length: rows * cols }, (_, n) => {
            const c = (n % cols) + 1;
            const r = Math.floor(n / cols) + 1;
            return <DroppableCell key={`gc-${c}-${r}`} id={`gc-${c}-${r}`} col={c} row={r} />;
          })}
        </div>
        {/* Items as normal cp__grid children — CSS variables handle placement */}
        {items.map(({ item, col }, idx) => (
          <DraggableGridItem
            key={`item-${idx}`}
            id={`gi-${idx}`}
            item={item}
            idx={idx}
            col={col}
            grid={grid}
            containerRef={containerRef}
            isDraggingThis={activeDragId === `gi-${idx}`}
            onItemChange={(changes) => onUpdateItem(idx, changes)}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          <div style={{ opacity: 0.75, pointerEvents: "none", cursor: "grabbing" }}>
            {renderItem(activeItem.item, activeIdx, activeItem.col)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// ── item renderer ─────────────────────────────────────────────────────────────

function renderItem(
  item: ContentItem,
  idx: number,
  col: "left" | "right",
  editProps?: React.ComponentProps<"div">,
  onItemChange?: (changes: Partial<ContentItem>) => void,
  editOverlay?: React.ReactNode,
) {
  const baseStyle = itemStyle(item);
  const mergedStyle: React.CSSProperties = editProps?.style
    ? { ...baseStyle, ...(editProps.style as React.CSSProperties) }
    : baseStyle;
  const { style: _s, ...restEdit } = editProps ?? {};

  if (item.kind === "image") {
    return (
      <div
        key={`img-${idx}`}
        className="cp__item cp__item--image"
        style={mergedStyle}
        data-el={`${col}-${idx}-image`}
        {...restEdit}
      >
        {editOverlay}
        {item.src ? (
          <MediaImage
            src={item.src}
            alt={item.alt ?? ""}
            className="cp__image"
            sizes="(max-width: 767px) 100vw, 530px"
          />
        ) : (
          <div className="cp__image cp__image--placeholder" />
        )}
      </div>
    );
  }

  const headingClass = ["cp__heading", item.headingTypo].filter(Boolean).join(" ");
  const bodyClass = ["cp__prose", item.bodyTypo].filter(Boolean).join(" ");
  const headingStroke = strokeStyle(item.headingStrokeW);
  const bodyStroke = strokeStyle(item.bodyStrokeW);

  return (
    <div
      key={`txt-${idx}`}
      className="cp__item cp__item--text"
      style={mergedStyle}
      {...restEdit}
    >
      {editOverlay}
      {(item.heading || onItemChange) ? (
        <Kicker
          className={headingClass}
          data-el={`${col}-${idx}-heading`}
          style={headingStroke}
        >
          {onItemChange ? (
            <TipTapInline
              value={item.heading ?? ""}
              onChange={(html) => onItemChange({ heading: html })}
              multiline={false}
            />
          ) : item.heading}
        </Kicker>
      ) : null}
      {(item.body || onItemChange) ? (
        <div className={bodyClass} data-el={`${col}-${idx}-body`} style={bodyStroke}>
          {onItemChange ? (
            <TipTapInline
              value={item.body ?? ""}
              onChange={(html) => onItemChange({ body: html })}
            />
          ) : renderRichText(item.body ?? "")}
        </div>
      ) : null}
    </div>
  );
}

type HeroAlign = TextAlign;

function alignStyle(align?: TextAlign): React.CSSProperties | undefined {
  return align ? { textAlign: align } : undefined;
}

function strokeStyle(value?: string): React.CSSProperties | undefined {
  return value ? ({ "--text-stroke-w": value } as React.CSSProperties) : undefined;
}

function rowStyle(align?: TextAlign, gap?: string): React.CSSProperties | undefined {
  const s: Record<string, string> = {};
  if (align) s.textAlign = align;
  if (gap) s.marginTop = gap;
  return Object.keys(s).length ? (s as React.CSSProperties) : undefined;
}

function elementStyle(strokeW?: string, maxWidth?: string): React.CSSProperties | undefined {
  const s: Record<string, string> = {};
  if (strokeW) s["--text-stroke-w"] = strokeW;
  if (maxWidth) {
    s.maxWidth = maxWidth;
    s.display = "inline-block";
  }
  return Object.keys(s).length ? (s as React.CSSProperties) : undefined;
}

function gridStyle(grid?: ContentGridConfig): React.CSSProperties {
  const columns = Number.isFinite(Number(grid?.columns)) ? Number(grid?.columns) : 12;
  const rows = Number.isFinite(Number(grid?.rows)) ? Number(grid?.rows) : undefined;
  return {
    "--cp-grid-cols": String(columns),
    ...(rows ? { "--cp-grid-rows": String(rows) } : {}),
    "--cp-grid-row-h": grid?.rowHeight || "44px",
    "--cp-grid-gap": grid?.gap || "8px",
  } as React.CSSProperties;
}

export function ContentPageV1({
  data,
  editMode,
  onChange,
}: {
  data: any;
  editMode?: boolean;
  onChange?: (next: any) => void;
}) {

  const kicker = data?.kicker;
  const title =
    typeof data?.title === "string" ? data.title.replace(/\s*\n\s*/g, " ") : data?.title;
  const subtitle = data?.subtitle;
  const cta = data?.cta as { label?: string; href?: string } | undefined;
  const left = normalize(data?.left);
  const right = normalize(data?.right);
  const contentMaxWidth = data?.maxWidth as string | undefined;
  const boxed = !!data?.boxed;

  const heroAlign = data?.heroAlign as HeroAlign | undefined;
  const kickerAlign = (data?.kickerAlign as TextAlign | undefined) ?? heroAlign;
  const titleAlign = (data?.titleAlign as TextAlign | undefined) ?? heroAlign;
  const subtitleAlign = (data?.subtitleAlign as TextAlign | undefined) ?? heroAlign;
  const ctaAlign = data?.ctaAlign as TextAlign | undefined;
  const kickerTypo = (data?.kickerTypo as string | undefined) ?? "typo-teachers-header";
  const subtitleTypo = (data?.subtitleTypo as string | undefined) ?? "typo-subtitle";
  const kickerStrokeW = data?.kickerStrokeW as string | undefined;
  const titleStrokeW = data?.titleStrokeW as string | undefined;
  const subtitleStrokeW = data?.subtitleStrokeW as string | undefined;
  const kickerGap = data?.kickerGap as string | undefined;
  const kickerMaxW = data?.kickerMaxW as string | undefined;
  const titleGap = data?.titleGap as string | undefined;
  const titleMaxW = data?.titleMaxW as string | undefined;
  const subtitleGap = data?.subtitleGap as string | undefined;
  const subtitleMaxW = data?.subtitleMaxW as string | undefined;
  const ctaGap = data?.ctaGap as string | undefined;
  const ctaMaxW = data?.ctaMaxW as string | undefined;

  const columnsMode: "one" | "two" = data?.columns === "one" ? "one" : "two";
  const scrollStory = !!data?.scrollStory;
  const grid = data?.grid as ContentGridConfig | undefined;
  const gridEnabled = grid?.enabled === true;
  const stickyTop = (data?.stickyTop as string | undefined) ?? "0px";
  const entryGap = data?.entryGap as string | undefined;
  const showProgress = !!data?.showProgress;

  // Entries for scroll-story mode: each entry is an independent sticky pair
  const entries: { left: ContentItem[]; right: ContentItem[] }[] = Array.isArray(data?.entries)
    ? data.entries.map((e: any) => ({
        left: normalize(e?.left),
        right: normalize(e?.right),
      }))
    : [];

  const columnsStyle: React.CSSProperties = {
    ...(contentMaxWidth ? { "--cp-content-max-w": contentMaxWidth } : {}),
  } as React.CSSProperties;

  const columnsClass = [
    "cp__columns",
    columnsMode === "one" ? "cp__columns--single" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // ── grid helpers (must be before entriesContent / gridContent) ──────────

  const gridItems = columnsMode === "one"
    ? left.map((item) => ({ item, col: "left" as const }))
    : [
        ...left.map((item) => ({ item, col: "left" as const })),
        ...right.map((item) => ({ item, col: "right" as const })),
      ];


  const moveFlatItem = useCallback(
    (idx: number, toCol: number, toRow: number) => {
      if (!onChange) return;
      const updated = gridItems.map((gi, i) =>
        i === idx
          ? { ...gi, item: { ...gi.item, grid: { ...(gi.item.grid ?? {}), col: toCol, row: toRow } } }
          : gi,
      );
      onChange({
        ...data,
        left: updated.filter((gi) => gi.col === "left").map((gi) => gi.item),
        right: updated.filter((gi) => gi.col === "right").map((gi) => gi.item),
      });
    },
    [onChange, data, gridItems],
  );

  const moveEntryItem = useCallback(
    (entryIdx: number, itemIdx: number, toCol: number, toRow: number) => {
      if (!onChange) return;
      const entry = entries[entryIdx];
      if (!entry) return;
      const all = [
        ...entry.left.map((item) => ({ item, col: "left" as const })),
        ...entry.right.map((item) => ({ item, col: "right" as const })),
      ];
      const updated = all.map((gi, i) =>
        i === itemIdx
          ? { ...gi, item: { ...gi.item, grid: { ...(gi.item.grid ?? {}), col: toCol, row: toRow } } }
          : gi,
      );
      const newEntries = (data.entries as any[]).map((e: any, i: number) =>
        i === entryIdx
          ? {
              ...e,
              left: updated.filter((gi) => gi.col === "left").map((gi) => gi.item),
              right: updated.filter((gi) => gi.col === "right").map((gi) => gi.item),
            }
          : e,
      );
      onChange({ ...data, entries: newEntries });
    },
    [onChange, data, entries],
  );


  // Update content of a flat-grid item (text/heading)
  const updateFlatItem = useCallback(
    (idx: number, changes: Partial<ContentItem>) => {
      if (!onChange) return;
      const updated = gridItems.map((gi, i) =>
        i === idx ? { ...gi, item: { ...gi.item, ...changes } } : gi,
      );
      onChange({
        ...data,
        left: updated.filter((gi) => gi.col === "left").map((gi) => gi.item),
        right: updated.filter((gi) => gi.col === "right").map((gi) => gi.item),
      });
    },
    [onChange, data, gridItems],
  );

  // Update content of an item inside a scroll-story entry
  const updateEntryItem = useCallback(
    (entryIdx: number, itemIdx: number, changes: Partial<ContentItem>) => {
      if (!onChange) return;
      const entry = entries[entryIdx];
      if (!entry) return;
      const all = [
        ...entry.left.map((item) => ({ item, col: "left" as const })),
        ...entry.right.map((item) => ({ item, col: "right" as const })),
      ];
      const updated = all.map((gi, i) =>
        i === itemIdx ? { ...gi, item: { ...gi.item, ...changes } } : gi,
      );
      const newEntries = (data.entries as any[]).map((e: any, i: number) =>
        i === entryIdx
          ? {
              ...e,
              left: updated.filter((gi) => gi.col === "left").map((gi) => gi.item),
              right: updated.filter((gi) => gi.col === "right").map((gi) => gi.item),
            }
          : e,
      );
      onChange({ ...data, entries: newEntries });
    },
    [onChange, data, entries],
  );

  // ── scroll-story entries layout ──────────────────────────────────────────

  const entriesContent =
    scrollStory && entries.length > 0 ? (
      <div
        className="cp__entries"
        style={{ "--ss-top": stickyTop, ...(entryGap ? { "--cp-entry-gap": entryGap } : {}) } as React.CSSProperties}
      >
        {entries.map((entry, eIdx) => {
          const entryItems = [
            ...entry.left.map((item) => ({ item, col: "left" as const })),
            ...entry.right.map((item) => ({ item, col: "right" as const })),
          ];
          if (gridEnabled) {
            return (
              <div key={eIdx} className="cp__entry">
                {editMode ? (
                  <DndGrid
                    items={entryItems}
                    grid={grid}
                    className="cp__grid"
                    style={gridStyle(grid)}
                    onMoveItem={(itemIdx, toCol, toRow) => moveEntryItem(eIdx, itemIdx, toCol, toRow)}
                    onUpdateItem={(itemIdx, changes) => updateEntryItem(eIdx, itemIdx, changes)}
                  />
                ) : (
                  <div className="cp__grid" style={gridStyle(grid)}>
                    {entryItems.map(({ item, col }, i) => renderItem(item, i, col))}
                  </div>
                )}
              </div>
            );
          }
          return (
            <div key={eIdx} className="cp__entry">
              <div className="cp__col cp__col--left">
                {entry.left.map((item, i) =>
                  renderItem(
                    item, i, "left", undefined,
                    editMode ? (changes) => updateEntryItem(eIdx, i, changes) : undefined,
                  )
                )}
              </div>
              <div className="cp__col cp__col--right">
                {entry.right.map((item, i) =>
                  renderItem(
                    item, i, "right", undefined,
                    editMode ? (changes) => updateEntryItem(eIdx, i, changes) : undefined,
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    ) : null;

  // ── flat grid (non-scroll-story) ─────────────────────────────────────────

  const gridContent =
    gridEnabled && !scrollStory && gridItems.length > 0 ? (
      editMode ? (
        <DndGrid
          items={gridItems}
          grid={grid}
          className="cp__grid"
          style={{ ...columnsStyle, ...gridStyle(grid) }}
          onMoveItem={moveFlatItem}
          onUpdateItem={updateFlatItem}
        />
      ) : (
        <div className="cp__grid" style={{ ...columnsStyle, ...gridStyle(grid) }}>
          {gridItems.map(({ item, col }, idx) => renderItem(item, idx, col))}
        </div>
      )
    ) : null;

  // Normal flat columns layout
  const columns =
    gridContent ?? (columnsMode === "one" ? (
      left.length > 0 ? (
        <div className={columnsClass} style={columnsStyle}>
          <div className="cp__col cp__col--left">
            {left.map((item, idx) => renderItem(item, idx, "left"))}
          </div>
        </div>
      ) : null
    ) : left.length > 0 || right.length > 0 ? (
      <div className={columnsClass} style={columnsStyle}>
        <div className="cp__col cp__col--left">
          {left.map((item, idx) => renderItem(item, idx, "left"))}
        </div>
        <div className="cp__col cp__col--right">
          {right.map((item, idx) => renderItem(item, idx, "right"))}
        </div>
      </div>
    ) : null);

  const updateHero = editMode && onChange
    ? (field: string, value: unknown) => onChange({ ...data, [field]: value })
    : null;

  const bodyContent = entriesContent ?? (boxed ? (
    <div className="cp__box">
      <div className="cp__box-clip" aria-hidden="true">
        <ClipIcon />
      </div>
      {columns}
    </div>
  ) : columns);

  const heroClass = ["cp__hero", heroAlign ? `cp__hero--align-${heroAlign}` : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <section className="content-page">
      <Container>
        {kicker || title || subtitle || cta?.label ? (
          <div className={heroClass}>
            <div className="cp__hero-text">
              {(kicker || updateHero) ? (
                <div className="cp__hero-row" style={rowStyle(kickerAlign, kickerGap)}>
                  <div
                    data-el="kicker"
                    className={kickerTypo}
                    style={elementStyle(kickerStrokeW, kickerMaxW)}
                  >
                    {updateHero ? (
                      <TipTapInline
                        value={kicker ?? ""}
                        onChange={(html) => updateHero("kicker", html)}
                        multiline={false}
                      />
                    ) : kicker}
                  </div>
                </div>
              ) : null}
              {title ? (
                <div className="cp__hero-row" style={rowStyle(titleAlign, titleGap)}>
                  <OutlineStampText
                    as="h1"
                    className="cp__title"
                    stamp={STAMP_TITLE}
                    data-el="title"
                    style={elementStyle(titleStrokeW, titleMaxW)}
                  >
                    {title}
                  </OutlineStampText>
                </div>
              ) : null}
              {(subtitle || updateHero) ? (
                <div className="cp__hero-row" style={rowStyle(subtitleAlign, subtitleGap)}>
                  <p
                    className={subtitleTypo}
                    data-el="subtitle"
                    style={elementStyle(subtitleStrokeW, subtitleMaxW)}
                  >
                    {updateHero ? (
                      <TipTapInline
                        value={subtitle ?? ""}
                        onChange={(html) => updateHero("subtitle", html)}
                        multiline={false}
                      />
                    ) : subtitle}
                  </p>
                </div>
              ) : null}
            </div>
            {(cta?.label || updateHero) ? (
              <div className="cp__hero-cta" style={rowStyle(ctaAlign, ctaGap)}>
                <a
                  href={cta?.href ?? "#"}
                  className="cp__cta-btn"
                  data-el="cta"
                  style={ctaMaxW ? { maxWidth: ctaMaxW } : undefined}
                >
                  {updateHero ? (
                    <TipTapInline
                      value={cta?.label ?? ""}
                      onChange={(html) => updateHero("cta", { ...cta, label: html })}
                      multiline={false}
                    />
                  ) : cta?.label}
                </a>
              </div>
            ) : null}
          </div>
        ) : null}

        {bodyContent}
      </Container>
      {scrollStory && showProgress && <ScrollProgressDot />}
    </section>
  );
}
