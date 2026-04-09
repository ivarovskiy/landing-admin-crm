import { NextResponse } from "next/server"
import { cookies } from "next/headers"

type P = { id: string }

export async function GET(req: Request, ctx: { params: P | Promise<P> }) {
  const accessToken = (await cookies()).get("access_token")?.value
  if (!accessToken) {
    return NextResponse.redirect(new URL("/admin/login", req.url))
  }

  const { id: pageId } = await Promise.resolve(ctx.params)

  const apiUrl = process.env.API_URL ?? "http://localhost:3000"
  const webUrl = process.env.WEB_URL ?? "http://localhost:3002"

  const r = await fetch(`${apiUrl}/v1/admin/pages/${encodeURIComponent(pageId)}/preview-token`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  })

  if (!r.ok) {
    return NextResponse.redirect(new URL(`/admin/pages?previewError=${r.status}`, req.url))
  }

  const data = (await r.json().catch(() => ({}))) as { token?: string }
  if (!data.token) {
    return NextResponse.redirect(new URL(`/admin/pages?previewError=no_token`, req.url))
  }

  const dest = new URL(`${webUrl}/preview/${pageId}`)
  dest.searchParams.set("token", data.token)
  return NextResponse.redirect(dest, 307)
}