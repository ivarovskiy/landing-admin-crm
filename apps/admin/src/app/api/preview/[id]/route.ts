import { NextResponse } from "next/server"
import { cookies } from "next/headers"

type P = { id: string }

function resolveWebUrl() {
  return (
    process.env.WEB_URL ??
    process.env.NEXT_PUBLIC_WEB_URL ??
    process.env.PUBLIC_WEB_URL ??
    (process.env.NODE_ENV === "development" ? "http://localhost:3002" : null)
  )
}

function isLoopbackUrl(value: string) {
  try {
    const { hostname } = new URL(value)
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
  } catch {
    return false
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&":
        return "&amp;"
      case "<":
        return "&lt;"
      case ">":
        return "&gt;"
      case '"':
        return "&quot;"
      default:
        return "&#39;"
    }
  })
}

function previewUnavailable(message: string, details?: string) {
  const safeMessage = escapeHtml(message)
  const safeDetails = details ? escapeHtml(details) : null

  return new NextResponse(
    `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html,body{margin:0;height:100%;font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#f4f4f5;color:#18181b}
      body{display:grid;place-items:center}
      main{max-width:520px;padding:32px;text-align:center}
      h1{margin:0 0 10px;font-size:18px;line-height:1.3}
      p{margin:0;color:#71717a;font-size:13px;line-height:1.55}
      code{display:inline-block;margin-top:14px;padding:6px 8px;border-radius:6px;background:#e4e4e7;color:#3f3f46;font-size:12px}
    </style>
  </head>
  <body>
    <main>
      <h1>${safeMessage}</h1>
      ${safeDetails ? `<p>${safeDetails}</p>` : ""}
      <code>WEB_URL</code>
    </main>
  </body>
</html>`,
    {
      status: 503,
      headers: { "content-type": "text/html; charset=utf-8" },
    },
  )
}

export async function GET(req: Request, ctx: { params: P | Promise<P> }) {
  const accessToken = (await cookies()).get("access_token")?.value
  if (!accessToken) {
    return NextResponse.redirect(new URL("/admin/login", req.url))
  }

  const { id: pageId } = await Promise.resolve(ctx.params)

  const apiUrl = process.env.API_URL ?? "http://localhost:3000"
  const webUrl = resolveWebUrl()
  if (!webUrl) {
    return previewUnavailable(
      "Preview web app URL is not configured",
      "Set WEB_URL to the public web app origin so the admin preview iframe can open the rendered page.",
    )
  }

  if (isLoopbackUrl(webUrl)) {
    try {
      await fetch(webUrl, {
        method: "HEAD",
        cache: "no-store",
        signal: AbortSignal.timeout(1500),
      })
    } catch {
      return previewUnavailable(
        "Web preview server is not running",
        `Admin preview is configured to open ${webUrl}. Start apps/web dev server or set WEB_URL to an available web app URL.`,
      )
    }
  }

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
  for (const [key, value] of new URL(req.url).searchParams) {
    if (key !== "token") dest.searchParams.set(key, value)
  }
  return NextResponse.redirect(dest, 307)
}
