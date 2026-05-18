/**
 * Slide template presets for the hero slider.
 * Each preset provides default content + layout for a specific visual arrangement.
 */

export type SlideTemplate =
  | "image-left-copy-right"
  | "copy-left-image-right"
  | "full-image";

export type TextVariant = "plain" | "stamp";
export type BodyVariant = "plain" | "list";
export type ObjectFit = "cover" | "contain";
export type HeroViewportProfileKey = "ipadPro";
export type HeroTuningScope = "default" | HeroViewportProfileKey;

export type SlideMedia = {
  kind?: "image";
  src?: string;
  alt?: string;
  aspectRatio?: string;
  objectFit?: ObjectFit;
};

/** Typography class that can be applied to slide elements */
export type TypoClass =
  | ""
  | "typo-content-header"
  | "typo-homepage-header"
  | "typo-subtitle"
  | "typo-body-text"
  | "typo-section-header"
  | "typo-text-header"
  | "typo-promo-header"
  | "typo-teachers-header";

/** Per-element positioning — margin, padding, alignment, size override */
export type ElementStyle = {
  mt?: string;   // margin-top
  mb?: string;   // margin-bottom
  ml?: string;   // margin-left
  mr?: string;   // margin-right
  pt?: string;   // padding-top
  pb?: string;   // padding-bottom
  x?: string;    // legacy drag offset folded into ml during absolute migration
  y?: string;    // legacy drag offset folded into mt during absolute migration
  w?: string;    // absolute rendered width captured from the live preview
  align?: "left" | "center" | "right";   // text-align + align-self
  size?: string;  // font-size override
  typo?: TypoClass; // typography class from design system
  strokeW?: string; // -webkit-text-stroke width (e.g. "3.6px")
  letterSpacing?: string; // letter-spacing (e.g. "0.05em", "2px")
  snapToBaseline?: boolean; // lock Y to the canvas baseline guideline
  locked?: boolean;         // prevent position/size changes in canvas and preview
  hidden?: boolean;         // hide this element without deleting it
  groupId?: string;         // group identifier — used for bulk lock/unlock in the form
  alignMode?: "1" | "2" | "3" | "4"; // centering reference field (used when align === "center")
  useFontOffset?: boolean;  // opt-in per-font padding offset (see getTypoOffset)
  viewportProfiles?: Partial<Record<HeroViewportProfileKey, ElementStyleProfile>>;
};

/** Classic design grid overlay — configurable columns/rows + optional center lines */
export type ClassicGridSettings = {
  enabled?: boolean;
  columns?: number;             // number of vertical column divisions (default 6)
  rows?: number;                // number of horizontal row divisions (default 4)
  showVerticalCenter?: boolean; // render 2 DOM-measured center lines (text-zone + media-zone)
  showHorizontalCenter?: boolean; // render a bright center-horizontal line
  color?: string;               // optional CSS color for column/row lines
  marginPx?: number;            // outer horizontal margin in design-canvas px (1440 basis)
  showMarginLines?: boolean;    // draw outer margin edge lines
};

/** One configurable guideline inside the stylistic overlay. */
export type StyleExtraGuideline = {
  id: string;
  label?: string;
  type: "vertical" | "horizontal";
  /** Position value. Interpretation depends on positionUnit + fromEdge. */
  position: number;
  positionUnit?: "px" | "percent"; // default "px" (design-canvas px: 1440 wide, 574 tall)
  fromEdge?: "right" | "bottom";   // measure from right/bottom instead of left/top
  pairId?: string;                 // share a pairId with another guideline for pair-toggle
  visible?: boolean;               // false hides the line without deleting it
};

