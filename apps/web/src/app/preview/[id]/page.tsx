import { tokensToCssVars } from "@/lib/theme"
import { PageRenderer } from "@/components/page-renderer"
import { LivePreviewProvider } from "@/components/live-preview-provider"

type SP = Record<string, string | string[] | undefined>
type P = { id: string }

export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: P | Promise<P>
  searchParams: SP | Promise<SP>
}) {
  const p = await Promise.resolve(params)
  const sp = await Promise.resolve(searchParams)

  const raw = sp.token
  const token = Array.isArray(raw) ? raw[0] : raw

  if (!token) return <div className="error-page__message">Missing token</div>

  const apiUrl = process.env.API_URL ?? "http://localhost:3000"
  const r = await fetch(
    `${apiUrl}/v1/public/preview/pages/${p.id}?token=${encodeURIComponent(token)}`,
    { cache: "no-store" },
  )

  if (!r.ok) return <div className="error-page__message">Preview failed: {r.status}</div>

  const { page, theme } = await r.json()
  const cssVars = tokensToCssVars((theme as any)?.tokens)

  return (
    <LivePreviewProvider>
      <main style={cssVars} className="page-base">
        <PageRenderer blocks={(page as any).blocks ?? []} pageSettings={(page as any).settings} />
      </main>
    </LivePreviewProvider>
  )
}
