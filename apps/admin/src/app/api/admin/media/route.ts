import { getAccessToken, getApiUrl, unauthorizedResponse, proxyResponse } from "@/lib/api-proxy"

export async function GET(req: Request) {
  const token = await getAccessToken()
  if (!token) return unauthorizedResponse()

  const { searchParams } = new URL(req.url)
  const qs = searchParams.toString()

  const r = await fetch(`${getApiUrl()}/v1/admin/media${qs ? `?${qs}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })

  return proxyResponse(r)
}
