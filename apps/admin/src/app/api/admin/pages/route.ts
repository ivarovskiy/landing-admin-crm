import { getAccessToken, getApiUrl, unauthorizedResponse, proxyResponse, authHeaders } from "@/lib/api-proxy"

export async function POST(req: Request) {
  const token = await getAccessToken()
  if (!token) return unauthorizedResponse()

  const body = await req.json().catch(() => null)

  const r = await fetch(`${getApiUrl()}/v1/admin/pages`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
    cache: "no-store",
  })

  return proxyResponse(r)
}
