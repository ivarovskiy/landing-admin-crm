"use client";

import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Container, Hairline, Kicker, OutlineStampText, STAMP_TITLE, STAMP_SECTION_TITLE, STAMP_SUBTITLE } from "@/components/landing/ui";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { TipTapInline, renderRichText } from "@/components/rich-text";
import { TYPO_PRESETS, getTypoOffset } from "@/lib/typo-presets";
import { useLivePreviewEdit } from "@/components/live-preview-provider";
import { computeColumnCenterX } from "@/lib/column-center";

type SlideTemplate =
  | "image-left-copy-right"
  | "copy-left-image-right"
  | "full-image";

type TextVariant = "plain" | "stamp";
type BodyVariant = "plain" | "list";
type ObjectFit = "cover" | "contain";
type HeroViewportProfileKey = "ipadPro";

type ElementStyle = {
  mt?: string;
  mb?: string;
  ml?: string;
  mr?: string;
  pt?: string;
  pb?: string;
  x?: string;
  y?: string;
  align?: "left" | "center" | "right";
  size?: string;
  typo?: string; // typography class from design system
  strokeW?: string; // -webkit-text-stroke width (e.g. "3.6px")
  locked?: boolean; // prevents drag/resize in preview and canvas
  hidden?: boolean; // hide this element without deleting it
  groupId?: string; // group identifier for moving elements together
  alignMode?: "1" | "2" | "3" | "4"; // centering reference field (used when align === "center")
  useFontOffset?: boolean; // opt-in per-font padding offset (see getTypoOffset)
  width?: string; // explicit width override for the element (e.g. "400px")
  viewportProfiles?: Partial<Record<HeroViewportProfileKey, ElementStyleProfile>>;
};

type ElementStyleProfile = Omit<ElementStyle, "viewportProfiles">;

type SlideExtra = {
  id?: string;
  kind: "text" | "kicker" | "stamp";
  text: string;
  style?: ElementStyle;
};

type SlideMedia = {
  kind?: "image";
  src?: string;
  alt?: string;
  aspectRatio?: string;
  objectFit?: ObjectFit;
};

type HeroDesktopLayout = {
  imageSide?: "left" | "right";
  gap?: string;
  mediaWidth?: string;
  textWidth?: string;
  titleSize?: string;
  subtitleSize?: string;
  kickerSize?: string;
  bodySize?: string;
  textAlign?: "left" | "center" | "right";
  contentJustify?: "start" | "center" | "end";
  contentOffsetX?: string;
  contentOffsetY?: string;
  padding?: string;
  mediaPadding?: string;
  mediaHeight?: string;
  mediaAlign?: "start" | "center" | "end" | "stretch";
  textAlignFullWidth?: boolean;
  dragIgnoreGap?: boolean;
  outerPadding?: string;   // symmetric outer padding used for centering mode math (modes 2 & 4)
};

type Slide = {
  id?: string;
  template?: SlideTemplate;
  hidden?: boolean;
  mirror?: boolean;
  stretchTextToMedia?: boolean;
  autoPlayMs?: number;
  quote?: string;
  kicker?: string;
  kickerVariant?: TextVariant;
  title?: string;
  subtitle?: string;
  subtitleVariant?: TextVariant;
  body?: string;
  bodyVariant?: BodyVariant;
  cta?: { label?: string; href?: string; enabled?: boolean; target?: "_self" | "_blank" };
  media?: SlideMedia;
  extras?: SlideExtra[];
  elementOrder?: string[];
  quoteStyle?: ElementStyle;
  kickerStyle?: ElementStyle;
  titleStyle?: ElementStyle;
  subtitleStyle?: ElementStyle;
  bodyStyle?: ElementStyle;
  ctaStyle?: ElementStyle;
  positioningMode?: "absolute"; // undefined = legacy flow, "absolute" = independent canvas
  layout?: {
    desktop?: HeroDesktopLayout;
    mobile?: {
      imageFirst?: boolean;
    };
    viewportProfiles?: Partial<Record<HeroViewportProfileKey, { desktop?: HeroDesktopLayout }>>;
    contentJustify?: "start" | "center" | "end";
  };
};

// ─── Canvas guideline types (mirrored from admin hero-slider-presets) ─────────

type ClassicGridSettings = {
  enabled?: boolean;
  columns?: number;
  rows?: number;
  showVerticalCenter?: boolean; // 2 DOM-measured lines: text-zone center + media center
  showHorizontalCenter?: boolean;
  color?: string;
  marginPx?: number;
  showMarginLines?: boolean;
};

type StyleExtraGuideline = {
  id: string;
  label?: string;
  type: "vertical" | "horizontal";
  position: number;
  positionUnit?: "px" | "percent";
  fromEdge?: "right" | "bottom";
  pairId?: string;
  visible?: boolean;
};

type StyleGuidelinesConfig = {
  showBoundaries?: boolean;
  showPhotoMargins?: boolean;
  photoMarginLeft?: number;
  photoMarginRight?: number;
  showPhotoInnerOffsets?: boolean;
  photoInnerOffsetLeft?: number;
  photoInnerOffsetRight?: number;
  showPhotoEdges?: boolean;
  showItalicLimit?: boolean;
  italicLimitOffset?: number;
  extras?: StyleExtraGuideline[];
  showTextCenterV?: boolean;
  showTextCenterH?: boolean;
  showMediaGap?: boolean;             // vertical line at text column inner edge (gap boundary)
  showMediaEdgeGuides?: boolean;      // inner edge: vertical line; outer edge: vertical + horizontal lines
  showColumnCenter?: boolean;         // single DOM-measured text-zone center line (modes 1–4)
  columnCenterMode?: 1 | 2 | 3 | 4;  // which zone pair to bisect (default 1)
  columnCenterOuterMarginPx?: number; // outer text margin in layout px (default 13)
};

type CanvasGuidelines = {
  gapOffset?: number;            // px from top in design canvas (574px total)
  baselineOffset?: number;       // px from bottom in design canvas
  italicBaselineOffset?: number; // px from bottom in design canvas
  classicGrid?: ClassicGridSettings;
  styleGuidelines?: StyleGuidelinesConfig;
  globalVerticalGuide?: string;      // CSS `left` value — rendered at page level (position:fixed)
  globalVerticalGuideColor?: string;
  sliderHorizontalGuide?: string;    // CSS `top` value — full-slider-width horizontal line
  sliderHorizontalGuideColor?: string;
};

/** Design canvas height used in the admin mini-canvas — offsets are relative to this. */
const DESIGN_CANVAS_H = 574;

const DESIGN_WIDTH_PX = 1440;
const VW_UNIT_RE = /(-?(?:\d+\.?\d*|\.\d+))vw\b/g;

function trimNumber(value: number) {
  return Number(value.toFixed(4)).toString();
}

/**
 * Desktop landing pages are laid out on a fixed 1440px artboard and then
 * scaled with CSS zoom. Browser `vw` units still resolve against the real
 * viewport inside that zoomed tree, so `zoom * vw` makes admin-entered sizes
 * smaller than the Figma canvas value on iPad. Convert those viewport units
 * to their 1440px design equivalent before they enter inline styles / CSS vars.
 */
function resolveDesignViewportUnits(value?: string) {
  if (!value || !value.includes("vw")) return value;
  return value.replace(VW_UNIT_RE, (_, raw: string) => {
    const n = Number(raw);
    if (!Number.isFinite(n)) return `${raw}vw`;
    return `${trimNumber((n / 100) * DESIGN_WIDTH_PX)}px`;
  });
}

/** Pick the stamp preset that matches the typo class so default shadow/stroke
 *  values are correct for each size. Admin per-size overrides (data-hero-shadow,
 *  data-section-shadow, etc.) still win via higher CSS specificity. */
function stampForTypo(typo?: string) {
  if (typo === "typo-homepage-header") return STAMP_SECTION_TITLE;
  if (typo === "typo-subtitle") return STAMP_SUBTITLE;
  return STAMP_TITLE; // default, typo-content-header, typo-hero-title
}

function mergeElementStyle(
  style?: ElementStyle,
  profile?: HeroViewportProfileKey | null,
): ElementStyle | undefined {
  if (!style) return undefined;
  if (!profile) return style;
  const profileStyle = style.viewportProfiles?.[profile];
  if (!profileStyle) return style;
  return { ...style, ...profileStyle };
}

function mergeDesktopLayout(
  slide: Slide,
  profile?: HeroViewportProfileKey | null,
): HeroDesktopLayout {
  const base = slide?.layout?.desktop ?? {};
  if (!profile) return base;
  return {
    ...base,
    ...(slide?.layout?.viewportProfiles?.[profile]?.desktop ?? {}),
  };
}

