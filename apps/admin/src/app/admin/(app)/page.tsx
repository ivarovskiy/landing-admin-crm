import { requireUser } from "@/lib/auth"
import { fetchAdminPages } from "@/lib/admin-api"
import Link from "next/link"
import { FileText, Plus, ExternalLink, Globe, PenLine } from "lucide-react"

export default async function AdminHome() {
  await requireUser()

  let pages: any[] = []
  try {
    const data = await fetchAdminPages() as { items?: Array<any> }
    pages = data.items ?? []
  } catch {}

  const published = pages.filter((p) => p.status === "published")
  const drafts = pages.filter((p) => p.status !== "published")
  const sorted = [...pages].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div className="min-h-screen bg-[oklch(0.13_0_0)] text-[oklch(0.93_0_0)] p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-[oklch(0.93_0_0)]">Pages</h1>
            <p className="text-xs text-[oklch(0.55_0_0)] mt-0.5">
              {pages.length} page{pages.length !== 1 ? "s" : ""} total
            </p>
          </div>
          <Link
            href="/admin/pages/new"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[oklch(0.58_0.22_25)] hover:bg-[oklch(0.54_0.22_25)] text-white text-xs font-semibold transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New page
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4">

          {/* Pages table */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[oklch(0.5_0_0)]">All pages</p>
            <div className="rounded-xl border border-[oklch(1_0_0/8%)] bg-[oklch(1_0_0/3%)] overflow-hidden">

              {/* Table header */}
              <div className="grid grid-cols-[1fr_56px_80px_72px_64px] gap-3 px-4 py-2 border-b border-[oklch(1_0_0/8%)]">
                {["Page", "Locale", "Status", "Updated", ""].map((h) => (
                  <span key={h} className="text-[10px] font-semibold uppercase tracking-wider text-[oklch(0.4_0_0)]">{h}</span>
                ))}
              </div>

              {pages.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <p className="text-xs text-[oklch(0.45_0_0)]">No pages yet.</p>
                  <Link href="/admin/pages/new" className="text-xs text-[oklch(0.58_0.22_25)] hover:underline mt-1 inline-block">
                    Create your first page
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-[oklch(1_0_0/6%)]">
                  {sorted.map((p: any) => (
                    <div
                      key={p.id}
                      className="grid grid-cols-[1fr_56px_80px_72px_64px] gap-3 items-center px-4 py-3 hover:bg-[oklch(1_0_0/4%)] transition-colors group"
                    >
                      <Link href={`/admin/pages/${p.id}`} className="flex items-center gap-2 min-w-0">
                        <FileText className="h-3.5 w-3.5 text-[oklch(0.4_0_0)] shrink-0" />
                        <span className="text-xs text-[oklch(0.88_0_0)] truncate group-hover:text-white transition-colors font-medium">
                          /{p.slug}
                        </span>
                      </Link>

                      <span className="text-[10px] text-[oklch(0.5_0_0)]">{p.locale ?? "—"}</span>

                      <span className={[
                        "text-[10px] font-medium px-1.5 py-0.5 rounded-md w-fit",
                        p.status === "published"
                          ? "bg-[oklch(0.58_0.22_25/12%)] text-[oklch(0.65_0.18_25)]"
                          : "bg-[oklch(1_0_0/5%)] text-[oklch(0.5_0_0)]",
                      ].join(" ")}>
                        {p.status}
                      </span>

                      <span className="text-[10px] text-[oklch(0.45_0_0)]">
                        {timeAgo(p.contentUpdatedAt ?? p.updatedAt)}
                      </span>

                      <Link
                        href={`/api/preview/${p.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[10px] text-[oklch(0.4_0_0)] hover:text-[oklch(0.88_0_0)] transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Preview
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* Overview */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[oklch(0.5_0_0)]">Overview</p>
              <div className="rounded-xl border border-[oklch(1_0_0/8%)] bg-[oklch(1_0_0/3%)] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[oklch(0.58_0.22_25)]" />
                    <span className="text-xs text-[oklch(0.65_0_0)]">Published</span>
                  </div>
                  <span className="text-xs font-semibold text-[oklch(0.93_0_0)]">{published.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[oklch(1_0_0/20%)]" />
                    <span className="text-xs text-[oklch(0.65_0_0)]">Drafts</span>
                  </div>
                  <span className="text-xs font-semibold text-[oklch(0.93_0_0)]">{drafts.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-3 w-3 text-[oklch(0.4_0_0)]" />
                    <span className="text-xs text-[oklch(0.65_0_0)]">Total</span>
                  </div>
                  <span className="text-xs font-semibold text-[oklch(0.93_0_0)]">{pages.length}</span>
                </div>

                {pages.length > 0 && (
                  <div className="h-1 rounded-full bg-[oklch(1_0_0/8%)] overflow-hidden mt-1">
                    <div
                      className="h-full rounded-full bg-[oklch(0.58_0.22_25)] transition-all"
                      style={{ width: `${(published.length / pages.length) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Unpublished */}
            {drafts.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[oklch(0.5_0_0)]">Unpublished</p>
                <div className="rounded-xl border border-[oklch(1_0_0/8%)] bg-[oklch(1_0_0/3%)] overflow-hidden divide-y divide-[oklch(1_0_0/6%)]">
                  {drafts.map((p) => (
                    <Link
                      key={p.id}
                      href={`/admin/pages/${p.id}`}
                      className="flex items-center justify-between px-4 py-2.5 hover:bg-[oklch(1_0_0/4%)] transition-colors group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <PenLine className="h-3 w-3 text-[oklch(0.4_0_0)] shrink-0" />
                        <span className="text-xs text-[oklch(0.65_0_0)] truncate group-hover:text-[oklch(0.88_0_0)] transition-colors">
                          /{p.slug}
                        </span>
                      </div>
                      <span className="text-[10px] text-[oklch(0.38_0_0)] ml-2 shrink-0">
                        {timeAgo(p.contentUpdatedAt ?? p.updatedAt)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
