"use client";
import { useEffect } from "react";

const VIEWPORT_DEFAULT = "width=device-width, initial-scale=1";

function getOrCreateViewportMeta(): HTMLMetaElement {
  let el = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  if (!el) {
    el = document.createElement("meta");
    el.name = "viewport";
    document.head.appendChild(el);
  }
  return el;
}

/**
 * All zoom/viewport behaviour is driven by props — nothing is hardcoded.
 *
 * enableZoom            — master switch for CSS zoom (default true)
 * designWidth           — reference canvas width in px (default 1480)
 * zoomBreakpoint        — min viewport width where zoom activates (default 768)
 * scale                 — coefficient multiplied on top of auto-zoom (default 1.0)
 * fitViewport           — fit page to screen height via header+hero measurement
 * normalizeViewport     — set <meta viewport content="width=N"> for native browser scaling
 * normalizeViewportWidth — the N above (default 1320)
 */
export function LandingZoom({
  enableZoom = true,
  designWidth = 1480,
  zoomBreakpoint = 768,
  scale = 1,
  fitViewport = false,
  normalizeViewport = false,
  normalizeViewportWidth = 1320,
  hideScrollbar = false,
}: {
  enableZoom?: boolean;
  designWidth?: number;
  zoomBreakpoint?: number;
  scale?: number;
  fitViewport?: boolean;
  normalizeViewport?: boolean;
  normalizeViewportWidth?: number;
  hideScrollbar?: boolean;
}) {
  /* ── Hide scrollbar ── */
  useEffect(() => {
    const html = document.documentElement;
    if (hideScrollbar) {
      html.classList.add("hide-scrollbar");
    }
    return () => html.classList.remove("hide-scrollbar");
  }, [hideScrollbar]);

  /* ── Normalize viewport meta ── */
  useEffect(() => {
    const meta = getOrCreateViewportMeta();
    const prev = meta.content;
    if (normalizeViewport) {
      meta.content = `width=${normalizeViewportWidth}`;
    }
    return () => {
      meta.content = prev || VIEWPORT_DEFAULT;
    };
  }, [normalizeViewport, normalizeViewportWidth]);

  /* ── CSS zoom ── */
  useEffect(() => {
    const stack = document.querySelector(".landing-stack") as HTMLElement | null;
    if (!stack) return;

    if (!enableZoom) {
      stack.style.removeProperty("zoom");
      return;
    }

    const mqQuery = `(min-width: ${zoomBreakpoint}px)`;
    const mq = window.matchMedia(mqQuery);
    const dw = designWidth > 0 ? designWidth : 1480;
    const s = typeof scale === "number" && isFinite(scale) && scale > 0 ? scale : 1;

    const update = () => {
      stack.style.removeProperty("zoom");
      if (!mq.matches) return;

      if (fitViewport) {
        void stack.offsetHeight;

        const headerH = parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue("--header-h") || "0"
        );
        const slider = stack.querySelector(".hero-slider") as HTMLElement | null;
        const sliderH = slider ? slider.offsetHeight : 0;
        const contentH = headerH + sliderH;

        if (contentH > 0) {
          const auto = Math.min(1, window.innerHeight / contentH);
          const final = auto * s;
          if (final < 0.999) {
            stack.style.zoom = final.toFixed(5);
            return;
          }
        }
      }

      const auto = Math.min(1, document.documentElement.clientWidth / dw);
      const final = auto * s;
      if (final < 0.999) {
        stack.style.zoom = final.toFixed(5);
      }
    };

    update();
    window.addEventListener("resize", update);
    mq.addEventListener("change", update);
    return () => {
      window.removeEventListener("resize", update);
      mq.removeEventListener("change", update);
      stack.style.removeProperty("zoom");
    };
  }, [enableZoom, designWidth, zoomBreakpoint, fitViewport, scale]);

  return null;
}
