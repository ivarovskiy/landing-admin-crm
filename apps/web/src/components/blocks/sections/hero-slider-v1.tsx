"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { Container, Hairline, Kicker, OutlineStampText, STAMP_HERO_TITLE, STAMP_KICKER, STAMP_SUBTITLE } from "@/components/landing/ui";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { InlineText } from "./inline-icons";

type SlideTemplate =
  | "image-left-copy-right"
  | "copy-left-image-right"
  | "full-image";

type TextVariant = "plain" | "stamp";
type BodyVariant = "plain" | "list";
type ObjectFit = "cover" | "contain";

type ElementStyle = {
  mt?: string;
  mb?: string;
  ml?: string;
  mr?: string;
  pt?: string;
  pb?: string;
  align?: "left" | "center" | "right";
  size?: string;
  typo?: string; // typography class from design system
};

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

type Slide = {
  id?: string;
  template?: SlideTemplate;
  quote?: string;
  kicker?: string;
  kickerVariant?: TextVariant;
  title?: string;
  subtitle?: string;
  subtitleVariant?: TextVariant;
  body?: string;
  bodyVariant?: BodyVariant;
  cta?: { label?: string; href?: string };
  media?: SlideMedia;
  extras?: SlideExtra[];
  quoteStyle?: ElementStyle;
  kickerStyle?: ElementStyle;
  titleStyle?: ElementStyle;
  subtitleStyle?: ElementStyle;
  bodyStyle?: ElementStyle;
  ctaStyle?: ElementStyle;
  layout?: {
    desktop?: {
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
    };
    mobile?: {
      imageFirst?: boolean;
    };
    contentJustify?: "start" | "center" | "end";
  };
};

/** Convert ElementStyle to inline CSS */
function elStyle(es?: ElementStyle): React.CSSProperties | undefined {
  if (!es) return undefined;
  const s: React.CSSProperties = {};
  if (es.mt) s.marginTop = es.mt;
  if (es.mb) s.marginBottom = es.mb;
  if (es.ml) s.marginLeft = es.ml;
  if (es.mr) s.marginRight = es.mr;
  if (es.pt) s.paddingTop = es.pt;
  if (es.pb) s.paddingBottom = es.pb;
  if (es.align) {
    s.textAlign = es.align;
    s.alignSelf = es.align === "center" ? "center" : es.align === "right" ? "flex-end" : "flex-start";
  }
  if (es.size) s.fontSize = es.size;
  return Object.keys(s).length ? s : undefined;
}

function resolveTemplate(slide: Slide): SlideTemplate {
  if (slide?.template) return slide.template;

  const legacySide = slide?.layout?.desktop?.imageSide ?? "right";
  return legacySide === "left"
    ? "image-left-copy-right"
    : "copy-left-image-right";
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

function slideStyle(slide: Slide): React.CSSProperties {
  const desktop = slide?.layout?.desktop ?? {};
  const style: Record<string, string> = {};

  if (desktop.gap) style["--hs-gap"] = desktop.gap;
  if (desktop.mediaWidth) style["--hs-media-w"] = desktop.mediaWidth;
  if (desktop.textWidth) style["--hs-text-w"] = desktop.textWidth;
  if (desktop.kickerSize) style["--hs-kicker-size"] = desktop.kickerSize;
  if (desktop.bodySize) style["--hs-body-size"] = desktop.bodySize;
  if (desktop.textAlign) style["--hs-text-align"] = desktop.textAlign;
  if (desktop.contentOffsetX) style["--hs-offset-x"] = desktop.contentOffsetX;
  if (desktop.contentOffsetY) style["--hs-offset-y"] = desktop.contentOffsetY;

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
    style["--hs-padding"] = desktop.padding;
  }
  if (desktop.mediaPadding) {
    style["--hs-media-padding"] = desktop.mediaPadding;
  }
  if (desktop.mediaHeight) {
    style["--hs-media-h"] = desktop.mediaHeight;
  }
  if (desktop.mediaAlign) {
    const map = { start: "flex-start", center: "center", end: "flex-end", stretch: "stretch" } as const;
    style["--hs-media-align"] = map[desktop.mediaAlign];
  }

  return style as React.CSSProperties;
}

