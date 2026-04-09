import type { BlockEditorAdapter, EditableElement } from "../types";

/**
 * Adapter: features:v1
 *
 * Legacy fields → elements:
 *   title         → text "title"
 *   subtitle      → text "subtitle"
 *   items[i].title → text "item-{i}-title"
 *   items[i].text  → text "item-{i}-body"
 *   items[i].icon  → image "item-{i}-icon"
 */
export const featuresV1Adapter: BlockEditorAdapter = {
  toEditableElements(data: any): EditableElement[] {
    const elements: EditableElement[] = [];

    // Section title
    elements.push({
      id: "title",
      type: "text",
      slot: "title",
      label: "Title",
      content: { text: data?.title ?? "" },
      style: {
        typography: { textTransform: "uppercase", textAlign: "center" },
        decoration: { titleVariant: "outline-stamp" },
      },
      visibility: {},
    });

    // Section subtitle
    elements.push({
      id: "subtitle",
      type: "text",
      slot: "subtitle",
      label: "Subtitle",
      content: { text: data?.subtitle ?? "" },
      style: {
        typography: { textAlign: "center" },
      },
      visibility: {},
    });

    // Feature items
    const items = Array.isArray(data?.items) ? data.items : [];
    items.forEach((item: any, i: number) => {
      const hide = item?._layout?.hide ?? {};

      // Item title
      elements.push({
        id: `item-${i}-title`,
        type: "text",
        slot: `items[${i}].title`,
        label: `Item ${i + 1} — Title`,
        content: { text: item?.title ?? "" },
        style: {
          typography: { textTransform: "uppercase" },
        },
        visibility: { hide },
      });

      // Item body
      elements.push({
        id: `item-${i}-body`,
        type: "text",
        slot: `items[${i}].text`,
        label: `Item ${i + 1} — Body`,
        content: { text: item?.text ?? "" },
        visibility: { hide },
      });

      // Item icon
      elements.push({
        id: `item-${i}-icon`,
        type: "image",
        slot: `items[${i}].icon`,
        label: `Item ${i + 1} — Icon`,
        content: { src: item?.icon ?? "ballet-bar", alt: item?.icon ?? "" },
        visibility: { hide },
      });
    });

    return elements;
  },

  applyEditableElements(data: any, elements: EditableElement[]): any {
    const result = { ...data };
    const items = Array.isArray(data?.items) ? [...data.items] : [];

    for (const el of elements) {
      if (el.id === "title" && el.type === "text") {
        result.title = el.content.text;
      } else if (el.id === "subtitle" && el.type === "text") {
        result.subtitle = el.content.text;
      } else {
        // item-{i}-title / item-{i}-body / item-{i}-icon
        const m = el.id.match(/^item-(\d+)-(title|body|icon)$/);
        if (m) {
          const idx = Number(m[1]);
          const field = m[2];
          if (idx < items.length) {
            const item = { ...items[idx] };
            if (field === "title" && el.type === "text") {
              item.title = el.content.text;
            } else if (field === "body" && el.type === "text") {
              item.text = el.content.text;
            } else if (field === "icon" && el.type === "image") {
              item.icon = el.content.src;
            }
            // Apply visibility back
            if (el.visibility?.hide) {
              item._layout = { ...(item._layout ?? {}), hide: el.visibility.hide };
            }
            items[idx] = item;
          }
        }
      }
    }

    result.items = items;
    return result;
  },
};
