import { requireUser } from "@/lib/auth"
import { fetchAdminPages } from "@/lib/admin-api"
import { GlobalBlocksEditor } from "@/components/global-blocks-editor"

type SP = Record<string, string | string[] | undefined>

function pickScope(sp: SP) {
  const v = sp["scope"]
  if (typeof v === "string") return v
  if (Array.isArray(v) && v.length) return v[0]
  return ""
}

export default async function GlobalBlocksPage({
  searchParams,
}: {
  searchParams: Promise<SP>
}) {
  await requireUser()

  const sp = await Promise.resolve(searchParams)
  const scopeRaw = pickScope(sp)

  const pagesRes = await fetchAdminPages().catch(() => ({ items: [] as any[] }))
  const pages = ((pagesRes as any).items ?? []).map((x: any) => ({
    id: x.id as string,
    slug: x.slug as string,
    parentId: (x.parentId ?? null) as string | null,
  }))

  // "site" or empty = null (site-wide); any other value = a page id
  const scope: string | null = scopeRaw && scopeRaw !== "site" ? scopeRaw : null

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Global Blocks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Shared header &amp; footer. Each scope (site-wide or per parent page) has its own pair.
          Child pages inherit from their nearest parent scope, falling back to site-wide.
        </p>
      </div>

      <GlobalBlocksEditor scope={scope} allPages={pages} />
    </div>
  )
}
