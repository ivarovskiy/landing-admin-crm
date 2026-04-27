"use client";
import { useEffect } from "react";

const VIEWPORT_DEFAULT = "width=device-width, initial-scale=1";
const PREPAINT_STYLE_ID = "landing-zoom-pre";

function getOrCreateViewportMeta(): HTMLMetaElement {
  let el = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  if (!el) {
    el = document.createElement("meta");
    el.name = "viewport";
    document.head.appendChild(el);
  }
  return el;
}

function removePrepaintStyle() {
  const el = document.getElementById(PREPAINT_STYLE_ID);
  if (el) el.remove();
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
 * preventInitialFlicker — coordinates with the SSR pre-paint script in
 *                         RootLayout. When true, this component:
 *                           - assumes meta viewport / hide-scrollbar / .landing-stack zoom
 *                             have already been applied synchronously in <head>;
 *                           - does NOT restore the previous meta content on
 *                             unmount (which would re-trigger a flicker);
 *                           - removes the prepaint <style id="landing-zoom-pre">
 *                             once it has set its own inline zoom on .landing-stack.
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
  preventInitialFlicker = false,
}: {
  enableZoom?: boolean;
  designWidth?: number;
  zoomBreakpoint?: number;
  scale?: number;
  fitViewport?: boolean;
  normalizeViewport?: boolean;
  normalizeViewportWidth?: number;
  hideScrollbar?: boolean;
  preventInitialFlicker?: boolean;
}) {
  /* ── Hide scrollbar ── */
  useEffect(() => {
    const html = document.documentElement;
    if (hideScrollbar) {
      html.classList.add("hide-scrollbar");
    } else {
      html.classList.remove("hide-scrollbar");
    }
    if (preventInitialFlicker) {
      // Pre-paint script already applied; don't toggle on unmount because that
      // would cause a flash on route transitions.
      return;
    }
    return () => html.classList.remove("hide-scrollbar");
  }, [hideScrollbar, preventInitialFlicker]);

  /* ── Normalize viewport meta ── */
  useEffect(() => {
    const meta = getOrCreateViewportMeta();
    if (preventInitialFlicker) {
      // Pre-paint script already set this; keep in sync with prop changes only,
      // and never restore on unmount.
      const desired = normalizeViewport
        ? `width=${normalizeViewportWidth}`
        : VIEWPORT_DEFAULT;
      if (meta.content !== desired) meta.content = desired;
      return;
    }
    const prev = meta.content;
    if (normalizeViewport) {
      meta.content = `width=${normalizeViewportWidth}`;
    }
    return () => {
      meta.content = prev || VIEWPORT_DEFAULT;
    };
  }, [normalizeViewport, normalizeViewportWidth, preventInitialFlicker]);

  /* ── CSS zoom ── */
  useEffect(() => {
    const stack = document.querySelector(".landing-stack") as HTMLElement | null;
    if (!stack) return;

    if (!enableZoom) {
      stack.style.removeProperty("zoom");
      removePrepaintStyle();
      return;
    }

    const mqQuery = `(min-width: ${zoomBreakpoint}px)`;
    const mq = window.matchMedia(mqQuery);
    const dw = designWidth > 0 ? designWidth : 1480;
    const s = typeof scale === "number" && isFinite(scale) && scale > 0 ? scale : 1;

    let prepaintCleared = false;
    const update = () => {
      // Compute target zoom value first so we can apply it without going
      // through an intermediate zoom-less state (which would un-do the
      // SSR prepaint style and cause a flicker).
      let target: string | null = null;

      if (mq.matches) {
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
            if (final < 0.999) target = final.toFixed(5);
          }
        }

        if (target == null) {
          const auto = Math.min(1, document.documentElement.clientWidth / dw);
          const final = auto * s;
          if (final < 0.999) target = final.toFixed(5);
        }
      }

      if (target == null) {
        stack.style.removeProperty("zoom");
      } else {
        stack.style.zoom = target;
      }

      // After we have applied (or explicitly cleared) zoom via inline style,
      // the SSR prepaint <style> rule is redundant and can be removed.
      if (!prepaintCleared) {
        removePrepaintStyle();
        prepaintCleared = true;
      }
    };

    update();

    // Re-run after fonts and images settle. `document.fonts.ready` resolves
    // ONCE for the initial batch; fonts that start loading later (e.g. oblique
    // italic registered via CSS variable) are missed. Listen for `loadingdone`
    // and add safety timeouts so a late-arriving font doesn't leave us with a
    // stale, smaller-metrics layout until the user scrolls.
    const fonts = (document as { fonts?: FontFaceSet }).fonts;
    if (fonts?.ready) {
      fonts.ready.then(() => update()).catch(() => {});
    }
    const onFontsLoadingDone = () => update();
    fonts?.addEventListener?.("loadingdone", onFontsLoadingDone);

    const onLoad = () => update();
    window.addEventListener("load", onLoad);
    window.addEventListener("resize", update);
    mq.addEventListener("change", update);

    // Safety nets — re-measure after short delays in case font metrics or
    // image dimensions finalized after mount but before any event fired.
    const t1 = window.setTimeout(update, 250);
    const t2 = window.setTimeout(update, 800);
    const t3 = window.setTimeout(update, 2000);

    return () => {
      window.removeEventListener("load", onLoad);
      window.removeEventListener("resize", update);
      mq.removeEventListener("change", update);
      fonts?.removeEventListener?.("loadingdone", onFontsLoadingDone);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      stack.style.removeProperty("zoom");
    };
  }, [enableZoom, designWidth, zoomBreakpoint, fitViewport, scale]);

  return null;
}
