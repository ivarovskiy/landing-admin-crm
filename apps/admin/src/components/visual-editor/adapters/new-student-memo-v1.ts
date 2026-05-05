import type { BlockEditorAdapter, EditableElement } from "../types";

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

function styleWithElementOffset(style: any, el: EditableElement) {
  const x = el.layout?.offset?.base?.x;
  const y = el.layout?.offset?.base?.y;
  return {
    ...(style ?? {}),
    ml: x ? `${Math.round(x)}px` : style?.ml,
    mt: y ? `${Math.round(y)}px` : style?.mt,
    size: el.style?.typography?.fontSize || style?.size,
    strokeW: el.style?.decoration?.borderWidth || style?.strokeW,
  };
}

function textElement(
  id: string,
  label: string,
  text: string,
  style: any,
  uppercase = false,
): EditableElement {
  return {
    id,
    type: "text",
    label,
    content: { text },
    style: {
      typography: {
        ...(uppercase ? { textTransform: "uppercase" as const } : {}),
        ...(style?.size ? { fontSize: style.size } : {}),
      },
      decoration: style?.strokeW ? { borderWidth: style.strokeW } : undefined,
    },
    layout: {
      offset: offsetFromStyle(style),
    },
    visibility: {},
  };
}

export const newStudentMemoV1Adapter: BlockEditorAdapter = {
  toEditableElements(data: any): EditableElement[] {
    const elements: EditableElement[] = [
      textElement("kicker", "Kicker", data?.kicker ?? "", data?.kickerStyle, true),
      textElement("title", "Title", data?.title ?? "", data?.titleStyle, true),
      textElement("subtitle", "Subtitle", data?.subtitle ?? "", data?.subtitleStyle),
    ];

    const cta = data?.cta ?? {};
    elements.push({
      id: "cta",
      type: "button",
      label: "CTA",
      content: { label: cta.label ?? "", href: cta.href ?? "" },
      visibility: {},
    });

    const sections = Array.isArray(data?.sections) ? data.sections : [];
    sections.forEach((section: any, index: number) => {
      elements.push(
        textElement(
          `section-${index}-heading`,
          `Section ${index + 1} - Heading`,
          section?.heading ?? "",
          section?.headingStyle ?? data?.sectionTitleStyle,
          true,
        ),
      );
      elements.push(
        textElement(
          `section-${index}-body`,
          `Section ${index + 1} - Body`,
          section?.body ?? "",
          section?.bodyStyle ?? data?.bodyStyle,
        ),
      );
    });

    const image = data?.image ?? {};
    elements.push({
      id: "image",
      type: "image",
      label: "Photo",
      content: { src: image.src ?? "", alt: image.alt ?? "" },
      layout: { area: "right" },
      visibility: {},
    });

    return elements;
  },

  applyEditableElements(data: any, elements: EditableElement[]): any {
    const result = { ...data };
    const sections = Array.isArray(data?.sections) ? data.sections.map((x: any) => ({ ...x })) : [];

    for (const el of elements) {
      if (el.id === "kicker" && el.type === "text") {
        result.kicker = el.content.text;
        result.kickerStyle = styleWithElementOffset(result.kickerStyle, el);
        continue;
      }
      if (el.id === "title" && el.type === "text") {
        result.title = el.content.text;
        result.titleStyle = styleWithElementOffset(result.titleStyle, el);
        continue;
      }
      if (el.id === "subtitle" && el.type === "text") {
        result.subtitle = el.content.text;
        result.subtitleStyle = styleWithElementOffset(result.subtitleStyle, el);
        continue;
      }
      if (el.id === "cta" && el.type === "button") {
        result.cta = {
          ...(result.cta ?? {}),
          label: el.content.label,
          href: el.content.href,
        };
        continue;
      }
      if (el.id === "image" && el.type === "image") {
        result.image = {
          ...(result.image ?? {}),
          src: el.content.src,
          alt: el.content.alt,
        };
        continue;
      }

      const match = el.id.match(/^section-(\d+)-(heading|body)$/);
      if (!match || el.type !== "text") continue;

      const index = Number(match[1]);
      const field = match[2];
      if (index >= sections.length) continue;

      if (field === "heading") {
        sections[index].heading = el.content.text;
        sections[index].headingStyle = styleWithElementOffset(sections[index].headingStyle, el);
      } else {
        sections[index].body = el.content.text;
        sections[index].bodyStyle = styleWithElementOffset(sections[index].bodyStyle, el);
      }
    }

    result.sections = sections;
    return result;
  },
};
