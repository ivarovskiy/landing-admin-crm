import type { BlockEditorAdapter, EditableElement } from "../types";

/**
 * Adapter: content-page:v1
 *
 * Fields → elements:
 *   kicker          → text "kicker"
 *   title           → text "title"
 *   subtitle        → text "subtitle"
 *   left[i]  (text) → text "left-{i}-heading", text "left-{i}-body"
 *   left[i]  (image)→ image "left-{i}-image"
 *   right[i] (text) → text "right-{i}-heading", text "right-{i}-body"
 *   right[i] (image)→ image "right-{i}-image"
 */
export const contentPageV1Adapter: BlockEditorAdapter = {
  toEditableElements(data: any): EditableElement[] {
    const elements: EditableElement[] = [];

    elements.push({
      id: "kicker",
      type: "text",
      slot: "kicker",
      label: "Kicker",
      content: { text: data?.kicker ?? "" },
      style: { typography: { textTransform: "uppercase" } },
      visibility: {},
    });

    elements.push({
      id: "title",
      type: "text",
      slot: "title",
      label: "Title",
      content: { text: data?.title ?? "" },
      style: {
        typography: { textTransform: "uppercase" },
        decoration: { titleVariant: "outline-stamp" },
      },
      visibility: {},
    });

    elements.push({
      id: "subtitle",
      type: "text",
      slot: "subtitle",
      label: "Subtitle",
      content: { text: data?.subtitle ?? "" },
      visibility: {},
    });

    // Column items
    for (const col of ["left", "right"] as const) {
      const items: any[] = Array.isArray(data?.[col]) ? data[col] : [];
      items.forEach((item: any, i: number) => {
        if (item?.kind === "image") {
          elements.push({
            id: `${col}-${i}-image`,
            type: "image",
            slot: `${col}[${i}]`,
            label: `${capitalize(col)} ${i + 1} — Image`,
            content: { src: item?.src ?? "", alt: item?.alt ?? "" },
            visibility: {},
          });
        } else if (item?.kind === "text") {
          elements.push({
            id: `${col}-${i}-heading`,
            type: "text",
            slot: `${col}[${i}].heading`,
            label: `${capitalize(col)} ${i + 1} — Heading`,
            content: { text: item?.heading ?? "" },
            style: { typography: { textTransform: "uppercase" } },
            visibility: {},
          });
          elements.push({
            id: `${col}-${i}-body`,
            type: "text",
            slot: `${col}[${i}].body`,
            label: `${capitalize(col)} ${i + 1} — Body`,
            content: { text: item?.body ?? "" },
            visibility: {},
          });
        }
      });
    }

    return elements;
  },

  applyEditableElements(data: any, elements: EditableElement[]): any {
    const result = { ...data };

    const left: any[] = Array.isArray(data?.left) ? data.left.map((x: any) => ({ ...x })) : [];
    const right: any[] = Array.isArray(data?.right) ? data.right.map((x: any) => ({ ...x })) : [];
    const cols = { left, right } as Record<string, any[]>;

    for (const el of elements) {
      if (el.id === "kicker" && el.type === "text") {
        result.kicker = el.content.text;
      } else if (el.id === "title" && el.type === "text") {
        result.title = el.content.text;
      } else if (el.id === "subtitle" && el.type === "text") {
        result.subtitle = el.content.text;
      } else {
        // left-{i}-image / left-{i}-heading / left-{i}-body
        const m = el.id.match(/^(left|right)-(\d+)-(image|heading|body)$/);
        if (m) {
          const col = m[1];
          const idx = Number(m[2]);
          const field = m[3];
          const arr = cols[col];
          if (idx < arr.length) {
            if (field === "image" && el.type === "image") {
              arr[idx].src = el.content.src;
              arr[idx].alt = el.content.alt;
            } else if (field === "heading" && el.type === "text") {
              arr[idx].heading = el.content.text;
            } else if (field === "body" && el.type === "text") {
              arr[idx].body = el.content.text;
            }
          }
        }
      }
    }

    result.left = left;
    result.right = right;
    return result;
  },
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
