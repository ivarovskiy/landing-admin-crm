import type { BlockEditorAdapter, EditableElement } from "../types";

type TextField = "kicker" | "title" | "subtitle" | "body" | "quote";

const TEXT_FIELDS: Array<{
  field: TextField;
  label: string;
  styleKey: string;
  uppercase?: boolean;
}> = [
  { field: "kicker", label: "Kicker", styleKey: "kickerStyle", uppercase: true },
  { field: "title", label: "Title", styleKey: "titleStyle", uppercase: true },
  { field: "subtitle", label: "Subtitle", styleKey: "subtitleStyle", uppercase: true },
  { field: "body", label: "Body", styleKey: "bodyStyle" },
  { field: "quote", label: "Quote", styleKey: "quoteStyle" },
];

function parsePx(value?: string): number | undefined {
  if (!value) return undefined;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : undefined;
}

function offsetFromStyle(style: any) {
  const x = parsePx(style?.ml);
  const y = parsePx(style?.mt);
  if (x === undefined && y === undefined) return undefined;
  return { base: { x, y } };
}

function styleWithOffset(style: any, el: EditableElement) {
  const x = el.layout?.offset?.base?.x;
  const y = el.layout?.offset?.base?.y;
  return {
    ...(style ?? {}),
    ml: x ? `${Math.round(x)}px` : undefined,
    mt: y ? `${Math.round(y)}px` : undefined,
    size: el.style?.typography?.fontSize || style?.size,
  };
}

function textElement(slide: any, slideIndex: number, field: TextField, label: string, styleKey: string, uppercase?: boolean): EditableElement | null {
  if (slide?.[field] == null && field !== "title") return null;
  const style = slide?.[styleKey] ?? {};
  return {
    id: `slide-${slideIndex}-${field}`,
    type: "text",
    slot: `slides[${slideIndex}].${field}`,
    label: `Slide ${slideIndex + 1} - ${label}`,
    content: { text: slide?.[field] ?? "" },
    style: {
      typography: {
        ...(uppercase ? { textTransform: "uppercase" as const } : {}),
        ...(style?.size ? { fontSize: style.size } : {}),
      },
      decoration: field === "title" ? { titleVariant: slide?.layout?.titleVariant ?? "outline" } : undefined,
    },
    layout: {
      justify: field === "title" ? slide?.layout?.contentJustify : undefined,
      offset: offsetFromStyle(style),
    },
    visibility: {},
  } as EditableElement;
}