function useHeroViewportProfile(): HeroViewportProfileKey | null {
  const [profile, setProfile] = useState<HeroViewportProfileKey | null>(null);

  useLayoutEffect(() => {
    const query = "(min-width: 1200px) and (max-width: 1439px)";
    const mql = window.matchMedia(query);
    const update = () => setProfile(mql.matches ? "ipadPro" : null);

    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return profile;
}

/** Convert ElementStyle to inline CSS for edit-mode wrappers.
 *  height:0 + overflow:visible removes each wrapper from the flex flow so that
 *  TipTap growing (text wrapping) or font-size changes never push sibling elements.
 *  Visual position is determined solely by the transform; precedingMt compensates
 *  for the sum of mt values of preceding elements (matching CSS margin-top behaviour). */
function absElStyle(es?: ElementStyle, precedingMt = 0): React.CSSProperties {
  const mlPx = parseFloat(resolveDesignViewportUnits(es?.ml) ?? "0") || 0;
  const mtPx = parseFloat(resolveDesignViewportUnits(es?.mt) ?? "0") || 0;
  const xPx  = parseFloat(resolveDesignViewportUnits(es?.x)  ?? "0") || 0;
  const yPx  = parseFloat(resolveDesignViewportUnits(es?.y)  ?? "0") || 0;
  const tx = mlPx + xPx;
  const ty = mtPx + yPx + precedingMt;
  const s: Record<string, string> = {};
  if (tx !== 0 || ty !== 0) s.transform = `translate(${tx}px, ${ty}px)`;
  if (es?.align) {
    s.textAlign = es.align;
    s.alignSelf = es.align === "center" ? "center" : es.align === "right" ? "flex-end" : "flex-start";
  }
  if (es?.size) s.fontSize = resolveDesignViewportUnits(es.size)!;
  if (es?.strokeW) s["--text-stroke-w"] = resolveDesignViewportUnits(es.strokeW)!;
  return { position: "relative", height: 0, overflow: "visible", ...s } as React.CSSProperties;
}

/** Convert ElementStyle to inline CSS */
function elStyle(es?: ElementStyle): React.CSSProperties | undefined {
  if (!es) return undefined;
  const s: Record<string, string> = {};
  if (es.mt) s.marginTop = resolveDesignViewportUnits(es.mt)!;
  if (es.mb) s.marginBottom = resolveDesignViewportUnits(es.mb)!;
  if (es.ml) s.marginLeft = resolveDesignViewportUnits(es.ml)!;
  if (es.mr) s.marginRight = resolveDesignViewportUnits(es.mr)!;
  if (es.pt) s.paddingTop = resolveDesignViewportUnits(es.pt)!;
  if (es.pb) s.paddingBottom = resolveDesignViewportUnits(es.pb)!;
  if (es.x != null || es.y != null) {
    const tx = resolveDesignViewportUnits(es.x) ?? "0px";
    const ty = resolveDesignViewportUnits(es.y) ?? "0px";
    s.transform = `translate(${tx}, ${ty})`;
  }
  if (es.align) {
    s.textAlign = es.align;
    s.alignSelf = es.align === "center" ? "center" : es.align === "right" ? "flex-end" : "flex-start";
  }
  if (es.size) s.fontSize = resolveDesignViewportUnits(es.size)!;
  if (es.strokeW) s["--text-stroke-w"] = resolveDesignViewportUnits(es.strokeW)!;
  if (es.useFontOffset && es.typo) {
    const offsetVal = getTypoOffset(es.typo);
    if (offsetVal) s.paddingBottom = offsetVal;
  }
  return Object.keys(s).length ? (s as React.CSSProperties) : undefined;
}

function resolveTemplate(slide: Slide, profile?: HeroViewportProfileKey | null): SlideTemplate {
  const base: SlideTemplate = slide?.template
    ? slide.template
    : (mergeDesktopLayout(slide, profile)?.imageSide ?? "right") === "left"
      ? "image-left-copy-right"
      : "copy-left-image-right";

  if (!slide?.mirror) return base;
  // Mirror only swaps the two two-column templates; full-image is symmetric.
  if (base === "image-left-copy-right") return "copy-left-image-right";
  if (base === "copy-left-image-right") return "image-left-copy-right";
  return base;
}

/** Returns which side the image is on for a given template */
function imageSide(template: SlideTemplate): "left" | "right" | "none" {
  switch (template) {
    case "image-left-copy-right":
      return "left";
    case "copy-left-image-right":
      return "right";
    case "full-image":
    default:
      return "none";
  }
}

function mapJustify(value?: "start" | "center" | "end") {
  if (value === "start") return "flex-start";
  if (value === "end") return "flex-end";
  return "center";
}

function mapItems(value?: "left" | "center" | "right") {
  if (value === "center") return "center";
  if (value === "right") return "flex-end";
  return "flex-start";
}

function slideStyle(slide: Slide, profile?: HeroViewportProfileKey | null): React.CSSProperties {
  const desktop = mergeDesktopLayout(slide, profile);
  const style: Record<string, string> = {};

  if (desktop.gap) style["--hs-gap"] = resolveDesignViewportUnits(desktop.gap)!;
  if (desktop.mediaWidth) style["--hs-media-w"] = resolveDesignViewportUnits(desktop.mediaWidth)!;
  if (desktop.textWidth) style["--hs-text-w"] = resolveDesignViewportUnits(desktop.textWidth)!;
  if (desktop.titleSize) style["--hs-title-size"] = resolveDesignViewportUnits(desktop.titleSize)!;
  if (desktop.subtitleSize) style["--hs-subtitle-size"] = resolveDesignViewportUnits(desktop.subtitleSize)!;
  if (desktop.kickerSize) style["--hs-kicker-size"] = resolveDesignViewportUnits(desktop.kickerSize)!;
  if (desktop.bodySize) style["--hs-body-size"] = resolveDesignViewportUnits(desktop.bodySize)!;
  if (desktop.textAlign) style["--hs-text-align"] = desktop.textAlign;
  if (desktop.contentOffsetX) style["--hs-offset-x"] = resolveDesignViewportUnits(desktop.contentOffsetX)!;
  if (desktop.contentOffsetY) style["--hs-offset-y"] = resolveDesignViewportUnits(desktop.contentOffsetY)!;

  style["--hs-content-justify"] = mapJustify(
    desktop.contentJustify ?? slide?.layout?.contentJustify
  );
  style["--hs-copy-items"] = mapItems(desktop.textAlign);

  if (slide?.media?.aspectRatio) {
    style["--hs-media-aspect"] = slide.media.aspectRatio;
  }
  if (slide?.media?.objectFit) {
    style["--hs-media-fit"] = slide.media.objectFit;
  }
  if (desktop.padding) {
    style["--hs-padding"] = resolveDesignViewportUnits(desktop.padding)!;
  }
  if (desktop.mediaPadding) {
    style["--hs-media-padding"] = resolveDesignViewportUnits(desktop.mediaPadding)!;
  }
  if (desktop.mediaHeight) {
    style["--hs-media-h"] = resolveDesignViewportUnits(desktop.mediaHeight)!;
  }
  if (desktop.mediaAlign) {
    const map = { start: "flex-start", center: "center", end: "flex-end", stretch: "stretch" } as const;
    style["--hs-media-align"] = map[desktop.mediaAlign];
  }
  if (desktop.outerPadding) style["--hs-outer-padding"] = resolveDesignViewportUnits(desktop.outerPadding)!;

  return style as React.CSSProperties;
}

export function HeroSliderV1({
  data,
  editMode = false,
  onChange,
}: {
  data: any;
  editMode?: boolean;
  onChange?: (next: any) => void;
}) {
  const rawSlides: Slide[] = Array.isArray(data?.slides) ? data.slides : [];
  // Hidden slides are skipped entirely — they affect neither count nor autoplay.
  const visibleSlides = useMemo(
    () => rawSlides.map((slide, index) => ({ slide, index })).filter((item) => !item.slide?.hidden),
    [rawSlides],
  );
  const slides: Slide[] = useMemo(() => visibleSlides.map((item) => item.slide), [visibleSlides]);
  const options = data?.options ?? {};
  const canvasGuidelines: CanvasGuidelines = data?.canvasGuidelines ?? {};
  const count = slides.length;

  const sectionRef = useRef<HTMLElement>(null);

  // useId() shifts between SSR and client when nested inside LiveBlockWrapper (extra client boundary).
  // Use a stable "hs" prefix on server; swap to the real ID after mount to keep aria links working.
  const uid = useId();
  const [carouselId, setCarouselId] = useState("hs");
  useEffect(() => { setCarouselId(uid); }, [uid]);

  const prefersReducedMotion = usePrefersReducedMotion();

  // --- Seamless infinite loop via clones (Swiper/Embla-style) ------------------
  // For N > 1 we render [clone(last), ...slides, clone(first)] and translate the
  // track forward only. When we land on a clone we snap (no transition) to the
  // matching real slide. This removes the "rewind flash" from last → first.
  const hasLoop = count > 1;
  const displayedSlides = useMemo<Slide[]>(() => {
    if (!hasLoop) return slides;
    return [slides[count - 1], ...slides, slides[0]];
  }, [slides, count, hasLoop]);
  const initialTrackIndex = hasLoop ? 1 : 0;

  const [trackIndex, setTrackIndex] = useState(initialTrackIndex);
  const [noTransition, setNoTransition] = useState(false);
  const [paused, setPaused] = useState(false);


  const showDots = options?.showDots !== false;
  const showArrows = options?.showArrows === true;
  const showGuides = options?.showGuides === true;
  const showElementGuides = options?.showElementGuides === true;
  const showCompositionGuides = options?.compositionGuides === true;
  const compositionGuideColor = options?.compositionGuideColor as string | undefined;
  const showLayoutGuides = options?.showLayoutGuides === true;
  const layoutGuideBottomOffset = options?.layoutGuideBottomOffset as string | undefined;
  const showStyleGuides = options?.showStyleGuides === true;
  // showMediaEdgeGuides moved to canvasGuidelines.styleGuidelines; keep options fallback
  const showMediaEdgeGuides = !!(canvasGuidelines?.styleGuidelines?.showMediaEdgeGuides || options?.showMediaEdgeGuides);
  const viewportProfile = useHeroViewportProfile();

  // Toolbox state comes from the admin toolbar via postMessage → LivePreviewContext.
  // When not in admin preview (editMode=false), all are false.
  const { toolboxState } = useLivePreviewEdit();
  const toolboxTextEdit = editMode && toolboxState.text;
  const toolboxDrag     = editMode && toolboxState.drag;
  const toolboxGuides   = editMode && toolboxState.guides;

  // effective values gated by toolbox
  const effectiveEditMode = editMode && (toolboxTextEdit || toolboxDrag);
  const effectiveDragMode = toolboxDrag;

  // Real slide currently displayed (for dots / aria / live preview)
  const active = hasLoop
    ? ((trackIndex - 1) % count + count) % count
    : Math.max(0, Math.min(trackIndex, count - 1));

  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const goNext = () => {
    if (count <= 1) return;
    setNoTransition(false);
    setTrackIndex((i) => (hasLoop ? i + 1 : Math.min(i + 1, count - 1)));
  };
  const goPrev = () => {
    if (count <= 1) return;
    setNoTransition(false);
    setTrackIndex((i) => (hasLoop ? i - 1 : Math.max(i - 1, 0)));
  };
  const goTo = (target: number) => {
    if (count <= 1) return;
    const real = ((target % count) + count) % count;
    setNoTransition(false);
    setTrackIndex(hasLoop ? real + 1 : real);
  };

  const updateSlide = (rawSlideIndex: number, nextSlide: Slide) => {
    const nextSlides = rawSlides.map((slide, index) => index === rawSlideIndex ? nextSlide : slide);
    onChange?.({ ...(data ?? {}), slides: nextSlides });
  };

  // Per-slide autoplay timer, re-armed on every active change so user
  // interaction (clicks / drag / arrow keys) restarts the countdown instead
  // of letting an old interval fire on top of a manual transition.
  useEffect(() => {
    if (count <= 1) return;
    if (prefersReducedMotion) return;
    if (paused) return;

    const slideMs = Number(slides[active]?.autoPlayMs ?? 0);
    const globalMs = Number(options?.autoPlayMs ?? 0);
    const ms = slideMs > 0 ? slideMs : globalMs;
    if (!ms || ms < 1500) return;

    const t = window.setTimeout(() => {
      setNoTransition(false);
      setTrackIndex((i) => i + 1);
    }, ms);

    return () => window.clearTimeout(t);
  }, [active, slides, options?.autoPlayMs, count, paused, prefersReducedMotion]);

  // When we land on a clone, wait for the slide-in transition to finish, then
  // snap (no transition) to the matching real slide. Re-enable transition on
  // next frame so subsequent movements animate normally.
  useEffect(() => {
    if (!hasLoop) return;
    if (trackIndex !== 0 && trackIndex !== count + 1) return;

    const timer = window.setTimeout(() => {
      setNoTransition(true);
      setTrackIndex(trackIndex === 0 ? count : 1);
    }, 520); // slightly longer than 500ms CSS transition to be safe
    return () => window.clearTimeout(timer);
  }, [trackIndex, count, hasLoop]);

  useEffect(() => {
    if (!noTransition) return;
    const r1 = requestAnimationFrame(() => {
      const r2 = requestAnimationFrame(() => setNoTransition(false));
      (r1 as unknown as { inner?: number }).inner = r2;
    });
    return () => cancelAnimationFrame(r1);
  }, [noTransition]);

  // If slide count changes (add/remove in admin), snap trackIndex back to a valid
  // real-slide position without animating.
  useEffect(() => {
    const maxIdx = hasLoop ? count + 1 : Math.max(count - 1, 0);
    const minIdx = 0;
    if (trackIndex < minIdx || trackIndex > maxIdx) {
      setNoTransition(true);
      setTrackIndex(hasLoop ? 1 : 0);
    }
  }, [count, hasLoop, trackIndex]);

  const drag = useRef<{
    startX: number;
    lastX: number;
    active: boolean;
    moved: boolean;
    pointerId: number;
  } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && (e as any).button !== 0) return;
    // In edit mode, block swipe only when pointer lands on an interactive/draggable element
    if (editMode && (e.target as HTMLElement).closest(".hero-slide__editable, [contenteditable]")) return;
    if ((e.target as HTMLElement).closest("a, button, [contenteditable]")) return;

    setPaused(true);

    drag.current = {
      startX: e.clientX,
      lastX: e.clientX,
      active: true,
      moved: false,
      pointerId: e.pointerId,
    };

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current?.active) return;
    drag.current.lastX = e.clientX;

    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 6) drag.current.moved = true;
  };

  const finishDrag = (e: React.PointerEvent) => {
    if (!drag.current?.active) return;

    // Use lastX (updated on every pointermove) so pointercancel events from
    // iOS "swipe back" gesture — which fire with the original clientX — still
    // measure the full drag distance.
    const dx = drag.current.lastX - drag.current.startX;
    const moved = drag.current.moved;

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(drag.current.pointerId);
    } catch { }

    drag.current = null;

    if (moved && Math.abs(dx) >= 30 && count > 1) {
      dx < 0 ? goNext() : goPrev();
    }

    window.setTimeout(() => setPaused(false), 1200);
  };

  const trackStyle = useMemo(
    () => ({ transform: `translateX(-${trackIndex * 100}%)` }),
    [trackIndex]
  );

  if (count === 0) return null;

  const withPause = (action: () => void) => {
    setPaused(true);
    action();
    window.setTimeout(() => setPaused(false), 1200);
  };

  const keyActions: Record<string, () => void> = {
    ArrowRight: goNext,
    ArrowLeft: goPrev,
    Home: () => goTo(0),
    End: () => goTo(count - 1),
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (count <= 1) return;
    const action = keyActions[e.key];
    if (action) {
      e.preventDefault();
      withPause(action);
    }
  };

  const sectionStyle: React.CSSProperties = {};
  if (options?.inlineIconMargin) (sectionStyle as any)["--hs-inline-icon-margin"] = options.inlineIconMargin;
  if (options?.inlineIconSize) (sectionStyle as any)["--hs-inline-icon-size"] = options.inlineIconSize;

  return (
    <section className="hero-slider" ref={sectionRef} style={sectionStyle}>
      <Container>
        {/* <Hairline className="hero-slider__hairline-top" /> */}
        <img
          src="/icons/slider_v1.svg"
          alt=""
          width={1320}
          height={14}
          className="hero-slider__hairline-top"
        />

        <div
          className="hero-slider__viewport"
          tabIndex={0}
          onKeyDown={onKeyDown}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          role="region"
          aria-roledescription="carousel"
          aria-label="Hero slides"
        >
          <div
            className={cn(
              "hero-slider__track",
              (prefersReducedMotion || noTransition) && "hero-slider__track--no-motion"
            )}
            style={trackStyle}
          >
            {displayedSlides.map((s, i) => {
              // Map DOM position → real slide index (clones share aria with their originals)
              const realIndex = hasLoop
                ? i === 0
                  ? count - 1
                  : i === count + 1
                    ? 0
                    : i - 1
                : i;
              const isClone = hasLoop && (i === 0 || i === count + 1);
              const rawSlideIndex = visibleSlides[realIndex]?.index ?? realIndex;
              return (
                <div
                  key={isClone ? `clone-${realIndex}-${i}` : (s.id ?? `real-${realIndex}`)}
                  id={isClone ? undefined : `${carouselId}-slide-${realIndex}`}
                  className="hero-slider__slide"
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${realIndex + 1} of ${count}`}
                  aria-hidden={isClone || realIndex !== active}
                >
                  <HeroSlide
                    slide={s}
                    isDragging={!!drag.current?.moved}
                    slideIndex={realIndex}
                    editMode={effectiveEditMode && !isClone && realIndex === active}
                    adminMode={editMode && !isClone && realIndex === active}
                    dragMode={effectiveDragMode}
                    onSlideChange={(nextSlide) => updateSlide(rawSlideIndex, nextSlide)}
                    showGuides={toolboxGuides && showGuides}
                    showElementGuides={toolboxGuides && showElementGuides}
                    showCompositionGuides={toolboxGuides && showCompositionGuides}
                    compositionGuideColor={compositionGuideColor}
                    showLayoutGuides={toolboxGuides && showLayoutGuides}
                    layoutGuideBottomOffset={layoutGuideBottomOffset}
                    showStyleGuides={toolboxGuides && showStyleGuides}
                    showMediaEdgeGuides={toolboxGuides && showMediaEdgeGuides}
                    canvasGuidelines={toolboxGuides ? canvasGuidelines : undefined}
                    viewportProfile={viewportProfile}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {showArrows && count > 1 ? (
          <div className="hero-slider__arrows">
            <button type="button" aria-label="Previous slide" onClick={goPrev} className="ds-icon-btn">
              &#8249;
            </button>
            <button type="button" aria-label="Next slide" onClick={goNext} className="ds-icon-btn">
              &#8250;
            </button>
          </div>
        ) : null}



        {/* <Hairline className="hero-slider__hairline-bottom" /> */}
        <img
          src="/icons/slider_v2.svg"
          alt=""
          width={1320}
          height={14}
          className="hero-slider__hairline-bottom"
        />

        {showDots && count >= 1 ? (
          <div className="hero-slider__dots" role="tablist" aria-label="Slides">
            {slides.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-label={`Go to slide ${i + 1}`}
                aria-selected={i === active}
                aria-controls={`${carouselId}-slide-${i}`}
                tabIndex={i === active ? 0 : -1}
                onClick={() => goTo(i)}
                className={cn("hero-slider__dot", i === active && "is-active")}
              />
            ))}
          </div>
        ) : null}
      </Container>
      {/* Full-page-height vertical guideline — position:fixed escapes slider clip/overflow */}
      {toolboxGuides && canvasGuidelines.globalVerticalGuide && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            top: 0, bottom: 0,
            left: canvasGuidelines.globalVerticalGuide,
            width: 1,
            background: canvasGuidelines.globalVerticalGuideColor ?? "rgba(255,100,180,0.8)",
            zIndex: 9998,
            pointerEvents: "none",
          }}
        />
      )}
    </section>
  );
}

// ─── Stylistic guideline overlay ──────────────────────────────────────────────
// Renders design-helper lines for layout review. pointer-events: none so drag
// and text editing are never blocked.

type MediaRect = {
  left: number; right: number; top: number; bottom: number;
  height: number; stretchTop: number; stretchBottom: number;
  textColFace?: number; // inner edge of text column facing the media (layout px)
};

type GuideLineDef = {
  key: string;
  label: string;
  type: "vertical" | "horizontal";
  pos: string; // CSS value: "80px" or "55.56%"
  color: string;
  group: string;
};

const SG_COLORS = {
  boundary:    "rgba(239, 68, 68, 0.9)",   // 🔴 slide edges
  photoMargin: "rgba(56, 189, 248, 0.9)",  // 🩵 photo placement margins
  photoInner:  "rgba(8, 60, 43, 0.9)",  // 🟢 inner offsets from photo bounds
  photoEdge:   "rgba(30, 7, 86, 0.9)",  // 🟣 photo top/bottom continuation
  italic:      "rgba(6, 70, 153, 0.9)",  // 🟡 italic lower limit
  extra:       "rgba(100, 116, 139, 0.85)",// ⚫ style extras
  center:      "rgba(11, 96, 14, 0.85)", // 🟡 text area center guides
  gap:         "rgba(14, 111, 100, 0.9)", // 🩵 text column inner edge (gap boundary)
} as const;

function StyleGuidelineOverlay({
  config,
  mediaRect,
  italicFallbackOffset,
  imgSide,
  slideWidthPx,
}: {
  config: StyleGuidelinesConfig;
  mediaRect: MediaRect | null;
  italicFallbackOffset?: number;
  imgSide: "left" | "right" | "none";
  slideWidthPx?: number;
}) {
  const lines: GuideLineDef[] = [];
  let labelIdx = 1;
  const lbl = () => {
    const CIRCLES = ["①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩","⑪","⑫","⑬","⑭","⑮"];
    return CIRCLES[(labelIdx++ - 1) % CIRCLES.length];
  };

  // Group 1 — Slide boundaries (always 0% and 100%)
  if (config.showBoundaries !== false) {
    lines.push({ key: "sb-l", label: lbl(), type: "vertical", pos: "0%",   color: SG_COLORS.boundary,    group: "slide-boundary" });
    lines.push({ key: "sb-r", label: lbl(), type: "vertical", pos: "100%", color: SG_COLORS.boundary,    group: "slide-boundary" });
  }

  // Group 2 — Photo placement margins (design-canvas px → percent of 1440)
  if (config.showPhotoMargins !== false) {
    if (config.photoMarginLeft != null) {
      lines.push({ key: "pm-l", label: lbl(), type: "vertical",
        pos: `${(config.photoMarginLeft / DESIGN_WIDTH_PX) * 100}%`,
        color: SG_COLORS.photoMargin, group: "photo-margin" });
    }
    if (config.photoMarginRight != null) {
      lines.push({ key: "pm-r", label: lbl(), type: "vertical",
        pos: `${((DESIGN_WIDTH_PX - config.photoMarginRight) / DESIGN_WIDTH_PX) * 100}%`,
        color: SG_COLORS.photoMargin, group: "photo-margin" });
    }
  }

  // Group 3 — Inner offsets from measured photo boundaries (layout px)
  if (config.showPhotoInnerOffsets !== false && mediaRect) {
    const iol = config.photoInnerOffsetLeft ?? 0;
    const ior = config.photoInnerOffsetRight ?? 0;
    if (iol > 0) {
      lines.push({ key: "pi-l", label: lbl(), type: "vertical",
        pos: `${mediaRect.left + iol}px`,
        color: SG_COLORS.photoInner, group: "photo-inner" });
    }
    if (ior > 0) {
      lines.push({ key: "pi-r", label: lbl(), type: "vertical",
        pos: `${mediaRect.right - ior}px`,
        color: SG_COLORS.photoInner, group: "photo-inner" });
    }
  }

  // Group 4 — Photo top/bottom horizontal continuation (layout px).
  // DOMRect.bottom is exclusive (first px after image), so subtract 1 to land on the last image row.
  if (config.showPhotoEdges !== false && mediaRect) {
    lines.push({ key: "pe-t", label: lbl(), type: "horizontal",
      pos: `${Math.round(mediaRect.top) + 1}px`,    color: SG_COLORS.photoEdge, group: "photo-edge" });
    lines.push({ key: "pe-b", label: lbl(), type: "horizontal",
      pos: `${Math.round(mediaRect.bottom) - 1}px`, color: SG_COLORS.photoEdge, group: "photo-edge" });
  }

  // Group 5 — Italic lower-limit line (design-canvas px from bottom → %)
  if (config.showItalicLimit !== false && imgSide !== "none") {
    const offset = config.italicLimitOffset ?? italicFallbackOffset;
    if (offset != null && offset > 0) {
      lines.push({ key: "italic", label: lbl(), type: "horizontal",
        pos: `${((DESIGN_CANVAS_H - offset) / DESIGN_CANVAS_H) * 100}%`,
        color: SG_COLORS.italic, group: "italic-limit" });
    }
  }

  // Group 6 — Style extras
  (config.extras ?? []).forEach((ex, idx) => {
    if (ex.visible === false) return;
    let pos: string;
    const unit = ex.positionUnit ?? "px";
    if (unit === "percent") {
      const pct = ex.fromEdge === "right" || ex.fromEdge === "bottom"
        ? 100 - ex.position : ex.position;
      pos = `${pct}%`;
    } else {
      // design-canvas px
      if (ex.type === "vertical") {
        const pct = ex.fromEdge === "right"
          ? ((DESIGN_WIDTH_PX - ex.position) / DESIGN_WIDTH_PX) * 100
          : (ex.position / DESIGN_WIDTH_PX) * 100;
        pos = `${pct}%`;
      } else {
        const pct = ex.fromEdge === "bottom"
          ? ((DESIGN_CANVAS_H - ex.position) / DESIGN_CANVAS_H) * 100
          : (ex.position / DESIGN_CANVAS_H) * 100;
        pos = `${pct}%`;
      }
    }
    lines.push({
      key: `ex-${ex.id ?? idx}`,
      label: ex.label ?? lbl(),
      type: ex.type,
      pos,
      color: SG_COLORS.extra,
      group: "style-extra",
    });
  });

  // Clip-path: restrict the entire overlay to the text area only
  let clipPath: string | undefined;
  if (mediaRect) {
    if (imgSide === "left") {
      // image on left → text area is right of photo
      clipPath = `inset(0 0 0 ${mediaRect.right}px)`;
    } else if (imgSide === "right") {
      // image on right → text area is left of photo
      clipPath = `inset(0 calc(100% - ${mediaRect.left}px) 0 0)`;
    }
  }

  // Gap guide — vertical line at text column inner edge (where the gap ends on the text side)
  if (config.showMediaGap && mediaRect?.textColFace != null) {
    lines.push({
      key: "gap-edge",
      label: lbl(),
      type: "vertical",
      pos: `${mediaRect.textColFace}px`,
      color: SG_COLORS.gap,
      group: "media-gap",
    });
  }

  // Center lines — positioned in slide space, visible only inside clipped text area
  const centerLines: GuideLineDef[] = [];
  if (config.showTextCenterV) {
    let pos: string;
    if (mediaRect && imgSide === "left") {
      pos = `calc(50% + ${mediaRect.right / 2}px)`;
    } else if (mediaRect && imgSide === "right") {
      pos = `${mediaRect.left / 2}px`;
    } else {
      pos = "50%";
    }
    centerLines.push({ key: "tc-v", label: lbl(), type: "vertical", pos, color: SG_COLORS.center, group: "text-center" });
  }
  if (config.showTextCenterH) {
    centerLines.push({ key: "tc-h", label: lbl(), type: "horizontal", pos: "50%", color: SG_COLORS.center, group: "text-center" });
  }

  // Column center — DOM-measured, single line, 4 modes (text zone only, not media)
  if (config.showColumnCenter && mediaRect && imgSide !== "none" && slideWidthPx) {
    const mode = (config.columnCenterMode ?? 1) as 1 | 2 | 3 | 4;
    const outerMargin = config.columnCenterOuterMarginPx ?? 13;
    const mediaEdge = imgSide === "right" ? mediaRect.left : mediaRect.right;
    const gapBoundary = mediaRect.textColFace ?? mediaEdge;
    const cx = computeColumnCenterX(mode, mediaEdge, gapBoundary, outerMargin, slideWidthPx, imgSide);
    centerLines.push({
      key: "col-center",
      label: lbl(),
      type: "vertical",
      pos: `${cx}px`,
      color: SG_COLORS.center,
      group: "text-center",
    });
  }

  const allLines = [...lines, ...centerLines];
  if (allLines.length === 0) return null;

  // Boundary lines span the full slide (no clip); everything else is clipped to text area.
  const boundaryLines = allLines.filter((l) => l.group === "slide-boundary");
  const clippedLines  = allLines.filter((l) => l.group !== "slide-boundary");

  const renderLine = (line: GuideLineDef) =>
    line.type === "vertical" ? (
      <div
        key={line.key}
        className="hero-slide__guide hero-slide__guide--vertical hero-slide__guide--style"
        style={{ left: line.pos, "--sg-color": line.color } as React.CSSProperties}
        data-sg-group={line.group}
      >
        <span className="hero-slide__guide-label">{line.label}</span>
      </div>
    ) : (
      <div
        key={line.key}
        className="hero-slide__guide hero-slide__guide--horizontal hero-slide__guide--style"
        style={{ top: line.pos, "--sg-color": line.color } as React.CSSProperties}
        data-sg-group={line.group}
      >
        <span className="hero-slide__guide-label hero-slide__guide-label--h">{line.label}</span>
      </div>
    );

  return (
    <div className="hero-slide__guides" aria-hidden="true" data-sg="1">
      {/* Slide boundary lines — full width, no clipping */}
      {boundaryLines.map(renderLine)}
      {/* All other lines — clipped to text area only */}
      {clippedLines.length > 0 && (
        <div style={{ position: "absolute", inset: 0, clipPath: clipPath ?? undefined }}>
          {clippedLines.map(renderLine)}
        </div>
      )}
    </div>
  );
}

function HeroSlide({
  slide,
  isDragging,
  slideIndex: i,
  editMode = false,
  adminMode = false,
  dragMode = true,
  onSlideChange,
  showGuides = false,
  showElementGuides = false,
  showCompositionGuides = false,
  compositionGuideColor,
  showLayoutGuides = false,
  layoutGuideBottomOffset,
  showStyleGuides = false,
  showMediaEdgeGuides = false,
  canvasGuidelines,
  viewportProfile,
}: {
  slide: Slide;
  isDragging: boolean;
  slideIndex: number;
  editMode?: boolean;
  /** adminMode = slide is active in admin even when toolbox text/drag are off */
  adminMode?: boolean;
  dragMode?: boolean;
  onSlideChange?: (next: Slide) => void;
  showGuides?: boolean;
  showElementGuides?: boolean;
  showCompositionGuides?: boolean;
  compositionGuideColor?: string;
  showLayoutGuides?: boolean;
  layoutGuideBottomOffset?: string;
  showStyleGuides?: boolean;
  showMediaEdgeGuides?: boolean;
  canvasGuidelines?: CanvasGuidelines;
  viewportProfile?: HeroViewportProfileKey | null;
}) {
  const template = resolveTemplate(slide, viewportProfile);
  const mobileImageFirst = !!slide?.layout?.mobile?.imageFirst;
  const stretchToMedia = !!slide?.stretchTextToMedia;
  const desktopLayout = mergeDesktopLayout(slide, viewportProfile);
  const slideRef = useRef<HTMLDivElement>(null);
  type ElementRect = {
    key: string;
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  const [mediaRect, setMediaRect] = useState<MediaRect | null>(null);
  const [elementRects, setElementRects] = useState<ElementRect[]>([]);
  type CompLine = { axis: "v" | "h"; pos: number };
  const [compGuides, setCompGuides] = useState<CompLine[]>([]);
  type LayoutGuideLines = { gapX?: number; bottomY?: number };
  const [layoutGuideLines, setLayoutGuideLines] = useState<LayoutGuideLines>({});
  // Measurement is needed for guides and for media-aligned text stretching.
  const measureNeeded = showGuides || showElementGuides || stretchToMedia || showCompositionGuides || showLayoutGuides || showStyleGuides || showMediaEdgeGuides || !!(canvasGuidelines?.classicGrid?.showVerticalCenter);

  useLayoutEffect(() => {
    if (!measureNeeded) {
      setMediaRect(null);
      setElementRects([]);
      return;
    }
    const slideEl = slideRef.current;
    if (!slideEl) return;
    const measure = () => {
      const media = slideEl.querySelector<HTMLElement>(".hero-slide__media-box");
      const sr = slideEl.getBoundingClientRect();
      if (!sr.width) return;
      // Convert visual px → layout px in case parent uses CSS zoom/scale.
      const scale = sr.width / slideEl.offsetWidth || 1;

      if (!media) {
        setMediaRect((prev) => (prev === null ? null : null));
      } else {
        const mr = media.getBoundingClientRect();
        if (mr.width) {
          const textCol = slideEl.querySelector<HTMLElement>(".hero-slide__text-col");
          const tc = textCol?.getBoundingClientRect();
          const refTop = tc?.top ?? sr.top;
          const refBottom = tc?.bottom ?? sr.bottom;
          const side = imageSide(template);
          let textColFace: number | undefined;
          if (tc) {
            textColFace = side === "left"
              ? (tc.left - sr.left) / scale
              : (tc.right - sr.left) / scale;
          }
          const next: MediaRect = {
            left: (mr.left - sr.left) / scale,
            right: (mr.right - sr.left) / scale,
            top: (mr.top - sr.top) / scale,
            bottom: (mr.bottom - sr.top) / scale,
            height: sr.height / scale,
            stretchTop: Math.max(0, (mr.top - refTop) / scale),
            stretchBottom: Math.max(0, (refBottom - mr.bottom) / scale),
            textColFace,
          };
          // Skip state update if nothing changed to avoid ResizeObserver feedback loop.
          setMediaRect((prev) =>
            prev &&
            prev.left === next.left && prev.right === next.right &&
            prev.top === next.top && prev.bottom === next.bottom &&
            prev.stretchTop === next.stretchTop && prev.stretchBottom === next.stretchBottom &&
            prev.textColFace === next.textColFace
              ? prev
              : next
          );
        }
      }

      // Per-element guide rects — collected from every `[data-el]` descendant
      // of this slide (titles, kickers, subtitles, body, extras, cta…). The
      // media-box already has its own pair of lines via `showGuides`, so we
      // exclude it here when both modes are on to avoid double-drawing.
      if (showElementGuides) {
        const dataEls = slideEl.querySelectorAll<HTMLElement>("[data-el]");
        const rects: ElementRect[] = [];
        dataEls.forEach((el) => {
          if (showGuides && el.classList.contains("hero-slide__media-box")) return;
          const r = el.getBoundingClientRect();
          if (!r.width || !r.height) return;
          rects.push({
            key: el.getAttribute("data-el") ?? "",
            left: (r.left - sr.left) / scale,
            right: (r.right - sr.left) / scale,
            top: (r.top - sr.top) / scale,
            bottom: (r.bottom - sr.top) / scale,
          });
        });
        setElementRects(rects);
      } else {
        setElementRects([]);
      }

      // Composition guides: media all 4 sides, text hierarchy vertical,
      // text-col gap edge vertical, symmetric vertical, CTA horizontal bottom.
      if (showCompositionGuides) {
        const compMedia = slideEl.querySelector<HTMLElement>(".hero-slide__media-box");
        const cmr = compMedia?.getBoundingClientRect();
        if (!cmr?.width) {
          setCompGuides([]);
        } else {
          const slideWidth = slideEl.offsetWidth;
          const mediaLeft = (cmr.left - sr.left) / scale;
          const mediaRight = (cmr.right - sr.left) / scale;
          const mediaTop = (cmr.top - sr.top) / scale;
          const mediaBottom = (cmr.bottom - sr.top) / scale;
          const mediaOnRight = (mediaLeft + mediaRight) / 2 > slideWidth / 2;

          const lines: CompLine[] = [
            { axis: "v", pos: mediaLeft },
            { axis: "v", pos: mediaRight },
            { axis: "h", pos: mediaTop },
            { axis: "h", pos: mediaBottom },
          ];

          // Text hierarchy: title → tagline/subtitle → body (vertical sides)
          const textRef =
            slideEl.querySelector<HTMLElement>('[data-el$="-title"]') ||
            slideEl.querySelector<HTMLElement>('[data-el$="-subtitle"]') ||
            slideEl.querySelector<HTMLElement>('[data-el$="-body"]');

          if (textRef) {
            const tr = textRef.getBoundingClientRect();
            lines.push(
              { axis: "v", pos: (tr.left - sr.left) / scale },
              { axis: "v", pos: (tr.right - sr.left) / scale }
            );
          }

          // Text column edge facing media — where the gap begins
          const compTextCol = slideEl.querySelector<HTMLElement>(".hero-slide__text-col");
          if (compTextCol) {
            const tc = compTextCol.getBoundingClientRect();
            lines.push({
              axis: "v",
              pos: mediaOnRight
                ? (tc.right - sr.left) / scale
                : (tc.left - sr.left) / scale,
            });
          }

          // Symmetric line: mirror of media outer edge offset
          const mediaOuterOffset = mediaOnRight
            ? slideWidth - mediaRight
            : mediaLeft;
          lines.push({
            axis: "v",
            pos: mediaOnRight ? mediaOuterOffset : slideWidth - mediaOuterOffset,
          });

          // CTA: horizontal line at its bottom edge
          const ctaEl = slideEl.querySelector<HTMLElement>(".hero-slide__cta");
          if (ctaEl) {
            const cr = ctaEl.getBoundingClientRect();
            if (cr.height) {
              lines.push({ axis: "h", pos: (cr.bottom - sr.top) / scale });
            }
          }

          setCompGuides(lines);
        }
      } else {
        setCompGuides([]);
      }

      // Layout guides: gap vertical line + configurable bottom horizontal line
      if (showLayoutGuides) {
        const lgTextCol = slideEl.querySelector<HTMLElement>(".hero-slide__text-col");
        const lgMediaCol = slideEl.querySelector<HTMLElement>(".hero-slide__media-col");
        const ltc = lgTextCol?.getBoundingClientRect();
        const lmc = lgMediaCol?.getBoundingClientRect();
        let gapX: number | undefined;
        if (ltc && lmc && ltc.width && lmc.width) {
          gapX = lmc.left > ltc.left
            ? (ltc.right - sr.left) / scale
            : (lmc.right - sr.left) / scale;
        }
        const offsetPx = parseFloat(layoutGuideBottomOffset ?? "") || 0;
        const bottomY = offsetPx > 0 ? sr.height / scale - offsetPx : undefined;
        setLayoutGuideLines((prev) =>
          prev.gapX === gapX && prev.bottomY === bottomY ? prev : { gapX, bottomY }
        );
      } else {
        setLayoutGuideLines((prev) => (prev.gapX === undefined && prev.bottomY === undefined ? prev : {}));
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(slideEl);
    const media = slideEl.querySelector<HTMLElement>(".hero-slide__media-box");
    if (media) ro.observe(media);
    const textCol = slideEl.querySelector<HTMLElement>(".hero-slide__text-col");
    if (textCol) ro.observe(textCol);
    if (showElementGuides) {
      slideEl.querySelectorAll<HTMLElement>("[data-el]").forEach((el) => {
        ro.observe(el);
      });
    }
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measureNeeded, showGuides, showElementGuides, showCompositionGuides, showLayoutGuides, layoutGuideBottomOffset, slide]);

  const slideClass = cn(
    "hero-slide",
    `hero-slide--${template}`,
    mobileImageFirst && "hero-slide--mobile-image-first",
    (desktopLayout.textAlignFullWidth || (editMode && desktopLayout.dragIgnoreGap)) && "hs-text-wide",
    slide?.stretchTextToMedia && "hero-slide--copy-stretch",
    (showGuides || showElementGuides || showCompositionGuides || showStyleGuides) && "hero-slide--with-guides"
  );

  // ── Canvas guideline overlay (pure CSS — no DOM measurement needed) ──────────
  const classicGrid = canvasGuidelines?.classicGrid;
  const hasClassicGrid = !!(classicGrid?.enabled);
  const hasFigmaGuidelines =
    !!(canvasGuidelines?.gapOffset) ||
    !!(canvasGuidelines?.baselineOffset) ||
    !!(canvasGuidelines?.italicBaselineOffset);

  const hasSliderHGuide = !!(canvasGuidelines?.sliderHorizontalGuide);
  const canvasOverlay = (hasClassicGrid || hasFigmaGuidelines || hasSliderHGuide) ? (
    <div className="hero-slide__guides" aria-hidden="true">
      {hasClassicGrid && (() => {
        const cols = Math.max(1, classicGrid!.columns ?? 6);
        const rows = Math.max(1, classicGrid!.rows ?? 4);
        const lineColor = classicGrid!.color ?? "rgba(56,189,248,0.45)";
        const centerColor = "rgba(72,199,72,0.75)";
        const marginPct = ((classicGrid!.marginPx ?? 0) / DESIGN_WIDTH_PX) * 100;
        const usable = 100 - 2 * marginPct;
        return (
          <>
            {/* Outer margin lines */}
            {classicGrid!.showMarginLines && marginPct > 0 && (
              <>
                <div className="hero-slide__guide hero-slide__guide--vertical"
                  style={{ left: `${marginPct}%`, background: centerColor, opacity: 1 }} />
                <div className="hero-slide__guide hero-slide__guide--vertical"
                  style={{ left: `${100 - marginPct}%`, background: centerColor, opacity: 1 }} />
              </>
            )}
            {/* Column dividers (within margins) */}
            {Array.from({ length: cols - 1 }, (_, k) => (
              <div
                key={`cg-col-${k}`}
                className="hero-slide__guide hero-slide__guide--vertical"
                style={{ left: `${marginPct + usable * (k + 1) / cols}%`, background: lineColor, opacity: 1 }}
              />
            ))}
            {/* Row dividers */}
            {Array.from({ length: rows - 1 }, (_, k) => (
              <div
                key={`cg-row-${k}`}
                className="hero-slide__guide hero-slide__guide--horizontal"
                style={{ top: `${(k + 1) / rows * 100}%`, background: lineColor, opacity: 1 }}
              />
            ))}
            {/* Vertical column centers — rendered in the DOM-measurement guides section below */}
            {/* Horizontal center line */}
            {classicGrid!.showHorizontalCenter && (
              <div
                className="hero-slide__guide hero-slide__guide--horizontal"
                style={{ top: "50%", background: centerColor, opacity: 1 }}
              />
            )}
          </>
        );
      })()}
      {/* Figma gap guideline — amber, from top */}
      {!!(canvasGuidelines?.gapOffset) && (
        <div
          className="hero-slide__guide hero-slide__guide--horizontal"
          style={{
            top: `${(canvasGuidelines!.gapOffset! / DESIGN_CANVAS_H) * 100}%`,
            background: "rgba(245,158,11,0.8)",
            opacity: 1,
          }}
        />
      )}
      {/* Figma baseline guideline — purple, from bottom */}
      {!!(canvasGuidelines?.baselineOffset) && (
        <div
          className="hero-slide__guide hero-slide__guide--horizontal"
          style={{
            top: `${((DESIGN_CANVAS_H - canvasGuidelines!.baselineOffset!) / DESIGN_CANVAS_H) * 100}%`,
            background: "rgba(139,92,246,0.8)",
            opacity: 1,
          }}
        />
      )}
      {/* Figma italic design-element baseline — teal, from bottom */}
      {!!(canvasGuidelines?.italicBaselineOffset) && (
        <div
          className="hero-slide__guide hero-slide__guide--horizontal"
          style={{
            top: `${((DESIGN_CANVAS_H - canvasGuidelines!.italicBaselineOffset!) / DESIGN_CANVAS_H) * 100}%`,
            background: "rgba(20,184,166,0.85)",
            opacity: 1,
          }}
        />
      )}
      {/* Full-slider-width horizontal guideline */}
      {hasSliderHGuide && (
        <div
          className="hero-slide__guide hero-slide__guide--horizontal"
          style={{
            top: canvasGuidelines!.sliderHorizontalGuide!,
            left: 0, right: 0,
            background: canvasGuidelines!.sliderHorizontalGuideColor ?? "rgba(255,100,180,0.8)",
            opacity: 1,
          }}
        />
      )}
    </div>
  ) : null;

  const styleGuidelineOverlay = showStyleGuides ? (
    <StyleGuidelineOverlay
      config={canvasGuidelines?.styleGuidelines ?? {}}
      mediaRect={mediaRect}
      italicFallbackOffset={canvasGuidelines?.italicBaselineOffset}
      imgSide={imageSide(template)}
      slideWidthPx={slideRef.current?.offsetWidth}
    />
  ) : null;

  const hasMediaGuides = showGuides && mediaRect;
  const hasMediaEdgeGuidesActive = showMediaEdgeGuides && mediaRect;
  const hasElementGuides = showElementGuides && elementRects.length > 0;
  const hasCompGuides = showCompositionGuides && compGuides.length > 0;
  const hasLayoutGuides = showLayoutGuides && (layoutGuideLines.gapX !== undefined || layoutGuideLines.bottomY !== undefined);
  const compGuideColor = compositionGuideColor || "rgba(255, 6, 102, 0.8)";
  const LAYOUT_GUIDE_COLOR = "#FF0066";
  const MEDIA_EDGE_COLOR = "rgba(239, 68, 68, 0.9)"; // amber

  // Media edge guides rendered separately at the highest z-index so the image cannot cover them.
  const mediaEdgeGuides = hasMediaEdgeGuidesActive ? (() => {
    const mr = mediaRect!;
    const h = mr.bottom - mr.top;
    const base: React.CSSProperties = { position: "absolute", background: MEDIA_EDGE_COLOR, pointerEvents: "none", zIndex: 100 };
    return (
      <>
        <div className="hero-slide__guide hero-slide__guide--vertical" style={{ ...base, top: 0, left: mr.left + 1,  width: 0.5, height: mr.top }} />
        <div className="hero-slide__guide hero-slide__guide--vertical" style={{ ...base, top: 0, left: mr.right + 1, width: 0.5, height: mr.top }} />
        <div className="hero-slide__guide hero-slide__guide--vertical" style={{ ...base, top: mr.bottom, left: mr.left + 1,  width: 0.5, height: mr.bottom }} />
        <div className="hero-slide__guide hero-slide__guide--vertical" style={{ ...base, top: mr.bottom, left: mr.right + 1, width: 0.5, height: mr.bottom }} />
      </>
    );
  })() : null;

  const guides = hasMediaGuides || hasElementGuides || hasCompGuides || hasLayoutGuides ? (
    <div className="hero-slide__guides" aria-hidden="true">
      {hasMediaGuides ? (
        <>
          <div className="hero-slide__guide hero-slide__guide--vertical" style={{ left: `${mediaRect!.left}px` }} />
          <div className="hero-slide__guide hero-slide__guide--vertical" style={{ left: `${mediaRect!.right}px` }} />
          <div className="hero-slide__guide hero-slide__guide--horizontal" style={{ top: `${mediaRect!.top}px` }} />
          <div className="hero-slide__guide hero-slide__guide--horizontal" style={{ top: `${mediaRect!.bottom}px` }} />
        </>
      ) : null}
      {hasElementGuides
        ? elementRects.map((r, idx) => (
            <React.Fragment key={`${r.key}-${idx}`}>
              <div className="hero-slide__guide hero-slide__guide--vertical hero-slide__guide--element" style={{ left: `${r.left}px` }} />
              <div className="hero-slide__guide hero-slide__guide--vertical hero-slide__guide--element" style={{ left: `${r.right}px` }} />
              <div className="hero-slide__guide hero-slide__guide--horizontal hero-slide__guide--element" style={{ top: `${r.top}px` }} />
              <div className="hero-slide__guide hero-slide__guide--horizontal hero-slide__guide--element" style={{ top: `${r.bottom}px` }} />
            </React.Fragment>
          ))
        : null}
      {hasCompGuides
        ? compGuides.map((line, idx) =>
            line.axis === "v" ? (
              <div
                key={`comp-${idx}`}
                className="hero-slide__guide hero-slide__guide--vertical"
                style={{ left: `${line.pos}px`, background: compGuideColor }}
              />
            ) : (
              <div
                key={`comp-${idx}`}
                className="hero-slide__guide hero-slide__guide--horizontal"
                style={{ top: `${line.pos}px`, background: compGuideColor }}
              />
            )
          )
        : null}
      {hasLayoutGuides ? (
        <>
          {layoutGuideLines.gapX !== undefined ? (
            <div
              className="hero-slide__guide hero-slide__guide--vertical"
              style={{ left: `${layoutGuideLines.gapX}px`, background: LAYOUT_GUIDE_COLOR, opacity: 1 }}
            />
          ) : null}
          {layoutGuideLines.bottomY !== undefined ? (
            <div
              className="hero-slide__guide hero-slide__guide--horizontal"
              style={{ top: `${layoutGuideLines.bottomY}px`, background: LAYOUT_GUIDE_COLOR, opacity: 1 }}
            />
          ) : null}
        </>
      ) : null}
    </div>
  ) : null;

  // Inline CSS vars for media-aligned text stretching: top/bottom insets equal
  // the media-box's distance from text-col content top/bottom (which excludes
  // hero-slide's own padding).
  const stretchInsets = stretchToMedia && mediaRect
    ? ({
        "--media-inset-top": `${mediaRect.stretchTop}px`,
        "--media-inset-bottom": `${mediaRect.stretchBottom}px`,
      } as React.CSSProperties)
    : undefined;

  // Drag handles only appear for migrated slides — legacy slides use flow layout until button click
  const effectiveDragMode = dragMode && slide.positioningMode === "absolute";

  const { editableProps, dragHandleProps, widthResizeHandleProps, lastWidthResizeRef } = useSlideElementEditor(slide, editMode, onSlideChange, dragMode, viewportProfile);

  // Listen for admin postMessages that require slide state access.
  // Uses adminMode (not editMode) so it works even when toolbox text/drag are off.
  useEffect(() => {
    if (!adminMode || !onSlideChange) return;
    const handler = (event: MessageEvent) => {
      const type = event.data?.type;
      if (type === "hero-slider-convert-to-absolute") {
        const slideEl = slideRef.current;
        if (!slideEl) return;
        const blockEl = slideEl.closest<HTMLElement>("[data-block-id]");
        if (blockEl?.dataset.blockId !== event.data?.blockId) return;
        onSlideChange(measureSlideToAbsolute(slideEl, slide, viewportProfile));
        if (window !== window.parent) {
          window.parent.postMessage({ type: "hero-slider-absolute-converted" }, "*");
        }
      }
      if (type === "scale-font-to-width") {
        const elementId = event.data?.elementId as string | undefined;
        const slideEl = slideRef.current;
        if (!slideEl || !elementId) return;

        // Find element in this slide by data-el attribute
        const dataEl = slideEl.querySelector<HTMLElement>(`[data-el="${CSS.escape(elementId)}"]`);
        if (!dataEl) return;

        // Walk up to the draggable wrapper to get the element key
        const draggable = dataEl.closest<HTMLElement>("[data-hs-draggable]");
        if (!draggable) return;
        const key = draggable.dataset.hsDraggable;
        if (!key) return;

        const es = mergeElementStyle(getSlideElementStyle(slide, key), viewportProfile);
        const explicitWidthStr = es?.width;
        if (!explicitWidthStr) return; // no explicit width — nothing to scale

        const explicitWidth = parseFloat(explicitWidthStr);
        if (!explicitWidth || explicitWidth <= 0) return;

        // Measure natural width by temporarily removing the inline width override
        const savedWidth = draggable.style.width;
        draggable.style.width = "";
        const naturalWidth = draggable.offsetWidth;
        draggable.style.width = savedWidth;

        if (!naturalWidth || naturalWidth <= 0 || naturalWidth === explicitWidth) return;

        const ratio = explicitWidth / naturalWidth;
        const currentSizePx = parseFloat(resolveDesignViewportUnits(es?.size) ?? "16") || 16;
        const newSizePx = Math.round(currentSizePx * ratio);

        // Scale font and clear explicit width in one update so Reset reverts both
        onSlideChange(setSlideElementViewportStyle(slide, key, viewportProfile, {
          size: `${newSizePx}px`,
          width: undefined,
        }));
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [adminMode, onSlideChange, slide, viewportProfile, lastWidthResizeRef]);

  const mediaPrimary = (
    <MediaFrame media={slide.media} className="hero-slide__media-box" slotId={`slide-${i}-media`} priority={i === 0} />
  );

  const _imgSide = imageSide(template);
  // columnCenterX: center of the text column in copy-main coordinates (layout px).
  // Measured directly from DOM so it works regardless of whether guides/mediaRect are active.
  const columnCenterX = (() => {
    if (_imgSide === "none" || !slideRef.current) return undefined;
    const slideEl = slideRef.current;
    const sr = slideEl.getBoundingClientRect();
    if (!sr.width) return undefined;
    const scale = sr.width / slideEl.offsetWidth || 1;
    const slideWidthPx = slideEl.offsetWidth;
    const outerMarginPx = 13;
    const textCol = slideEl.querySelector<HTMLElement>(".hero-slide__text-col");
    const tc = textCol?.getBoundingClientRect();
    if (!tc) return undefined;
    let rawCenter: number;
    if (_imgSide === "right") {
      const gapBoundaryPx = (tc.right - sr.left) / scale;
      rawCenter = (outerMarginPx + gapBoundaryPx) / 2;
    } else {
      const gapBoundaryPx = (tc.left - sr.left) / scale;
      rawCenter = (gapBoundaryPx + (slideWidthPx - outerMarginPx)) / 2;
    }
    const copyMain = slideEl.querySelector<HTMLElement>(".hero-slide__copy-main");
    if (!copyMain) return rawCenter;
    const cr = copyMain.getBoundingClientRect();
    return rawCenter - (cr.left - sr.left) / scale;
  })();

  const standardCopy = (
    <CopyStack
      slide={slide}
      slideIndex={i}
      spread={false}
      viewportProfile={viewportProfile}
      editableProps={editableProps}
      dragHandleProps={dragHandleProps}
      widthResizeHandleProps={effectiveDragMode ? widthResizeHandleProps : undefined}
      dragMode={effectiveDragMode}
      onSlideChange={editMode ? onSlideChange : undefined}
      columnCenterX={columnCenterX}
    />
  );

  const cta = slide?.cta;
  const imgSide = imageSide(template);
  const autoCtaAlign = imgSide === "left" ? "right" : "left";
  const ctaStyle = mergeElementStyle(slide.ctaStyle, viewportProfile);
  const ctaSide = ctaStyle?.align || autoCtaAlign;

  const rootStyle = { ...slideStyle(slide, viewportProfile), ...(stretchInsets ?? {}) };

  if (template === "full-image") {
    return (
      <div ref={slideRef} className={slideClass} style={rootStyle}>
        <div className="hero-slide__media-col hero-slide__media-col--full">
          {mediaPrimary}
        </div>
        {canvasOverlay}
        {guides}
        {styleGuidelineOverlay}
        {mediaEdgeGuides}
      </div>
    );
  }

  return (
    <div ref={slideRef} className={slideClass} style={rootStyle}>
      <div className="hero-slide__text-col">
        {standardCopy}
      </div>

      <div className="hero-slide__media-col">
        {mediaPrimary}
      </div>

      {canvasOverlay}
      {guides}
      {styleGuidelineOverlay}
      {mediaEdgeGuides}

      {cta?.href && cta?.enabled !== false ? (
        <a
          href={cta.href}
          target={cta.target === "_blank" ? "_blank" : undefined}
          rel={cta.target === "_blank" ? "noopener noreferrer" : undefined}
          {...editableProps("cta", cn("hero-slide__cta", `hero-slide__cta--${ctaSide}`))}
          data-el={`slide-${i}-cta`}
          style={elStyle(ctaStyle)}
          onClick={(e) => {
            if (isDragging) e.preventDefault();
          }}
        >
          {cta?.label ?? "LEARN MORE"}
        </a>
      ) : null}
    </div>
  );
}

function getSlideElementStyle(slide: Slide, key: string): ElementStyle | undefined {
  if (key === "title") return slide.titleStyle;
  if (key === "subtitle") return slide.subtitleStyle;
  if (key === "kicker") return slide.kickerStyle;
  if (key === "body") return slide.bodyStyle;
  if (key === "quote") return slide.quoteStyle;
  if (key === "cta") return slide.ctaStyle;
  return slide.extras?.find((extra) => extra.id === key)?.style;
}

function setSlideElementStyle(slide: Slide, key: string, style: ElementStyle): Slide {
  if (key === "title") return { ...slide, titleStyle: style };
  if (key === "subtitle") return { ...slide, subtitleStyle: style };
  if (key === "kicker") return { ...slide, kickerStyle: style };
  if (key === "body") return { ...slide, bodyStyle: style };
  if (key === "quote") return { ...slide, quoteStyle: style };
  if (key === "cta") return { ...slide, ctaStyle: style };
  const extras = Array.isArray(slide.extras) ? slide.extras : [];
  return {
    ...slide,
    extras: extras.map((extra) => extra.id === key ? { ...extra, style } : extra),
  };
}

function setSlideElementViewportStyle(
  slide: Slide,
  key: string,
  profile: HeroViewportProfileKey | null | undefined,
  patch: ElementStyleProfile,
): Slide {
  const current = getSlideElementStyle(slide, key) ?? {};
  const baseNext: ElementStyle = {
    ...current,
    ...patch,
  };
  if (!profile) return setSlideElementStyle(slide, key, baseNext);
  return setSlideElementStyle(slide, key, {
    ...baseNext,
    viewportProfiles: {
      ...(current.viewportProfiles ?? {}),
      [profile]: {
        ...(current.viewportProfiles?.[profile] ?? {}),
        ...patch,
      },
    },
  });
}

/** Canonical ordered key list for a slide, respecting elementOrder overrides. */
function buildSlideOrderedKeys(slide: Slide): string[] {
  const extras = Array.isArray(slide.extras) ? slide.extras : [];
  const fixed: string[] = [];
  if (slide.kicker !== undefined) fixed.push("kicker");
  fixed.push("title");
  if (slide.subtitle !== undefined) fixed.push("subtitle");
  if (slide.body !== undefined) fixed.push("body");
  if (slide.quote !== undefined) fixed.push("quote");
  const all = [...fixed, ...extras.map((e) => e.id ?? "")];
  const stored = slide.elementOrder ?? [];
  const allSet = new Set(all);
  const used = new Set<string>();
  return [
    ...stored.filter((k) => allSet.has(k) && !used.has(k) && (used.add(k), true)),
    ...all.filter((k) => !used.has(k)),
  ];
}

/** Sum of mt values of all elements rendered BEFORE key in the slide's ordered list.
 *  Used to correct edit-mode transform positioning so it matches CSS flow layout. */
function getPrecedingMt(slide: Slide, targetKey: string): number {
  let sum = 0;
  for (const k of buildSlideOrderedKeys(slide)) {
    if (k === targetKey) break;
    sum += parseFloat(getSlideElementStyle(slide, k)?.mt ?? "0") || 0;
  }
  return sum;
}

/** After dragging `afterKey`, preserve every subsequent element's absolute visual position.
 *  For each element X after afterKey:
 *    oldAbsY = X.oldMt + getPrecedingMt(original, X)
 *    X.newMt  = oldAbsY - getPrecedingMt(result_so_far, X)
 *  Because getPrecedingMt(result, X) is computed from the incrementally-updated state,
 *  locked elements between `afterKey` and X are handled correctly — their own correction
 *  propagates forward without double-compensating later elements.
 *  Pass skipKeys to skip group members that the caller already positioned explicitly. */
function preserveVisualPositions(
  original: Slide,
  current: Slide,
  afterKey: string,
  skipKeys?: Set<string>,
): Slide {
  let result = current;
  let compensating = false;
  for (const k of buildSlideOrderedKeys(original)) {
    if (k === afterKey) { compensating = true; continue; }
    if (!compensating) continue;
    if (skipKeys?.has(k)) continue;
    const origStyle = getSlideElementStyle(original, k) ?? {};
    const oldMt = parseFloat(origStyle.mt ?? "0") || 0;
    const oldAbsY = oldMt + getPrecedingMt(original, k);
    const newPrecedingMt = getPrecedingMt(result, k);
    const newMt = Math.round(oldAbsY - newPrecedingMt);
    result = setSlideElementStyle(result, k, {
      ...getSlideElementStyle(result, k) ?? {},
      mt: newMt !== 0 ? `${newMt}px` : undefined,
    });
  }
  return result;
}

/** Edit-mode positioning: position:absolute so elements are independent (no cascade).
 *  For legacy slides (no positioningMode) adds getPrecedingMt so visual matches live flow. */
function absPositionStyle(slide: Slide, key: string, es?: ElementStyle, columnCenterX?: number): React.CSSProperties {
  const mtPx = parseFloat(resolveDesignViewportUnits(es?.mt) ?? "0") || 0;
  const mlPx = parseFloat(resolveDesignViewportUnits(es?.ml) ?? "0") || 0;
  const xPx  = parseFloat(resolveDesignViewportUnits(es?.x)  ?? "0") || 0;
  const yPx  = parseFloat(resolveDesignViewportUnits(es?.y)  ?? "0") || 0;
  const top  = slide.positioningMode === "absolute"
    ? mtPx + yPx
    : mtPx + yPx + getPrecedingMt(slide, key);
  const left = mlPx + xPx;
  const s: Record<string, string> = { position: "absolute", top: `${top}px` };

  if (es?.align === "center") {
    if (columnCenterX != null) {
      // DOM-measured text-column center — exact, matches Canvas center vertical guideline.
      s.left = `${columnCenterX}px`;
    } else {
      // Fallback: formula-based approximation when DOM measurement is unavailable.
      const desktop = mergeDesktopLayout(slide);
      const gapPx = parseFloat(resolveDesignViewportUnits(desktop.gap) ?? "0") || 0;
      const outerPadPx = parseFloat(resolveDesignViewportUnits(desktop.outerPadding) ?? "0") || 0;
      const side = imageSide(resolveTemplate(slide));
      const dir = side === "right" ? 1 : side === "left" ? -1 : 0;
      let offsetPx = 0;
      if (es.alignMode === "1") offsetPx = dir * gapPx / 2;
      else if (es.alignMode === "2") offsetPx = dir * (outerPadPx + gapPx) / 2;
      else if (es.alignMode === "4") offsetPx = dir * outerPadPx / 2;
      s.left = offsetPx ? `calc(50% + ${offsetPx}px)` : "50%";
    }
    s.transform = "translateX(-50%)";
    s.textAlign = "center";
    s.width = "max-content"; // prevent shrink-to-fit left edge from wrapping text
  } else if (es?.align === "right") {
    s.left = "0";
    s.right = "0";
    s.textAlign = "right";
  } else {
    s.left = `${left}px`;
    if (es?.align) s.textAlign = es.align;
  }
  if (es?.size) s.fontSize = resolveDesignViewportUnits(es.size)!;
  if (es?.strokeW) s["--text-stroke-w"] = resolveDesignViewportUnits(es.strokeW)!;
  if (es?.pt) s.paddingTop = resolveDesignViewportUnits(es.pt)!;
  if (es?.pb) s.paddingBottom = resolveDesignViewportUnits(es.pb)!;
  if (es?.useFontOffset && es?.typo) {
    const offsetVal = getTypoOffset(es.typo);
    if (offsetVal) s.paddingBottom = offsetVal;
  }
  if (es?.width && es?.align !== "right") s.width = es.width;
  return s as React.CSSProperties;
}

function textContentStyle(es?: ElementStyle): React.CSSProperties | undefined {
  if (!es) return undefined;
  const s: Record<string, string> = {};
  if (es.size) {
    const fontSize = resolveDesignViewportUnits(es.size)!;
    const sizePx = parseFloat(fontSize);
    s.fontSize = fontSize;
    if (Number.isFinite(sizePx) && fontSize.endsWith("px")) {
      const ratio =
        es.typo === "typo-homepage-header" ? 126 / 104 :
        es.typo === "typo-subtitle" ? 60 / 47 :
        es.typo === "typo-hero-title" ? 0.92 :
        86 / 78;
      s.lineHeight = `${Math.round(sizePx * ratio)}px`;
    }
  }
  if (es.strokeW) s["--text-stroke-w"] = resolveDesignViewportUnits(es.strokeW)!;
  return Object.keys(s).length ? (s as React.CSSProperties) : undefined;
}

/** Converts a legacy flow slide to absolute positioning on first drag.
 *  Each element's new mt = old mt + y + getPrecedingMt (= its absolute Y from top of copy-main).
 *  Idempotent: if positioningMode is already "absolute", returns slide unchanged. */
function migrateSlideToAbsolute(slide: Slide): Slide {
  if (slide.positioningMode === "absolute") return slide;
  let result = { ...slide };
  for (const k of buildSlideOrderedKeys(slide)) {
    const es = getSlideElementStyle(slide, k);
    if (!es) continue;
    const mtPx = parseFloat(resolveDesignViewportUnits(es.mt) ?? "0") || 0;
    const yPx  = parseFloat(resolveDesignViewportUnits(es.y)  ?? "0") || 0;
    const mlPx = parseFloat(resolveDesignViewportUnits(es.ml) ?? "0") || 0;
    const xPx  = parseFloat(resolveDesignViewportUnits(es.x)  ?? "0") || 0;
    const newMt = Math.round(mtPx + yPx + getPrecedingMt(slide, k));
    const newMl = Math.round(mlPx + xPx);
    result = setSlideElementStyle(result, k, {
      ...es,
      mt: newMt !== 0 ? `${newMt}px` : undefined,
      ml: newMl !== 0 ? `${newMl}px` : undefined,
      x: undefined,
      y: undefined,
    });
  }
  return { ...result, positioningMode: "absolute" as const };
}

/** Measures actual DOM positions of each draggable element relative to copy-main
 *  and stores them as absolute mt/ml, clearing x/y offsets.
 *  Used by the "Перенести на absolute" button which needs pixel-accurate positions. */
function measureSlideToAbsolute(
  slideEl: HTMLElement,
  slide: Slide,
  viewportProfile?: HeroViewportProfileKey | null,
): Slide {
  const copyMain = slideEl.querySelector<HTMLElement>(".hero-slide__copy-main");
  if (!copyMain) return migrateSlideToAbsolute(slide);
  const copyRect = copyMain.getBoundingClientRect();
  if (!copyRect.width) return migrateSlideToAbsolute(slide);
  const scale = copyRect.width / copyMain.offsetWidth || 1;
  let result: Slide = { ...slide };
  for (const k of buildSlideOrderedKeys(slide)) {
    const el = slideEl.querySelector<HTMLElement>(`[data-hs-draggable="${CSS.escape(k)}"]`);
    const currentStyle = getSlideElementStyle(slide, k) ?? {};
    if (!el) {
      result = setSlideElementStyle(result, k, { ...currentStyle, x: undefined, y: undefined });
      continue;
    }
    const elRect = el.getBoundingClientRect();
    const mt = Math.round((elRect.top - copyRect.top) / scale);
    const ml = Math.round((elRect.left - copyRect.left) / scale);
    result = setSlideElementViewportStyle(result, k, viewportProfile, {
      mt: mt !== 0 ? `${mt}px` : undefined,
      ml: ml !== 0 ? `${ml}px` : undefined,
      x: undefined,
      y: undefined,
    });
  }
  return { ...result, positioningMode: "absolute" as const };
}

/**
 * Route to the right positioning style depending on context:
 * - absolute slides (already migrated): position:absolute top/left in all contexts
 * - legacy slides: margin-based flow (same as live site) — migrate via "Перенести на absolute" button
 */
function posStyle(
  slide: Slide, key: string, es?: ElementStyle, _isEdit?: boolean, columnCenterX?: number,
): React.CSSProperties | undefined {
  if (slide.positioningMode === "absolute") return absPositionStyle(slide, key, es, columnCenterX);
  return elStyle(es) ?? undefined;
}

const DRAG_HANDLE_STYLE: React.CSSProperties = {
  position: "absolute",
  top: 2,
  right: 2,
  width: 18,
  height: 18,
  cursor: "grab",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(99,102,241,0.75)",
  borderRadius: 3,
  color: "rgba(255,255,255,0.9)",
  fontSize: 11,
  zIndex: 100,
  touchAction: "none",
  userSelect: "none",
  lineHeight: 1,
  flexShrink: 0,
};

function DragHandle(props: React.HTMLAttributes<HTMLSpanElement>) {
  return <span style={DRAG_HANDLE_STYLE} title="Drag to move" {...props}>⠿</span>;
}

const WIDTH_RESIZE_HANDLE_STYLE: React.CSSProperties = {
  position: "absolute",
  bottom: 2,
  left: 2,
  width: 16,
  height: 16,
  cursor: "ew-resize",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(34,197,94,0.8)",
  borderRadius: 3,
  color: "rgba(255,255,255,0.9)",
  fontSize: 10,
  zIndex: 100,
  touchAction: "none",
  userSelect: "none",
  lineHeight: 1,
  flexShrink: 0,
};

function WidthResizeHandle(props: React.HTMLAttributes<HTMLSpanElement>) {
  return <span style={WIDTH_RESIZE_HANDLE_STYLE} title="Drag to resize width" {...props}>↔</span>;
}

function useSlideElementEditor(
  slide: Slide,
  editMode: boolean,
  onSlideChange?: (next: Slide) => void,
  dragMode = true,
  viewportProfile?: HeroViewportProfileKey | null,
) {
  type GroupStart = { tx: number; ty: number; el: HTMLElement };
  // Always-current ref so drag handlers read the latest slide even if re-rendered after pointer-down
  const slideRef = useRef(slide);
  slideRef.current = slide;
  const onSlideChangeRef = useRef(onSlideChange);
  onSlideChangeRef.current = onSlideChange;
  const dragRef = useRef<{
    key: string;
    mode: "move" | "resize" | "width-resize";
    startX: number;
    startY: number;
    startTx: number;
    startTy: number;
    startSize: number;
    startWidth: number;
    scale: number;
    moved: boolean;
    groupStarts?: Map<string, GroupStart>;
  } | null>(null);
  const lastWidthResizeRef = useRef<{ key: string; orig: number; curr: number } | null>(null);

  // Props for a dedicated drag handle child — applies transform to closest [data-hs-draggable]
  function dragHandleProps(key: string): React.HTMLAttributes<HTMLElement> {
    if (!editMode || !onSlideChange || !dragMode) return {};
    const currentStyle = getSlideElementStyle(slide, key);
    if (currentStyle?.locked) return {};

    return {
      onPointerDown: (e) => {
        if (slideRef.current.positioningMode !== "absolute") return;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        const handle = e.currentTarget as HTMLElement;
        const el = handle.closest<HTMLElement>("[data-hs-draggable]");
        if (!el) return;
        const slideEl = el.closest(".hero-slide") as HTMLElement | null;
        const scale = slideEl ? slideEl.getBoundingClientRect().width / slideEl.offsetWidth || 1 : 1;
        const computed = getComputedStyle(el);
        const matrix = new DOMMatrix(computed.transform === "none" ? "" : computed.transform);
        handle.setPointerCapture(e.pointerId);
        el.classList.add("hero-slide__editable--dragging");

        // Collect group-member starting transforms for live group drag
        let groupStarts: Map<string, GroupStart> | undefined;
        const groupId = getSlideElementStyle(slideRef.current, key)?.groupId;
        if (groupId && slideEl) {
          groupStarts = new Map();
          slideEl.querySelectorAll<HTMLElement>("[data-hs-draggable]").forEach((member) => {
            if (member === el) return;
            const memberKey = member.dataset.hsDraggable ?? "";
            if (!memberKey) return;
            const ms = getSlideElementStyle(slideRef.current, memberKey);
            if (ms?.groupId !== groupId || ms.locked) return;
            const mc = getComputedStyle(member);
            const mm = new DOMMatrix(mc.transform === "none" ? "" : mc.transform);
            groupStarts!.set(memberKey, { tx: mm.m41 || 0, ty: mm.m42 || 0, el: member });
          });
        }

        dragRef.current = {
          key, mode: "move",
          startX: e.clientX, startY: e.clientY,
          startTx: matrix.m41 || 0, startTy: matrix.m42 || 0,
          startSize: parseFloat(computed.fontSize || "0") || 16,
          startWidth: 0,
          scale, moved: false, groupStarts,
        };
      },
      onPointerMove: (e) => {
        const d = dragRef.current;
        if (!d || d.key !== key) return;
        e.stopPropagation();
        const dx = (e.clientX - d.startX) / d.scale;
        const dy = (e.clientY - d.startY) / d.scale;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) d.moved = true;
        if (!d.moved) return;
        const el = (e.currentTarget as HTMLElement).closest<HTMLElement>("[data-hs-draggable]");
        if (!el) return;
        el.style.transform = `translate(${Math.round(d.startTx + dx)}px, ${Math.round(d.startTy + dy)}px)`;
        // Move group members in sync
        d.groupStarts?.forEach(({ tx, ty, el: gEl }) => {
          gEl.style.transform = `translate(${Math.round(tx + dx)}px, ${Math.round(ty + dy)}px)`;
        });
      },
      onPointerUp: (e) => {
        const d = dragRef.current;
        dragRef.current = null;
        const el = (e.currentTarget as HTMLElement).closest<HTMLElement>("[data-hs-draggable]");
        if (!d || d.key !== key || !d.moved) {
          if (el) { el.classList.remove("hero-slide__editable--dragging"); el.style.transform = ""; }
          return;
        }
        e.stopPropagation();
        const dx = Math.round((e.clientX - d.startX) / d.scale);
        const dy = Math.round((e.clientY - d.startY) / d.scale);

        // Gather DOM measurements for snap-aligned elements BEFORE resetting transforms
        const slideEl = el?.closest(".hero-slide") as HTMLElement | null;
        const copyMain = slideEl?.querySelector<HTMLElement>(".hero-slide__copy-main");
        const copyRect = copyMain?.getBoundingClientRect();
        const sc = copyRect && copyMain ? copyRect.width / copyMain.offsetWidth || 1 : 1;
        const measureEl = (memberEl: HTMLElement, memberKey: string): { ml: number; mt: number; clear: boolean } => {
          const memberSnap = getSlideElementStyle(slideRef.current, memberKey)?.align;
          const clear = memberSnap === "center" || memberSnap === "right";
          if (clear && copyRect && memberEl) {
            const er = memberEl.getBoundingClientRect();
            return { ml: Math.round((er.left - copyRect.left) / sc), mt: Math.round((er.top - copyRect.top) / sc), clear };
          }
          return { ml: 0, mt: 0, clear: false };
        };

        // Leader key measurement
        const leaderMeasure = el ? measureEl(el, key) : { ml: 0, mt: 0, clear: false };
        // Group members measurement
        const memberMeasures = new Map<string, { ml: number; mt: number; clear: boolean }>();
        d.groupStarts?.forEach(({ el: gEl }, k) => { memberMeasures.set(k, measureEl(gEl, k)); });

        // Reset transforms
        if (el) { el.classList.remove("hero-slide__editable--dragging"); el.style.transform = ""; }
        d.groupStarts?.forEach(({ el: gEl }) => { gEl.style.transform = ""; });

        const migratedSlide = migrateSlideToAbsolute(slideRef.current);

        if (d.groupStarts && d.groupStarts.size > 0) {
          const allGroupKeys = new Set([key, ...d.groupStarts.keys()]);
          let updated = migratedSlide;
          for (const k of buildSlideOrderedKeys(migratedSlide)) {
            if (!allGroupKeys.has(k)) continue;
            const m = k === key ? leaderMeasure : memberMeasures.get(k);
            let newMl: number;
            let newMt: number;
            if (m?.clear) {
              newMl = m.ml;
              newMt = m.mt;
            } else {
              const ms = mergeElementStyle(getSlideElementStyle(migratedSlide, k), viewportProfile) ?? {};
              newMl = (parseFloat(ms.ml ?? "0") || 0) + dx;
              newMt = (parseFloat(ms.mt ?? "0") || 0) + dy;
            }
            updated = setSlideElementViewportStyle(updated, k, viewportProfile, {
              ml: newMl !== 0 ? `${newMl}px` : undefined,
              mt: newMt !== 0 ? `${newMt}px` : undefined,
              x: undefined, y: undefined,
              ...(m?.clear ? { align: undefined } : {}),
            });
          }
          onSlideChangeRef.current!(updated);
        } else {
          let newMl: number;
          let newMt: number;
          if (leaderMeasure.clear) {
            newMl = leaderMeasure.ml;
            newMt = leaderMeasure.mt;
          } else {
            const style = mergeElementStyle(getSlideElementStyle(migratedSlide, key), viewportProfile) ?? {};
            newMl = (parseFloat(style.ml ?? "0") || 0) + dx;
            newMt = (parseFloat(style.mt ?? "0") || 0) + dy;
          }
          onSlideChangeRef.current!(setSlideElementViewportStyle(migratedSlide, key, viewportProfile, {
            ml: newMl !== 0 ? `${newMl}px` : undefined,
            mt: newMt !== 0 ? `${newMt}px` : undefined,
            x: undefined, y: undefined,
            ...(leaderMeasure.clear ? { align: undefined } : {}),
          }));
        }
      },
      onPointerCancel: (e) => {
        const d = dragRef.current;
        dragRef.current = null;
        if (!d || d.key !== key) return;
        const el = (e.currentTarget as HTMLElement).closest<HTMLElement>("[data-hs-draggable]");
        if (!el) return;
        el.classList.remove("hero-slide__editable--dragging");
        el.style.transform = (d.startTx || d.startTy)
          ? `translate(${d.startTx}px, ${d.startTy}px)` : "";
        // Revert group members
        d.groupStarts?.forEach(({ tx, ty, el: gEl }) => {
          gEl.style.transform = (tx || ty) ? `translate(${tx}px, ${ty}px)` : "";
        });
      },
    };
  }

  function editableProps(key: string, className?: string): React.HTMLAttributes<HTMLElement> {
    if (!editMode || !onSlideChange) return { className };
    const elStyle = getSlideElementStyle(slide, key);
    if (elStyle?.locked) {
      return {
        className: cn(className, "hero-slide__editable hero-slide__editable--locked"),
        ...(dragMode ? {
          onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
            e.stopPropagation();
            const el = e.currentTarget as HTMLElement;
            el.querySelectorAll("[data-hs-lock-flash]").forEach(n => n.remove());
            const flash = document.createElement("span");
            flash.setAttribute("data-hs-lock-flash", "1");
            flash.textContent = "🔒";
            Object.assign(flash.style, {
              position: "absolute", top: "2px", right: "2px",
              background: "rgba(239,68,68,0.85)", borderRadius: "3px",
              padding: "2px 4px", fontSize: "12px", zIndex: "200",
              pointerEvents: "none", lineHeight: "1", transition: "opacity 0.3s",
            });
            el.appendChild(flash);
            setTimeout(() => { flash.style.opacity = "0"; setTimeout(() => flash.remove(), 300); }, 1200);
          },
        } : {}),
      };
    }

    return {
      className: cn(className, "hero-slide__editable"),
      tabIndex: 0,
      role: "button",
      "aria-label": "Drag to position slide element. Drag the bottom-right handle to resize.",
      onPointerDown: (e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;

        const el = e.currentTarget as HTMLElement;
        const rect = el.getBoundingClientRect();
        const isResize = e.clientX >= rect.right - 16 && e.clientY >= rect.bottom - 16;

        // Send element-clicked for admin panel selection regardless of mode
        const blockEl = el.closest<HTMLElement>("[data-block-id]");
        const blockId = blockEl?.dataset.blockId;
        const elementId = el.dataset.el;
        if (blockId && elementId && window !== window.parent) {
          window.parent.postMessage({ type: "element-clicked", blockId, elementId }, "*");
        }

        // Legacy slides: no drag, let event bubble so slider can swipe
        if (!isResize && slideRef.current.positioningMode !== "absolute") return;

        // Always stop slider from swiping on absolute elements
        e.stopPropagation();

        // Text-edit mode (canvas drag off, not resize): let default through so TipTap gets focus
        if (!isResize && !dragMode) return;

        e.preventDefault();

        const slideEl = el.closest(".hero-slide") as HTMLElement | null;
        const scale = slideEl ? slideEl.getBoundingClientRect().width / slideEl.offsetWidth || 1 : 1;
        const computed = getComputedStyle(el);
        const matrix = new DOMMatrix(computed.transform === "none" ? "" : computed.transform);

        el.setPointerCapture(e.pointerId);
        el.classList.add(isResize ? "hero-slide__editable--resizing" : "hero-slide__editable--dragging");

        // Collect group-member starting transforms (same as dragHandleProps)
        let groupStarts: Map<string, GroupStart> | undefined;
        if (!isResize) {
          const groupId = getSlideElementStyle(slideRef.current, key)?.groupId;
          if (groupId && slideEl) {
            groupStarts = new Map();
            slideEl.querySelectorAll<HTMLElement>("[data-hs-draggable]").forEach((member) => {
              if (member === el) return;
              const memberKey = member.dataset.hsDraggable ?? "";
              if (!memberKey) return;
              const ms = getSlideElementStyle(slideRef.current, memberKey);
              if (ms?.groupId !== groupId || ms.locked) return;
              const mc = getComputedStyle(member);
              const mm = new DOMMatrix(mc.transform === "none" ? "" : mc.transform);
              groupStarts!.set(memberKey, { tx: mm.m41 || 0, ty: mm.m42 || 0, el: member });
            });
          }
        }

        dragRef.current = {
          key,
          mode: isResize ? "resize" : "move",
          startX: e.clientX,
          startY: e.clientY,
          startTx: matrix.m41 || 0,
          startTy: matrix.m42 || 0,
          startSize: parseFloat(computed.fontSize || "0") || 16,
          startWidth: el.offsetWidth,
          scale,
          moved: false,
          groupStarts,
        };
      },
      onPointerMove: (e) => {
        const d = dragRef.current;
        if (!d || d.key !== key) return;
        e.stopPropagation();

        const dx = (e.clientX - d.startX) / d.scale;
        const dy = (e.clientY - d.startY) / d.scale;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) d.moved = true;
        if (!d.moved) return;

        const el = e.currentTarget as HTMLElement;
        if (d.mode === "resize") {
          const nextSize = Math.max(6, Math.round(d.startSize + (dx + dy) / 2));
          el.style.fontSize = `${nextSize}px`;
          return;
        }

        const newTx = Math.round(d.startTx + dx);
        const newTy = Math.round(d.startTy + dy);
        el.style.transform = `translate(${newTx}px, ${newTy}px)`;
        // Move group members in sync
        d.groupStarts?.forEach(({ tx, ty, el: gEl }) => {
          gEl.style.transform = `translate(${Math.round(tx + dx)}px, ${Math.round(ty + dy)}px)`;
        });
      },
      onPointerUp: (e) => {
        const d = dragRef.current;
        dragRef.current = null;
        const el = e.currentTarget as HTMLElement;
        el.classList.remove("hero-slide__editable--dragging", "hero-slide__editable--resizing");
        if (!d || d.key !== key || !d.moved) { el.style.transform = ""; return; }
        e.stopPropagation();
        const dx = Math.round((e.clientX - d.startX) / d.scale);
        const dy = Math.round((e.clientY - d.startY) / d.scale);
        if (d.mode === "resize") {
          el.style.transform = "";
          const nextSize = Math.max(6, Math.round(d.startSize + (dx + dy) / 2));
          onSlideChangeRef.current!(setSlideElementViewportStyle(slideRef.current, key, viewportProfile, { size: `${nextSize}px` }));
          return;
        }
        // Measure snap-aligned elements from DOM before resetting transforms
        const slideEl2 = el.closest(".hero-slide") as HTMLElement | null;
        const copyMain2 = slideEl2?.querySelector<HTMLElement>(".hero-slide__copy-main");
        const copyRect2 = copyMain2?.getBoundingClientRect();
        const sc2 = copyRect2 && copyMain2 ? copyRect2.width / copyMain2.offsetWidth || 1 : 1;
        const measureEl2 = (memberEl: HTMLElement, memberKey: string) => {
          const memberSnap = getSlideElementStyle(slideRef.current, memberKey)?.align;
          const clear = memberSnap === "center" || memberSnap === "right";
          if (clear && copyRect2) {
            const er = memberEl.getBoundingClientRect();
            return { ml: Math.round((er.left - copyRect2.left) / sc2), mt: Math.round((er.top - copyRect2.top) / sc2), clear };
          }
          return { ml: 0, mt: 0, clear: false };
        };
        const leaderM = measureEl2(el, key);
        const memberMs = new Map<string, { ml: number; mt: number; clear: boolean }>();
        d.groupStarts?.forEach(({ el: gEl }, k) => memberMs.set(k, measureEl2(gEl, k)));
        // Reset transforms
        el.style.transform = "";
        d.groupStarts?.forEach(({ el: gEl }) => { gEl.style.transform = ""; });
        const migratedSlide = migrateSlideToAbsolute(slideRef.current);
        if (d.groupStarts && d.groupStarts.size > 0) {
          const allGroupKeys = new Set([key, ...d.groupStarts.keys()]);
          let updated = migratedSlide;
          for (const k of buildSlideOrderedKeys(migratedSlide)) {
            if (!allGroupKeys.has(k)) continue;
            const m = k === key ? leaderM : memberMs.get(k);
            let newMl: number, newMt: number;
            if (m?.clear) { newMl = m.ml; newMt = m.mt; }
            else {
              const ms = mergeElementStyle(getSlideElementStyle(migratedSlide, k), viewportProfile) ?? {};
              newMl = (parseFloat(ms.ml ?? "0") || 0) + dx;
              newMt = (parseFloat(ms.mt ?? "0") || 0) + dy;
            }
            updated = setSlideElementViewportStyle(updated, k, viewportProfile, {
              ml: newMl !== 0 ? `${newMl}px` : undefined,
              mt: newMt !== 0 ? `${newMt}px` : undefined,
              x: undefined, y: undefined,
              ...(m?.clear ? { align: undefined } : {}),
            });
          }
          onSlideChangeRef.current!(updated);
        } else {
          let newMl: number, newMt: number;
          if (leaderM.clear) { newMl = leaderM.ml; newMt = leaderM.mt; }
          else {
            const style = mergeElementStyle(getSlideElementStyle(migratedSlide, key), viewportProfile) ?? {};
            newMl = (parseFloat(style.ml ?? "0") || 0) + dx;
            newMt = (parseFloat(style.mt ?? "0") || 0) + dy;
          }
          onSlideChangeRef.current!(setSlideElementViewportStyle(migratedSlide, key, viewportProfile, {
            ml: newMl !== 0 ? `${newMl}px` : undefined,
            mt: newMt !== 0 ? `${newMt}px` : undefined,
            x: undefined, y: undefined,
            ...(leaderM.clear ? { align: undefined } : {}),
          }));
        }
      },
      onPointerCancel: (e) => {
        const d = dragRef.current;
        dragRef.current = null;
        if (!d || d.key !== key) return;
        const el = e.currentTarget as HTMLElement;
        el.classList.remove("hero-slide__editable--dragging", "hero-slide__editable--resizing");
        el.style.transform = "";
        el.style.fontSize = `${d.startSize}px`;
        d.groupStarts?.forEach(({ tx, ty, el: gEl }) => {
          gEl.style.transform = (tx || ty) ? `translate(${tx}px, ${ty}px)` : "";
        });
      },
      onKeyDown: (e) => {
        if (slideRef.current.positioningMode !== "absolute") return;
        const deltaByKey: Record<string, [number, number]> = {
          ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
        };
        const delta = deltaByKey[e.key];
        if (!delta) return;
        e.preventDefault();
        e.stopPropagation();
        const step = e.shiftKey ? 10 : 1;
        const migratedSlide = migrateSlideToAbsolute(slideRef.current);
        const currentStyle = mergeElementStyle(getSlideElementStyle(migratedSlide, key), viewportProfile) ?? {};
        const currentMl = parseFloat(currentStyle.ml ?? "0") || 0;
        const currentMt = parseFloat(currentStyle.mt ?? "0") || 0;
        const nextMl = Math.round(currentMl + delta[0] * step);
        const nextMt = Math.round(currentMt + delta[1] * step);
        // Horizontal arrow keys release center/right snap so ml takes effect
        const isHorizontal = delta[0] !== 0;
        const snapAlign = currentStyle.align;
        const clearAlign = isHorizontal && (snapAlign === "center" || snapAlign === "right");
        onSlideChangeRef.current!(setSlideElementViewportStyle(migratedSlide, key, viewportProfile, {
          ml: nextMl !== 0 ? `${nextMl}px` : undefined,
          mt: nextMt !== 0 ? `${nextMt}px` : undefined,
          x: undefined, y: undefined,
          ...(clearAlign ? { align: undefined } : {}),
        }));
      },
    };
  }

  // Width-resize handle props — lower-left corner handle that changes element width
  function widthResizeHandleProps(key: string): React.HTMLAttributes<HTMLElement> {
    if (!editMode || !onSlideChange || !dragMode) return {};
    const currentStyle = getSlideElementStyle(slide, key);
    if (currentStyle?.locked) return {};

    return {
      onPointerDown: (e) => {
        if (slideRef.current.positioningMode !== "absolute") return;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        const handle = e.currentTarget as HTMLElement;
        const el = handle.closest<HTMLElement>("[data-hs-draggable]");
        if (!el) return;
        const slideEl = el.closest(".hero-slide") as HTMLElement | null;
        const scale = slideEl ? slideEl.getBoundingClientRect().width / slideEl.offsetWidth || 1 : 1;
        handle.setPointerCapture(e.pointerId);
        el.classList.add("hero-slide__editable--resizing");
        dragRef.current = {
          key, mode: "width-resize",
          startX: e.clientX, startY: e.clientY,
          startTx: 0, startTy: 0,
          startSize: 0, startWidth: el.offsetWidth,
          scale, moved: false,
        };
      },
      onPointerMove: (e) => {
        const d = dragRef.current;
        if (!d || d.key !== key || d.mode !== "width-resize") return;
        e.stopPropagation();
        const dx = (e.clientX - d.startX) / d.scale;
        if (Math.abs(dx) > 2) d.moved = true;
        if (!d.moved) return;
        const el = (e.currentTarget as HTMLElement).closest<HTMLElement>("[data-hs-draggable]");
        if (!el) return;
        el.style.width = `${Math.max(50, Math.round(d.startWidth + dx))}px`;
      },
      onPointerUp: (e) => {
        const d = dragRef.current;
        dragRef.current = null;
        const el = (e.currentTarget as HTMLElement).closest<HTMLElement>("[data-hs-draggable]");
        if (!d || d.key !== key || d.mode !== "width-resize") {
          if (el) { el.classList.remove("hero-slide__editable--resizing"); el.style.width = ""; }
          return;
        }
        e.stopPropagation();
        if (el) { el.classList.remove("hero-slide__editable--resizing"); el.style.width = ""; }
        if (!d.moved) return;
        const dx = Math.round((e.clientX - d.startX) / d.scale);
        const newWidth = Math.max(50, d.startWidth + dx);
        lastWidthResizeRef.current = { key, orig: d.startWidth, curr: newWidth };
        onSlideChangeRef.current!(setSlideElementViewportStyle(slideRef.current, key, viewportProfile, { width: `${newWidth}px` }));
      },
      onPointerCancel: (e) => {
        const d = dragRef.current;
        dragRef.current = null;
        if (!d || d.key !== key || d.mode !== "width-resize") return;
        const el = (e.currentTarget as HTMLElement).closest<HTMLElement>("[data-hs-draggable]");
        if (!el) return;
        el.classList.remove("hero-slide__editable--resizing");
        el.style.width = "";
      },
    };
  }

  return { editableProps, dragHandleProps, widthResizeHandleProps, lastWidthResizeRef };
}

function CopyStack({
  slide,
  slideIndex,
  spread,
  viewportProfile,
  editableProps,
  dragHandleProps,
  widthResizeHandleProps,
  dragMode = true,
  onSlideChange,
  columnCenterX,
}: {
  slide: Slide;
  slideIndex: number;
  spread?: boolean;
  viewportProfile?: HeroViewportProfileKey | null;
  editableProps: (key: string, className?: string) => React.HTMLAttributes<HTMLElement>;
  dragHandleProps: (key: string) => React.HTMLAttributes<HTMLElement>;
  widthResizeHandleProps?: (key: string) => React.HTMLAttributes<HTMLElement>;
  dragMode?: boolean;
  onSlideChange?: (next: Slide) => void;
  columnCenterX?: number;
}) {
  const kicker = slide?.kicker;
  const quote = slide?.quote;
  const title = slide?.title ?? "";
  const subtitle = slide?.subtitle;
  const body = slide?.body;
  const extras = Array.isArray(slide?.extras) ? slide.extras : [];
  const extraById = new Map(extras.map(e => [e.id ?? "", e]));
  const extraIndexById = new Map(extras.map((e, i) => [e.id ?? "", i]));

  const activeFixed: string[] = [
    ...(kicker != null ? ["kicker"] : []),
    ...(title ? ["title"] : []),
    ...(subtitle != null ? ["subtitle"] : []),
    ...(body != null ? ["body"] : []),
    ...(quote != null ? ["quote"] : []),
  ];
  const extraKeys = extras.map(e => e.id ?? "");
  const defaultOrder = [...activeFixed, ...extraKeys];

  const stored = slide?.elementOrder;
  let orderedKeys: string[];
  if (stored && stored.length > 0) {
    const knownSet = new Set(defaultOrder);
    const used = new Set<string>();
    orderedKeys = [
      ...stored.filter(k => knownSet.has(k) && !used.has(k) && (used.add(k), true)),
      ...defaultOrder.filter(k => !used.has(k)),
    ];
  } else {
    orderedKeys = defaultOrder;
  }

  const makeAlignChange = (!dragMode && onSlideChange)
    ? (key: string, _es: ElementStyle | undefined) =>
        (align: "left" | "center" | "right" | undefined) =>
          onSlideChange(setSlideElementViewportStyle(slide, key, viewportProfile, { align }))
    : null;

  const makeTypoChange = (!dragMode && onSlideChange)
    ? (key: string, _es: ElementStyle | undefined) =>
        (typo: string) =>
          onSlideChange(setSlideElementViewportStyle(slide, key, viewportProfile, { typo: typo || undefined }))
    : null;

  function renderElement(key: string) {
    if (key === "kicker" && kicker) {
      const es = mergeElementStyle(slide.kickerStyle, viewportProfile);
      if (es?.hidden) return null;
      const typo = es?.typo;
      const s = posStyle(slide, "kicker", es, !!onSlideChange, columnCenterX);
      if (onSlideChange && slide.positioningMode === "absolute") {
        const isLocked = !!es?.locked;
        return (
          <div
            key="kicker"
            {...editableProps("kicker", cn(isLocked && "hero-slide__editable--locked", typo || undefined))}
            data-hs-draggable="kicker"
            style={s}
            data-el={`slide-${slideIndex}-kicker`}
          >
            {!isLocked && dragMode && widthResizeHandleProps && <WidthResizeHandle {...widthResizeHandleProps("kicker")} />}
            <TipTapInline value={kicker} onChange={dragMode ? undefined : (html) => onSlideChange({ ...slide, kicker: html })} multiline={false} typoClass={typo} typoOptions={TYPO_PRESETS} fontOffsetEnabled={!!es?.useFontOffset} currentFontHasOffset={!!getTypoOffset(typo)} onFontOffsetToggle={dragMode ? undefined : () => onSlideChange({ ...slide, kickerStyle: { ...(es ?? {}), useFontOffset: !es?.useFontOffset } })} onElementAlignChange={makeAlignChange?.("kicker", es)} elementAlign={es?.align} onElementTypoChange={makeTypoChange?.("kicker", es)} />
          </div>
        );
      }
      return (
        <div key="kicker" className={typo || undefined} style={s} data-el={`slide-${slideIndex}-kicker`} data-hs-draggable={onSlideChange ? "kicker" : undefined}>
          <SlideKicker text={kicker} />
        </div>
      );
    }
    if (key === "title" && title) {
      const titleEs = mergeElementStyle(slide.titleStyle, viewportProfile);
      if (titleEs?.hidden) return null;
      const titleTypo = titleEs?.typo;
      const titleStyle = posStyle(slide, "title", titleEs, !!onSlideChange, columnCenterX);
      const titleClass = cn("hero-slide__title", titleTypo);
      const isTitleStamp = !titleTypo || titleTypo === "typo-content-header" || titleTypo === "typo-homepage-header" || titleTypo === "typo-subtitle";
      if (onSlideChange && slide.positioningMode === "absolute") {
        const isTitleLocked = !!titleEs?.locked;
        if (isTitleStamp) {
          return (
            <div
              key="title"
              {...editableProps("title", isTitleLocked ? "hero-slide__editable--locked" : undefined)}
              data-hs-draggable="title"
              style={titleStyle}
            >
              {!isTitleLocked && dragMode && widthResizeHandleProps && <WidthResizeHandle {...widthResizeHandleProps("title")} />}
              <OutlineStampText className={titleClass} data-el={`slide-${slideIndex}-title`} stamp={stampForTypo(titleTypo)} style={textContentStyle(titleEs)} shadowContent={renderRichText(title)}>
                <TipTapInline value={title} onChange={dragMode ? undefined : (html) => onSlideChange({ ...slide, title: html })} typoClass={titleTypo} typoOptions={TYPO_PRESETS} fontOffsetEnabled={!!titleEs?.useFontOffset} currentFontHasOffset={!!getTypoOffset(titleTypo)} onFontOffsetToggle={dragMode ? undefined : () => onSlideChange({ ...slide, titleStyle: { ...(titleEs ?? {}), useFontOffset: !titleEs?.useFontOffset } })} onElementAlignChange={makeAlignChange?.("title", titleEs)} elementAlign={titleEs?.align} onElementTypoChange={makeTypoChange?.("title", titleEs)} />
              </OutlineStampText>
            </div>
          );
        }
        return (
          <div
            key="title"
            {...editableProps("title", isTitleLocked ? "hero-slide__editable--locked" : undefined)}
            data-hs-draggable="title"
            style={titleStyle}
          >
            {!isTitleLocked && dragMode && <DragHandle {...dragHandleProps("title")} />}
            {!isTitleLocked && dragMode && widthResizeHandleProps && <WidthResizeHandle {...widthResizeHandleProps("title")} />}
            <p className={titleClass} data-el={`slide-${slideIndex}-title`} style={textContentStyle(titleEs)}>
              <TipTapInline value={title} onChange={dragMode ? undefined : (html) => onSlideChange({ ...slide, title: html })} typoClass={titleTypo} typoOptions={TYPO_PRESETS} fontOffsetEnabled={!!titleEs?.useFontOffset} currentFontHasOffset={!!getTypoOffset(titleTypo)} onFontOffsetToggle={dragMode ? undefined : () => onSlideChange({ ...slide, titleStyle: { ...(titleEs ?? {}), useFontOffset: !titleEs?.useFontOffset } })} onElementAlignChange={makeAlignChange?.("title", titleEs)} elementAlign={titleEs?.align} onElementTypoChange={makeTypoChange?.("title", titleEs)} />
            </p>
          </div>
        );
      }
      if (isTitleStamp) {
        if (!onSlideChange && slide.positioningMode === "absolute") {
          return (
            <div key="title" style={titleStyle} data-hs-draggable={undefined}>
              <OutlineStampText className={titleClass} data-el={`slide-${slideIndex}-title`} stamp={stampForTypo(titleTypo)} style={textContentStyle(titleEs)}>
                {renderRichText(title)}
              </OutlineStampText>
            </div>
          );
        }
        return (
          <OutlineStampText key="title" className={titleClass} data-el={`slide-${slideIndex}-title`} stamp={stampForTypo(titleTypo)} style={titleStyle} data-hs-draggable={onSlideChange ? "title" : undefined}>
            {renderRichText(title)}
          </OutlineStampText>
        );
      }
      if (!onSlideChange && slide.positioningMode === "absolute") {
        return (
          <div key="title" style={titleStyle} data-hs-draggable={undefined}>
            <div className={titleClass} data-el={`slide-${slideIndex}-title`} style={textContentStyle(titleEs)}>
              {renderRichText(title)}
            </div>
          </div>
        );
      }
      return (
        <div key="title" className={titleClass} data-el={`slide-${slideIndex}-title`} style={titleStyle} data-hs-draggable={onSlideChange ? "title" : undefined}>
          {renderRichText(title)}
        </div>
      );
    }
    if (key === "subtitle" && subtitle) {
      const es = mergeElementStyle(slide.subtitleStyle, viewportProfile);
      if (es?.hidden) return null;
      const typo = es?.typo;
      const s = posStyle(slide, "subtitle", es, !!onSlideChange, columnCenterX);
      if (onSlideChange && slide.positioningMode === "absolute") {
        const isLocked = !!es?.locked;
        return (
          <div
            key="subtitle"
            {...editableProps("subtitle", cn(isLocked && "hero-slide__editable--locked", typo || undefined))}
            data-hs-draggable="subtitle"
            style={s}
            data-el={`slide-${slideIndex}-subtitle`}
          >
            {!isLocked && dragMode && widthResizeHandleProps && <WidthResizeHandle {...widthResizeHandleProps("subtitle")} />}
            <TipTapInline value={subtitle} onChange={dragMode ? undefined : (html) => onSlideChange({ ...slide, subtitle: html })} typoClass={typo} typoOptions={TYPO_PRESETS} fontOffsetEnabled={!!es?.useFontOffset} currentFontHasOffset={!!getTypoOffset(typo)} onFontOffsetToggle={dragMode ? undefined : () => onSlideChange({ ...slide, subtitleStyle: { ...(es ?? {}), useFontOffset: !es?.useFontOffset } })} onElementAlignChange={makeAlignChange?.("subtitle", es)} elementAlign={es?.align} onElementTypoChange={makeTypoChange?.("subtitle", es)} />
          </div>
        );
      }
      return (
        <div key="subtitle" className={typo || undefined} style={s} data-el={`slide-${slideIndex}-subtitle`} data-hs-draggable={onSlideChange ? "subtitle" : undefined}>
          <SlideSubtitle text={subtitle} variant={slide?.subtitleVariant} slotId={`slide-${slideIndex}-subtitle`} />
        </div>
      );
    }
    if (key === "body" && body) {
      const es = mergeElementStyle(slide.bodyStyle, viewportProfile);
      if (es?.hidden) return null;
      const typo = es?.typo;
      const s = posStyle(slide, "body", es, !!onSlideChange, columnCenterX);
      if (onSlideChange && slide.positioningMode === "absolute") {
        const isLocked = !!es?.locked;
        return (
          <div
            key="body"
            {...editableProps("body", cn(isLocked && "hero-slide__editable--locked", typo || undefined))}
            data-hs-draggable="body"
            style={s}
            data-el={`slide-${slideIndex}-body`}
          >
            {!isLocked && dragMode && widthResizeHandleProps && <WidthResizeHandle {...widthResizeHandleProps("body")} />}
            <TipTapInline value={body} onChange={dragMode ? undefined : (html) => onSlideChange({ ...slide, body: html })} typoClass={typo} typoOptions={TYPO_PRESETS} showWordCount fontOffsetEnabled={!!es?.useFontOffset} currentFontHasOffset={!!getTypoOffset(typo)} onFontOffsetToggle={dragMode ? undefined : () => onSlideChange({ ...slide, bodyStyle: { ...(es ?? {}), useFontOffset: !es?.useFontOffset } })} onElementAlignChange={makeAlignChange?.("body", es)} elementAlign={es?.align} onElementTypoChange={makeTypoChange?.("body", es)} />
          </div>
        );
      }
      return (
        <div key="body" className={typo || undefined} style={s} data-el={`slide-${slideIndex}-body`} data-hs-draggable={onSlideChange ? "body" : undefined}>
          <SlideBody text={body} variant={slide?.bodyVariant} />
        </div>
      );
    }
    if (key === "quote" && quote) {
      const es = mergeElementStyle(slide.quoteStyle, viewportProfile);
      if (es?.hidden) return null;
      const typo = es?.typo;
      const s = posStyle(slide, "quote", es, !!onSlideChange, columnCenterX);
      const cls = cn("hero-slide__quote", typo);
      if (onSlideChange && slide.positioningMode === "absolute") {
        const isLocked = !!es?.locked;
        return (
          <div
            key="quote"
            {...editableProps("quote", cn(isLocked && "hero-slide__editable--locked", cls))}
            data-hs-draggable="quote"
            style={s}
            data-el={`slide-${slideIndex}-quote`}
          >
            {!isLocked && dragMode && widthResizeHandleProps && <WidthResizeHandle {...widthResizeHandleProps("quote")} />}
            <TipTapInline value={quote} onChange={dragMode ? undefined : (html) => onSlideChange({ ...slide, quote: html })} typoClass={typo} typoOptions={TYPO_PRESETS} fontOffsetEnabled={!!es?.useFontOffset} currentFontHasOffset={!!getTypoOffset(typo)} onFontOffsetToggle={dragMode ? undefined : () => onSlideChange({ ...slide, quoteStyle: { ...(es ?? {}), useFontOffset: !es?.useFontOffset } })} onElementAlignChange={makeAlignChange?.("quote", es)} elementAlign={es?.align} onElementTypoChange={makeTypoChange?.("quote", es)} />
          </div>
        );
      }
      return (
        <div key="quote" className={cls} style={s} data-el={`slide-${slideIndex}-quote`} data-hs-draggable={onSlideChange ? "quote" : undefined}>
          {renderRichText(quote)}
        </div>
      );
    }
    const extra = extraById.get(key);
    if (extra) {
      const exIdx = extraIndexById.get(key) ?? 0;
      return (
        <ExtraElement
          key={key}
          extra={extra}
          slideIndex={slideIndex}
          extraIndex={exIdx}
          viewportProfile={viewportProfile}
          editableProps={editableProps}
          dragHandleProps={dragHandleProps}
          widthResizeHandleProps={widthResizeHandleProps}
          dragMode={dragMode}
          slide={slide}
          onSlideChange={onSlideChange}
          columnCenterX={columnCenterX}
        />
      );
    }
    return null;
  }

  return (
    <div className={cn("hero-slide__copy", spread && "hero-slide__copy--spread")}>
      <div className="hero-slide__copy-main">
        {orderedKeys.map(key => renderElement(key))}
      </div>
    </div>
  );
}

function ExtraElement({
  extra,
  slideIndex,
  extraIndex,
  viewportProfile,
  editableProps,
  dragHandleProps,
  widthResizeHandleProps,
  dragMode = true,
  slide,
  onSlideChange,
  columnCenterX,
}: {
  extra: SlideExtra;
  slideIndex: number;
  extraIndex: number;
  viewportProfile?: HeroViewportProfileKey | null;
  editableProps?: (key: string, className?: string) => React.HTMLAttributes<HTMLElement>;
  dragHandleProps?: (key: string) => React.HTMLAttributes<HTMLElement>;
  widthResizeHandleProps?: (key: string) => React.HTMLAttributes<HTMLElement>;
  dragMode?: boolean;
  slide?: Slide;
  onSlideChange?: (next: Slide) => void;
  columnCenterX?: number;
}) {
  const resolvedStyle = mergeElementStyle(extra.style, viewportProfile);
  if (resolvedStyle?.hidden) return null;
  const extraKey = extra.id ?? "";
  const inEditMode = !!(onSlideChange && slide && slide.positioningMode === "absolute");
  const style = slide ? posStyle(slide, extraKey, resolvedStyle, inEditMode, columnCenterX) : elStyle(resolvedStyle);
  const typo = resolvedStyle?.typo;
  const slotId = `slide-${slideIndex}-extra-${extraIndex}`;
  const isLocked = !!resolvedStyle?.locked;
  const updateText = !dragMode && inEditMode
    ? (html: string) => {
        const extras = Array.isArray(slide!.extras) ? slide!.extras : [];
        onSlideChange!({ ...slide!, extras: extras.map(e => e.id === extra.id ? { ...e, text: html } : e) });
      }
    : null;
  const extraFontOffsetEnabled = !!extra.style?.useFontOffset;
  const extraFontHasOffset = !!getTypoOffset(typo);
  const onExtraFontOffsetToggle = !dragMode && inEditMode
    ? () => {
        const extras = Array.isArray(slide!.extras) ? slide!.extras : [];
        onSlideChange!({ ...slide!, extras: extras.map(e => e.id === extra.id ? { ...e, style: { ...(e.style ?? {}), useFontOffset: !e.style?.useFontOffset } } : e) });
      }
    : undefined;
  const onExtraAlignChange = !dragMode && inEditMode
    ? (align: "left" | "center" | "right" | undefined) => {
        onSlideChange!(setSlideElementViewportStyle(slide!, extra.id!, viewportProfile, { align }));
      }
    : undefined;
  const onExtraTypoChange = !dragMode && inEditMode
    ? (cls: string) => {
        onSlideChange!(setSlideElementViewportStyle(slide!, extra.id!, viewportProfile, { typo: cls || undefined }));
      }
    : undefined;

  if (extra.kind === "stamp") {
    const cls = cn("hero-slide__title", typo);
    if (inEditMode) {
      return (
        <div
          {...(editableProps?.(extraKey, isLocked ? "hero-slide__editable--locked" : undefined) ?? { className: cn("hero-slide__editable", isLocked && "hero-slide__editable--locked") })}
          data-hs-draggable={extraKey}
          style={style}
        >
          <OutlineStampText className={cls} data-el={slotId} stamp={stampForTypo(typo)} style={textContentStyle(resolvedStyle)} shadowContent={renderRichText(extra.text)}>
            <TipTapInline value={extra.text} onChange={updateText ?? undefined} typoClass={typo} typoOptions={TYPO_PRESETS} fontOffsetEnabled={extraFontOffsetEnabled} currentFontHasOffset={extraFontHasOffset} onFontOffsetToggle={onExtraFontOffsetToggle} onElementAlignChange={onExtraAlignChange} elementAlign={resolvedStyle?.align} onElementTypoChange={onExtraTypoChange} />
          </OutlineStampText>
        </div>
      );
    }
    if (!onSlideChange && slide?.positioningMode === "absolute") {
      return (
        <div style={style}>
          <OutlineStampText
            className={cls}
            data-el={slotId}
            stamp={stampForTypo(typo)}
            style={textContentStyle(resolvedStyle)}
          >
            {renderRichText(extra.text)}
          </OutlineStampText>
        </div>
      );
    }
    return (
      <OutlineStampText
        className={cls}
        data-el={slotId}
        stamp={stampForTypo(typo)}
        style={style}
        data-hs-draggable={onSlideChange ? extraKey : undefined}
      >
        {renderRichText(extra.text)}
      </OutlineStampText>
    );
  }

  if (extra.kind === "kicker") {
    if (inEditMode) {
      return (
        <div
          {...(editableProps?.(extraKey, cn(isLocked && "hero-slide__editable--locked", typo || undefined)) ?? { className: cn("hero-slide__editable", isLocked && "hero-slide__editable--locked", typo || undefined) })}
          data-hs-draggable={extraKey}
          style={style}
          data-el={slotId}
        >
          <Kicker><TipTapInline value={extra.text} onChange={updateText ?? undefined} multiline={false} typoClass={typo} typoOptions={TYPO_PRESETS} fontOffsetEnabled={extraFontOffsetEnabled} currentFontHasOffset={extraFontHasOffset} onFontOffsetToggle={onExtraFontOffsetToggle} onElementAlignChange={onExtraAlignChange} elementAlign={resolvedStyle?.align} onElementTypoChange={onExtraTypoChange} /></Kicker>
        </div>
      );
    }
    return (
      <div
        className={typo || undefined}
        style={style}
        data-el={slotId}
        data-hs-draggable={onSlideChange ? extraKey : undefined}
      >
        <Kicker>{renderRichText(extra.text)}</Kicker>
      </div>
    );
  }

  // Stamp-type typo → render identically to title so --hs-title-size CSS var applies
  const TITLE_TYPOS = new Set(["typo-content-header", "typo-homepage-header", "typo-subtitle", "typo-hero-title"]);
  if (typo && TITLE_TYPOS.has(typo)) {
    const cls = cn("hero-slide__title", typo);
    if (inEditMode) {
      return (
        <div
          {...(editableProps?.(extraKey, isLocked ? "hero-slide__editable--locked" : undefined) ?? { className: cn("hero-slide__editable", isLocked && "hero-slide__editable--locked") })}
          data-hs-draggable={extraKey}
          style={style}
        >
          <OutlineStampText className={cls} data-el={slotId} stamp={stampForTypo(typo)} style={textContentStyle(resolvedStyle)} shadowContent={renderRichText(extra.text)}>
            <TipTapInline value={extra.text} onChange={updateText ?? undefined} typoClass={typo} typoOptions={TYPO_PRESETS} fontOffsetEnabled={extraFontOffsetEnabled} currentFontHasOffset={extraFontHasOffset} onFontOffsetToggle={onExtraFontOffsetToggle} onElementAlignChange={onExtraAlignChange} elementAlign={resolvedStyle?.align} onElementTypoChange={onExtraTypoChange} />
          </OutlineStampText>
        </div>
      );
    }
    if (!onSlideChange && slide?.positioningMode === "absolute") {
      return (
        <div style={style}>
          <OutlineStampText
            className={cls}
            data-el={slotId}
            stamp={stampForTypo(typo)}
            style={textContentStyle(resolvedStyle)}
          >
            {renderRichText(extra.text)}
          </OutlineStampText>
        </div>
      );
    }
    return (
      <OutlineStampText
        className={cls}
        data-el={slotId}
        stamp={stampForTypo(typo)}
        style={style}
        data-hs-draggable={onSlideChange ? extraKey : undefined}
      >
        {renderRichText(extra.text)}
      </OutlineStampText>
    );
  }

  const cls = cn("hero-slide__quote", typo);
  if (inEditMode) {
    return (
      <div
        {...(editableProps?.(extraKey, cn(isLocked && "hero-slide__editable--locked", cls)) ?? { className: cn("hero-slide__editable", isLocked && "hero-slide__editable--locked", cls) })}
        data-hs-draggable={extraKey}
        style={style}
        data-el={slotId}
      >
        {!isLocked && dragMode && dragHandleProps && <DragHandle {...dragHandleProps(extraKey)} />}
        {!isLocked && dragMode && widthResizeHandleProps && <WidthResizeHandle {...widthResizeHandleProps(extraKey)} />}
        <TipTapInline value={extra.text} onChange={updateText ?? undefined} typoClass={typo} typoOptions={TYPO_PRESETS} fontOffsetEnabled={extraFontOffsetEnabled} currentFontHasOffset={extraFontHasOffset} onFontOffsetToggle={onExtraFontOffsetToggle} />
      </div>
    );
  }
  return (
    <div
      className={cls}
      style={style}
      data-el={slotId}
      data-hs-draggable={onSlideChange ? extraKey : undefined}
    >
      {renderRichText(extra.text)}
    </div>
  );
}

function SlideKicker({
  text,
}: {
  text: string;
}) {
  return <div className="hero-slide__kicker">{renderRichText(text)}</div>;
}

function SlideSubtitle({
  text,
  variant,
  slotId,
}: {
  text: string;
  variant?: TextVariant;
  slotId: string;
}) {
  if (variant === "stamp") {
    // return (
    //   <OutlineStampText
    //     className="hero-slide__subtitle"
    //     data-el={slotId}
    //     stamp={STAMP_SUBTITLE}
    //   >
    //     {text}
    //   </OutlineStampText>
    // );
  }

  return (
    <div className="hero-slide__subtitle" data-el={slotId}>
      {renderRichText(text)}
    </div>
  );
}

function SlideBody({
  text,
  variant,
}: {
  text: string;
  variant?: BodyVariant;
}) {
  const cls = variant === "list"
    ? "hero-slide__body hero-slide__body--list"
    : "hero-slide__body hero-slide__body--plain";
  return <div className={cls}>{renderRichText(text)}</div>;
}

function MediaFrame({
  media,
  className,
  slotId,
  priority = false,
}: {
  media?: SlideMedia;
  className?: string;
  slotId: string;
  priority?: boolean;
}) {
  const src = media?.src;
  const ratioLabel = media?.aspectRatio?.replace(/\s+/g, "") ?? "";
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Pre-decode on mount so that swapping to this slide is jank-free.
  // All slides live in the DOM at once (carousel track), so we can warm them in advance.
  useEffect(() => {
    const img = imgRef.current;
    if (!img || !src) return;
    if (img.complete) {
      img.decode?.().catch(() => {});
    } else {
      const onLoad = () => { img.decode?.().catch(() => {}); };
      img.addEventListener("load", onLoad, { once: true });
      return () => img.removeEventListener("load", onLoad);
    }
  }, [src]);

  return (
    <div className={cn(className, !src && "hero-slide__media-box--placeholder")} data-el={slotId}>
      {src ? (
        <img
          ref={imgRef}
          src={src}
          alt={media?.alt ?? ""}
          className="hero-slide__media-img"
          loading="eager"
          decoding="async"
          fetchPriority={priority ? "high" : "low"}
          draggable={false}
        />
      ) : ratioLabel ? (
        <span className="hero-slide__media-ratio" aria-hidden>{ratioLabel}</span>
      ) : null}
    </div>
  );
}
