import type { BlockEditorAdapter, EditableElement } from "../types";

/**
 * Adapter: footer:v1
 *
 * Legacy fields → elements:
 *   left.logoText            → text   "left-logo-text"
 *   left.subText             → text   "left-sub-text"
 *   left.logo                → logo   "left-logo"
 *   left.href                → button "left-link"
 *   columns[c].links[l]      → button "col-{c}-link-{l}"
 *   right.portal             → button "portal"
 *   right.promo.label        → text   "promo-label"
 *   right.promo.href         → button "promo-link"
 *   right.promo.logoText     → text   "promo-logo-text"
 *   right.promo.subText      → text   "promo-sub-text"
 *   right.promo.logo         → logo   "promo-logo"
 *   bottomText               → text   "bottom-text"
 */
export const footerV1Adapter: BlockEditorAdapter = {
  toEditableElements(data: any): EditableElement[] {
    const elements: EditableElement[] = [];
    const left = data?.left ?? {};
    const right = data?.right ?? {};
    const portal = right?.portal ?? {};
    const promo = right?.promo ?? {};
    const columns = Array.isArray(data?.columns) ? data.columns : [];

    // Left brand logo
    const logo = left?.logo ?? {};
    elements.push({
      id: "left-logo",
      type: "logo",
      slot: "left.logo",
      label: "Brand Logo",
      content: {
        kind: logo.kind ?? "asset",
        name: logo.name ?? "",
        src: logo.src ?? "",
        alt: logo.alt ?? "",
      },
      visibility: {},
    });

    // Left logo text
    elements.push({
      id: "left-logo-text",
      type: "text",
      slot: "left.logoText",
      label: "Logo Text",
      content: { text: left.logoText ?? "" },
      style: { typography: { textTransform: "uppercase", fontWeight: 700 } },
      visibility: {},
    });

    // Left sub text
    elements.push({
      id: "left-sub-text",
      type: "text",
      slot: "left.subText",
      label: "Sub Text",
      content: { text: left.subText ?? "" },
      style: { typography: { textTransform: "uppercase" } },
      visibility: {},
    });

    // Left link
    elements.push({
      id: "left-link",
      type: "button",
      slot: "left.href",
      label: "Brand Link",
      content: { label: left.logoText ?? "", href: left.href ?? "" },
      visibility: {},
    });

    // Column links
    columns.forEach((col: any, cIdx: number) => {
      const links = Array.isArray(col?.links) ? col.links : [];
      links.forEach((link: any, lIdx: number) => {
        elements.push({
          id: `col-${cIdx}-link-${lIdx}`,
          type: "button",
          slot: `columns[${cIdx}].links[${lIdx}]`,
          label: `Col ${cIdx + 1} Link ${lIdx + 1}`,
          content: { label: link?.label ?? "", href: link?.href ?? "" },
          visibility: {},
        });
      });
    });

    // Portal
    elements.push({
      id: "portal",
      type: "button",
      slot: "right.portal",
      label: "Portal",
      content: { label: portal.label ?? "", href: portal.href ?? "" },
      style: { decoration: { pillVariant: portal.icon ?? "lock" } },
      visibility: {},
    });

    // Promo label
    elements.push({
      id: "promo-label",
      type: "text",
      slot: "right.promo.label",
      label: "Promo Label",
      content: { text: promo.label ?? "" },
      visibility: {},
    });

    // Promo link
    elements.push({
      id: "promo-link",
      type: "button",
      slot: "right.promo.href",
      label: "Promo Link",
      content: { label: promo.label ?? "", href: promo.href ?? "" },
      visibility: {},
    });

    // Promo logo text (fallback text when no logo image)
    elements.push({
      id: "promo-logo-text",
      type: "text",
      slot: "right.promo.logoText",
      label: "Promo Logo Text",
      content: { text: promo.logoText ?? "" },
      style: { typography: { textTransform: "uppercase", fontWeight: 700 } },
      visibility: {},
    });

    // Promo sub text
    elements.push({
      id: "promo-sub-text",
      type: "text",
      slot: "right.promo.subText",
      label: "Promo Sub Text",
      content: { text: promo.subText ?? "" },
      style: { typography: { textTransform: "uppercase" } },
      visibility: {},
    });

    // Promo logo
    const pLogo = promo?.logo ?? {};
    elements.push({
      id: "promo-logo",
      type: "logo",
      slot: "right.promo.logo",
      label: "Promo Logo",
      content: {
        kind: pLogo.kind ?? "asset",
        name: pLogo.name ?? "",
        src: pLogo.src ?? "",
        alt: pLogo.alt ?? "",
      },
      visibility: {},
    });

    // Bottom text
    elements.push({
      id: "bottom-text",
      type: "text",
      slot: "bottomText",
      label: "Bottom Text",
      content: { text: data?.bottomText ?? "" },
      visibility: {},
    });

    return elements;
  },

  applyEditableElements(data: any, elements: EditableElement[]): any {
    const result = { ...data };
    const left = { ...(data?.left ?? {}) };
    const right = { ...(data?.right ?? {}) };
    const portal = { ...(right.portal ?? {}) };
    const promo = { ...(right.promo ?? {}) };
    const columns = Array.isArray(data?.columns)
      ? data.columns.map((c: any) => ({
          ...c,
          links: Array.isArray(c?.links) ? [...c.links] : [],
        }))
      : [];

    for (const el of elements) {
      switch (el.id) {
        case "left-logo":
          if (el.type === "logo") left.logo = { ...el.content };
          break;
        case "left-logo-text":
          if (el.type === "text") left.logoText = el.content.text;
          break;
        case "left-sub-text":
          if (el.type === "text") left.subText = el.content.text;
          break;
        case "left-link":
          if (el.type === "button") left.href = el.content.href;
          break;
        case "portal":
          if (el.type === "button") {
            portal.label = el.content.label;
            portal.href = el.content.href;
            if (el.style?.decoration?.pillVariant) {
              portal.icon = el.style.decoration.pillVariant;
            }
          }
          break;
        case "promo-label":
          if (el.type === "text") promo.label = el.content.text;
          break;
        case "promo-link":
          if (el.type === "button") promo.href = el.content.href;
          break;
        case "promo-logo-text":
          if (el.type === "text") promo.logoText = el.content.text;
          break;
        case "promo-sub-text":
          if (el.type === "text") promo.subText = el.content.text;
          break;
        case "promo-logo":
          if (el.type === "logo") promo.logo = { ...el.content };
          break;
        case "bottom-text":
          if (el.type === "text") result.bottomText = el.content.text;
          break;
        default: {
          const colMatch = el.id.match(/^col-(\d+)-link-(\d+)$/);
          if (colMatch && el.type === "button") {
            const cIdx = Number(colMatch[1]);
            const lIdx = Number(colMatch[2]);
            if (cIdx < columns.length && lIdx < columns[cIdx].links.length) {
              columns[cIdx].links[lIdx] = {
                ...columns[cIdx].links[lIdx],
                label: el.content.label,
                href: el.content.href,
              };
            }
          }
        }
      }
    }

    result.left = left;
    right.portal = portal;
    right.promo = promo;
    result.right = right;
    result.columns = columns;
    return result;
  },
};
