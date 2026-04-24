import { getAccessToken, getApiUrl, unauthorizedResponse, proxyResponse, authHeaders } from "@/lib/api-proxy"

type P = { key: string }

function buildUpstreamUrl(req: Request, key: string) {
  const incoming = new URL(req.url)
  const scope = incoming.searchParams.get("scope")
  const qs = scope ? `?scope=${encodeURIComponent(scope)}` : ""
  return `${getApiUrl()}/v1/admin/global-blocks/${encodeURIComponent(key)}${qs}`
}

export async function GET(req: Request, ctx: { params: P | Promise<P> }) {
  const token = await getAccessToken()
  if (!token) return unauthorizedResponse()

  const { key } = await Promise.resolve(ctx.params)

  const r = await fetch(buildUpstreamUrl(req, key), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })

  return proxyResponse(r)
}

export async function PATCH(req: Request, ctx: { params: P | Promise<P> }) {
  const token = await getAccessToken()
  if (!token) return unauthorizedResponse()

  const { key } = await Promise.resolve(ctx.params)
  const body = await req.json().catch(() => null)

  const r = await fetch(buildUpstreamUrl(req, key), {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(body),
    cache: "no-store",
  })

  return proxyResponse(r)
}
