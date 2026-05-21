"use client";

import type React from "react";
import { useState, useCallback, useRef } from "react";
import { DndContext, DragOverlay, useDraggable, useDroppable, pointerWithin, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Container, Kicker, OutlineStampText, STAMP_TITLE } from "@/components/landing/ui";
import { MediaImage } from "@/components/media-image";
import { MediaResizeHandle } from "@/components/blocks/media-resize-handle";
import ClipIcon from "@/assets/icons/clip.svg";
import { ScrollProgressDot } from "./scroll-progress-dot";
import { TipTapInline, renderRichText } from "@/components/rich-text";
import { TYPO_PRESETS } from "@/lib/typo-presets";
import { useLivePreviewEdit } from "@/components/live-preview-provider";

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

type GuidelinesConfig = {
  showCenter?: boolean;
  showGapLines?: boolean;
  showEdgeLines?: boolean;
};

function ContentPageGuidelines({
  config,
  gap,
}: {
  config: GuidelinesConfig;
  gap: string;
}) {
  const line = (props: React.CSSProperties) => (
    <div aria-hidden="true" style={{ position: "absolute", top: 0, bottom: 0, width: 1, pointerEvents: "none", ...props }} />
  );
  return (
    <div
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 50, overflow: "hidden" }}
    >
      {config.showEdgeLines !== false && (
        <>
          {line({ left: 0, background: "rgba(239,68,68,0.55)" })}
          {line({ right: 0, background: "rgba(239,68,68,0.55)" })}
        </>
      )}
      {config.showGapLines !== false && (
        <>
          {line({ left: `calc(50% - ${gap} / 2)`, background: "rgba(16,185,129,0.6)" })}
          {line({ left: `calc(50% + ${gap} / 2)`, background: "rgba(16,185,129,0.6)" })}
        </>
      )}
      {config.showCenter !== false && (
        line({ left: "50%", background: "rgba(59,130,246,0.65)" })
      )}
    </div>
  );
}

type ContentItem = {
  kind: "image" | "text" | "media-pair";
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
  // media-pair
  pairGap?: string;         // column-gap between the two media, e.g. "24px"
  pairLinked?: boolean;     // when true, resizing one media resizes the other to match
  pairPaddingTop?: string;  // padding above the pair, e.g. "40px"
  pairPaddingBottom?: string; // padding below the pair, e.g. "40px"
  leftSrc?: string;
  leftAlt?: string;
  leftWidth?: string;  // becomes left grid-template column, e.g. "300px" or "1fr"
  leftAspect?: string;
  rightSrc?: string;
  rightAlt?: string;
  rightWidth?: string; // becomes right grid-template column
  rightAspect?: string;
  // mobile
  mobileOrder?: number;
  // row layout
  fullWidth?: boolean;
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
    (x: any) => x && typeof x === "object" && (x.kind === "image" || x.kind === "text" || x.kind === "media-pair"),
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

function itemStyle(item: ContentItem, col?: "left" | "right"): React.CSSProperties {
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

  // Grid placement — explicit values take priority; when col is known, smart defaults apply
  if (item.grid?.col) {
    s["--cp-grid-col"] = String(item.grid.col);
  } else if (col !== undefined) {
    s["--cp-grid-col"] = col === "right" ? "7" : "1";
  }
  s["--cp-grid-col-span"] = item.grid?.colSpan
    ? String(item.grid.colSpan)
    : col !== undefined ? "6" : "1";
  if (item.grid?.row) s["--cp-grid-row"] = String(item.grid.row);
  if (item.grid?.rowSpan) s["--cp-grid-row-span"] = String(item.grid.rowSpan);

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
  const rowH = parseFloat(grid?.rowHeight ?? "44");
  const gapPx = parseFloat(grid?.gap ?? "8");
  const containerMinHeight = rows * rowH + (rows - 1) * gapPx;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

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
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={({ active }) => setActiveDragId(String(active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveDragId(null)}
    >
      <div ref={containerRef} className={className} style={{ ...(style ?? {}), position: "relative", minHeight: containerMinHeight }}>
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
  const baseStyle = itemStyle(item, col);
  const mergedStyle: React.CSSProperties = editProps?.style
    ? { ...baseStyle, ...(editProps.style as React.CSSProperties) }
    : baseStyle;
  const { style: _s, ...restEdit } = editProps ?? {};

  if (item.kind === "image") {
    return (
      <ContentImageItem
        key={`img-${idx}`}
        item={item}
        idx={idx}
        col={col}
        style={mergedStyle}
        editProps={restEdit}
        editOverlay={editOverlay}
        onItemChange={onItemChange}
      />
    );
  }

  if (item.kind === "media-pair") {
    return (
      <MediaPairItem
        key={`mp-${idx}`}
        item={item}
        idx={idx}
        col={col}
        style={mergedStyle}
        editProps={restEdit}
        editOverlay={editOverlay}
        onItemChange={onItemChange}
      />
    );
  }

  // In edit mode the typo class is applied as a TipTap mark inside the content —
  // NOT on the outer wrapper — so the wrapper's styles never bleed into editor UI.
  const headingClass = onItemChange
    ? "cp__heading"
    : ["cp__heading", item.headingTypo].filter(Boolean).join(" ");
  const bodyClass = onItemChange
    ? "cp__prose"
    : ["cp__prose", item.bodyTypo].filter(Boolean).join(" ");
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
              typoClass={item.headingTypo ?? ""}
              typoOptions={TYPO_PRESETS}
            />
          ) : renderRichText(item.heading ?? "")}
        </Kicker>
      ) : null}
      {(item.body || onItemChange) ? (
        <div className={bodyClass} data-el={`${col}-${idx}-body`} style={bodyStroke}>
          {onItemChange ? (
            <TipTapInline
              value={item.body ?? ""}
              onChange={(html) => onItemChange({ body: html })}
              typoClass={item.bodyTypo ?? ""}
              typoOptions={TYPO_PRESETS}
            />
          ) : renderRichText(item.body ?? "")}
        </div>
      ) : null}
    </div>
  );
}

