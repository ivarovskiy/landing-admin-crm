import type { BlockEditorAdapter, EditableElement } from "../types";

/**
 * Adapter: studio-address:v1
 *
 * Legacy fields → elements:
 *   title              → text   "title"
 *   map.embedUrl       → text   "map-embed"
 *   map.imageSrc       → image  "map-image"
 *   addressLines[i]    → text   "address-{i}"
 *   notes[i]           → text   "note-{i}" (desktop-only)
 *   socials[i]         → button "social-{i}"
 *   contacts.phone     → text   "phone"
 *   contacts.phoneHref → text   "phone-href"
 *   contacts.email     → text   "email"
 *   contacts.emailHref → text   "email-href"
 */
export const studioAddressV1Adapter: BlockEditorAdapter = {
  toEditableElements(data: any): EditableElement[] {
    const elements: EditableElement[] = [];

    // Title
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

    // Map embed URL
    const map = data?.map ?? {};
    elements.push({
      id: "map-embed",
      type: "text",
      slot: "map.embedUrl",
      label: "Map Embed URL",
      content: { text: map.embedUrl ?? "" },
      visibility: {},
    });

    // Map image
    elements.push({
      id: "map-image",
      type: "image",
      slot: "map",
      label: "Map Image",
      content: {
        src: map.imageSrc ?? "",
        alt: map.alt ?? "Studio map",
        href: map.linkUrl ?? "",
      },
      visibility: {},
    });

    // Address lines
    const addressLines: string[] = Array.isArray(data?.addressLines) ? data.addressLines : [];
    addressLines.forEach((line: string, i: number) => {
      elements.push({
        id: `address-${i}`,
        type: "text",
        slot: `addressLines[${i}]`,
        label: `Address line ${i + 1}`,
        content: { text: line ?? "" },
        style: { typography: { textTransform: "uppercase" } },
        visibility: {},
      });
    });

    // Notes (desktop-only)
    const notes: string[] = Array.isArray(data?.notes) ? data.notes : [];
    notes.forEach((note: string, i: number) => {
      elements.push({
        id: `note-${i}`,
        type: "text",
        slot: `notes[${i}]`,
        label: `Note ${i + 1}`,
        content: { text: note ?? "" },
        visibility: { hide: { base: true } },
      });
    });

    // Socials
    const socials = Array.isArray(data?.socials) ? data.socials : [];
    socials.forEach((s: any, i: number) => {
      elements.push({
        id: `social-${i}`,
        type: "button",
        slot: `socials[${i}]`,
        label: `Social — ${s?.icon ?? "link"}`,
        content: { label: s?.label ?? "", href: s?.href ?? "" },
        style: {
          decoration: { pillVariant: s?.icon ?? "instagram" },
        },
        visibility: {},
      });
    });

    // Phone
    const contacts = data?.contacts ?? {};
    elements.push({
      id: "phone",
      type: "text",
      slot: "contacts.phone",
      label: "Phone",
      content: { text: contacts.phone ?? "" },
      visibility: {},
    });

    // Phone href (custom override)
    elements.push({
      id: "phone-href",
      type: "text",
      slot: "contacts.phoneHref",
      label: "Phone Link (override)",
      content: { text: contacts.phoneHref ?? "" },
      visibility: {},
    });

    // Email
    elements.push({
      id: "email",
      type: "text",
      slot: "contacts.email",
      label: "Email",
      content: { text: contacts.email ?? "" },
      visibility: {},
    });

    // Email href (custom override)
    elements.push({
      id: "email-href",
      type: "text",
      slot: "contacts.emailHref",
      label: "Email Link (override)",
      content: { text: contacts.emailHref ?? "" },
      visibility: {},
    });

    return elements;
  },

  applyEditableElements(data: any, elements: EditableElement[]): any {
    const result = { ...data };
    const addressLines = Array.isArray(data?.addressLines) ? [...data.addressLines] : [];
    const notes = Array.isArray(data?.notes) ? [...data.notes] : [];
    const socials = Array.isArray(data?.socials) ? [...data.socials] : [];
    const contacts = { ...(data?.contacts ?? {}) };
    const map = { ...(data?.map ?? {}) };

    for (const el of elements) {
      switch (el.id) {
        case "title":
          if (el.type === "text") result.title = el.content.text;
          break;
        case "map-embed":
          if (el.type === "text") map.embedUrl = el.content.text;
          break;
        case "map-image":
          if (el.type === "image") {
            map.imageSrc = el.content.src;
            map.alt = el.content.alt;
            map.linkUrl = el.content.href;
          }
          break;
        case "phone":
          if (el.type === "text") contacts.phone = el.content.text;
          break;
        case "phone-href":
          if (el.type === "text") contacts.phoneHref = el.content.text;
          break;
        case "email":
          if (el.type === "text") contacts.email = el.content.text;
          break;
        case "email-href":
          if (el.type === "text") contacts.emailHref = el.content.text;
          break;
        default: {
          const addrMatch = el.id.match(/^address-(\d+)$/);
          if (addrMatch && el.type === "text") {
            addressLines[Number(addrMatch[1])] = el.content.text ?? "";
            break;
          }
          const noteMatch = el.id.match(/^note-(\d+)$/);
          if (noteMatch && el.type === "text") {
            notes[Number(noteMatch[1])] = el.content.text ?? "";
            break;
          }
          const socialMatch = el.id.match(/^social-(\d+)$/);
          if (socialMatch && el.type === "button") {
            const idx = Number(socialMatch[1]);
            if (idx < socials.length) {
              socials[idx] = {
                ...socials[idx],
                label: el.content.label,
                href: el.content.href,
                icon: el.style?.decoration?.pillVariant ?? socials[idx]?.icon,
              };
            }
            break;
          }
        }
      }
    }

    result.addressLines = addressLines;
    result.notes = notes;
    result.socials = socials;
    result.contacts = contacts;
    result.map = map;
    return result;
  },
};