export function HeroSliderV1({ data }: { data: any }) {
  const slides: Slide[] = Array.isArray(data?.slides) ? data.slides : [];
  const options = data?.options ?? {};
  const count = slides.length;

  const sectionRef = useRef<HTMLElement>(null);

  // useId() shifts between SSR and client when nested inside LiveBlockWrapper (extra client boundary).
  // Use a stable "hs" prefix on server; swap to the real ID after mount to keep aria links working.
  const uid = useId();
  const [carouselId, setCarouselId] = useState("hs");
  useEffect(() => { setCarouselId(uid); }, [uid]);

  const prefersReducedMotion = usePrefersReducedMotion();

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const showDots = options?.showDots !== false;
  const showArrows = options?.showArrows === true;

  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const clampIndex = (i: number) => {
    const n = Math.max(count, 1);
    return ((i % n) + n) % n;
  };

  const goTo = (i: number) => setActive(clampIndex(i));
  const goNext = () => setActive((x) => clampIndex(x + 1));
  const goPrev = () => setActive((x) => clampIndex(x - 1));

  useEffect(() => {
    const ms = Number(options?.autoPlayMs ?? 0);
    if (!ms || ms < 1500 || count <= 1) return;
    if (prefersReducedMotion) return;
    if (paused) return;

    const t = window.setInterval(() => {
      const cur = activeRef.current;
      setActive(clampIndex(cur + 1));
    }, ms);

    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options?.autoPlayMs, count, paused, prefersReducedMotion]);

  useEffect(() => {
    if (active > count - 1) setActive(0);
  }, [active, count]);

  const drag = useRef<{
    startX: number;
    lastX: number;
    active: boolean;
    moved: boolean;
    pointerId: number;
  } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    if (count <= 1) return;
    if (e.pointerType === "mouse" && (e as any).button !== 0) return;
    if ((e.target as HTMLElement).closest("a, button")) return;

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

    const dx = e.clientX - drag.current.startX;
    const moved = drag.current.moved;

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(drag.current.pointerId);
    } catch { }

    drag.current = null;

    if (moved && Math.abs(dx) >= 30) {
      dx < 0 ? goNext() : goPrev();
    }

    window.setTimeout(() => setPaused(false), 1200);
  };

  const trackStyle = useMemo(
    () => ({ transform: `translateX(-${active * 100}%)` }),
    [active]
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
        <img src="/icons/slider_v1.svg" alt="" className="hero-slider__hairline-top" />

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
              prefersReducedMotion && "hero-slider__track--no-motion"
            )}
            style={trackStyle}
          >
            {slides.map((s, i) => (
              <div
                key={s.id ?? i}
                id={`${carouselId}-slide-${i}`}
                className="hero-slider__slide"
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${count}`}
                aria-hidden={i !== active}
              >
                <HeroSlide slide={s} isDragging={!!drag.current?.moved} slideIndex={i} />
              </div>
            ))}
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
        <img src="/icons/slider_v2.svg" alt="" className="hero-slider__hairline-bottom"/>

        {showDots && count > 1 ? (
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
}: {
  slide: Slide;
  isDragging: boolean;
  slideIndex: number;
}) {
  const template = resolveTemplate(slide);
  const mobileImageFirst = !!slide?.layout?.mobile?.imageFirst;

  const slideClass = cn(
    "hero-slide",
    `hero-slide--${template}`,
    mobileImageFirst && "hero-slide--mobile-image-first",
    slide?.layout?.desktop?.textAlignFullWidth && "hs-text-wide"
  );

  const mediaPrimary = (
    <MediaFrame media={slide.media} className="hero-slide__media-box" slotId={`slide-${i}-media`} priority={i === 0} />
  );

  const standardCopy = (
    <CopyStack slide={slide} slideIndex={i} spread={false} />
  );

  const cta = slide?.cta;
  const imgSide = imageSide(template);
  const autoCtaAlign = imgSide === "left" ? "right" : "left";
  const ctaSide = slide.ctaStyle?.align || autoCtaAlign;

  if (template === "full-image") {
    return (
      <div className={slideClass} style={slideStyle(slide)}>
        <div className="hero-slide__media-col hero-slide__media-col--full">
          {mediaPrimary}
        </div>
      </div>
    );
  }

  return (
    <div className={slideClass} style={slideStyle(slide)}>
      <div className="hero-slide__text-col">
        {standardCopy}
      </div>

      <div className="hero-slide__media-col">
        {mediaPrimary}
      </div>

      {cta?.href ? (
        <a
          href={cta.href}
          className={cn("hero-slide__cta", `hero-slide__cta--${ctaSide}`)}
          data-el={`slide-${i}-cta`}
          style={elStyle(slide.ctaStyle)}
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

function CopyStack({
  slide,
  slideIndex,
  spread,
}: {
  slide: Slide;
  slideIndex: number;
  spread?: boolean;
}) {
  const kicker = slide?.kicker;
  const quote = slide?.quote;
  const title = slide?.title ?? "";
  const subtitle = slide?.subtitle;
  const body = slide?.body;
  const extras = Array.isArray(slide?.extras) ? slide.extras : [];

  const main = (
    <div className="hero-slide__copy-main">
      {kicker ? (
        <div className={slide.kickerStyle?.typo || undefined} style={elStyle(slide.kickerStyle)}>
          <SlideKicker text={kicker} />
        </div>
      ) : null}

      {title ? (
        <OutlineStampText
          className={cn("hero-slide__title", slide.titleStyle?.typo)}
          data-el={`slide-${slideIndex}-title`}
          stamp={STAMP_HERO_TITLE}
          style={elStyle(slide.titleStyle)}
        >
          <InlineText text={title} />
        </OutlineStampText>
      ) : null}

      {subtitle ? (
        <div className={slide.subtitleStyle?.typo || undefined} style={elStyle(slide.subtitleStyle)}>
          <SlideSubtitle
            text={subtitle}
            variant={slide?.subtitleVariant}
            slotId={`slide-${slideIndex}-subtitle`}
          />
        </div>
      ) : null}

      {body ? (
        <div className={slide.bodyStyle?.typo || undefined} style={elStyle(slide.bodyStyle)}>
          <SlideBody text={body} variant={slide?.bodyVariant} />
        </div>
      ) : null}

      {extras.map((ex, exIdx) => (
        <ExtraElement key={ex.id ?? exIdx} extra={ex} slideIndex={slideIndex} extraIndex={exIdx} />
      ))}
    </div>
  );

  return (
    <div className={cn("hero-slide__copy", spread && "hero-slide__copy--spread")}>
      {quote ? (
        <p className={cn("hero-slide__quote", slide.quoteStyle?.typo)} style={elStyle(slide.quoteStyle)}>
          <InlineText text={quote} />
        </p>
      ) : spread ? (
        <div />
      ) : null}

      {main}
    </div>
  );
}

function ExtraElement({
  extra,
  slideIndex,
  extraIndex,
}: {
  extra: SlideExtra;
  slideIndex: number;
  extraIndex: number;
}) {
  const style = elStyle(extra.style);
  const typo = extra.style?.typo;
  const slotId = `slide-${slideIndex}-extra-${extraIndex}`;

  if (extra.kind === "stamp") {
    return (
      <OutlineStampText
        className={cn("hero-slide__title", typo)}
        data-el={slotId}
        stamp={STAMP_HERO_TITLE}
        style={style}
      >
        <InlineText text={extra.text} />
      </OutlineStampText>
    );
  }

  if (extra.kind === "kicker") {
    return (
      <div className={typo || undefined} style={style} data-el={slotId}>
        <Kicker><InlineText text={extra.text} /></Kicker>
      </div>
    );
  }

  return (
    <p className={cn("hero-slide__quote", typo)} style={style} data-el={slotId}>
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
        />
      ) : ratioLabel ? (
        <span className="hero-slide__media-ratio" aria-hidden>{ratioLabel}</span>
      ) : null}
    </div>
  );
}
