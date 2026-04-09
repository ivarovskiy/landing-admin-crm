import type { BlockEditorAdapter, EditableElement } from "../types";

/**
 * Adapter: header:v1
 *
 * Desktop elements:
 *   brand.label             → text   "brand-label"
 *   brand.href              → button "brand-link"
 *   desktop.portal          → button "cta"          (portal link in header top-right)
 *   desktop.phone           → text   "desktop-phone"
 *   desktop.phoneHref       → button "desktop-phone-link"
 *   desktop.logo            → logo   "desktop-logo"
 *   desktop.subText         → text   "desktop-subtext"
 *   links[i]                → button "link-{i}"
 *
 * Mobile elements:
 *   mobile.masthead.subText → text   "mobile-subtext"
 *   mobile.masthead.tagline → text   "mobile-tagline"
 *   mobile.masthead.logo    → logo   "mobile-masthead-logo"
 *   mobile.top.phoneHref    → button "mobile-phone"
 *   mobile.top.emailHref    → button "mobile-email"
 *   mobile.portal           → button "mobile-portal"
 *   mobile.promo.label      → text   "promo-label"
 *   mobile.promo.label2     → text   "promo-label2"
 *   mobile.promo.logoText   → text   "promo-logo-text"
 *   mobile.promo.subText    → text   "promo-sub-text"
 *   mobile.promo.logo       → logo   "mobile-promo-logo"
 */
