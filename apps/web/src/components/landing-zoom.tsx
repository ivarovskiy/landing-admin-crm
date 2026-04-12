"use client";
import { useEffect } from "react";

/**
 * Applies CSS zoom to `.landing-stack` at ≥768px.
 *
 * Normal mode (fitViewport=false):
 *   zoom = (viewport width / 1360) * scale
 *
 * Fit-viewport mode (fitViewport=true):
 *   zoom = (viewport height / (header height + hero-slider height)) * scale
 *   Falls back to width zoom when no slider is present.
 *
 * scale — global zoom coefficient (default 1.0), set by admin in Site Settings.
 */
export function LandingZoom({
  fitViewport = false,
  scale = 1,
}: {
  fitViewport?: boolean;
  scale?: number;
}) {
  useEffect(() => {
    const stack = document.querySelector(".landing-stack") as HTMLElement | null;
    if (!stack) return;

    const mq = window.matchMedia("(min-width: 768px)");
    const DESIGN_WIDTH = 1480; // 1360px content + 60px padding on each side
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

      const auto = Math.min(1, document.documentElement.clientWidth / DESIGN_WIDTH);
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
  }, [fitViewport, scale]);

  return null;
}
