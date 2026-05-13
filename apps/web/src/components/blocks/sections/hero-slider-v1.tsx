"use client";

import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Container, Hairline, Kicker, OutlineStampText, STAMP_TITLE, STAMP_SECTION_TITLE, STAMP_SUBTITLE } from "@/components/landing/ui";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { InlineText } from "./inline-icons";
import { TipTapInline, renderRichText } from "@/components/rich-text";
import { TYPO_PRESETS } from "@/lib/typo-presets";

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
  groupId?: string; // group identifier for moving elements together
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
  showVerticalCenter?: boolean;
  showHorizontalCenter?: boolean;
  color?: string;
};

type CanvasGuidelines = {
  gapOffset?: number;            // px from top in design canvas (574px total)
  baselineOffset?: number;       // px from bottom in design canvas
  italicBaselineOffset?: number; // px from bottom in design canvas
  classicGrid?: ClassicGridSettings;
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
 *  Keeps elements in normal flow (position:relative) so initial layout is preserved,
 *  but folds ml/mt/x/y into a single transform — margin changes don't push siblings. */
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
  return { position: "relative", ...s } as React.CSSProperties;
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
  const viewportProfile = useHeroViewportProfile();

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
    // In edit mode the slide itself must not swipe — element drag handles stopPropagation themselves
    if (editMode) return;
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
                    editMode={editMode && !isClone && realIndex === active}
                    dragMode={options?.enableCanvasDrag !== false}
                    onSlideChange={(nextSlide) => updateSlide(rawSlideIndex, nextSlide)}
                    showGuides={showGuides}
                    showElementGuides={showElementGuides}
                    showCompositionGuides={showCompositionGuides}
                    compositionGuideColor={compositionGuideColor}
                    showLayoutGuides={showLayoutGuides}
                    layoutGuideBottomOffset={layoutGuideBottomOffset}
                    canvasGuidelines={canvasGuidelines}
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
    </section>
  );
}

