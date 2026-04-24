import localFont from "next/font/local";

/**
 * Body font — used by kickers, bullet lists, paragraphs, etc.
 * Switched from `swap` to `block` because Arial's metrics don't match Maru
 * well enough: the swap visibly shrinks/grows chunks of the hero slide
 * (e.g. the right-aligned list on slide 3) until the real font loads.
 * With `preload: true` the font is in the critical request chain, so the
 * brief FOIT is barely perceptible and far less jarring than the FOUT size jump.
 */
export const fontMaru = localFont({
  src: [
    { path: "../assets/fonts/GTMaruRegular.ttf", weight: "400", style: "normal" },
    { path: "../assets/fonts/GTMaruMedium.ttf", weight: "500", style: "normal" },
    { path: "../assets/fonts/GTMaruBold.ttf", weight: "700", style: "normal" },
    { path: "../assets/fonts/GTMaruBlack.ttf", weight: "900", style: "normal" },
  ],
  variable: "--font-maru",
  display: "block",
  preload: true,
  adjustFontFallback: "Arial",
});

export const fontMaruOblique = localFont({
  src: [
    { path: "../assets/fonts/GTMaruMediumOblique.ttf", weight: "500", style: "normal" },
  ],
  variable: "--font-maru-oblique",
  display: "block",
  preload: true,
  adjustFontFallback: "Arial",
});

/**
 * Display font renders stamp headlines (OutlineStampText) — these use a
 * dual-span technique where the shadow copy is positioned absolutely.
 * With `swap`, fallback metrics briefly differ from the real font, producing
 * a visible "doubled outline" at the top of italic glyphs on first paint.
 * `block` makes the text invisible until the font is ready, trading FOUT
 * for a brief FOIT — acceptable since these are above-the-fold decorative
 * headlines and local fonts load quickly.
 */
export const fontDisplay = localFont({
  src: [
    { path: "../assets/fonts/GTMaruBlack.ttf", weight: "700", style: "normal" },
    { path: "../assets/fonts/GTMaruMedium.ttf", weight: "500", style: "normal" },
  ],
  variable: "--font-display",
  display: "block",
  preload: true,
  adjustFontFallback: "Arial",
});