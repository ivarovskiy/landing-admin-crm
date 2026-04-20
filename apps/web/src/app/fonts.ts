import localFont from "next/font/local";

export const fontMaru = localFont({
  src: [
    { path: "../assets/fonts/GTMaruRegular.ttf", weight: "400", style: "normal" },
    { path: "../assets/fonts/GTMaruMedium.ttf", weight: "500", style: "normal" },
    { path: "../assets/fonts/GTMaruBold.ttf", weight: "700", style: "normal" },
    { path: "../assets/fonts/GTMaruBlack.ttf", weight: "900", style: "normal" },
  ],
  variable: "--font-maru",
  display: "swap",
  preload: true,
  adjustFontFallback: "Arial",
});

export const fontMaruOblique = localFont({
  src: [
    { path: "../assets/fonts/GTMaruMediumOblique.ttf", weight: "500", style: "normal" },
  ],
  variable: "--font-maru-oblique",
  display: "swap",
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