function ContentImageItem({
  item,
  idx,
  col,
  style,
  editProps,
  editOverlay,
  onItemChange,
}: {
  item: ContentItem;
  idx: number;
  col: "left" | "right";
  style: React.CSSProperties;
  editProps: React.ComponentProps<"div">;
  editOverlay?: React.ReactNode;
  onItemChange?: (changes: Partial<ContentItem>) => void;
}) {
  const imageRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="cp__item cp__item--image"
      style={style}
      data-el={`${col}-${idx}-image`}
      {...editProps}
    >
      {editOverlay}
      <div
        ref={imageRef}
        className={[
          "cp__image",
          item.src ? "" : "cp__image--placeholder",
          onItemChange ? "media-resize-target" : "",
        ].filter(Boolean).join(" ")}
        style={{ width: item.imageWidth || "" }}
      >
        {item.src ? (
          <MediaImage
            src={item.src}
            alt={item.alt ?? ""}
            className="cp__image-media"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            sizes="(max-width: 767px) 100vw, 530px"
          />
        ) : null}
      </div>
      {onItemChange ? (
        <MediaResizeHandle
          targetRef={imageRef}
          onResize={(width) =>
            onItemChange({
              imageWidth: width,
              layout: {
                ...(item.layout ?? {}),
                lg: { ...(item.layout?.lg ?? {}), width },
              },
            })
          }
        />
      ) : null}
    </div>
  );
}

