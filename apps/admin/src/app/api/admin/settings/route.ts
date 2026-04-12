import { getAccessToken, getApiUrl, unauthorizedResponse, proxyResponse, authHeaders } from "@/lib/api-proxy"

export async function GET() {
  const token = await getAccessToken()
  if (!token) return unauthorizedResponse()

  const r = await fetch(`${getApiUrl()}/v1/admin/settings`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })

  return proxyResponse(r)
}

export async function PATCH(req: Request) {
  const token = await getAccessToken()
  if (!token) return unauthorizedResponse()

  const body = await req.json().catch(() => null)

  const r = await fetch(`${getApiUrl()}/v1/admin/settings`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(body),
    cache: "no-store",
  })

  return proxyResponse(r)
}