/** Stylistic guideline system config — stored at block level inside canvasGuidelines. */
export type StyleGuidelinesConfig = {
  showBoundaries?: boolean;         // group 1: left/right slide-edge vertical lines
  showPhotoMargins?: boolean;       // group 2: outer photo placement margin verticals
  photoMarginLeft?: number;         // px from left slide edge (design-canvas px, 1440 basis)
  photoMarginRight?: number;        // px from right slide edge (design-canvas px, 1440 basis)
  showPhotoInnerOffsets?: boolean;  // group 3: inner offsets measured from photo bounds
  photoInnerOffsetLeft?: number;    // layout px inward from photo left edge
  photoInnerOffsetRight?: number;   // layout px inward from photo right edge
  showPhotoEdges?: boolean;         // group 4: horizontal lines at photo top/bottom
  showItalicLimit?: boolean;        // group 5: italic text lower-limit horizontal line
  italicLimitOffset?: number;       // px from bottom (design-canvas px, 574 basis); falls back to canvasGuidelines.italicBaselineOffset
  extras?: StyleExtraGuideline[];   // group 6: up to 4–6 additional named guidelines
  showTextCenterV?: boolean;        // vertical center of full text area (legacy simple mode)
  showTextCenterH?: boolean;        // horizontal center of text area (horizontal line)
  showMediaGap?: boolean;           // vertical line at text column inner edge (gap boundary)
  showMediaEdgeGuides?: boolean;    // inner edge: vertical line; outer edge: vertical + horizontal lines
  showColumnCenter?: boolean;       // single DOM-measured text-zone center line (modes 1–4)
  columnCenterMode?: 1 | 2 | 3 | 4; // which zone pair to bisect (default 1)
  columnCenterOuterMarginPx?: number; // outer text margin in layout px (default 13)
};

/** Canvas guideline offsets stored at block level (shared across all slides) */
export type CanvasGuidelines = {
  gapOffset?: number;            // px from top — amber dashed line
  baselineOffset?: number;       // px from bottom — purple dashed line
  italicBaselineOffset?: number; // px from bottom — lowest allowed italic design-element guide
  classicGrid?: ClassicGridSettings; // classic configurable design grid
  styleGuidelines?: StyleGuidelinesConfig; // stylistic layout guideline overlay
  globalVerticalGuide?: string;      // CSS `left` value for a full-page-height vertical line
  globalVerticalGuideColor?: string;
  sliderHorizontalGuide?: string;    // CSS `top` value for a full-slider-width horizontal line
  sliderHorizontalGuideColor?: string;
};

export type ElementStyleProfile = Omit<ElementStyle, "viewportProfiles">;

/** Extra text block that can be added to any slide */
export type SlideExtra = {
  id?: string;
  kind: "text" | "kicker" | "stamp";
  text: string;
  style?: ElementStyle;
};

export type HeroDesktopLayout = {
  gap?: string;
  mediaWidth?: string;
  textWidth?: string;
  titleSize?: string;
  subtitleSize?: string;
  kickerSize?: string;
  bodySize?: string;
  textAlign?: "left" | "center" | "right";
  contentJustify?: "start" | "center" | "end";
  contentOffsetX?: string;
  contentOffsetY?: string;
  padding?: string;
  mediaPadding?: string;
  mediaHeight?: string;
  mediaAlign?: "start" | "center" | "end" | "stretch";
  textAlignFullWidth?: boolean;
  dragIgnoreGap?: boolean;
  imageSide?: "left" | "right";
  outerPadding?: string;   // symmetric outer padding used for centering mode math (modes 2 & 4)
};

