import { tokensToCssVars } from "@/lib/theme"
import { PageRenderer } from "@/components/page-renderer"
import { LivePreviewProvider } from "@/components/live-preview-provider"
import { getSiteSettings } from "@/lib/api-public"

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
  const [r, settingsRes] = await Promise.all([
    fetch(
      `${apiUrl}/v1/public/preview/pages/${p.id}?token=${encodeURIComponent(token)}`,
      { cache: "no-store" },
    ),
    getSiteSettings(),
  ])

  if (!r.ok) return <div className="error-page__message">Preview failed: {r.status}</div>

  const { page, theme } = await r.json()
  const cssVars = tokensToCssVars((theme as any)?.tokens)
  const blocks: any[] = (page as any).blocks ?? []
  const blockFillViewport = blocks.some((b: any) => b.data?.options?.fillViewport === true)
  const baseZoom = settingsRes.ok ? (settingsRes.data?.zoom ?? null) : null
  const zoomSettings = blockFillViewport ? { ...baseZoom, fitViewport: true } : baseZoom

  return (
    <LivePreviewProvider>
      <main style={cssVars} className="page-base">
        <PageRenderer blocks={(page as any).blocks ?? []} zoomSettings={zoomSettings} />
      </main>
    </LivePreviewProvider>
  )
}
