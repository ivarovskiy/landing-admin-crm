"use client";

import { useEffect, useRef } from "react";
import { TipTapInline, renderRichText } from "@/components/rich-text";
import { TYPO_PRESETS } from "@/lib/typo-presets";
import {
  Container,
  Kicker,
  OutlineStampText,
  STAMP_SECTION_TITLE,
  hideToResponsiveClasses,
} from "@/components/landing/ui";
import { Icon, type IconName } from "@/components/landing/icons";
import { MediaImage } from "@/components/media-image";

type ResponsiveHide = { base?: boolean; md?: boolean; lg?: boolean };
type LayoutConfig = { hide?: ResponsiveHide };

type FeatureItem = {
  id?: string;
  title?: string;
  text?: string;
  icon?: string;
  image?: string;
  imageAlt?: string;
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

export function FeaturesV1({
  data,
  editMode,
  onChange,
}: {
  data: FeaturesV1Data;
  editMode?: boolean;
  onChange?: (next: unknown) => void;
}) {
  const title = data?.title ?? "OUR SCHOOL";
  const items: FeatureItem[] = Array.isArray(data?.items) ? data.items : [];
  const autoPlayMs = Number(data?.options?.autoPlayMs ?? 4000);
  const gridRef = useRef<HTMLDivElement>(null);

  const update = editMode && onChange
    ? (field: keyof FeaturesV1Data, value: unknown) => onChange({ ...data, [field]: value })
    : null;

  const updateItem = editMode && onChange
    ? (idx: number, field: keyof FeatureItem, value: string) =>
        onChange({ ...data, items: items.map((it, i) => i === idx ? { ...it, [field]: value } : it) })
    : null;

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
          shadowContent={update ? renderRichText(title) : undefined}
        >
          {update ? (
            <TipTapInline
              value={title}
              onChange={(html) => update("title", html)}
              multiline={false}
              typoOptions={TYPO_PRESETS}
            />
          ) : title}
        </OutlineStampText>

        {(data?.subtitle || update) ? (() => {
          const subtitleHide = data?.subtitleHide
            ?? (data?.showSubtitle === false ? { base: true, md: true, lg: true } : {});
          const { className: rClass, style: rStyle } = hideToResponsiveClasses(subtitleHide, "block");
          return (
            <div
              className={`features-subtitle text-center ${rClass}`}
              style={rStyle}
              data-el="subtitle"
            >
              {update ? (
                <TipTapInline
                  value={data?.subtitle ?? ""}
                  onChange={(html) => update("subtitle", html)}
                  typoOptions={TYPO_PRESETS}
                />
              ) : renderRichText(data!.subtitle!)}
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
                    {it?.image ? (
                      <MediaImage
                        src={it.image}
                        alt={it.imageAlt ?? ""}
                        className="features-v1-icon"
                        sizes="252px"
                      />
                    ) : (
                      <Icon name={iconName} className="features-v1-icon" aria-hidden />
                    )}
                  </div>

                  {(it?.title || updateItem) ? (
                    <Kicker className="feature-card__title" data-el={`item-${idx}-title`}>
                      {updateItem ? (
                        <TipTapInline
                          value={it?.title ?? ""}
                          onChange={(html) => updateItem(idx, "title", html)}
                          multiline={false}
                          typoOptions={TYPO_PRESETS}
                        />
                      ) : renderRichText(it.title!)}
                    </Kicker>
                  ) : null}

                  {(it?.text || updateItem) ? (
                    <div className="feature-card__text" data-el={`item-${idx}-body`}>
                      {updateItem ? (
                        <TipTapInline
                          value={it?.text ?? ""}
                          onChange={(html) => updateItem(idx, "text", html)}
                          typoOptions={TYPO_PRESETS}
                        />
                      ) : renderRichText(it.text!)}
                    </div>
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
    case "girl":
      return "girl";
    default:
      return "prize-cup";
  }
}
