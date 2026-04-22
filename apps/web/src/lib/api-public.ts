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
};

export async function getSiteSettings() {
  const url = `${BASE}/v1/public/settings`;
  return safeFetchJson<{
    zoom?: { fitViewport?: boolean; scale?: number };
    scrollToTop?: ScrollToTopSettings;
    typography?: TypographySettings;
  }>(url, { cache: "no-store" });
}