export const heroSliderV1Adapter: BlockEditorAdapter = {
  toEditableElements(data: any): EditableElement[] {
    const elements: EditableElement[] = [];
    const slides = Array.isArray(data?.slides) ? data.slides : [];
    const options = data?.options ?? {};

    elements.push({
      id: "option-autoplay",
      type: "text",
      slot: "options.autoPlayMs",
      label: "Autoplay (ms)",
      content: { text: String(options.autoPlayMs ?? 0) },
      visibility: {},
    });

    elements.push({
      id: "option-dots",
      type: "text",
      slot: "options.showDots",
      label: "Show Dots",
      content: { text: options.showDots !== false ? "true" : "false" },
      visibility: {},
    });

    elements.push({
      id: "option-arrows",
      type: "text",
      slot: "options.showArrows",
      label: "Show Arrows",
      content: { text: options.showArrows === true ? "true" : "false" },
      visibility: {},
    });

    slides.forEach((slide: any, i: number) => {
      const cta = slide?.cta ?? {};
      const media = slide?.media ?? {};
      const layout = slide?.layout ?? {};
      const desktop = layout?.desktop ?? {};

      for (const item of TEXT_FIELDS) {
        const el = textElement(slide, i, item.field, item.label, item.styleKey, item.uppercase);
        if (el) elements.push(el);
      }

      const extras = Array.isArray(slide?.extras) ? slide.extras : [];
      extras.forEach((extra: any, extraIndex: number) => {
        elements.push({
          id: `slide-${i}-extra-${extraIndex}`,
          type: "text",
          slot: `slides[${i}].extras[${extraIndex}]`,
          label: `Slide ${i + 1} - Extra ${extraIndex + 1}`,
          content: { text: extra?.text ?? "" },
          style: {
            typography: extra?.style?.size ? { fontSize: extra.style.size } : undefined,
            decoration: extra?.kind === "stamp" ? { titleVariant: "outline" } : undefined,
          },
          layout: { offset: offsetFromStyle(extra?.style) },
          visibility: {},
        });
      });

      elements.push({
        id: `slide-${i}-cta`,
        type: "button",
        slot: `slides[${i}].cta`,
        label: `Slide ${i + 1} - CTA`,
        content: { label: cta.label ?? "", href: cta.href ?? "" },
        style: {
          typography: slide?.ctaStyle?.size ? { fontSize: slide.ctaStyle.size } : undefined,
        },
        layout: { offset: offsetFromStyle(slide?.ctaStyle) },
        visibility: {},
      });

      elements.push({
        id: `slide-${i}-media`,
        type: "image",
        slot: `slides[${i}].media`,
        label: `Slide ${i + 1} - Image`,
        content: {
          src: media.src ?? "",
          alt: media.alt ?? "",
        },
        layout: {
          area: desktop.imageSide ?? "right",
        },
        visibility: {},
      });
    });

    return elements;
  },

  applyEditableElements(data: any, elements: EditableElement[]): any {
    const result = { ...data };
    const slides = Array.isArray(data?.slides) ? [...data.slides] : [];
    const options = { ...(data?.options ?? {}) };

    for (const el of elements) {
      if (el.id === "option-autoplay" && el.type === "text") {
        const v = Number(el.content.text);
        options.autoPlayMs = Number.isFinite(v) ? v : 0;
        continue;
      }
      if (el.id === "option-dots" && el.type === "text") {
        options.showDots = el.content.text === "true";
        continue;
      }
      if (el.id === "option-arrows" && el.type === "text") {
        options.showArrows = el.content.text === "true";
        continue;
      }

      const m = el.id.match(/^slide-(\d+)-(kicker|title|subtitle|body|quote|cta|media|extra-(\d+))$/);
      if (!m) continue;

      const idx = Number(m[1]);
      const field = m[2];
      const extraIndex = m[3] != null ? Number(m[3]) : null;
      if (idx >= slides.length) continue;

      const slide = { ...slides[idx] };
      const layout = { ...(slide.layout ?? {}) };

      if (field === "cta" && el.type === "button") {
        slide.cta = {
          ...(slide.cta ?? {}),
          label: el.content.label,
          href: el.content.href,
        };
        slide.ctaStyle = styleWithOffset(slide.ctaStyle, el);
      } else if (field === "media" && el.type === "image") {
        slide.media = {
          ...(slide.media ?? {}),
          kind: "image",
          src: el.content.src,
          alt: el.content.alt,
        };
        if (el.layout?.area) {
          layout.desktop = {
            ...(layout.desktop ?? {}),
            imageSide: el.layout.area as "left" | "right",
          };
        }
      } else if (field.startsWith("extra-") && el.type === "text" && extraIndex != null) {
        const extras = Array.isArray(slide.extras) ? [...slide.extras] : [];
        if (extraIndex < extras.length) {
          const extra = { ...extras[extraIndex] };
          extra.text = el.content.text;
          extra.style = styleWithOffset(extra.style, el);
          extras[extraIndex] = extra;
          slide.extras = extras;
        }
      } else if (el.type === "text") {
        const item = TEXT_FIELDS.find((entry) => entry.field === field);
        if (!item) continue;
        slide[field] = el.content.text;
        slide[item.styleKey] = styleWithOffset(slide[item.styleKey], el);
        if (field === "title") {
          if (el.style?.decoration?.titleVariant) {
            layout.titleVariant = el.style.decoration.titleVariant;
          }
          if (el.layout?.justify) {
            layout.contentJustify = el.layout.justify;
          }
        }
      }

      slide.layout = layout;
      slides[idx] = slide;
    }

    result.slides = slides;
    result.options = options;
    return result;
  },
};