export const headerV1Adapter: BlockEditorAdapter = {
  toEditableElements(data: any): EditableElement[] {
    const elements: EditableElement[] = [];
    const brand = data?.brand ?? {};
    const links = Array.isArray(data?.links) ? data.links : [];
    const mobile = data?.mobile ?? {};
    const mobileTop = mobile?.top ?? {};
    const masthead = mobile?.masthead ?? {};
    const portal = mobile?.portal ?? {};
    const promo = mobile?.promo ?? {};
    const desktop = data?.desktop ?? {};
    const desktopPortal = desktop?.portal ?? portal;

    // ── Desktop ──

    // Brand label
    elements.push({
      id: "brand-label",
      type: "text",
      slot: "brand.label",
      label: "Brand",
      content: { text: brand.label ?? "" },
      style: { typography: { fontWeight: 700 } },
      visibility: {},
    });

    // Brand href as button
    elements.push({
      id: "brand-link",
      type: "button",
      slot: "brand",
      label: "Brand Link",
      content: { label: brand.label ?? "", href: brand.href ?? "" },
      visibility: {},
    });

    // Desktop portal / CTA (top-right button in header)
    elements.push({
      id: "cta",
      type: "button",
      slot: "desktop.portal",
      label: "CTA / Portal",
      content: { label: desktopPortal.label ?? "", href: desktopPortal.href ?? "" },
      visibility: {},
    });

    // Desktop phone
    elements.push({
      id: "desktop-phone",
      type: "text",
      slot: "desktop.phone",
      label: "Desktop Phone",
      content: { text: desktop.phone ?? mobileTop.phone ?? "" },
      visibility: { hide: { base: true } },
    });

    // Desktop phone link
    elements.push({
      id: "desktop-phone-link",
      type: "button",
      slot: "desktop.phoneHref",
      label: "Desktop Phone Link",
      content: { label: desktop.phone ?? "", href: desktop.phoneHref ?? mobileTop.phoneHref ?? "" },
      visibility: { hide: { base: true } },
    });

    // Desktop logo
    const dLogo = desktop?.logo ?? masthead?.logo ?? {};
    elements.push({
      id: "desktop-logo",
      type: "logo",
      slot: "desktop.logo",
      label: "Desktop Logo",
      content: {
        kind: dLogo.kind ?? "asset",
        name: dLogo.name ?? "",
        src: dLogo.src ?? "",
        alt: dLogo.alt ?? "",
      },
      visibility: { hide: { base: true } },
    });

    // Desktop sub text
    elements.push({
      id: "desktop-subtext",
      type: "text",
      slot: "desktop.subText",
      label: "Desktop Sub Text",
      content: { text: desktop.subText ?? masthead.subText ?? "" },
      style: { typography: { textTransform: "uppercase" } },
      visibility: { hide: { base: true } },
    });

    // Desktop nav links
    links.forEach((link: any, i: number) => {
      elements.push({
        id: `link-${i}`,
        type: "button",
        slot: `links[${i}]`,
        label: `Nav Link ${i + 1}`,
        content: { label: link?.label ?? "", href: link?.href ?? "" },
        style: { typography: { textTransform: "none" } },
        visibility: {},
      });
    });

    // ── Mobile ──

    // Mobile phone
    elements.push({
      id: "mobile-phone",
      type: "button",
      slot: "mobile.top.phoneHref",
      label: "Mobile Phone",
      content: { label: mobileTop.phone ?? "", href: mobileTop.phoneHref ?? "" },
      visibility: { hide: { md: true, lg: true } },
    });

    // Mobile email
    elements.push({
      id: "mobile-email",
      type: "button",
      slot: "mobile.top.emailHref",
      label: "Mobile Email",
      content: { label: "", href: mobileTop.emailHref ?? "" },
      visibility: { hide: { md: true, lg: true } },
    });

    // Mobile masthead sub text
    elements.push({
      id: "mobile-subtext",
      type: "text",
      slot: "mobile.masthead.subText",
      label: "Mobile Sub Text",
      content: { text: masthead.subText ?? "" },
      style: { typography: { textTransform: "uppercase" } },
      visibility: { hide: { md: true, lg: true } },
    });

    // Mobile tagline
    elements.push({
      id: "mobile-tagline",
      type: "text",
      slot: "mobile.masthead.tagline",
      label: "Mobile Tagline",
      content: { text: masthead.tagline ?? "" },
      visibility: { hide: { md: true, lg: true } },
    });

    // Mobile masthead logo
    const mLogo = masthead?.logo ?? {};
    elements.push({
      id: "mobile-masthead-logo",
      type: "logo",
      slot: "mobile.masthead.logo",
      label: "Masthead Logo",
      content: {
        kind: mLogo.kind ?? "asset",
        name: mLogo.name ?? "",
        src: mLogo.src ?? "",
        alt: mLogo.alt ?? "",
      },
      visibility: { hide: { md: true, lg: true } },
    });

    // Mobile portal
    elements.push({
      id: "mobile-portal",
      type: "button",
      slot: "mobile.portal",
      label: "Mobile Portal",
      content: { label: portal.label ?? "", href: portal.href ?? "" },
      visibility: { hide: { md: true, lg: true } },
    });

    // Mobile promo label
    elements.push({
      id: "promo-label",
      type: "text",
      slot: "mobile.promo.label",
      label: "Promo Label",
      content: { text: promo.label ?? "" },
      style: { typography: { textTransform: "uppercase" } },
      visibility: { hide: { md: true, lg: true } },
    });

    // Mobile promo label 2
    elements.push({
      id: "promo-label2",
      type: "text",
      slot: "mobile.promo.label2",
      label: "Promo Label 2",
      content: { text: promo.label2 ?? "" },
      style: { typography: { textTransform: "uppercase" } },
      visibility: { hide: { md: true, lg: true } },
    });

    // Mobile promo logo text
    elements.push({
      id: "promo-logo-text",
      type: "text",
      slot: "mobile.promo.logoText",
      label: "Promo Logo Text",
      content: { text: promo.logoText ?? "" },
      style: { typography: { textTransform: "uppercase", fontWeight: 700 } },
      visibility: { hide: { md: true, lg: true } },
    });

    // Mobile promo sub text
    elements.push({
      id: "promo-sub-text",
      type: "text",
      slot: "mobile.promo.subText",
      label: "Promo Sub Text",
      content: { text: promo.subText ?? "" },
      style: { typography: { textTransform: "uppercase" } },
      visibility: { hide: { md: true, lg: true } },
    });

    // Mobile promo logo
    const pLogo = promo?.logo ?? {};
    elements.push({
      id: "mobile-promo-logo",
      type: "logo",
      slot: "mobile.promo.logo",
      label: "Promo Logo",
      content: {
        kind: pLogo.kind ?? "asset",
        name: pLogo.name ?? "",
        src: pLogo.src ?? "",
        alt: pLogo.alt ?? "",
      },
      visibility: { hide: { md: true, lg: true } },
    });

    return elements;
  },

  applyEditableElements(data: any, elements: EditableElement[]): any {
    const result = { ...data };
    const brand = { ...(data?.brand ?? {}) };
    const links = Array.isArray(data?.links) ? [...data.links] : [];
    const mobile = { ...(data?.mobile ?? {}) };
    const mobileTop = { ...(mobile.top ?? {}) };
    const masthead = { ...(mobile.masthead ?? {}) };
    const portal = { ...(mobile.portal ?? {}) };
    const promo = { ...(mobile.promo ?? {}) };
    const desktop = { ...(data?.desktop ?? {}) };
    const desktopPortal = { ...(desktop.portal ?? mobile.portal ?? {}) };

    for (const el of elements) {
      switch (el.id) {
        case "brand-label":
          if (el.type === "text") brand.label = el.content.text;
          break;
        case "brand-link":
          if (el.type === "button") {
            brand.label = el.content.label;
            brand.href = el.content.href;
          }
          break;
        case "cta":
          if (el.type === "button") {
            desktopPortal.label = el.content.label;
            desktopPortal.href = el.content.href;
          }
          break;
        case "desktop-phone":
          if (el.type === "text") desktop.phone = el.content.text;
          break;
        case "desktop-phone-link":
          if (el.type === "button") desktop.phoneHref = el.content.href;
          break;
        case "desktop-logo":
          if (el.type === "logo") desktop.logo = { ...el.content };
          break;
        case "desktop-subtext":
          if (el.type === "text") desktop.subText = el.content.text;
          break;
        case "mobile-phone":
          if (el.type === "button") {
            mobileTop.phone = el.content.label;
            mobileTop.phoneHref = el.content.href;
          }
          break;
        case "mobile-email":
          if (el.type === "button") mobileTop.emailHref = el.content.href;
          break;
        case "mobile-subtext":
          if (el.type === "text") masthead.subText = el.content.text;
          break;
        case "mobile-tagline":
          if (el.type === "text") masthead.tagline = el.content.text;
          break;
        case "mobile-masthead-logo":
          if (el.type === "logo") masthead.logo = { ...el.content };
          break;
        case "mobile-portal":
          if (el.type === "button") {
            portal.label = el.content.label;
            portal.href = el.content.href;
          }
          break;
        case "promo-label":
          if (el.type === "text") promo.label = el.content.text;
          break;
        case "promo-label2":
          if (el.type === "text") promo.label2 = el.content.text;
          break;
        case "promo-logo-text":
          if (el.type === "text") promo.logoText = el.content.text;
          break;
        case "promo-sub-text":
          if (el.type === "text") promo.subText = el.content.text;
          break;
        case "mobile-promo-logo":
          if (el.type === "logo") promo.logo = { ...el.content };
          break;
        default: {
          const linkMatch = el.id.match(/^link-(\d+)$/);
          if (linkMatch && el.type === "button") {
            const idx = Number(linkMatch[1]);
            if (idx < links.length) {
              links[idx] = {
                ...links[idx],
                label: el.content.label,
                href: el.content.href,
              };
            }
          }
        }
      }
    }

    result.brand = brand;
    result.links = links;
    mobile.top = mobileTop;
    mobile.masthead = masthead;
    mobile.portal = portal;
    mobile.promo = promo;
    result.mobile = mobile;
    desktop.portal = desktopPortal;
    result.desktop = desktop;
    return result;
  },
};
