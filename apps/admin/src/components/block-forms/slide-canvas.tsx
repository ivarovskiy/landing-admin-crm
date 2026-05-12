"use client";

/**
 * SlideCanvas — visual drag-to-position editor for hero slide text elements.
 *
 * Elements are rendered as absolute-positioned handles at (mt, ml) from the
 * top-left corner of a fixed reference canvas (REF_W × REF_H).
 * Dragging a handle updates mt/ml directly via DOM (zero React state during
 * drag), then commits the new values in a single onChange call on pointerup.
 *
 * The reference canvas is scaled to fit the admin panel via transform: scale()
 * applied directly to the inner DOM node — no re-renders on resize.
 */

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, Lock, Plus } from "lucide-react";
import type {
  Slide,
  ElementStyle,
  HeroTuningScope,
  SlideExtra,
} from "./hero-slider-presets";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Design-space dimensions of the canvas (matches desktop slide height) */
const REF_W = 460;
const REF_H = 574;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parsePx(v?: string): number {
  if (!v) return 0;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function getStyle(slide: Slide, key: string): ElementStyle | undefined {
  if (key === "title") return slide.titleStyle;
  if (key === "subtitle") return slide.subtitleStyle;
  if (key === "kicker") return slide.kickerStyle;
  if (key === "body") return slide.bodyStyle;
  if (key === "quote") return slide.quoteStyle;
  return slide.extras?.find((e) => e.id === key)?.style;
}

function getText(slide: Slide, key: string): string {
  if (key === "title") return slide.title ?? "";
  if (key === "subtitle") return slide.subtitle ?? "";
  if (key === "kicker") return slide.kicker ?? "";
  if (key === "body") return slide.body ?? "";
  if (key === "quote") return slide.quote ?? "";
  return slide.extras?.find((e) => e.id === key)?.text ?? "";
}

function getLabel(key: string): string {
  if (key === "title") return "Title";
  if (key === "subtitle") return "Tagline";
  if (key === "kicker") return "Kicker";
  if (key === "body") return "Body";
  if (key === "quote") return "Quote";
  return "Extra";
}

function orderedKeys(slide: Slide): string[] {
  const extras = Array.isArray(slide.extras) ? slide.extras : [];
  const fixed: string[] = [];
  if (slide.kicker !== undefined) fixed.push("kicker");
  fixed.push("title");
  if (slide.subtitle !== undefined) fixed.push("subtitle");
  if (slide.body !== undefined) fixed.push("body");
  if (slide.quote !== undefined) fixed.push("quote");
  const extraKeys = extras.map((e, i) => e.id ?? String(i));
  const all = [...fixed, ...extraKeys];
  const stored = slide.elementOrder ?? [];
  const known = new Set(all);
  const used = new Set<string>();
  return [
    ...stored.filter((k) => known.has(k) && !used.has(k) && (used.add(k), true)),
    ...all.filter((k) => !used.has(k)),
  ];
}

function commitStyle(
  slide: Slide,
  key: string,
  style: ElementStyle,
  onChange: (s: Slide) => void,
) {
  if (key === "title") { onChange({ ...slide, titleStyle: style }); return; }
  if (key === "subtitle") { onChange({ ...slide, subtitleStyle: style }); return; }
  if (key === "kicker") { onChange({ ...slide, kickerStyle: style }); return; }
  if (key === "body") { onChange({ ...slide, bodyStyle: style }); return; }
  if (key === "quote") { onChange({ ...slide, quoteStyle: style }); return; }
  const extras = Array.isArray(slide.extras) ? slide.extras : [];
  onChange({ ...slide, extras: extras.map((e) => e.id === key ? { ...e, style } : e) });
}

// ─── CanvasItem ───────────────────────────────────────────────────────────────

function CanvasItem({
  itemKey,
  slide,
  scaleRef,
  canMoveUp,
  canMoveDown,
  onMove,
  onChange,
  onSelect,
  isSelected,
  baselineOffset,
}: {
  itemKey: string;
  slide: Slide;
  scaleRef: React.RefObject<number>;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (key: string, dir: "up" | "down") => void;
  onChange: (s: Slide) => void;
  onSelect: (key: string) => void;
  isSelected: boolean;
  baselineOffset?: number;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const style = getStyle(slide, itemKey);
  const text = getText(slide, itemKey);
  const label = getLabel(itemKey);
  const isLocked = !!(style?.locked);
  const snapToBaseline = !isLocked && !!(style?.snapToBaseline && baselineOffset != null && baselineOffset > 0);
  const mt = snapToBaseline ? REF_H - baselineOffset! : parsePx(style?.mt);
  const ml = parsePx(style?.ml);
  const typo = style?.typo ?? "";

  const dragRef = useRef<{
    startY: number;
    startX: number;
    startMt: number;
    startMl: number;
    moved: boolean;
    scale: number;
  } | null>(null);

  const onPD = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (isLocked) { e.stopPropagation(); return; }
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startY: e.clientY,
      startX: e.clientX,
      startMt: mt,
      startMl: ml,
      moved: false,
      scale: scaleRef.current ?? 1,
    };
  }, [isLocked, mt, ml, scaleRef]);

  const onPM = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const rawDy = (e.clientY - d.startY) / d.scale;
    const dx = (e.clientX - d.startX) / d.scale;
    const dy = snapToBaseline ? 0 : rawDy;
    if (Math.abs(rawDy) > 4 || Math.abs(dx) > 4) d.moved = true;
    if (!d.moved) return;
    // Direct DOM — no React state during drag
    const el = elRef.current;
    if (!el) return;
    if (!snapToBaseline) el.style.top = `${Math.round(d.startMt + dy)}px`;
    el.style.left = `${Math.round(d.startMl + dx)}px`;
  }, [snapToBaseline]);

  const onPU = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    if (!d.moved) {
      // Click without drag — select this element
      onSelect(itemKey);
      return;
    }
    const rawDy = (e.clientY - d.startY) / d.scale;
    const dx = (e.clientX - d.startX) / d.scale;
    const newMt = snapToBaseline ? mt : Math.round(d.startMt + rawDy);
    const newMl = Math.round(d.startMl + dx);
    commitStyle(slide, itemKey, {
      ...(style ?? {}),
      mt: newMt ? `${newMt}px` : undefined,
      ml: newMl ? `${newMl}px` : undefined,
    }, onChange);
  }, [slide, itemKey, style, onChange, snapToBaseline, mt, onSelect]);

  const onPC = useCallback(() => {
    if (!dragRef.current) return;
    dragRef.current = null;
    // Revert visual position to committed values
    const el = elRef.current;
    if (el) { el.style.top = `${mt}px`; el.style.left = `${ml}px`; }
  }, [mt, ml]);

  // Approximate visual weight from typo class
  const isLarge = !typo || typo === "typo-content-header" || typo === "typo-homepage-header";
  const isMid = typo === "typo-subtitle";
  const fontSize = isLarge ? 24 : isMid ? 16 : 11;
  const textPreview = text ? text.replace(/\n/g, " ").slice(0, 36) : "·";

  const borderClass = isLocked
    ? "border-amber-400/50 opacity-70"
    : isSelected
      ? "border-blue-400 shadow-[0_0_0_1px_rgba(96,165,250,0.5)]"
      : "border-primary/30 hover:border-primary/70";

  return (
    <div
      ref={elRef}
      className={[
        "sc-item absolute flex items-start gap-1 select-none rounded border bg-background/80 px-1.5 py-1 transition-colors max-w-[90%]",
        isLocked ? "cursor-default" : "cursor-grab active:cursor-grabbing",
        borderClass,
      ].join(" ")}
      style={{ top: mt, left: ml, fontSize, touchAction: "none" }}
      onPointerDown={onPD}
      onPointerMove={isLocked ? undefined : onPM}
      onPointerUp={isLocked ? undefined : onPU}
      onPointerCancel={isLocked ? undefined : onPC}
    >
      <div
        className="flex shrink-0 flex-col gap-0.5"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="rounded border border-border/70 bg-background/80 p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-25"
          disabled={!canMoveUp || isLocked}
          title="Move forward"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMove(itemKey, "up");
          }}
        >
          <ArrowUp className="h-2.5 w-2.5" />
        </button>
        <button
          type="button"
          className="rounded border border-border/70 bg-background/80 p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-25"
          disabled={!canMoveDown || isLocked}
          title="Move backward"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMove(itemKey, "down");
          }}
        >
          <ArrowDown className="h-2.5 w-2.5" />
        </button>
      </div>
      {isLocked ? (
        <Lock className="shrink-0 text-amber-400/80 mt-px" style={{ width: fontSize, height: fontSize }} />
      ) : (
        <GripVertical className="shrink-0 text-muted-foreground/50 mt-px" style={{ width: fontSize, height: fontSize }} />
      )}
      <div className="min-w-0">
        <div className="text-[8px] font-semibold uppercase tracking-widest text-muted-foreground/60 leading-none mb-0.5">
          {label}
          {style?.groupId ? (
            <span className="ml-1 opacity-60">#{style.groupId.slice(0, 4)}</span>
          ) : null}
        </div>
        <div className="font-medium leading-tight truncate" style={{ fontSize }}>
          {textPreview}
        </div>
      </div>
    </div>
  );
}

