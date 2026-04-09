import { getAccessToken, getApiUrl, unauthorizedResponse, proxyResponse, authHeaders } from "@/lib/api-proxy"

type P = { id: string }

export async function POST(req: Request, ctx: { params: P | Promise<P> }) {
  const token = await getAccessToken()
  if (!token) return unauthorizedResponse()

  const { id: pageId } = await Promise.resolve(ctx.params)
  const body = await req.json().catch(() => null)

  const r = await fetch(`${getApiUrl()}/v1/admin/pages/${encodeURIComponent(pageId)}/blocks`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
    cache: "no-store",
  })

  return proxyResponse(r)
}