function MediaPairItem({
  item,
  idx,
  col,
  style,
  editProps,
  editOverlay,
  onItemChange,
}: {
  item: ContentItem;
  idx: number;
  col: "left" | "right";
  style: React.CSSProperties;
  editProps: React.ComponentProps<"div">;
  editOverlay?: React.ReactNode;
  onItemChange?: (changes: Partial<ContentItem>) => void;
}) {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  const pairStyle = {
    "--cp-pair-gap": item.pairGap || "24px",
    "--cp-pair-left": item.leftWidth || "1fr",
    "--cp-pair-right": item.rightWidth || "1fr",
  } as React.CSSProperties;

  const outerStyle: React.CSSProperties = {
    ...style,
    ...(item.pairPaddingTop ? { paddingTop: item.pairPaddingTop } : {}),
    ...(item.pairPaddingBottom ? { paddingBottom: item.pairPaddingBottom } : {}),
  };

  return (
    <div
      className="cp__item cp__item--media-pair"
      style={outerStyle}
      data-el={`${col}-${idx}-media-pair`}
      {...editProps}
    >
      {editOverlay}
      <div className="cp__media-pair" style={pairStyle}>
        {/* Left media — occupies left grid column */}
        <div
          ref={leftRef}
          className={["cp__media-pair__media", !item.leftSrc ? "cp__image--placeholder" : ""].filter(Boolean).join(" ")}
          style={item.leftAspect ? { aspectRatio: item.leftAspect } : undefined}
        >
          {item.leftSrc ? (
            <MediaImage
              src={item.leftSrc}
              alt={item.leftAlt ?? ""}
              className="cp__image-media"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
              sizes="(max-width: 767px) 100vw, 530px"
            />
          ) : null}
          {onItemChange ? (
            <MediaResizeHandle
              targetRef={leftRef}
              onResize={(w) =>
                onItemChange(item.pairLinked ? { leftWidth: w, rightWidth: w } : { leftWidth: w })
              }
            />
          ) : null}
        </div>

        {/* Right media — occupies right grid column */}
        <div
          ref={rightRef}
          className={["cp__media-pair__media", !item.rightSrc ? "cp__image--placeholder" : ""].filter(Boolean).join(" ")}
          style={item.rightAspect ? { aspectRatio: item.rightAspect } : undefined}
        >
          {item.rightSrc ? (
            <MediaImage
              src={item.rightSrc}
              alt={item.rightAlt ?? ""}
              className="cp__image-media"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
              sizes="(max-width: 767px) 100vw, 530px"
            />
          ) : null}
          {onItemChange ? (
            <MediaResizeHandle
              targetRef={rightRef}
              onResize={(w) =>
                onItemChange(item.pairLinked ? { leftWidth: w, rightWidth: w } : { rightWidth: w })
              }
            />
          ) : null}
        </div>
      </div>
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
    s.width = maxWidth;
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

  const scrollStoryColGap = (data?.scrollStoryColGap as string | undefined) ?? "142px";
  const scrollStoryLeftMaxW = data?.scrollStoryLeftMaxW as string | undefined;
  const scrollStoryRightMaxW = data?.scrollStoryRightMaxW as string | undefined;
  const guidelinesConfig = (data?.guidelinesConfig ?? {}) as GuidelinesConfig;

  const { toolboxState, editMode: liveEditMode } = useLivePreviewEdit();
  const showGuides = liveEditMode && toolboxState.guides && columnsMode === "two" && !gridEnabled;

  // Entries for scroll-story mode: each entry is an independent sticky pair
  const entries: { left: ContentItem[]; right: ContentItem[] }[] = Array.isArray(data?.entries)
    ? data.entries.map((e: any) => ({
        left: normalize(e?.left),
        right: normalize(e?.right),
      }))
    : [];

  // When scroll story is on but no entries defined yet, use flat left/right as a single entry
  const usingFlatAsEntries = scrollStory && entries.length === 0 && (left.length > 0 || right.length > 0);
  const effectiveEntries = usingFlatAsEntries ? [{ left, right }] : entries;

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
    scrollStory && effectiveEntries.length > 0 ? (
      <div
        className="cp__entries"
        style={{ "--ss-top": stickyTop, ...(entryGap ? { "--cp-entry-gap": entryGap } : {}) } as React.CSSProperties}
      >
        {effectiveEntries.map((entry, eIdx) => {
          const entryItems = [
            ...entry.left.map((item) => ({ item, col: "left" as const })),
            ...entry.right.map((item) => ({ item, col: "right" as const })),
          ];
          // Callbacks: if using flat data as entries, write to left[]/right[]; otherwise to entries[]
          const onMoveItem = usingFlatAsEntries
            ? (itemIdx: number, toCol: number, toRow: number) => moveFlatItem(itemIdx, toCol, toRow)
            : (itemIdx: number, toCol: number, toRow: number) => moveEntryItem(eIdx, itemIdx, toCol, toRow);
          const onUpdateItem = usingFlatAsEntries
            ? (itemIdx: number, changes: Partial<ContentItem>) => updateFlatItem(itemIdx, changes)
            : (itemIdx: number, changes: Partial<ContentItem>) => updateEntryItem(eIdx, itemIdx, changes);

          if (gridEnabled) {
            return (
              <div key={eIdx} className="cp__entry">
                {editMode ? (
                  <DndGrid
                    items={entryItems}
                    grid={grid}
                    className="cp__grid"
                    style={gridStyle(grid)}
                    onMoveItem={onMoveItem}
                    onUpdateItem={onUpdateItem}
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
                    editMode ? (changes) => onUpdateItem(i, changes) : undefined,
                  )
                )}
              </div>
              <div className="cp__col cp__col--right">
                {entry.right.map((item, i) =>
                  renderItem(
                    item, i, "right", undefined,
                    editMode ? (changes) => onUpdateItem(entry.left.length + i, changes) : undefined,
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

  // Full-width items (two-column mode only) — rendered below both columns
  const leftWithIdx = left.map((item, idx) => ({ item, idx }));
  const rightWithIdx = right.map((item, idx) => ({ item, idx }));
  const leftNormal = leftWithIdx.filter(({ item }) => !item.fullWidth);
  const rightNormal = rightWithIdx.filter(({ item }) => !item.fullWidth);
  const fullWidthEntries = columnsMode === "two" ? [
    ...leftWithIdx.filter(({ item }) => item.fullWidth).map(({ item, idx }) => ({ item, col: "left" as const, flatIdx: idx })),
    ...rightWithIdx.filter(({ item }) => item.fullWidth).map(({ item, idx }) => ({ item, col: "right" as const, flatIdx: left.length + idx })),
  ] : [];

  // Normal flat columns layout
  const columns =
    gridContent ?? (columnsMode === "one" ? (
      left.length > 0 ? (
        <div className={columnsClass} style={columnsStyle}>
          <div className="cp__col cp__col--left">
            {left.map((item, idx) => renderItem(
              item, idx, "left", undefined,
              editMode ? (changes) => updateFlatItem(idx, changes) : undefined,
            ))}
          </div>
        </div>
      ) : null
    ) : leftNormal.length > 0 || rightNormal.length > 0 ? (
      <div className={columnsClass} style={columnsStyle}>
        <div className="cp__col cp__col--left">
          {leftNormal.map(({ item, idx }) => renderItem(
            item, idx, "left", undefined,
            editMode ? (changes) => updateFlatItem(idx, changes) : undefined,
          ))}
        </div>
        <div className="cp__col cp__col--right">
          {rightNormal.map(({ item, idx }) => renderItem(
            item, idx, "right", undefined,
            editMode ? (changes) => updateFlatItem(left.length + idx, changes) : undefined,
          ))}
        </div>
      </div>
    ) : null);

  const fullRowsSection = fullWidthEntries.length > 0 ? (
    <div
      className="cp__full-rows"
      style={contentMaxWidth ? { "--cp-content-max-w": contentMaxWidth } as React.CSSProperties : undefined}
    >
      {fullWidthEntries.map(({ item, col, flatIdx }) => renderItem(
        item, flatIdx, col, undefined,
        editMode ? (changes) => updateFlatItem(flatIdx, changes) : undefined,
      ))}
    </div>
  ) : null;

  const updateHero = editMode && onChange
    ? (field: string, value: unknown) => onChange({ ...data, [field]: value })
    : null;

  const bodyContent = entriesContent ?? (boxed ? (
    <>
      <div className="cp__box">
        <div className="cp__box-clip" aria-hidden="true">
          <ClipIcon />
        </div>
        {columns}
      </div>
      {fullRowsSection}
    </>
  ) : (
    <>
      {columns}
      {fullRowsSection}
    </>
  ));

  const heroClass = ["cp__hero", heroAlign ? `cp__hero--align-${heroAlign}` : ""]
    .filter(Boolean)
    .join(" ");

  const sectionVars = {
    ...(scrollStory && scrollStoryColGap !== "142px" ? { "--cp-entry-col-gap": scrollStoryColGap } : {}),
    ...(scrollStoryLeftMaxW ? { "--cp-col-left-max-w": scrollStoryLeftMaxW } : {}),
    ...(scrollStoryRightMaxW ? { "--cp-col-right-max-w": scrollStoryRightMaxW } : {}),
  } as React.CSSProperties;

  return (
    <section className="content-page" style={Object.keys(sectionVars).length ? sectionVars : undefined}>
      <Container>
        {kicker || title || subtitle || cta?.label ? (
          <div className={heroClass}>
            <div className="cp__hero-text">
              {kicker || updateHero ? (
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
                        typoOptions={TYPO_PRESETS}
                        currentTypoClass={kickerTypo}
                        onTypoChange={(cls) => updateHero("kickerTypo", cls || undefined)}
                      />
                    ) : renderRichText(kicker ?? "")}
                  </div>
                </div>
              ) : null}
              {title || updateHero ? (
                <div className="cp__hero-row" style={rowStyle(titleAlign, titleGap)}>
                  {updateHero ? (
                    <h1
                      className="ds-outline-stamp cp__title"
                      data-el="title"
                      style={elementStyle(titleStrokeW, titleMaxW)}
                    >
                      <span className="ds-outline-stamp__shadow" aria-hidden="true">
                        {renderRichText(title ?? "")}
                      </span>
                      <span className="ds-outline-stamp__front">
                        <TipTapInline
                          value={title ?? ""}
                          onChange={(html) => updateHero("title", html)}
                        />
                      </span>
                    </h1>
                  ) : (
                    <OutlineStampText
                      as="h1"
                      className="cp__title"
                      stamp={STAMP_TITLE}
                      data-el="title"
                      style={elementStyle(titleStrokeW, titleMaxW)}
                    >
                      {renderRichText(title ?? "")}
                    </OutlineStampText>
                  )}
                </div>
              ) : null}
              {subtitle || updateHero ? (
                <div className="cp__hero-row" style={rowStyle(subtitleAlign, subtitleGap)}>
                  <div
                    className={subtitleTypo}
                    data-el="subtitle"
                    style={elementStyle(subtitleStrokeW, subtitleMaxW)}
                  >
                    {updateHero ? (
                      <TipTapInline
                        value={subtitle ?? ""}
                        onChange={(html) => updateHero("subtitle", html)}
                        typoOptions={TYPO_PRESETS}
                        currentTypoClass={subtitleTypo}
                        onTypoChange={(cls) => updateHero("subtitleTypo", cls || undefined)}
                      />
                    ) : renderRichText(subtitle ?? "")}
                  </div>
                </div>
              ) : null}
            </div>
            {cta?.label ? (
              <div className="cp__hero-cta" style={rowStyle(ctaAlign, ctaGap)}>
                <a
                  href={cta?.href ?? "#"}
                  className="cp__cta-btn"
                  data-el="cta"
                  style={ctaMaxW ? { maxWidth: ctaMaxW } : undefined}
                  onClick={updateHero ? (e) => e.preventDefault() : undefined}
                >
                  {updateHero ? (
                    <TipTapInline
                      value={cta.label}
                      onChange={(html) => updateHero("cta", { ...cta, label: html })}
                      multiline={false}
                    />
                  ) : cta.label}
                </a>
              </div>
            ) : null}
          </div>
        ) : null}

        {bodyContent}
        {showGuides && (
          <ContentPageGuidelines
            config={guidelinesConfig}
            gap={scrollStory ? scrollStoryColGap : "80px"}
          />
        )}
      </Container>
      {scrollStory && showProgress && <ScrollProgressDot />}
    </section>
  );
}
