"use client";

import type React from "react";
import { useState, useRef, useCallback } from "react";
import { Container, Kicker, OutlineStampText, STAMP_TITLE } from "@/components/landing/ui";
import { MediaImage } from "@/components/media-image";
import ClipIcon from "@/assets/icons/clip.svg";
import { ScrollProgressDot } from "./scroll-progress-dot";

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

function renderItem(
  item: ContentItem,
  idx: number,
  col: "left" | "right",
  editProps?: React.HTMLAttributes<HTMLDivElement>,
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
      {item.heading ? (
        <Kicker
          className={headingClass}
          data-el={`${col}-${idx}-heading`}
          style={headingStroke}
        >
          {item.heading}
        </Kicker>
      ) : null}
      {item.body ? (
        <div className={bodyClass} data-el={`${col}-${idx}-body`} style={bodyStroke}>
          {item.body.split("\n\n").map((p, i) => (
            <p key={i}>{p}</p>
          ))}
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
  const gridRef = useRef<HTMLDivElement>(null);
  const entryGridRefs = useRef<(HTMLDivElement | null)[]>([]);
  // dragState: which item is being dragged; entry===null → flat grid, entry===N → scroll-story entry N
  const [dragState, setDragState] = useState<{ entry: number | null; idx: number } | null>(null);
  const [dropCell, setDropCell] = useState<{ col: number; row: number } | null>(null);

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

  // Scroll-story entries layout (each entry has its own sticky context)
  const entriesContent =
    scrollStory && entries.length > 0 ? (
      <div
        className="cp__entries"
        style={{ "--ss-top": stickyTop, ...(entryGap ? { "--cp-entry-gap": entryGap } : {}) } as React.CSSProperties}
      >
        {entries.map((entry, eIdx) => {
          if (gridEnabled) {
            const entryItems = [
              ...entry.left.map((item) => ({ item, col: "left" as const })),
              ...entry.right.map((item) => ({ item, col: "right" as const })),
            ];
            const isActiveEntry = dragState?.entry === eIdx;
            return (
              <div key={eIdx} className="cp__entry">
                <div
                  ref={(el) => { entryGridRefs.current[eIdx] = el; }}
                  className="cp__grid"
                  style={{
                    ...gridStyle(grid),
                    ...(editMode ? { position: "relative" } : {}),
                  }}
                  onDragOver={
                    editMode
                      ? (e) => {
                          e.preventDefault();
                          setDropCell(getCellFromEvent(e, entryGridRefs.current[eIdx]));
                        }
                      : undefined
                  }
                  onDragLeave={editMode ? () => setDropCell(null) : undefined}
                  onDrop={
                    editMode
                      ? (e) => {
                          e.preventDefault();
                          const cell = getCellFromEvent(e, entryGridRefs.current[eIdx]);
                          if (cell !== null && dragState !== null && dragState.entry === eIdx) {
                            moveEntryItem(eIdx, dragState.idx, cell.col, cell.row);
                          }
                          setDragState(null);
                          setDropCell(null);
                        }
                      : undefined
                  }
                >
                  {editMode && isActiveEntry && makeGridOverlay(dropCell)}
                  {entryItems.map(({ item, col }, i) =>
                    renderItem(item, i, col, makeDragProps(eIdx, i)),
                  )}
                </div>
              </div>
            );
          }
          return (
            <div key={eIdx} className="cp__entry">
              <div className="cp__col cp__col--left">
                {entry.left.map((item, i) => renderItem(item, i, "left"))}
              </div>
              <div className="cp__col cp__col--right">
                {entry.right.map((item, i) => renderItem(item, i, "right"))}
              </div>
            </div>
          );
        })}
      </div>
    ) : null;

  const gridItems = columnsMode === "one"
    ? left.map((item) => ({ item, col: "left" as const }))
    : [
        ...left.map((item) => ({ item, col: "left" as const })),
        ...right.map((item) => ({ item, col: "right" as const })),
      ];

  const getCellFromEvent = useCallback(
    (e: React.DragEvent, el: HTMLElement | null) => {
      if (!el || !grid) return null;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cols = Number(grid.columns) || 12;
      const rows = Number(grid.rows) || 6;
      const gapPx = parseFloat(grid.gap || "8") || 8;
      const rowHPx = parseFloat(grid.rowHeight || "44") || 44;
      const cellW = (rect.width - gapPx * (cols - 1)) / cols;
      const col = Math.max(1, Math.min(cols, Math.floor(x / (cellW + gapPx)) + 1));
      const row = Math.max(1, Math.min(rows, Math.floor(y / (rowHPx + gapPx)) + 1));
      return { col, row };
    },
    [grid],
  );

  // Move item in flat grid (non-scroll-story)
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

  // Move item within a specific scroll-story entry
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

  const makeGridOverlay = (activeCell: { col: number; row: number } | null) => {
    if (!grid) return null;
    const cols = Number(grid.columns) || 12;
    const rows = Number(grid.rows) || 6;
    const cells: React.ReactNode[] = [];
    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        const isTarget = activeCell?.col === c && activeCell?.row === r;
        cells.push(
          <div
            key={`${c}-${r}`}
            style={{
              gridColumn: String(c),
              gridRow: String(r),
              border: "1px dashed rgba(99,102,241,0.35)",
              borderRadius: "3px",
              backgroundColor: isTarget ? "rgba(99,102,241,0.18)" : "transparent",
              transition: "background-color 0.08s",
              pointerEvents: "none",
            }}
          />,
        );
      }
    }
    return (
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, var(--cp-grid-row-h, 44px))`,
          gap: "var(--cp-grid-gap, 8px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        {cells}
      </div>
    );
  };

  const makeDragProps = (entry: number | null, idx: number) =>
    editMode
      ? {
          draggable: true as const,
          style: {
            cursor: dragState?.entry === entry && dragState?.idx === idx ? "grabbing" : "grab",
            opacity: dragState?.entry === entry && dragState?.idx === idx ? 0.45 : 1,
            position: "relative" as const,
            zIndex: 1,
          },
          onDragStart: () => setDragState({ entry, idx }),
          onDragEnd: () => {
            setDragState(null);
            setDropCell(null);
          },
        }
      : undefined;

  const gridContent =
    gridEnabled && !scrollStory && gridItems.length > 0 ? (
      <div
        ref={gridRef}
        className="cp__grid"
        style={{
          ...columnsStyle,
          ...gridStyle(grid),
          ...(editMode ? { position: "relative" } : {}),
        }}
        onDragOver={
          editMode
            ? (e) => {
                e.preventDefault();
                setDropCell(getCellFromEvent(e, gridRef.current));
              }
            : undefined
        }
        onDragLeave={editMode ? () => setDropCell(null) : undefined}
        onDrop={
          editMode
            ? (e) => {
                e.preventDefault();
                const cell = getCellFromEvent(e, gridRef.current);
                if (cell !== null && dragState !== null && dragState.entry === null) {
                  moveFlatItem(dragState.idx, cell.col, cell.row);
                }
                setDragState(null);
                setDropCell(null);
              }
            : undefined
        }
      >
        {editMode && makeGridOverlay(dropCell)}
        {gridItems.map(({ item, col }, idx) =>
          renderItem(item, idx, col, makeDragProps(null, idx)),
        )}
      </div>
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
              {kicker ? (
                <div className="cp__hero-row" style={rowStyle(kickerAlign, kickerGap)}>
                  <div
                    data-el="kicker"
                    className={kickerTypo}
                    style={elementStyle(kickerStrokeW, kickerMaxW)}
                  >
                    {kicker}
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
              {subtitle ? (
                <div className="cp__hero-row" style={rowStyle(subtitleAlign, subtitleGap)}>
                  <p
                    className={subtitleTypo}
                    data-el="subtitle"
                    style={elementStyle(subtitleStrokeW, subtitleMaxW)}
                  >
                    {subtitle}
                  </p>
                </div>
              ) : null}
            </div>
            {cta?.label ? (
              <div className="cp__hero-cta" style={rowStyle(ctaAlign, ctaGap)}>
                <a
                  href={cta.href ?? "#"}
                  className="cp__cta-btn"
                  data-el="cta"
                  style={ctaMaxW ? { maxWidth: ctaMaxW } : undefined}
                >
                  {cta.label}
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
