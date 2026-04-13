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

export type SiteZoomSettings = { fitViewport?: boolean; scale?: number; normalizeViewport?: boolean }
export type SiteSettingsData = { zoom?: SiteZoomSettings }

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
