"use client";

import { useEffect, useRef } from "react";
import {
  Container,
  Kicker,
  OutlineStampText,
  STAMP_SECTION_TITLE,
  hideToResponsiveClasses,
} from "@/components/landing/ui";
import { Icon, type IconName } from "@/components/landing/icons";

type ResponsiveHide = { base?: boolean; md?: boolean; lg?: boolean };
type LayoutConfig = { hide?: ResponsiveHide };

type FeatureItem = {
  id?: string;
  title?: string;
  text?: string;
  icon?: string;
  _layout?: LayoutConfig;
};

type FeaturesV1Data = {
  title?: string;
  subtitle?: string;
  subtitleHide?: { base?: boolean; md?: boolean; lg?: boolean };
  showSubtitle?: boolean;
  items?: FeatureItem[];
  options?: {
    autoPlayMs?: number;
  };
};

export function FeaturesV1({ data }: { data: FeaturesV1Data }) {
  const title = data?.title ?? "OUR SCHOOL";
  const items: FeatureItem[] = Array.isArray(data?.items) ? data.items : [];
  const autoPlayMs = Number(data?.options?.autoPlayMs ?? 4000);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = gridRef.current;
    if (!el || items.length < 2 || !autoPlayMs || autoPlayMs < 1000) return;

    let idx = 0;
    let timer: ReturnType<typeof setInterval>;

    const isSlider = () => el.scrollWidth > el.clientWidth + 1;

    const goTo = (i: number) => {
      const child = el.children[i] as HTMLElement | undefined;
      if (child) el.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
    };

    timer = setInterval(() => {
      if (!isSlider()) return;
      idx = (idx + 1) % items.length;
      goTo(idx);
    }, autoPlayMs);

    const stop = () => clearInterval(timer);

    // pointerdown catches both touch and mouse; once:true — fires once and auto-removes
    el.addEventListener("pointerdown", stop, { passive: true, once: true });
    el.addEventListener("touchstart", stop, { passive: true, once: true });

    return () => {
      clearInterval(timer);
      el.removeEventListener("pointerdown", stop);
      el.removeEventListener("touchstart", stop);
    };
  }, [items.length, autoPlayMs]);

  return (
    <section className="features-section">
      <Container>
        <OutlineStampText
          className="features-title"
          data-el="title"
          stamp={STAMP_SECTION_TITLE}
        >
          {title}
        </OutlineStampText>

        {data?.subtitle ? (() => {
          // subtitleHide: new responsive field; falls back to legacy showSubtitle boolean
          const subtitleHide = data.subtitleHide
            ?? (data.showSubtitle === false ? { base: true, md: true, lg: true } : {});
          const { className: rClass, style: rStyle } = hideToResponsiveClasses(subtitleHide, "block");
          return (

              <div
                className={`features-subtitle text-center ${rClass}`}
                style={rStyle}
                data-el="subtitle"
              >
                {data.subtitle}
              </div>

          );
        })() : null}

        <div className="features-grid" ref={gridRef}>
          {items.map((it, idx) => {
            const hide = it?._layout?.hide;
            const iconName = normalizeFeatureIcon(it?.icon);

            return (
              <div
                key={it?.id ?? `feature-${idx}`}
                {...hideToResponsiveClasses(hide, "block")}
              >
                <div className="feature-card">

                  <div className="feature-card__icon-wrap" data-el={`item-${idx}-icon`}>
                    <Icon name={iconName} className="features-v1-icon" aria-hidden />
                  </div>

                  {it?.title ? (
                    <Kicker className="feature-card__title" data-el={`item-${idx}-title`}>{it.title}</Kicker>
                  ) : null}

                  {it?.text ? (
                    <p className="feature-card__text" data-el={`item-${idx}-body`}>{it.text}</p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

function normalizeFeatureIcon(v?: string): IconName {
  switch (v) {
    case "ballet-bar":
      return "ballet-bar";
    case "ballet-shoes":
      return "ballet-shoes";
    case "prize-cup":
      return "prize-cup";
    default:
      return "prize-cup";
  }
}
