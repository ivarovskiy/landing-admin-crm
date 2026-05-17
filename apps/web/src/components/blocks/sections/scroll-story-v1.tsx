"use client";

import { useEffect, useRef, useState } from "react";
import type React from "react";
import { TipTapInline, renderRichText } from "@/components/rich-text";
import { TYPO_PRESETS } from "@/lib/typo-presets";
import { Container } from "@/components/landing/ui";
import { MediaImage } from "@/components/media-image";

type ContentItem = {
  kind: "image" | "text";
  src?: string;
  alt?: string;
  aspectRatio?: string;
  heading?: string;
  body?: string;
};

type ScrollStoryV1Data = {
  left?: ContentItem[];
  right?: ContentItem[];
  stickyTop?: string;
  showProgress?: boolean;
};

function normalize(raw: unknown): ContentItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (x: any) => x && (x.kind === "image" || x.kind === "text"),
  ) as ContentItem[];
}

function Col({
  items,
  onItemChange,
}: {
  items: ContentItem[];
  onItemChange?: (idx: number, field: "heading" | "body", value: string) => void;
}) {
  return (
    <>
      {items.map((item, idx) => {
        if (item.kind === "image") {
          const imgStyle = item.aspectRatio
            ? { aspectRatio: item.aspectRatio }
            : { aspectRatio: "4 / 3" };

          return (
            <div key={idx} className="ss__image-wrap">
              {item.src ? (
                <MediaImage
                  src={item.src}
                  alt={item.alt ?? ""}
                  className="ss__image"
                  style={imgStyle}
                  sizes="(max-width: 767px) 100vw, 50vw"
                />
              ) : (
                <div className="ss__image ss__image--placeholder" style={imgStyle} />
              )}
            </div>
          );
        }

        return (
          <div key={idx} className="ss__text-item">
            {(item.heading || onItemChange) ? (
              <div className="ss__label">
                {onItemChange ? (
                  <TipTapInline
                    value={item.heading ?? ""}
                    onChange={(html) => onItemChange(idx, "heading", html)}
                    multiline={false}
                    typoOptions={TYPO_PRESETS}
                  />
                ) : renderRichText(item.heading!)}
              </div>
            ) : null}
            {(item.body || onItemChange) ? (
              <div className="ss__body">
                {onItemChange ? (
                  <TipTapInline
                    value={item.body ?? ""}
                    onChange={(html) => onItemChange(idx, "body", html)}
                    typoOptions={TYPO_PRESETS}
                  />
                ) : renderRichText(item.body!)}
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
}

export function ScrollStoryV1({
  data,
  editMode,
  onChange,
}: {
  data: any;
  editMode?: boolean;
  onChange?: (next: unknown) => void;
}) {
  const d = data as ScrollStoryV1Data;
  const left = normalize(d?.left);
  const right = normalize(d?.right);
  const stickyTop = d?.stickyTop ?? "0px";
  const showProgress = d?.showProgress ?? false;

  const sectionRef = useRef<HTMLElement>(null);
  const [dotStyle, setDotStyle] = useState<React.CSSProperties>({ opacity: 0, top: 0 });

  const makeItemUpdater = editMode && onChange
    ? (col: "left" | "right", arr: ContentItem[]) =>
        (idx: number, field: "heading" | "body", value: string) =>
          onChange({ ...d, [col]: arr.map((it, i) => i === idx ? { ...it, [field]: value } : it) })
    : null;

  useEffect(() => {
    if (!showProgress) return;

    function update() {
      const el = sectionRef.current;
      if (!el) return;
      const { top, height } = el.getBoundingClientRect();
      const vh = window.innerHeight;

      if (top > vh || top + height < 0) {
        setDotStyle((s) => ({ ...s, opacity: 0 }));
        return;
      }

      const p = Math.min(1, Math.max(0, -top / Math.max(1, height - vh)));
      setDotStyle({ opacity: 1, top: 24 + p * (vh - 48) });
    }

    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, [showProgress]);

  if (!left.length && !right.length) return null;

  return (
    <section className="scroll-story" ref={sectionRef}>
      <Container>
        <div
          className="ss__cols"
          style={{ "--ss-top": stickyTop } as React.CSSProperties}
        >
          {left.length > 0 && (
            <div className="ss__col">
              <Col
                items={left}
                onItemChange={makeItemUpdater ? makeItemUpdater("left", left) : undefined}
              />
            </div>
          )}
          {right.length > 0 && (
            <div className="ss__col">
              <Col
                items={right}
                onItemChange={makeItemUpdater ? makeItemUpdater("right", right) : undefined}
              />
            </div>
          )}
        </div>
      </Container>

      {showProgress ? (
        <div className="scroll-story__dot" style={dotStyle} aria-hidden="true" />
      ) : null}
    </section>
  );
}
