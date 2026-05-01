"use client";

import { useEffect, useRef, useState } from "react";
import type React from "react";
import { Container } from "@/components/landing/ui";
import { MediaImage } from "@/components/media-image";

type StoryImage = { src: string; alt?: string };

type StoryEntry = {
  label?: string;
  text?: string;
  images?: StoryImage[];
  imagePosition?: "left" | "right"; // default: "right"
};

type ScrollStoryV1Data = {
  entries?: StoryEntry[];
  // CSS length applied as `top` when the media column is sticky.
  // Set to your header height, e.g. "80px".
  stickyTop?: string;
  // Render the scroll-progress dot on the right edge of the viewport.
  showProgress?: boolean;
};

export function ScrollStoryV1({ data }: { data: any }) {
  const d = data as ScrollStoryV1Data;
  const entries: StoryEntry[] = Array.isArray(d?.entries) ? d.entries : [];
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

      const scrolled = Math.max(0, -top);
      const total = Math.max(1, height - vh);
      const p = Math.min(1, scrolled / total);
      // keep dot 24px from top / bottom of viewport
      const dotY = 24 + p * (vh - 48);

      setDotStyle({ opacity: 1, top: dotY });
    }

    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, [showProgress]);

  if (!entries.length) return null;

  return (
    <section className="scroll-story" ref={sectionRef}>
      <Container>
        {entries.map((entry, idx) => {
          const imgLeft = (entry.imagePosition ?? "right") === "left";
          const images = Array.isArray(entry.images) ? entry.images : [];

          const textCol = (
            <div className="scroll-story__text">
              {entry.label ? (
                <p className="scroll-story__label">{entry.label}</p>
              ) : null}
              {entry.text ? (
                <div className="scroll-story__body">
                  {entry.text.split("\n\n").map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              ) : null}
            </div>
          );

          const mediaCol = (
            <div
              className="scroll-story__media"
              style={{ "--ss-top": stickyTop } as React.CSSProperties}
            >
              {images.map((img, i) => (
                <MediaImage
                  key={i}
                  src={img.src}
                  alt={img.alt ?? ""}
                  className="scroll-story__image"
                  sizes="(max-width: 767px) 100vw, 50vw"
                />
              ))}
              {images.length === 0 ? (
                <div className="scroll-story__image scroll-story__image--placeholder" />
              ) : null}
            </div>
          );

          return (
            <div key={idx} className="scroll-story__entry">
              {imgLeft ? mediaCol : textCol}
              {imgLeft ? textCol : mediaCol}
            </div>
          );
        })}
      </Container>

      {showProgress ? (
        <div
          className="scroll-story__dot"
          style={dotStyle}
          aria-hidden="true"
        />
      ) : null}
    </section>
  );
}
