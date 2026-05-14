/**
 * Pure business-logic utilities for slider layout management.
 * No React or DOM dependencies — safe to import in tests and in form components.
 */

import type {
  Slide,
  ElementStyle,
  ElementStyleProfile,
  HeroViewportProfileKey,
  SlideExtra,
} from "./hero-slider-presets";

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

export function setSlideStyle(slide: Slide, key: string, style: ElementStyle): Slide {
  if (key === "title") return { ...slide, titleStyle: style };
  if (key === "subtitle") return { ...slide, subtitleStyle: style };
  if (key === "kicker") return { ...slide, kickerStyle: style };
  if (key === "body") return { ...slide, bodyStyle: style };
  if (key === "quote") return { ...slide, quoteStyle: style };
  const extras = Array.isArray(slide.extras) ? slide.extras : [];
  return { ...slide, extras: extras.map((e) => e.id === key ? { ...e, style } : e) };
}

function getEffectiveSlideStyle(
  slide: Slide,
  key: string,
  profile?: HeroViewportProfileKey,
): ElementStyle | undefined {
  const base = getSlideStyle(slide, key);
  if (!base || !profile) return base;
  const profileStyle = base.viewportProfiles?.[profile];
  return profileStyle ? { ...base, ...profileStyle } : base;
}

function setSlideProfileStyle(
  slide: Slide,
  key: string,
  profile: HeroViewportProfileKey,
  patch: ElementStyleProfile,
): Slide {
  const base = getSlideStyle(slide, key) ?? {};
  return setSlideStyle(slide, key, {
    ...base,
    viewportProfiles: {
      ...(base.viewportProfiles ?? {}),
      [profile]: {
        ...(base.viewportProfiles?.[profile] ?? {}),
        ...patch,
      },
    },
  });
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

function getViewportProfileKeys(slide: Slide): HeroViewportProfileKey[] {
  const profiles = new Set<HeroViewportProfileKey>();
  for (const key of getOrderedKeys(slide)) {
    if (getSlideStyle(slide, key)?.viewportProfiles?.ipadPro) profiles.add("ipadPro");
  }
  return [...profiles];
}

function getPrecedingMt(slide: Slide, targetKey: string, profile?: HeroViewportProfileKey): number {
  let sum = 0;
  for (const key of getOrderedKeys(slide)) {
    if (key === targetKey) break;
    sum += parsePx(getEffectiveSlideStyle(slide, key, profile)?.mt);
  }
  return sum;
}

function toAbsoluteStyle(
  slide: Slide,
  key: string,
  style: ElementStyle,
  profile?: HeroViewportProfileKey,
): ElementStyleProfile {
  const rest = Object.fromEntries(
    Object.entries(style).filter(([key]) => key !== "viewportProfiles"),
  ) as ElementStyleProfile;
  const nextMt = Math.round(parsePx(style.mt) + parsePx(style.y) + getPrecedingMt(slide, key, profile));
  const nextMl = Math.round(parsePx(style.ml) + parsePx(style.x));
  return {
    ...rest,
    mt: nextMt !== 0 ? `${nextMt}px` : undefined,
    ml: nextMl !== 0 ? `${nextMl}px` : undefined,
    x: undefined,
    y: undefined,
  };
}

export function migrateSlideToAbsolute(slide: Slide): Slide {
  if (slide.positioningMode === "absolute") return slide;
  const source = slide;
  let result = { ...slide };

  for (const key of getOrderedKeys(source)) {
    const style = getEffectiveSlideStyle(source, key);
    if (!style) continue;
    result = setSlideStyle(result, key, {
      ...(getSlideStyle(result, key) ?? {}),
      ...toAbsoluteStyle(source, key, style),
    });
  }

  for (const profile of getViewportProfileKeys(source)) {
    for (const key of getOrderedKeys(source)) {
      const style = getEffectiveSlideStyle(source, key, profile);
      if (!style) continue;
      result = setSlideProfileStyle(result, key, profile, toAbsoluteStyle(source, key, style, profile));
    }
  }

  return { ...result, positioningMode: "absolute" };
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
      // Inherit ALL original style fields (typo, align, size, strokeW, locked, groupId, viewportProfiles…)
      ...(originalStyle ?? {}),
      // Override position to stack lines vertically; reset baseline snap since each line is now free
      mt: `${baseMt + (i + 1) * lineSpacingPx}px`,
      ml: baseMl ? `${baseMl}px` : undefined,
      snapToBaseline: undefined,
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
