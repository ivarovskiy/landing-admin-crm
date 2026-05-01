"use client";

import { useEffect, useRef, useState } from "react";
import type React from "react";
import { Container } from "@/components/landing/ui";
import { MediaImage } from "@/components/media-image";

// Same item schema as content-page-v1 — copy the JSON as-is
type ContentItem = {
  kind: "image" | "text";
  // image
  src?: string;
  alt?: string;
  // text
  heading?: string;
  body?: string;
};

type ScrollStoryV1Data = {
  left?: ContentItem[];
  right?: ContentItem[];
  stickyTop?: string;    // CSS length — offset from top when sticky, e.g. "80px"
  showProgress?: boolean; // scroll-progress dot on right viewport edge
};

function normalize(raw: unknown): ContentItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (x: any) => x && (x.kind === "image" || x.kind === "text"),
  ) as ContentItem[];
}

function Col({ items }: { items: ContentItem[] }) {
  return (
    <>
      {items.map((item, idx) => {
        if (item.kind === "image") {
          return (
            <div key={idx} className="ss__image-wrap">
              {item.src ? (
                <MediaImage
                  src={item.src}
                  alt={item.alt ?? ""}
                  className="ss__image"
                  sizes="(max-width: 767px) 100vw, 50vw"
                />
              ) : (
                <div className="ss__image ss__image--placeholder" />
              )}
            </div>
          );
        }

        return (
          <div key={idx} className="ss__text-item">
            {item.heading ? <p className="ss__label">{item.heading}</p> : null}
            {item.body ? (
              <div className="ss__body">
                {item.body.split("\n\n").map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
}

export function ScrollStoryV1({ data }: { data: any }) {
  const d = data as ScrollStoryV1Data;
  const left = normalize(d?.left);
  const right = normalize(d?.right);
  const stickyTop = d?.stickyTop ?? "0px";
  const showProgress = d?.showProgress ?? false;

  const sectionRef = useRef<HTMLElement>(null);
  const [dotStyle, setDotStyle] = useState<React.CSSProperties>({ opacity: 0, top: 0 });

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
              <Col items={left} />
            </div>
          )}
          {right.length > 0 && (
            <div className="ss__col">
              <Col items={right} />
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
