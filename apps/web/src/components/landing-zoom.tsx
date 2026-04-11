"use client";
import { useEffect } from "react";

/**
 * Applies CSS zoom to `.landing-stack` at ≥768px.
 *
 * Normal mode (fitViewport=false):
 *   zoom = viewport width / 1360  — proportional width scaling.
 *
 * Fit-viewport mode (fitViewport=true):
 *   zoom = viewport height / (header height + hero-slider height)
 *   — scales the whole page so the hero fits on screen vertically.
 *   Falls back to width zoom when no slider is present.
 */
export function LandingZoom({ fitViewport = false }: { fitViewport?: boolean }) {
  useEffect(() => {
    const stack = document.querySelector(".landing-stack") as HTMLElement | null;
    if (!stack) return;

    const mq = window.matchMedia("(min-width: 768px)");
    const DESIGN_WIDTH = 1360;

    const update = () => {
      stack.style.removeProperty("zoom");
      if (!mq.matches) return;

      if (fitViewport) {
        // Force reflow at natural (unzoomed) size
        void stack.offsetHeight;

        const headerH = parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue("--header-h") || "0"
        );
        const slider = stack.querySelector(".hero-slider") as HTMLElement | null;
        const sliderH = slider ? slider.offsetHeight : 0;
        const contentH = headerH + sliderH;

        if (contentH > 0) {
          const scale = Math.min(1, window.innerHeight / contentH);
          if (scale < 0.999) {
            stack.style.zoom = scale.toFixed(5);
            return;
          }
        }
      }

      // Default: proportional width zoom
      const scale = Math.min(1, document.documentElement.clientWidth / DESIGN_WIDTH);
      if (scale < 0.999) {
        stack.style.zoom = scale.toFixed(5);
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
  }, [fitViewport]);

  return null;
}