function HeroSlide({
  slide,
  isDragging,
  slideIndex: i,
  editMode = false,
  dragMode = true,
  onSlideChange,
  showGuides = false,
  showElementGuides = false,
  showCompositionGuides = false,
  compositionGuideColor,
  showLayoutGuides = false,
  layoutGuideBottomOffset,
  canvasGuidelines,
  viewportProfile,
}: {
  slide: Slide;
  isDragging: boolean;
  slideIndex: number;
  editMode?: boolean;
  dragMode?: boolean;
  onSlideChange?: (next: Slide) => void;
  showGuides?: boolean;
  showElementGuides?: boolean;
  showCompositionGuides?: boolean;
  compositionGuideColor?: string;
  showLayoutGuides?: boolean;
  layoutGuideBottomOffset?: string;
  canvasGuidelines?: CanvasGuidelines;
  viewportProfile?: HeroViewportProfileKey | null;
}) {
  const template = resolveTemplate(slide, viewportProfile);
  const mobileImageFirst = !!slide?.layout?.mobile?.imageFirst;
  const stretchToMedia = !!slide?.stretchTextToMedia;
  const desktopLayout = mergeDesktopLayout(slide, viewportProfile);
  const slideRef = useRef<HTMLDivElement>(null);
  type MediaRect = {
    /** Media-box rect relative to the slide root — used for guide-line overlay. */
    left: number;
    right: number;
    top: number;
    bottom: number;
    height: number;
    /** Media-box vertical insets relative to the text-col content box —
     *  used to align `.hero-slide__copy` padding with the media's actual edges
     *  (NOT the slide outer edges, which include hero-slide padding). */
    stretchTop: number;
    stretchBottom: number;
  };
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
  const measureNeeded = showGuides || showElementGuides || stretchToMedia || showCompositionGuides || showLayoutGuides;

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
          const next: MediaRect = {
            left: (mr.left - sr.left) / scale,
            right: (mr.right - sr.left) / scale,
            top: (mr.top - sr.top) / scale,
            bottom: (mr.bottom - sr.top) / scale,
            height: sr.height / scale,
            stretchTop: Math.max(0, (mr.top - refTop) / scale),
            stretchBottom: Math.max(0, (refBottom - mr.bottom) / scale),
          };
          // Skip state update if nothing changed to avoid ResizeObserver feedback loop.
          setMediaRect((prev) =>
            prev &&
            prev.left === next.left && prev.right === next.right &&
            prev.top === next.top && prev.bottom === next.bottom &&
            prev.stretchTop === next.stretchTop && prev.stretchBottom === next.stretchBottom
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
    (showGuides || showElementGuides || showCompositionGuides) && "hero-slide--with-guides"
  );

  // ── Canvas guideline overlay (pure CSS — no DOM measurement needed) ──────────
  const classicGrid = canvasGuidelines?.classicGrid;
  const hasClassicGrid = !!(classicGrid?.enabled);
  const hasFigmaGuidelines =
    !!(canvasGuidelines?.gapOffset) ||
    !!(canvasGuidelines?.baselineOffset) ||
    !!(canvasGuidelines?.italicBaselineOffset);

  const canvasOverlay = (hasClassicGrid || hasFigmaGuidelines) ? (
    <div className="hero-slide__guides" aria-hidden="true">
      {hasClassicGrid && (() => {
        const cols = Math.max(1, classicGrid!.columns ?? 6);
        const rows = Math.max(1, classicGrid!.rows ?? 4);
        const lineColor = classicGrid!.color ?? "rgba(100,149,237,0.45)";
        const centerColor = "rgba(72,199,72,0.75)";
        return (
          <>
            {/* Column dividers */}
            {Array.from({ length: cols - 1 }, (_, k) => (
              <div
                key={`cg-col-${k}`}
                className="hero-slide__guide hero-slide__guide--vertical"
                style={{ left: `${(k + 1) / cols * 100}%`, background: lineColor, opacity: 1 }}
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
            {/* Vertical center line */}
            {classicGrid!.showVerticalCenter && (
              <div
                className="hero-slide__guide hero-slide__guide--vertical"
                style={{ left: "50%", background: centerColor, opacity: 1 }}
              />
            )}
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
    </div>
  ) : null;

  const hasMediaGuides = showGuides && mediaRect;
  const hasElementGuides = showElementGuides && elementRects.length > 0;
  const hasCompGuides = showCompositionGuides && compGuides.length > 0;
  const hasLayoutGuides = showLayoutGuides && (layoutGuideLines.gapX !== undefined || layoutGuideLines.bottomY !== undefined);
  const compGuideColor = compositionGuideColor || "rgba(255, 6, 102, 0.8)"; // цвет guidlines
  const LAYOUT_GUIDE_COLOR = "#FF0066";
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

  const mediaPrimary = (
    <MediaFrame media={slide.media} className="hero-slide__media-box" slotId={`slide-${i}-media`} priority={i === 0} />
  );
  const { editableProps, dragHandleProps } = useSlideElementEditor(slide, editMode, onSlideChange, dragMode);

  const standardCopy = (
    <CopyStack
      slide={slide}
      slideIndex={i}
      spread={false}
      viewportProfile={viewportProfile}
      editableProps={editableProps}
      dragHandleProps={dragHandleProps}
      dragMode={dragMode}
      onSlideChange={editMode ? onSlideChange : undefined}
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

/** Sum of mt values of all elements rendered BEFORE key in the slide's ordered list.
 *  Used to correct edit-mode transform positioning so it matches CSS flow layout. */
function getPrecedingMt(slide: Slide, targetKey: string): number {
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
  const ordered = [
    ...stored.filter((k) => allSet.has(k) && !used.has(k) && (used.add(k), true)),
    ...all.filter((k) => !used.has(k)),
  ];
  let sum = 0;
  for (const k of ordered) {
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
  const extras = Array.isArray(original.extras) ? original.extras : [];
  const fixed: string[] = [];
  if (original.kicker !== undefined) fixed.push("kicker");
  fixed.push("title");
  if (original.subtitle !== undefined) fixed.push("subtitle");
  if (original.body !== undefined) fixed.push("body");
  if (original.quote !== undefined) fixed.push("quote");
  const all = [...fixed, ...extras.map((e) => e.id ?? "")];
  const stored = original.elementOrder ?? [];
  const allSet = new Set(all);
  const used = new Set<string>();
  const ordered = [
    ...stored.filter((k) => allSet.has(k) && !used.has(k) && (used.add(k), true)),
    ...all.filter((k) => !used.has(k)),
  ];
  let result = current;
  let compensating = false;
  for (const k of ordered) {
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

function useSlideElementEditor(
  slide: Slide,
  editMode: boolean,
  onSlideChange?: (next: Slide) => void,
  dragMode = true,
) {
  type GroupStart = { tx: number; ty: number; el: HTMLElement };
  const dragRef = useRef<{
    key: string;
    mode: "move" | "resize";
    startX: number;
    startY: number;
    startTx: number;
    startTy: number;
    startSize: number;
    scale: number;
    moved: boolean;
    groupStarts?: Map<string, GroupStart>;
  } | null>(null);

  // Props for a dedicated drag handle child — applies transform to closest [data-hs-draggable]
  function dragHandleProps(key: string): React.HTMLAttributes<HTMLElement> {
    if (!editMode || !onSlideChange || !dragMode) return {};
    const currentStyle = getSlideElementStyle(slide, key);
    if (currentStyle?.locked) return {};

    return {
      onPointerDown: (e) => {
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
        const groupId = currentStyle?.groupId;
        if (groupId && slideEl) {
          groupStarts = new Map();
          slideEl.querySelectorAll<HTMLElement>("[data-hs-draggable]").forEach((member) => {
            if (member === el) return;
            const memberKey = member.dataset.hsDraggable ?? "";
            if (!memberKey) return;
            const ms = getSlideElementStyle(slide, memberKey);
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
        if (el) el.classList.remove("hero-slide__editable--dragging");
        if (!d || d.key !== key || !d.moved) return;
        e.stopPropagation();
        const dx = (e.clientX - d.startX) / d.scale;
        const dy = (e.clientY - d.startY) / d.scale;
        const newTx = Math.round(d.startTx + dx);
        const newTy = Math.round(d.startTy + dy);
        const style = getSlideElementStyle(slide, key) ?? {};
        // Fold x/y back into ml/mt so the right panel shows the real position after drag
        const oldMt = parseFloat(style.mt ?? "0") || 0;
        const precedingMt = getPrecedingMt(slide, key);
        const newMl = newTx !== 0 ? `${newTx}px` : undefined;
        const newMtVal = Math.round(newTy - precedingMt);
        const newMt = newMtVal !== 0 ? `${newMtVal}px` : undefined;
        const deltaMt = newMtVal - oldMt;

        if (d.groupStarts && d.groupStarts.size > 0) {
          let updated = setSlideElementStyle(slide, key, {
            ...style, ml: newMl, mt: newMt, x: undefined, y: undefined,
          });
          const groupKeys = new Set([key]);
          d.groupStarts.forEach(({ tx, ty }, memberKey) => {
            groupKeys.add(memberKey);
            const ms = getSlideElementStyle(updated, memberKey) ?? {} as ElementStyle;
            const mPrecedingMt = getPrecedingMt(updated, memberKey);
            const mNewTx = Math.round(tx + dx);
            const mNewTy = Math.round(ty + dy);
            const mNewMl = mNewTx !== 0 ? `${mNewTx}px` : undefined;
            const mNewMtVal = Math.round(mNewTy - mPrecedingMt);
            const mNewMt = mNewMtVal !== 0 ? `${mNewMtVal}px` : undefined;
            updated = setSlideElementStyle(updated, memberKey, {
              ...ms, ml: mNewMl, mt: mNewMt, x: undefined, y: undefined,
            });
          });
          updated = preserveVisualPositions(slide, updated, key, groupKeys);
          onSlideChange(updated);
        } else {
          let updated = setSlideElementStyle(slide, key, {
            ...style, ml: newMl, mt: newMt, x: undefined, y: undefined,
          });
          updated = preserveVisualPositions(slide, updated, key);
          onSlideChange(updated);
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
    if (elStyle?.locked) return { className: cn(className, "hero-slide__editable hero-slide__editable--locked") };

    return {
      className: cn(className, "hero-slide__editable"),
      tabIndex: 0,
      role: "button",
      "aria-label": "Drag to position slide element. Drag the bottom-right handle to resize.",
      onPointerDown: (e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();

        const el = e.currentTarget as HTMLElement;
        const rect = el.getBoundingClientRect();
        const isResize = e.clientX >= rect.right - 16 && e.clientY >= rect.bottom - 16;
        const slideEl = el.closest(".hero-slide") as HTMLElement | null;
        const blockEl = el.closest<HTMLElement>("[data-block-id]");
        const blockId = blockEl?.dataset.blockId;
        const elementId = el.dataset.el;
        const scale = slideEl ? slideEl.getBoundingClientRect().width / slideEl.offsetWidth || 1 : 1;
        const computed = getComputedStyle(el);
        const matrix = new DOMMatrix(computed.transform === "none" ? "" : computed.transform);

        el.setPointerCapture(e.pointerId);
        el.classList.add(isResize ? "hero-slide__editable--resizing" : "hero-slide__editable--dragging");
        if (blockId && elementId && window !== window.parent) {
          window.parent.postMessage({ type: "element-clicked", blockId, elementId }, "*");
        }

        dragRef.current = {
          key,
          mode: isResize ? "resize" : "move",
          startX: e.clientX,
          startY: e.clientY,
          startTx: matrix.m41 || 0,
          startTy: matrix.m42 || 0,
          startSize: parseFloat(computed.fontSize || "0") || 16,
          scale,
          moved: false,
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
      },
      onPointerUp: (e) => {
        const d = dragRef.current;
        dragRef.current = null;
        const el = e.currentTarget as HTMLElement;
        el.classList.remove("hero-slide__editable--dragging", "hero-slide__editable--resizing");
        if (!d || d.key !== key || !d.moved) return;
        e.stopPropagation();

        const dx = (e.clientX - d.startX) / d.scale;
        const dy = (e.clientY - d.startY) / d.scale;
        const currentStyle = getSlideElementStyle(slide, key) ?? {};

        if (d.mode === "resize") {
          const nextSize = Math.max(6, Math.round(d.startSize + (dx + dy) / 2));
          onSlideChange(setSlideElementStyle(slide, key, {
            ...currentStyle,
            size: `${nextSize}px`,
          }));
          return;
        }

        const newTx = Math.round(d.startTx + dx);
        const newTy = Math.round(d.startTy + dy);
        const oldMt = parseFloat(currentStyle.mt ?? "0") || 0;
        const precedingMt = getPrecedingMt(slide, key);
        const newMl = newTx !== 0 ? `${newTx}px` : undefined;
        const newMtVal = Math.round(newTy - precedingMt);
        const newMt = newMtVal !== 0 ? `${newMtVal}px` : undefined;
        const deltaMt = newMtVal - oldMt;
        let updated = setSlideElementStyle(slide, key, {
          ...currentStyle, ml: newMl, mt: newMt, x: undefined, y: undefined,
        });
        updated = preserveVisualPositions(slide, updated, key);
        onSlideChange(updated);
      },
      onPointerCancel: (e) => {
        const d = dragRef.current;
        dragRef.current = null;
        if (!d || d.key !== key) return;
        const el = e.currentTarget as HTMLElement;
        el.classList.remove("hero-slide__editable--dragging", "hero-slide__editable--resizing");
        el.style.transform = (d.startTx || d.startTy)
          ? `translate(${d.startTx}px, ${d.startTy}px)`
          : "";
        el.style.fontSize = `${d.startSize}px`;
      },
      onKeyDown: (e) => {
        const deltaByKey: Record<string, [number, number]> = {
          ArrowLeft: [-1, 0],
          ArrowRight: [1, 0],
          ArrowUp: [0, -1],
          ArrowDown: [0, 1],
        };
        const delta = deltaByKey[e.key];
        if (!delta) return;
        e.preventDefault();
        e.stopPropagation();
        const step = e.shiftKey ? 10 : 1;
        const currentStyle = getSlideElementStyle(slide, key) ?? {};
        const currentMl = parseFloat(currentStyle.ml ?? "0") || 0;
        const currentMt = parseFloat(currentStyle.mt ?? "0") || 0;
        const nextMl = Math.round(currentMl + delta[0] * step);
        const nextMt = Math.round(currentMt + delta[1] * step);
        const deltaMt = nextMt - currentMt;
        let updated = setSlideElementStyle(slide, key, {
          ...currentStyle,
          ml: nextMl ? `${nextMl}px` : undefined,
          mt: nextMt ? `${nextMt}px` : undefined,
          x: undefined,
          y: undefined,
        });
        updated = preserveVisualPositions(slide, updated, key);
        onSlideChange(updated);
      },
    };
  }

  return { editableProps, dragHandleProps };
}

function CopyStack({
  slide,
  slideIndex,
  spread,
  viewportProfile,
  editableProps,
  dragHandleProps,
  dragMode = true,
  onSlideChange,
}: {
  slide: Slide;
  slideIndex: number;
  spread?: boolean;
  viewportProfile?: HeroViewportProfileKey | null;
  editableProps: (key: string, className?: string) => React.HTMLAttributes<HTMLElement>;
  dragHandleProps: (key: string) => React.HTMLAttributes<HTMLElement>;
  dragMode?: boolean;
  onSlideChange?: (next: Slide) => void;
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

  // In edit mode, each element uses transform instead of CSS margins.
  // precedingMtByKey[k] = sum of mt of all elements before k — restores the
  // vertical spacing that CSS margins would have created in normal flow.
  const precedingMtByKey = new Map<string, number>();
  if (onSlideChange) {
    let _pmt = 0;
    for (const k of orderedKeys) {
      precedingMtByKey.set(k, _pmt);
      _pmt += parseFloat(getSlideElementStyle(slide, k)?.mt ?? "0") || 0;
    }
  }

  function renderElement(key: string) {
    if (key === "kicker" && kicker) {
      const es = mergeElementStyle(slide.kickerStyle, viewportProfile);
      const typo = es?.typo;
      const s = elStyle(es);
      if (onSlideChange) {
        const isLocked = !!es?.locked;
        return (
          <div
            key="kicker"
            className={cn("hero-slide__editable", isLocked && "hero-slide__editable--locked", typo || undefined)}
            data-hs-draggable="kicker"
            style={absElStyle(es, precedingMtByKey.get(key) ?? 0)}
            data-el={`slide-${slideIndex}-kicker`}
          >
            {!isLocked && dragMode && <DragHandle {...dragHandleProps("kicker")} />}
            <TipTapInline value={kicker} onChange={dragMode ? undefined : (html) => onSlideChange({ ...slide, kicker: html })} multiline={false} typoClass={typo} typoOptions={TYPO_PRESETS} />
          </div>
        );
      }
      return (
        <div key="kicker" {...editableProps("kicker", typo || undefined)} style={s} data-el={`slide-${slideIndex}-kicker`}>
          <SlideKicker text={kicker} />
        </div>
      );
    }
    if (key === "title" && title) {
      const titleEs = mergeElementStyle(slide.titleStyle, viewportProfile);
      const titleTypo = titleEs?.typo;
      const titleStyle = elStyle(titleEs);
      const titleClass = cn("hero-slide__title", titleTypo);
      const isTitleStamp = !titleTypo || titleTypo === "typo-content-header" || titleTypo === "typo-homepage-header" || titleTypo === "typo-subtitle";
      if (onSlideChange) {
        const isTitleLocked = !!titleEs?.locked;
        if (isTitleStamp) {
          return (
            <div
              key="title"
              className={cn("hero-slide__editable", isTitleLocked && "hero-slide__editable--locked")}
              data-hs-draggable="title"
              style={absElStyle(titleEs, precedingMtByKey.get(key) ?? 0)}
            >
              {!isTitleLocked && dragMode && <DragHandle {...dragHandleProps("title")} />}
              <OutlineStampText className={titleClass} data-el={`slide-${slideIndex}-title`} stamp={stampForTypo(titleTypo)} shadowContent={renderRichText(title)}>
                <TipTapInline value={title} onChange={dragMode ? undefined : (html) => onSlideChange({ ...slide, title: html })} typoClass={titleTypo} typoOptions={TYPO_PRESETS} />
              </OutlineStampText>
            </div>
          );
        }
        return (
          <div
            key="title"
            className={cn("hero-slide__editable", isTitleLocked && "hero-slide__editable--locked")}
            data-hs-draggable="title"
            style={absElStyle(titleEs, precedingMtByKey.get(key) ?? 0)}
          >
            {!isTitleLocked && dragMode && <DragHandle {...dragHandleProps("title")} />}
            <p className={titleClass} data-el={`slide-${slideIndex}-title`}>
              <TipTapInline value={title} onChange={dragMode ? undefined : (html) => onSlideChange({ ...slide, title: html })} typoClass={titleTypo} typoOptions={TYPO_PRESETS} />
            </p>
          </div>
        );
      }
      if (isTitleStamp) {
        return (
          <OutlineStampText key="title" {...editableProps("title", titleClass)} data-el={`slide-${slideIndex}-title`} stamp={stampForTypo(titleTypo)} style={titleStyle}>
            <InlineText text={title} />
          </OutlineStampText>
        );
      }
      return (
        <p key="title" {...editableProps("title", titleClass)} data-el={`slide-${slideIndex}-title`} style={titleStyle}>
          <InlineText text={title} />
        </p>
      );
    }
    if (key === "subtitle" && subtitle) {
      const es = mergeElementStyle(slide.subtitleStyle, viewportProfile);
      const typo = es?.typo;
      const s = elStyle(es);
      if (onSlideChange) {
        const isLocked = !!es?.locked;
        return (
          <div
            key="subtitle"
            className={cn("hero-slide__editable", isLocked && "hero-slide__editable--locked", typo || undefined)}
            data-hs-draggable="subtitle"
            style={absElStyle(es, precedingMtByKey.get(key) ?? 0)}
            data-el={`slide-${slideIndex}-subtitle`}
          >
            {!isLocked && dragMode && <DragHandle {...dragHandleProps("subtitle")} />}
            <TipTapInline value={subtitle} onChange={dragMode ? undefined : (html) => onSlideChange({ ...slide, subtitle: html })} typoClass={typo} typoOptions={TYPO_PRESETS} />
          </div>
        );
      }
      return (
        <div key="subtitle" {...editableProps("subtitle", typo || undefined)} style={s} data-el={`slide-${slideIndex}-subtitle`}>
          <SlideSubtitle text={subtitle} variant={slide?.subtitleVariant} slotId={`slide-${slideIndex}-subtitle`} />
        </div>
      );
    }
    if (key === "body" && body) {
      const es = mergeElementStyle(slide.bodyStyle, viewportProfile);
      const typo = es?.typo;
      const s = elStyle(es);
      if (onSlideChange) {
        const isLocked = !!es?.locked;
        return (
          <div
            key="body"
            className={cn("hero-slide__editable", isLocked && "hero-slide__editable--locked", typo || undefined)}
            data-hs-draggable="body"
            style={absElStyle(es, precedingMtByKey.get(key) ?? 0)}
            data-el={`slide-${slideIndex}-body`}
          >
            {!isLocked && dragMode && <DragHandle {...dragHandleProps("body")} />}
            <TipTapInline value={body} onChange={dragMode ? undefined : (html) => onSlideChange({ ...slide, body: html })} typoClass={typo} typoOptions={TYPO_PRESETS} showWordCount />
          </div>
        );
      }
      return (
        <div key="body" {...editableProps("body", typo || undefined)} style={s} data-el={`slide-${slideIndex}-body`}>
          <SlideBody text={body} variant={slide?.bodyVariant} />
        </div>
      );
    }
    if (key === "quote" && quote) {
      const es = mergeElementStyle(slide.quoteStyle, viewportProfile);
      const typo = es?.typo;
      const s = elStyle(es);
      const cls = cn("hero-slide__quote", typo);
      if (onSlideChange) {
        const isLocked = !!es?.locked;
        return (
          <div
            key="quote"
            className={cn("hero-slide__editable", isLocked && "hero-slide__editable--locked", cls)}
            data-hs-draggable="quote"
            style={absElStyle(es, precedingMtByKey.get(key) ?? 0)}
            data-el={`slide-${slideIndex}-quote`}
          >
            {!isLocked && dragMode && <DragHandle {...dragHandleProps("quote")} />}
            <TipTapInline value={quote} onChange={dragMode ? undefined : (html) => onSlideChange({ ...slide, quote: html })} typoClass={typo} typoOptions={TYPO_PRESETS} />
          </div>
        );
      }
      return (
        <p key="quote" {...editableProps("quote", cls)} style={s} data-el={`slide-${slideIndex}-quote`}>
          <InlineText text={quote} />
        </p>
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
          dragMode={dragMode}
          slide={onSlideChange ? slide : undefined}
          onSlideChange={onSlideChange}
          precedingMt={onSlideChange ? (precedingMtByKey.get(key) ?? 0) : 0}
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
  dragMode = true,
  slide,
  onSlideChange,
  precedingMt = 0,
}: {
  extra: SlideExtra;
  slideIndex: number;
  extraIndex: number;
  viewportProfile?: HeroViewportProfileKey | null;
  editableProps?: (key: string, className?: string) => React.HTMLAttributes<HTMLElement>;
  dragHandleProps?: (key: string) => React.HTMLAttributes<HTMLElement>;
  dragMode?: boolean;
  slide?: Slide;
  onSlideChange?: (next: Slide) => void;
  precedingMt?: number;
}) {
  const resolvedStyle = mergeElementStyle(extra.style, viewportProfile);
  const style = elStyle(resolvedStyle);
  const typo = resolvedStyle?.typo;
  const slotId = `slide-${slideIndex}-extra-${extraIndex}`;
  const extraKey = extra.id ?? "";
  const isLocked = !!resolvedStyle?.locked;

  const inEditMode = !!(onSlideChange && slide);
  const updateText = !dragMode && inEditMode
    ? (html: string) => {
        const extras = Array.isArray(slide!.extras) ? slide!.extras : [];
        onSlideChange!({ ...slide!, extras: extras.map(e => e.id === extra.id ? { ...e, text: html } : e) });
      }
    : null;

  if (extra.kind === "stamp") {
    const cls = cn("hero-slide__title", typo);
    if (inEditMode) {
      return (
        <div
          className={cn("hero-slide__editable", isLocked && "hero-slide__editable--locked")}
          data-hs-draggable={extraKey}
          style={absElStyle(resolvedStyle, precedingMt)}
        >
          {!isLocked && dragMode && dragHandleProps && <DragHandle {...dragHandleProps(extraKey)} />}
          <OutlineStampText className={cls} data-el={slotId} stamp={stampForTypo(typo)} shadowContent={renderRichText(extra.text)}>
            <TipTapInline value={extra.text} onChange={updateText ?? undefined} typoClass={typo} typoOptions={TYPO_PRESETS} />
          </OutlineStampText>
        </div>
      );
    }
    return (
      <OutlineStampText
        {...(editableProps?.(extraKey, cls) ?? { className: cls })}
        data-el={slotId}
        stamp={stampForTypo(typo)}
        style={style}
      >
        <InlineText text={extra.text} />
      </OutlineStampText>
    );
  }

  if (extra.kind === "kicker") {
    if (inEditMode) {
      return (
        <div
          className={cn("hero-slide__editable", isLocked && "hero-slide__editable--locked", typo || undefined)}
          data-hs-draggable={extraKey}
          style={absElStyle(resolvedStyle, precedingMt)}
          data-el={slotId}
        >
          {!isLocked && dragMode && dragHandleProps && <DragHandle {...dragHandleProps(extraKey)} />}
          <Kicker><TipTapInline value={extra.text} onChange={updateText ?? undefined} multiline={false} typoClass={typo} typoOptions={TYPO_PRESETS} /></Kicker>
        </div>
      );
    }
    return (
      <div
        {...(editableProps?.(extraKey, typo || undefined) ?? { className: typo || undefined })}
        style={style}
        data-el={slotId}
      >
        <Kicker><InlineText text={extra.text} /></Kicker>
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
          className={cn("hero-slide__editable", isLocked && "hero-slide__editable--locked")}
          data-hs-draggable={extraKey}
          style={absElStyle(resolvedStyle, precedingMt)}
        >
          {!isLocked && dragMode && dragHandleProps && <DragHandle {...dragHandleProps(extraKey)} />}
          <OutlineStampText className={cls} data-el={slotId} stamp={stampForTypo(typo)} shadowContent={renderRichText(extra.text)}>
            <TipTapInline value={extra.text} onChange={updateText ?? undefined} typoClass={typo} typoOptions={TYPO_PRESETS} />
          </OutlineStampText>
        </div>
      );
    }
    return (
      <OutlineStampText
        {...(editableProps?.(extraKey, cls) ?? { className: cls })}
        data-el={slotId}
        stamp={stampForTypo(typo)}
        style={style}
      >
        <InlineText text={extra.text} />
      </OutlineStampText>
    );
  }

  const cls = cn("hero-slide__quote", typo);
  if (inEditMode) {
    return (
      <div
        className={cn("hero-slide__editable", isLocked && "hero-slide__editable--locked", cls)}
        data-hs-draggable={extraKey}
        style={absElStyle(resolvedStyle, precedingMt)}
        data-el={slotId}
      >
        {!isLocked && dragMode && dragHandleProps && <DragHandle {...dragHandleProps(extraKey)} />}
        <TipTapInline value={extra.text} onChange={updateText ?? undefined} typoClass={typo} typoOptions={TYPO_PRESETS} />
      </div>
    );
  }
  return (
    <p
      {...(editableProps?.(extraKey, cls) ?? { className: cls })}
      style={style}
      data-el={slotId}
    >
      <InlineText text={extra.text} />
    </p>
  );
}

function SlideKicker({
  text,
}: {
  text: string;
}) {
  return <p className="hero-slide__kicker"><InlineText text={text} /></p>;
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
    <p className="hero-slide__subtitle" data-el={slotId}>
      <InlineText text={text} />
    </p>
  );
}

function SlideBody({
  text,
  variant,
}: {
  text: string;
  variant?: BodyVariant;
}) {
  if (variant === "list") {
    return (
      <div className="hero-slide__body hero-slide__body--list">
        {text
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line, idx) => (
            <div key={idx}><InlineText text={line} /></div>
          ))}
      </div>
    );
  }

  return (
    <div className="hero-slide__body hero-slide__body--plain">
      {text
        .split("\n\n")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part, idx) => (
          <p key={idx}><InlineText text={part} /></p>
        ))}
    </div>
  );
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
