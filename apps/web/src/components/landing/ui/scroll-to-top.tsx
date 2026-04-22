"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Icon } from "../icons";

export type ScrollToTopProps = {
  enabled?: boolean;
  right?: string;
  bottom?: string;
  showAfter?: number;
  stopOffset?: number;
};

export function ScrollToTop({
  enabled = true,
  right,
  bottom,
  showAfter = 400,
  stopOffset,
}: ScrollToTopProps) {
  const [visible, setVisible] = useState(false);
  const [pushUp, setPushUp] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    function onScroll() {
      const scrollY = window.scrollY;
      setVisible(scrollY > showAfter);

      if (stopOffset && stopOffset > 0) {
        const docHeight = document.documentElement.scrollHeight;
        const viewHeight = window.innerHeight;
        const distFromBottom = docHeight - scrollY - viewHeight;
        setPushUp(Math.max(0, stopOffset - distFromBottom));
      } else {
        setPushUp(0);
      }
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [enabled, showAfter, stopOffset]);

  if (!enabled) return null;

  function scrollTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const style: CSSProperties = {};
  if (right) style.right = right;
  if (pushUp > 0) {
    style.bottom = bottom ? `calc(${bottom} + ${pushUp}px)` : `${pushUp}px`;
  } else if (bottom) {
    style.bottom = bottom;
  }

  return (
    <button
      type="button"
      onClick={scrollTop}
      aria-label="Повернутись нагору"
      className={`scroll-to-top${visible ? " scroll-to-top--visible" : ""}`}
      style={style}
    >
      {/* <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 12V4M4 7l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg> */}
      <Icon name="arrow-up" className="header-desktop__portal-icon" aria-hidden/>
    </button>
  );
}
