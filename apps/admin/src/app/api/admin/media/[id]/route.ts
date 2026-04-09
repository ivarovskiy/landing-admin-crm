import { getAccessToken, getApiUrl, unauthorizedResponse, proxyResponse } from "@/lib/api-proxy"

type P = { id: string }

export async function DELETE(_req: Request, ctx: { params: P | Promise<P> }) {
  const token = await getAccessToken()
  if (!token) return unauthorizedResponse()

  const { id } = await Promise.resolve(ctx.params)

  const r = await fetch(`${getApiUrl()}/v1/admin/media/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })

  return proxyResponse(r)
}