// ─── SlideCanvas ──────────────────────────────────────────────────────────────

export function SlideCanvas({
  slide,
  enableDrag = true,
  onChange,
  gapOffset,
  baselineOffset,
  italicBaselineOffset,
}: {
  slide: Slide;
  tuningScope: HeroTuningScope; // reserved for future scope-aware editing
  enableDrag?: boolean;
  onChange: (s: Slide) => void;
  gapOffset?: number;
  baselineOffset?: number;
  italicBaselineOffset?: number;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef<number>(0.6);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // Scale inner canvas to fill outer wrapper — direct DOM, no re-render
  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const update = () => {
      const s = outer.offsetWidth / REF_W;
      scaleRef.current = s;
      inner.style.transform = `scale(${s})`;
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(outer);
    return () => obs.disconnect();
  }, []);

  const keys = useMemo(() => orderedKeys(slide), [slide]);

  const moveKey = useCallback((key: string, dir: "up" | "down") => {
    const current = orderedKeys(slide);
    const idx = current.indexOf(key);
    const target = dir === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || target < 0 || target >= current.length) return;
    const nextOrder = [...current];
    [nextOrder[idx], nextOrder[target]] = [nextOrder[target], nextOrder[idx]];
    onChange({ ...slide, elementOrder: nextOrder });
  }, [slide, onChange]);

  // Keyboard nudging — arrow keys move the selected element by 1px (10px with shift)
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!selectedKey || !enableDrag) return;
    const style = getStyle(slide, selectedKey);
    if (style?.locked) return; // Locked elements are immune to keyboard movement

    let dx = 0;
    let dy = 0;
    const delta = e.shiftKey ? 10 : 1;

    if (e.key === "ArrowLeft") { dx = -delta; }
    else if (e.key === "ArrowRight") { dx = delta; }
    else if (e.key === "ArrowUp") { dy = -delta; }
    else if (e.key === "ArrowDown") { dy = delta; }
    else return;

    e.preventDefault();

    const snapToBaseline =
      !!(style?.snapToBaseline && baselineOffset != null && baselineOffset > 0);
    const curMt = snapToBaseline ? REF_H - baselineOffset! : parsePx(style?.mt);
    const curMl = parsePx(style?.ml);
    const newMt = snapToBaseline ? curMt : curMt + dy;
    const newMl = curMl + dx;

    commitStyle(slide, selectedKey, {
      ...(style ?? {}),
      mt: newMt ? `${newMt}px` : undefined,
      ml: newMl ? `${newMl}px` : undefined,
    }, onChange);
  }, [selectedKey, slide, onChange, enableDrag, baselineOffset]);

  // Click on empty canvas → add new extra at the clicked Y position
  const onCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".sc-item")) return;
    const outer = outerRef.current;
    if (!outer) return;
    const scale = scaleRef.current;
    const rect = outer.getBoundingClientRect();
    const y = Math.round((e.clientY - rect.top) / scale);
    const x = Math.round((e.clientX - rect.left) / scale);
    const id = (crypto?.randomUUID?.() ?? `ex-${Date.now()}`);
    const newExtra: SlideExtra = {
      id,
      kind: "text",
      text: "New text",
      style: {
        mt: y > 0 ? `${y}px` : undefined,
        ml: x > 4 ? `${x}px` : undefined,
      },
    };
    onChange({
      ...slide,
      extras: [...(Array.isArray(slide.extras) ? slide.extras : []), newExtra],
      elementOrder: [...orderedKeys(slide), id],
    });
    setSelectedKey(id);
  }, [slide, onChange]);

  const hasText = slide.template !== "full-image";

  return (
    <div className="space-y-1">
      {/* Outer responsive wrapper — height controlled by padding-bottom ratio */}
      <div
        ref={outerRef}
        className="relative w-full overflow-hidden rounded border bg-muted/10"
        style={{ paddingBottom: `${(REF_H / REF_W) * 100}%` }}
        // tabIndex enables keyboard focus so arrow-key nudging works
        tabIndex={enableDrag ? 0 : undefined}
        onKeyDown={enableDrag ? handleKeyDown : undefined}
      >
        {/* Inner canvas at REF_W × REF_H, scaled via transform */}
        <div
          ref={innerRef}
          className={`absolute top-0 left-0 ${enableDrag ? "cursor-crosshair" : "cursor-default"}`}
          style={{ width: REF_W, height: REF_H, transformOrigin: "top left", touchAction: enableDrag ? "none" : undefined }}
          onClick={enableDrag ? onCanvasClick : undefined}
        >
          {/* Background grid (subtle) */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(to right,#888 1px,transparent 1px),linear-gradient(to bottom,#888 1px,transparent 1px)",
              backgroundSize: "46px 46px",
            }}
          />

          {/* Gap guideline — amber dashed line at gapOffset from top */}
          {gapOffset != null && gapOffset > 0 && (
            <div
              className="absolute left-0 right-0 pointer-events-none"
              style={{ top: gapOffset, borderTop: "1.5px dashed rgba(245,158,11,0.75)", zIndex: 3 }}
            >
              <span className="absolute left-1 -top-3 text-[7px] font-medium" style={{ color: "rgba(245,158,11,0.9)" }}>gap {gapOffset}px</span>
            </div>
          )}

          {/* Baseline guideline — purple dashed line at baselineOffset from bottom */}
          {baselineOffset != null && baselineOffset > 0 && (
            <div
              className="absolute left-0 right-0 pointer-events-none"
              style={{ top: REF_H - baselineOffset, borderTop: "1.5px dashed rgba(139,92,246,0.75)", zIndex: 3 }}
            >
              <span className="absolute left-1 -top-3 text-[7px] font-medium" style={{ color: "rgba(139,92,246,0.9)" }}>baseline {baselineOffset}px</span>
            </div>
          )}

          {/* Italic design-element guideline — teal dashed line, lowest allowed italic position */}
          {italicBaselineOffset != null && italicBaselineOffset > 0 && (
            <div
              className="absolute left-0 right-0 pointer-events-none"
              style={{ top: REF_H - italicBaselineOffset, borderTop: "1.5px dashed rgba(20,184,166,0.8)", zIndex: 3 }}
            >
              <span className="absolute right-1 -top-3 text-[7px] font-medium" style={{ color: "rgba(20,184,166,0.95)" }}>italic min {italicBaselineOffset}px</span>
            </div>
          )}

          {!hasText ? (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[11px] text-muted-foreground/40">Full-image template — no text elements</span>
            </div>
          ) : !enableDrag ? (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[11px] text-muted-foreground/40">Canvas drag editing disabled</span>
            </div>
          ) : (
            keys.map((key, index) => {
              const t = getText(slide, key);
              const isExtra = Array.isArray(slide.extras) && slide.extras.some((e) => e.id === key);
              // Skip empty fixed elements except title
              if (!t && !isExtra && key !== "title") return null;
              return (
                <CanvasItem
                  key={key}
                  itemKey={key}
                  slide={slide}
                  scaleRef={scaleRef}
                  canMoveUp={index > 0}
                  canMoveDown={index < keys.length - 1}
                  onMove={moveKey}
                  onChange={onChange}
                  onSelect={setSelectedKey}
                  isSelected={selectedKey === key}
                  baselineOffset={baselineOffset}
                />
              );
            })
          )}

          {/* Click-to-add hint — only when drag is enabled */}
          {enableDrag && hasText && (
            <div className="absolute bottom-1.5 left-0 right-0 flex justify-center pointer-events-none">
              <span className="flex items-center gap-0.5 text-[8px] text-muted-foreground/35">
                <Plus className="w-2 h-2" /> click empty area to add text
                {selectedKey && <span className="ml-1 opacity-60">· arrow keys to nudge · shift+arrow for 10px</span>}
              </span>
            </div>
          )}
        </div>
      </div>

      <p className="text-[9px] text-muted-foreground/50 px-0.5">
        Drag handles to set position (mt / ml). Click to select, then use arrow keys to nudge. Edit text and styling in the Text fields above.
      </p>
    </div>
  );
}