export type Slide = {
  id?: string;
  /** Display name shown in the admin slide list — admin-only, not rendered on site */
  name?: string;
  template?: SlideTemplate;
  /** Hide this slide from the carousel without deleting it (admin-only state) */
  hidden?: boolean;
  /** Render order of text elements: fixed keys ('quote'|'kicker'|'title'|'subtitle'|'body') or extra ids */
  elementOrder?: string[];
  /** Mirror the layout — swaps media ↔ text horizontally for templates with both columns */
  mirror?: boolean;
  /** Stretch the text column to match media height — children spread top↔bottom */
  stretchTextToMedia?: boolean;
  /** Per-slide autoplay duration (ms). Falls back to options.autoPlayMs when unset/zero. */
  autoPlayMs?: number;
  quote?: string;
  kicker?: string;
  kickerVariant?: TextVariant;
  title?: string;
  subtitle?: string;
  subtitleVariant?: TextVariant;
  body?: string;
  bodyVariant?: BodyVariant;
  cta?: {
    label?: string;
    href?: string;
    /** false = slide is static (no cursor change, no click navigation). Defaults to true when href is set. */
    enabled?: boolean;
    /** "_blank" opens in a new tab. Defaults to "_self". */
    target?: "_self" | "_blank";
  };
  media?: SlideMedia;
  extras?: SlideExtra[];
  /** Per-element style overrides */
  quoteStyle?: ElementStyle;
  kickerStyle?: ElementStyle;
  titleStyle?: ElementStyle;
  subtitleStyle?: ElementStyle;
  bodyStyle?: ElementStyle;
  ctaStyle?: ElementStyle;
  layout?: {
    desktop?: HeroDesktopLayout;
    mobile?: {
      imageFirst?: boolean;
    };
    viewportProfiles?: Partial<Record<HeroViewportProfileKey, {
      desktop?: HeroDesktopLayout;
    }>>;
  };
  /** undefined/"flow" keeps legacy cascade margins; "absolute" stores independent mt/ml coordinates. */
  positioningMode?: "flow" | "absolute";
};

export const TEMPLATE_OPTIONS: { value: SlideTemplate; label: string }[] = [
  { value: "image-left-copy-right", label: "Photo left, text right" },
  { value: "copy-left-image-right", label: "Text left, photo right" },
  { value: "full-image", label: "Full-width image (no text)" },
];

/** Named presets — pre-fill specific fields for each Figma slide design */
export type PresetKey = "1" | "2" | "3" | "4" | "5" | "6" | "7";

export const PRESET_OPTIONS: { value: PresetKey; label: string }[] = [
  { value: "1", label: "① Photo left — title + subtitle" },
  { value: "2", label: "② Title + subtitle — photo right" },
  { value: "3", label: "③ Photo left — title + bullet list" },
  { value: "4", label: "④ Title + bullet list — photo right" },
  { value: "5", label: "⑤ Kicker + title — wide photo right" },
  { value: "6", label: "⑥ Full-width banner image" },
  { value: "7", label: "⑦ Photo left — subtitle + bullet list (right-aligned)" },
];

export const TEXT_VARIANT_OPTIONS = [
  { value: "plain", label: "Plain" },
  { value: "stamp", label: "Stamp" },
];

export const BODY_VARIANT_OPTIONS = [
  { value: "plain", label: "Paragraph" },
  { value: "list", label: "Uppercase list" },
];

export const ASPECT_RATIO_OPTIONS = [
  { value: "1/1", label: "1:1 — Square" },
  { value: "5/3", label: "5:3 — Landscape" },
  { value: "16/9", label: "16:9 — Wide" },
  { value: "16/7", label: "16:7 — Banner" },
  { value: "4/3", label: "4:3 — Classic" },
  { value: "3/2", label: "3:2 — Photo" },
  { value: "4/5", label: "4:5 — Portrait" },
  { value: "5/7", label: "5:7 — Tall portrait" },
  { value: "2/3", label: "2:3 — Vertical" },
  { value: "3/5", label: "3:5 — Tall vertical" },
  { value: "9/16", label: "9:16 — Story" },
];

export const FIT_OPTIONS = [
  { value: "cover", label: "Cover" },
  { value: "contain", label: "Contain" },
];

export const ALIGN_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

