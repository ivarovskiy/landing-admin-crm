import { getAccessToken, getApiUrl, unauthorizedResponse, proxyResponse } from "@/lib/api-proxy"

export async function POST(req: Request) {
  const token = await getAccessToken()
  if (!token) return unauthorizedResponse()

  // Forward the multipart form data as-is to the API
  const formData = await req.formData()
  const body = new FormData()
  for (const [key, value] of formData.entries()) {
    body.append(key, value)
  }

  const r = await fetch(`${getApiUrl()}/v1/admin/media/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
    cache: "no-store",
  })

  return proxyResponse(r)
}
