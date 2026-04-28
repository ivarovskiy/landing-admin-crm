import { safeFetchJson } from "./safe-fetch";

const BASE = process.env.API_BASE_URL ?? "http://127.0.0.1:3000";

export async function getPublicPage(slug: string, locale: string) {
  const url = `${BASE}/v1/public/pages/${encodeURIComponent(slug)}?locale=${encodeURIComponent(locale)}`;
  return safeFetchJson<{ page: any; theme: any }>(url, { cache: "no-store" });
}

export async function getPreviewPage(pageId: string, token: string) {
  const url = `${BASE}/v1/public/preview/${encodeURIComponent(pageId)}?token=${encodeURIComponent(token)}`;
  return safeFetchJson<{ page: any; theme: any }>(url, { cache: "no-store" });
}

export type ScrollToTopSettings = {
  enabled?: boolean;
  right?: string;
  bottom?: string;
  showAfter?: number;
  stopOffset?: number;
};

export type TypographySettings = {
  linkStampScale?: boolean;

  sectionTitleStrokeEnabled?: boolean;
  sectionTitleStrokeW?: string;
  sectionTitleShadowEnabled?: boolean;
  sectionTitleShadowOffset?: string;

  heroTitleStrokeEnabled?: boolean;
  heroTitleStrokeW?: string;
  heroTitleShadowEnabled?: boolean;
  heroTitleShadowOffset?: string;

  subtitleStrokeEnabled?: boolean;
  subtitleStrokeW?: string;
  subtitleShadowEnabled?: boolean;
  subtitleShadowOffset?: string;
};

export type ZoomSettings = {
  enableZoom?: boolean;
  designWidth?: number;
  zoomBreakpoint?: number;
  scale?: number;
  fitViewport?: boolean;
  normalizeViewport?: boolean;
  normalizeViewportWidth?: number;
  hideScrollbar?: boolean;
  /** Apply viewport meta + CSS zoom synchronously before first paint to eliminate FOUC. Off by default. */
  preventInitialFlicker?: boolean;
};

export type NavUnderlineMode = 'parent' | 'all' | 'none';

export type HeaderSettings = {
  /** Controls the hover/active underline under desktop nav links.
   *  parent = only parents with children (current behavior, also default).
   *  all    = parents + childless top items + subnav children.
   *  none   = no underline anywhere in the desktop nav. */
  navUnderlineMode?: NavUnderlineMode;
};

export async function getSiteSettings() {
  const url = `${BASE}/v1/public/settings`;
  return safeFetchJson<{
    zoom?: ZoomSettings;
    scrollToTop?: ScrollToTopSettings;
    typography?: TypographySettings;
    header?: HeaderSettings;
  }>(url, { cache: "no-store" });
}

export type GlobalBlockRow = {
  id: string;
  key: string;
  type: string;
  variant: string;
  data: any;
};

export async function getGlobalBlocks() {
  const url = `${BASE}/v1/public/global-blocks`;
  return safeFetchJson<{ header?: GlobalBlockRow | null; footer?: GlobalBlockRow | null }>(url, {
    cache: "no-store",
  });
}

/**
 * Walks the page's parent chain server-side and returns the most-specific
 * (header, footer) pair, falling back to site-wide defaults.
 */
export async function getGlobalBlocksForPage(pageId: string) {
  const url = `${BASE}/v1/public/global-blocks/for-page/${encodeURIComponent(pageId)}`;
  return safeFetchJson<{ header?: GlobalBlockRow | null; footer?: GlobalBlockRow | null }>(url, {
    cache: "no-store",
  });
}

/**
 * Prepend header and append footer synthesized from GlobalBlock rows.
 * Page-level opt-outs live in `page.settings.disableGlobalHeader` / `disableGlobalFooter`.
 */
export function mergeGlobalBlocks(
  pageBlocks: any[],
  globals: { header?: GlobalBlockRow | null; footer?: GlobalBlockRow | null } | null | undefined,
  settings?: { disableGlobalHeader?: boolean; disableGlobalFooter?: boolean } | null,
): any[] {
  const out: any[] = [];
  const header = globals?.header;
  const footer = globals?.footer;

  if (header && settings?.disableGlobalHeader !== true) {
    out.push({
      id: `global:${header.key}:${header.id}`,
      type: header.type,
      variant: header.variant,
      data: header.data ?? {},
      order: -1_000_000,
    });
  }

  out.push(...pageBlocks);

  if (footer && settings?.disableGlobalFooter !== true) {
    out.push({
      id: `global:${footer.key}:${footer.id}`,
      type: footer.type,
      variant: footer.variant,
      data: footer.data ?? {},
      order: 1_000_000,
    });
  }

  return out;
}