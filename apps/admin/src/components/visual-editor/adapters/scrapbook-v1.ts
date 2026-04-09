import type { BlockEditorAdapter, EditableElement } from "../types";

/**
 * Adapter: scrapbook:v1
 *
 * Fields → elements:
 *   title           → text "title"
 *   items[i].src    → image "tile-{i+1}"  (8 fixed slots)
 */
export const scrapbookV1Adapter: BlockEditorAdapter = {
  toEditableElements(data: any): EditableElement[] {
    const elements: EditableElement[] = [];

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

    const items: any[] = Array.isArray(data?.items) ? data.items : [];

    for (let i = 0; i < 8; i++) {
      const item = items[i] ?? {};
      elements.push({
        id: `tile-${i + 1}`,
        type: "image",
        slot: `items[${i}]`,
        label: `Tile ${i + 1}`,
        content: {
          src: item?.src ?? "",
          alt: item?.alt ?? "",
          href: item?.href ?? "",
        },
        visibility: {},
      });
    }

    return elements;
  },

  applyEditableElements(data: any, elements: EditableElement[]): any {
    const result = { ...data };
    const items: any[] = Array.isArray(data?.items)
      ? data.items.map((x: any) => ({ ...x }))
      : Array.from({ length: 8 }, () => ({}));

    // Ensure 8 slots
    while (items.length < 8) items.push({});

    for (const el of elements) {
      if (el.id === "title" && el.type === "text") {
        result.title = el.content.text;
      } else if (el.type === "image") {
        const m = el.id.match(/^tile-(\d+)$/);
        if (m) {
          const idx = Number(m[1]) - 1;
          if (idx >= 0 && idx < items.length) {
            items[idx] = {
              ...items[idx],
              src: el.content.src,
              alt: el.content.alt,
              href: el.content.href,
            };
          }
        }
      }
    }

    result.items = items;
    return result;
  },
};
