"use client";

import { useEffect } from "react";

export function PageLoader() {
  useEffect(() => {
    const html = document.documentElement;

    const dismiss = () => {
      // Swap class: keep opacity:0 but add transition, then drop page-loading so it fades to 1.
      html.classList.add("page-loading-out");
      requestAnimationFrame(() => {
        html.classList.remove("page-loading");
      });
    };

    // Hero slider already signalled (image was cached, fired in useLayoutEffect before this useEffect).
    if ((window as any).__pageReady) { dismiss(); return; }

    // No hero slider on this page — dismiss immediately.
    if (!(window as any).__pageLoaderHeld) { dismiss(); return; }

    // Hero slider is present but image not yet decoded — wait for it.
    window.addEventListener("page-ready", dismiss, { once: true });
    // Hard fallback: never block more than 5s.
    const t = setTimeout(dismiss, 5000);
    return () => {
      window.removeEventListener("page-ready", dismiss);
      clearTimeout(t);
    };
  }, []);

  return null;
}
