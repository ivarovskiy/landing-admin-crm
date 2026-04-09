import { getAccessToken, getApiUrl, unauthorizedResponse, proxyResponse, authHeaders } from "@/lib/api-proxy"

type P = { id: string }

export async function PATCH(req: Request, ctx: { params: P | Promise<P> }) {
  const token = await getAccessToken()
  if (!token) return unauthorizedResponse()

  const { id } = await Promise.resolve(ctx.params)
  const body = await req.json().catch(() => null)

  const r = await fetch(`${getApiUrl()}/v1/admin/blocks/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(body),
    cache: "no-store",
  })

  return proxyResponse(r)
}

export async function DELETE(_req: Request, ctx: { params: P | Promise<P> }) {
  const token = await getAccessToken()
  if (!token) return unauthorizedResponse()

  const { id } = await Promise.resolve(ctx.params)

  const r = await fetch(`${getApiUrl()}/v1/admin/blocks/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })

  return proxyResponse(r)
}
