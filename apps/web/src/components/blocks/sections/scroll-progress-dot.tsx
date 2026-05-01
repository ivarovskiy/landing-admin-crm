"use client";

import { useEffect, useRef } from "react";

// Tracks scroll progress through the nearest .content-page ancestor
// and moves a fixed dot on the right edge of the viewport.
export function ScrollProgressDot() {
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    if (!dot) return;

    const section = dot.closest(".content-page") as HTMLElement | null;
    if (!section) return;

    function update() {
      const { top, height } = section!.getBoundingClientRect();
      const vh = window.innerHeight;

      if (top > vh || top + height < 0) {
        dot!.style.opacity = "0";
        return;
      }

      const p = Math.min(1, Math.max(0, -top / Math.max(1, height - vh)));
      dot!.style.opacity = "1";
      dot!.style.top = `${24 + p * (vh - 48)}px`;
    }

    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

  return <div ref={dotRef} className="cp__scroll-dot" aria-hidden="true" />;
}
