import type { BlockEditorAdapter, EditableElement } from "../types";

/**
 * Adapter: hero:slider-v1
 *
 * Legacy fields → elements (per slide):
 *   slides[i].title    → text   "slide-{i}-title"
 *   slides[i].subtitle → text   "slide-{i}-subtitle"
 *   slides[i].cta      → button "slide-{i}-cta"
 *   slides[i].media    → image  "slide-{i}-media"
 *
 * Global options:
 *   options.autoPlayMs  → text   "option-autoplay"
 *   options.showDots    → text   "option-dots"
 *   options.showArrows  → text   "option-arrows"
 *
 * Layout fields stored on element style/layout:
 *   desktop.imageSide  → layout.area ("left" | "right")
 *   contentJustify     → layout.justify
 *   titleVariant       → style.decoration.titleVariant
 */
export const heroSliderV1Adapter: BlockEditorAdapter = {
  toEditableElements(data: any): EditableElement[] {
    const elements: EditableElement[] = [];
    const slides = Array.isArray(data?.slides) ? data.slides : [];
    const options = data?.options ?? {};

    // Global options
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

      // Slide title
      elements.push({
        id: `slide-${i}-title`,
        type: "text",
        slot: `slides[${i}].title`,
        label: `Slide ${i + 1} — Title`,
        content: { text: slide?.title ?? "" },
        style: {
          typography: { textTransform: "uppercase" },
          decoration: { titleVariant: layout?.titleVariant ?? "outline" },
        },
        layout: {
          justify: layout?.contentJustify as any,
        },
        visibility: {},
      });

      // Slide subtitle
      elements.push({
        id: `slide-${i}-subtitle`,
        type: "text",
        slot: `slides[${i}].subtitle`,
        label: `Slide ${i + 1} — Subtitle`,
        content: { text: slide?.subtitle ?? "" },
        style: {
          typography: { textTransform: "uppercase" },
        },
        visibility: {},
      });

      // Slide CTA
      elements.push({
        id: `slide-${i}-cta`,
        type: "button",
        slot: `slides[${i}].cta`,
        label: `Slide ${i + 1} — CTA`,
        content: { label: cta.label ?? "", href: cta.href ?? "" },
        visibility: {},
      });

      // Slide media
      elements.push({
        id: `slide-${i}-media`,
        type: "image",
        slot: `slides[${i}].media`,
        label: `Slide ${i + 1} — Image`,
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
      // Handle options
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

      const m = el.id.match(/^slide-(\d+)-(title|subtitle|cta|media)$/);
      if (!m) continue;

      const idx = Number(m[1]);
      const field = m[2];
      if (idx >= slides.length) continue;

      const slide = { ...slides[idx] };
      const layout = { ...(slide.layout ?? {}) };

      switch (field) {
        case "title":
          if (el.type === "text") {
            slide.title = el.content.text;
            // Write back style fields
            if (el.style?.decoration?.titleVariant) {
              layout.titleVariant = el.style.decoration.titleVariant;
            }
            if (el.layout?.justify) {
              layout.contentJustify = el.layout.justify;
            }
          }
          break;
        case "subtitle":
          if (el.type === "text") {
            slide.subtitle = el.content.text;
          }
          break;
        case "cta":
          if (el.type === "button") {
            slide.cta = {
              ...(slide.cta ?? {}),
              label: el.content.label,
              href: el.content.href,
            };
          }
          break;
        case "media":
          if (el.type === "image") {
            slide.media = {
              ...(slide.media ?? {}),
              kind: "image",
              src: el.content.src,
              alt: el.content.alt,
            };
            // Image side
            if (el.layout?.area) {
              layout.desktop = {
                ...(layout.desktop ?? {}),
                imageSide: el.layout.area as "left" | "right",
              };
            }
          }
          break;
      }

      slide.layout = layout;
      slides[idx] = slide;
    }

    result.slides = slides;
    result.options = options;
    return result;
  },
};
