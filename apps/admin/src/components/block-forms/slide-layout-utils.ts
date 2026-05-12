/**
 * Pure business-logic utilities for slider layout management.
 * No React or DOM dependencies — safe to import in tests and in form components.
 */

import type { Slide, ElementStyle, SlideExtra } from "./hero-slider-presets";

// ─── Internal helpers ─────────────────────────────────────────────────────────

export function parsePx(v?: string): number {
  if (!v) return 0;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

export function getSlideText(slide: Slide, key: string): string {
  if (key === "title") return slide.title ?? "";
  if (key === "subtitle") return slide.subtitle ?? "";
  if (key === "kicker") return slide.kicker ?? "";
  if (key === "body") return slide.body ?? "";
  if (key === "quote") return slide.quote ?? "";
  return slide.extras?.find((e) => e.id === key)?.text ?? "";
}

export function getSlideStyle(slide: Slide, key: string): ElementStyle | undefined {
  if (key === "title") return slide.titleStyle;
  if (key === "subtitle") return slide.subtitleStyle;
  if (key === "kicker") return slide.kickerStyle;
  if (key === "body") return slide.bodyStyle;
  if (key === "quote") return slide.quoteStyle;
  return slide.extras?.find((e) => e.id === key)?.style;
}

/** Returns the ordered list of visible element keys for a slide. */
export function getOrderedKeys(slide: Slide): string[] {
  const extras = Array.isArray(slide.extras) ? slide.extras : [];
  const fixed: string[] = [];
  if (slide.kicker !== undefined) fixed.push("kicker");
  fixed.push("title");
  if (slide.subtitle !== undefined) fixed.push("subtitle");
  if (slide.body !== undefined) fixed.push("body");
  if (slide.quote !== undefined) fixed.push("quote");
  const extraKeys = extras.map((e, i) => e.id ?? String(i));
  const all = [...fixed, ...extraKeys];
  const stored = slide.elementOrder ?? [];
  const allSet = new Set(all);
  const used = new Set<string>();
  return [
    ...stored.filter((k) => allSet.has(k) && !used.has(k) && (used.add(k), true)),
    ...all.filter((k) => !used.has(k)),
  ];
}

// ─── Lock helpers ─────────────────────────────────────────────────────────────

/**
 * Returns true when an element is locked and must not be moved by any operation.
 * Checks the element's own lock flag.
 */
export function isElementLocked(slide: Slide, key: string): boolean {
  return !!(getSlideStyle(slide, key)?.locked);
}

/**
 * Set locked=true/false on every element whose groupId matches the given group.
 * Elements without the matching groupId are not affected.
 */
export function setGroupLock(slide: Slide, groupId: string, locked: boolean): Slide {
  const lockStyle = (style: ElementStyle | undefined): ElementStyle | undefined => {
    if (!style?.groupId || style.groupId !== groupId) return style;
    return { ...style, locked: locked || undefined };
  };

  const extras = Array.isArray(slide.extras) ? slide.extras : [];
  return {
    ...slide,
    titleStyle: lockStyle(slide.titleStyle),
    subtitleStyle: lockStyle(slide.subtitleStyle),
    kickerStyle: lockStyle(slide.kickerStyle),
    bodyStyle: lockStyle(slide.bodyStyle),
    quoteStyle: lockStyle(slide.quoteStyle),
    extras: extras.map((e) => ({ ...e, style: lockStyle(e.style) })),
  };
}

// ─── Text split ───────────────────────────────────────────────────────────────

/**
 * Split a multi-line text element into independent extras.
 *
 * - The first line stays in the original element.
 * - Subsequent lines become new SlideExtras inserted immediately after the
 *   original element in elementOrder.
 * - Each split element inherits typography/alignment from the original style;
 *   positions are staggered vertically by `lineSpacingPx` so they are
 *   visually distinct on the canvas.
 * - Returns the slide unchanged when the element has fewer than 2 non-empty lines.
 */
export function splitTextElement(
  slide: Slide,
  key: string,
  lineSpacingPx = 40,
): Slide {
  const text = getSlideText(slide, key);
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  if (lines.length < 2) return slide;

  const originalStyle = getSlideStyle(slide, key);
  const baseMt = parsePx(originalStyle?.mt);
  const baseMl = parsePx(originalStyle?.ml);
  const extras = Array.isArray(slide.extras) ? slide.extras : [];

  const newExtras: SlideExtra[] = lines.slice(1).map((line, i) => ({
    id: `split-${Date.now()}-${i}`,
    kind: "text" as const,
    text: line,
    style: {
      ...(originalStyle
        ? {
            typo: originalStyle.typo,
            align: originalStyle.align,
            size: originalStyle.size,
            strokeW: originalStyle.strokeW,
            groupId: originalStyle.groupId,
          }
        : {}),
      mt: `${baseMt + (i + 1) * lineSpacingPx}px`,
      ml: baseMl ? `${baseMl}px` : undefined,
    },
  }));

  let updated: Slide;
  if (key === "title") {
    updated = { ...slide, title: lines[0] };
  } else if (key === "subtitle") {
    updated = { ...slide, subtitle: lines[0] };
  } else if (key === "kicker") {
    updated = { ...slide, kicker: lines[0] };
  } else if (key === "body") {
    updated = { ...slide, body: lines[0] };
  } else if (key === "quote") {
    updated = { ...slide, quote: lines[0] };
  } else {
    updated = {
      ...slide,
      extras: extras.map((e) => (e.id === key ? { ...e, text: lines[0] } : e)),
    };
  }

  const currentOrder = getOrderedKeys(slide);
  const origIdx = currentOrder.indexOf(key);
  const newIds = newExtras.map((e) => e.id!);
  const newOrder = [
    ...currentOrder.slice(0, origIdx + 1),
    ...newIds,
    ...currentOrder.slice(origIdx + 1),
  ];

  return {
    ...updated,
    extras: [...(Array.isArray(updated.extras) ? updated.extras : []), ...newExtras],
    elementOrder: newOrder,
  };
}

/**
 * Apply a layout delta (dx, dy) to an element's ml/mt, respecting lock state.
 * Returns the style unchanged when locked; otherwise returns updated mt/ml.
 */
export function nudgeElement(
  style: ElementStyle | undefined,
  dx: number,
  dy: number,
): ElementStyle {
  if (style?.locked) return style ?? {};
  const mt = parsePx(style?.mt) + dy;
  const ml = parsePx(style?.ml) + dx;
  return {
    ...(style ?? {}),
    mt: mt !== 0 ? `${mt}px` : undefined,
    ml: ml !== 0 ? `${ml}px` : undefined,
  };
}
