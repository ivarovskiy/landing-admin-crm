import type { paths } from "@acme/openapi-client"
import { getAccessToken, getApiUrl } from "./api-proxy"

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await getAccessToken()
  if (!token) throw new Error("No access token")

  const r = await fetch(`${getApiUrl()}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...init?.headers },
    cache: "no-store",
  })

  if (!r.ok) throw new Error(`API ${r.status}: ${path}`)
  return r
}

type AdminPages200 =
  NonNullable<paths["/v1/admin/pages"]["get"]["responses"]["200"]["content"]>["application/json"]

export async function fetchAdminPages(): Promise<AdminPages200> {
  const r = await apiFetch("/v1/admin/pages")
  return (await r.json()) as AdminPages200
}

type AdminPage200 =
  NonNullable<paths["/v1/admin/pages/{id}"]["get"]["responses"]["200"]["content"]>["application/json"]

export async function fetchAdminPage(id: string): Promise<AdminPage200> {
  const r = await apiFetch(`/v1/admin/pages/${encodeURIComponent(id)}`)
  return (await r.json()) as AdminPage200
}

export async function createPreviewToken(pageId: string): Promise<{ token: string; expiresAt: string }> {
  const r = await apiFetch(`/v1/admin/pages/${pageId}/preview-token`, { method: "POST" })
  return r.json()
}

export type SiteZoomSettings = {
  /** Enable/disable CSS zoom entirely */
  enableZoom?: boolean;
  /** Reference canvas width in px (default 1320) */
  designWidth?: number;
  /** Min viewport width (px) at which CSS zoom activates (default 768) */
  zoomBreakpoint?: number;
  /** Scale coefficient applied on top of auto-zoom (default 1.0) */
  scale?: number;
  /** Fit page height to viewport using header + hero dimensions */
  fitViewport?: boolean;
  /** Set <meta viewport> to a fixed width so browser scales natively */
  normalizeViewport?: boolean;
  /** Width value used in meta viewport when normalizeViewport is on (default 1320) */
  normalizeViewportWidth?: number;
  /** Hide the vertical scrollbar visually (scrolling still works) */
  hideScrollbar?: boolean;
  /** Apply viewport meta + CSS zoom synchronously before first paint to eliminate FOUC. Off by default. */
  preventInitialFlicker?: boolean;
}
export type SiteScrollToTopSettings = {
  /** Enable/disable the scroll-to-top button (default true) */
  enabled?: boolean;
  /** CSS `right` value — distance from viewport right edge (default "28px") */
  right?: string;
  /** CSS `bottom` value — distance from viewport bottom edge (default "32px") */
  bottom?: string;
  /** ScrollY threshold (px) at which the button becomes visible (default 400) */
  showAfter?: number;
  /** Distance (px) from document bottom where the button locks in place (sticky-until-footer). 0/undefined = no stop */
  stopOffset?: number;
}
export type SiteTypographySettings = {
  /** Auto-scale stamp stroke + shadow proportionally to font-size (em-based).
   *  Per-size overrides below always win over this when both are enabled. */
  linkStampScale?: boolean;

  /** Stamp shadow render style.
   *  - `'drop'` (default): classic single-offset `filter: drop-shadow`. On
   *    iPad/Safari this can leak the painted cream fill into hollow glyph
   *    holes as thin wedges; Chromium/Firefox render it cleanly.
   *  - `'extruded'`: same compact offset rendered via single-layer
   *    `text-shadow`. Glyph-silhouette only — no cross-browser fill
   *    leakage inside hollow letters. */
  stampShadowStyle?: 'drop' | 'extruded';

  /** 104px stamp — Section title (homepage-header, features-title, studio-address__title) */
  sectionTitleStrokeEnabled?: boolean;
  sectionTitleStrokeW?: string;
  sectionTitleShadowEnabled?: boolean;
  sectionTitleShadowOffset?: string;

  /** 78px stamp — Hero title (content-header, hero-title) */
  heroTitleStrokeEnabled?: boolean;
  heroTitleStrokeW?: string;
  heroTitleShadowEnabled?: boolean;
  heroTitleShadowOffset?: string;

  /** 47px stamp — Subtitle */
  subtitleStrokeEnabled?: boolean;
  subtitleStrokeW?: string;
  subtitleShadowEnabled?: boolean;
  subtitleShadowOffset?: string;
}
export type NavUnderlineMode = 'parent' | 'all' | 'none';

export type SiteHeaderSettings = {
  /** Controls the hover/active underline under desktop nav links.
   *  parent = only parents with children (current behavior).
   *  all    = parents + childless top items + subnav children.
   *  none   = no underline anywhere in the desktop nav. */
  navUnderlineMode?: NavUnderlineMode;
}
export type SiteSettingsData = {
  zoom?: SiteZoomSettings;
  scrollToTop?: SiteScrollToTopSettings;
  typography?: SiteTypographySettings;
  header?: SiteHeaderSettings;
}

export async function fetchSiteSettings(): Promise<SiteSettingsData> {
  const r = await apiFetch("/v1/admin/settings")
  return r.json()
}

export async function updateSiteSettings(data: SiteSettingsData): Promise<SiteSettingsData> {
  const r = await apiFetch("/v1/admin/settings", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  })
  return r.json()
}

export type GlobalBlock = {
  id: string
  key: string
  type: string
  variant: string
  data: any
  createdAt: string
  updatedAt: string
}

export async function fetchGlobalBlock(
  key: string,
  scope?: string | null,
): Promise<GlobalBlock> {
  const qs = scope ? `?scope=${encodeURIComponent(scope)}` : ""
  const r = await apiFetch(`/v1/admin/global-blocks/${encodeURIComponent(key)}${qs}`)
  return r.json()
}

export async function updateGlobalBlock(
  key: string,
  patch: { type?: string; variant?: string; data?: unknown },
  scope?: string | null,
): Promise<GlobalBlock> {
  const qs = scope ? `?scope=${encodeURIComponent(scope)}` : ""
  const r = await apiFetch(`/v1/admin/global-blocks/${encodeURIComponent(key)}${qs}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  })
  return r.json()
}