export const JUSTIFY_OPTIONS = [
  { value: "start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "end", label: "End" },
];

export const TYPO_OPTIONS: { value: TypoClass; label: string }[] = [
  { value: "", label: "Default" },
  { value: "typo-homepage-header", label: "Block Title (104px stamp)" },
  { value: "typo-content-header", label: "Page / Slider Header (78px stamp)" },
  { value: "typo-subtitle", label: "Tagline (47px oblique stamp)" },
  { value: "typo-promo-header", label: "Slider Promo Header (26px)" },
  { value: "typo-section-header", label: "Section Title (22px, ls 32.7%)" },
  { value: "typo-teachers-header", label: "Teachers Names (22px, ls 20%)" },
  { value: "typo-text-header", label: "Pull-Out Quote (22px, ls 32.1%)" },
  { value: "typo-body-text", label: "Column Text (20px)" },
];

const CTA_DEFAULT = { label: "LEARN MORE", href: "#address" };

/** Preset media — no src means the slide renders as a grey placeholder with ratio label */
function media(alt: string, aspect: string, fit: ObjectFit = "cover"): SlideMedia {
  return { kind: "image", alt, aspectRatio: aspect, objectFit: fit };
}

/** Fields allowed per template — everything else gets removed on switch */
export const TEMPLATE_FIELDS: Record<SlideTemplate, (keyof Slide)[]> = {
  "image-left-copy-right":  ["template", "quote", "kicker", "title", "subtitle", "body", "bodyVariant", "cta", "media", "extras", "elementOrder", "quoteStyle", "kickerStyle", "titleStyle", "subtitleStyle", "bodyStyle", "ctaStyle", "layout", "positioningMode"],
  "copy-left-image-right":  ["template", "quote", "kicker", "title", "subtitle", "body", "bodyVariant", "cta", "media", "extras", "elementOrder", "quoteStyle", "kickerStyle", "titleStyle", "subtitleStyle", "bodyStyle", "ctaStyle", "layout", "positioningMode"],
  "full-image":             ["template", "media", "layout", "positioningMode"],
};

/** Get preset by Figma slide number */
export function presetSlide(preset: PresetKey): Omit<Slide, "id"> {
  switch (preset) {
    case "1": // ① Photo left — title + subtitle
      return {
        template: "image-left-copy-right",
        title: "FUN\nCHILDREN'S\nPROGRAMS",
        subtitle: "For 2026-27 Academic Year",
        cta: CTA_DEFAULT,
        media: media("Children's programs", "1/1"),
        titleStyle: { typo: "typo-content-header", mt: "120px", mb: "46px" },
        subtitleStyle: { typo: "typo-subtitle", pb: "132px" },
        ctaStyle: { mb: "4px" },
        layout: {
          desktop: {
            gap: "50px", mediaWidth: "547px", textWidth: "88%",
            textAlign: "left", contentJustify: "center",
            mediaPadding: "0 0 0 12px",
          },
          mobile: { imageFirst: true },
        },
      };

    case "2": // ② Title + subtitle — photo right
      return {
        template: "copy-left-image-right",
        title: "SCHOOL YEAR\n2026-27",
        subtitle: "Registration Now Open",
        cta: CTA_DEFAULT,
        media: media("School year", "1/1"),
        titleStyle: { typo: "typo-content-header", mt: "73px", mb: "18px" },
        subtitleStyle: { typo: "typo-subtitle", ml: "15px" },
        layout: {
          desktop: {
            gap: "114px", mediaWidth: "547px", textWidth: "100%",
            textAlign: "center", contentJustify: "center",
            contentOffsetX: "0",
            mediaPadding: "0 13px 0 0",
          },
          mobile: { imageFirst: false },
        },
      };

    case "3": // ③ Photo left — subtitle + bullet list (right-aligned)
      return {
        template: "image-left-copy-right",
        subtitle: "All Levels\nAge 3 and Up",
        body: "BALLET\nPOINTE\nCONTEMPORARY\nJAZZ\nHIP HOP\nTAP COMBO CLASSES\nPRESCHOOL DANCE",
        bodyVariant: "list",
        cta: CTA_DEFAULT,
        media: media("Dance styles", "788/526"),
        subtitleStyle: { mt: "80px", mb: "44px", typo: "typo-subtitle", align: "left" },
        bodyStyle: { typo: "typo-text-header", align: "right", pb: "112px" },
        layout: {
          desktop: {
            gap: "50px", mediaWidth: "818px", textWidth: "80%",
            textAlign: "right", contentJustify: "center",
            mediaPadding: "0 0 0 12px",
          },
          mobile: { imageFirst: true },
        },
      };

    case "4": // ④ Photo left — subtitle + bullet list (left-aligned)
      return {
        template: "image-left-copy-right",
        subtitle: "All Levels\nAge 3 and Up",
        body: "BALLET\nPOINTE\nCONTEMPORARY\nJAZZ\nHIP HOP\nTAP COMBO CLASSES\nPRESCHOOL DANCE",
        bodyVariant: "list",
        cta: CTA_DEFAULT,
        media: media("Dance styles", "788/526"),
        subtitleStyle: { mt: "80px", mb: "44px", typo: "typo-subtitle", align: "left" },
        bodyStyle: { typo: "typo-text-header", align: "left", pb: "112px" },
        layout: {
          desktop: {
            gap: "50px", mediaWidth: "818px", textWidth: "80%",
            textAlign: "right", contentJustify: "center",
            mediaPadding: "0 0 0 12px",
          },
          mobile: { imageFirst: true },
        },
      };

    case "5": // ⑤ Kicker + title — wide photo right
      return {
        template: "copy-left-image-right",
        kicker: "June 25th to\nAugust 4th",
        title: "2027\nSUMMER\nPROGRAM",
        cta: CTA_DEFAULT,
        ctaStyle: { align: "right" },
        kickerStyle: { mt: "60px", mb: "76px", typo: "typo-subtitle", align: "right" },
        titleStyle: { typo: "typo-content-header", mb: "66px", ml: "30px", align: "right" },
        media: media("Program photo", "796/448"),
        layout: {
          desktop: {
            gap: "60px", mediaWidth: "818px", textWidth: "82%",
            textAlign: "left", contentJustify: "end",
            mediaPadding: "26px 12px 66px 0",
          },
          mobile: { imageFirst: false },
        },
      };

    case "6": // ⑥ Full-width banner image
      return {
        template: "full-image",
        media: media("Full image", "16/6"),
        layout: {
          desktop: { mediaWidth: "100%", mediaPadding: "0 12px" },
          mobile: { imageFirst: true },
        },
      };
      
      case "7": // ⑦ Photo left — subtitle + bullet list (right-aligned)"
      return {
        template: "image-left-copy-right",
        subtitle: "All Levels\nAge 3 and Up",
        body: "BALLET\nPOINTE\nCONTEMPORARY\nJAZZ\nHIP HOP\nTAP COMBO CLASSES\nPRESCHOOL DANCE",
        bodyVariant: "list",
        cta: CTA_DEFAULT,
        media: media("Dance styles", "788/526"),
        titleStyle: { mt: "120px", mb: "46px" },
        subtitleStyle: { mt: "80px", mb: "44px", typo: "typo-subtitle", align: "left" },
        bodyStyle: { typo: "typo-text-header", align: "right", pb: "112px" },
        layout: {
          desktop: {
            gap: "50px", mediaWidth: "818px", textWidth: "80%",
            textAlign: "right", contentJustify: "center",
            mediaPadding: "0 0 0 12px",
          },
          mobile: { imageFirst: true },
        },
      };
  }
}

export function newSlide(preset: PresetKey = "2"): Slide {
  return {
    id: crypto?.randomUUID?.() ?? `slide-${Date.now()}`,
    ...presetSlide(preset),
  };
}

// ─── Per-font bottom offset (configured in Typography admin settings) ─────────

/**
 * Fonts that have a bottom offset configured in Typography settings.
 * Add a key here when you configure bottomOffset for that font in admin.
 * The actual value lives in Typography settings → bottomOffset field.
 */
const TYPO_OFFSET_FONTS = new Set([
  "typo-content-header",
]);

/** Returns true when this font has a bottom offset configured in Typography settings. */
export function getTypoOffset(typoClass?: string): boolean {
  return !!typoClass && TYPO_OFFSET_FONTS.has(typoClass);
}
