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

import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { GripVertical, Plus } from "lucide-react";
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
  onChange,
}: {
  itemKey: string;
  slide: Slide;
  scaleRef: React.RefObject<number>;
  onChange: (s: Slide) => void;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const style = getStyle(slide, itemKey);
  const text = getText(slide, itemKey);
  const label = getLabel(itemKey);
  const mt = parsePx(style?.mt);
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
  }, [mt, ml, scaleRef]);

  const onPM = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const dy = (e.clientY - d.startY) / d.scale;
    const dx = (e.clientX - d.startX) / d.scale;
    if (Math.abs(dy) > 4 || Math.abs(dx) > 4) d.moved = true;
    if (!d.moved) return;
    // Direct DOM — no React state during drag
    const el = elRef.current;
    if (!el) return;
    el.style.top = `${Math.round(d.startMt + dy)}px`;
    el.style.left = `${Math.round(d.startMl + dx)}px`;
  }, []);

  const onPU = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d?.moved) return;
    const dy = (e.clientY - d.startY) / d.scale;
    const dx = (e.clientX - d.startX) / d.scale;
    const newMt = Math.round(d.startMt + dy);
    const newMl = Math.round(d.startMl + dx);
    commitStyle(slide, itemKey, {
      ...(style ?? {}),
      mt: newMt ? `${newMt}px` : undefined,
      ml: newMl ? `${newMl}px` : undefined,
    }, onChange);
  }, [slide, itemKey, style, onChange]);

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

  return (
    <div
      ref={elRef}
      className="sc-item absolute flex items-start gap-1 select-none cursor-grab active:cursor-grabbing rounded border border-primary/30 bg-background/80 px-1.5 py-1 hover:border-primary/70 transition-colors max-w-[90%]"
      style={{ top: mt, left: ml, fontSize, touchAction: "none" }}
      onPointerDown={onPD}
      onPointerMove={onPM}
      onPointerUp={onPU}
      onPointerCancel={onPC}
    >
      <GripVertical
        className="shrink-0 text-muted-foreground/50 mt-px"
        style={{ width: fontSize, height: fontSize }}
      />
      <div className="min-w-0">
        <div className="text-[8px] font-semibold uppercase tracking-widest text-muted-foreground/60 leading-none mb-0.5">
          {label}
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
  onChange,
}: {
  slide: Slide;
  tuningScope: HeroTuningScope; // reserved for future scope-aware editing
  onChange: (s: Slide) => void;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef<number>(0.6);

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
  }, [slide, onChange]);

  const hasText = slide.template !== "full-image";

  return (
    <div className="space-y-1">
      {/* Outer responsive wrapper — height controlled by padding-bottom ratio */}
      <div
        ref={outerRef}
        className="relative w-full overflow-hidden rounded border bg-muted/10"
        style={{ paddingBottom: `${(REF_H / REF_W) * 100}%` }}
      >
        {/* Inner canvas at REF_W × REF_H, scaled via transform */}
        <div
          ref={innerRef}
          className="absolute top-0 left-0 cursor-crosshair"
          style={{ width: REF_W, height: REF_H, transformOrigin: "top left" }}
          onClick={onCanvasClick}
        >
          {/* Grid background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(to right,#888 1px,transparent 1px),linear-gradient(to bottom,#888 1px,transparent 1px)",
              backgroundSize: "46px 46px",
            }}
          />

          {!hasText ? (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[11px] text-muted-foreground/40">Full-image template — no text elements</span>
            </div>
          ) : (
            keys.map((key) => {
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
                  onChange={onChange}
                />
              );
            })
          )}

          {/* Click-to-add hint */}
          <div className="absolute bottom-1.5 left-0 right-0 flex justify-center pointer-events-none">
            <span className="flex items-center gap-0.5 text-[8px] text-muted-foreground/35">
              <Plus className="w-2 h-2" /> click empty area to add text
            </span>
          </div>
        </div>
      </div>

      <p className="text-[9px] text-muted-foreground/50 px-0.5">
        Drag handles to set position (mt / ml). Edit text and styling in the Text fields above.
      </p>
    </div>
  );
}
