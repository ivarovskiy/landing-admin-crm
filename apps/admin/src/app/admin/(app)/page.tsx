import { requireUser } from "@/lib/auth"
import { fetchAdminPages } from "@/lib/admin-api"
import Link from "next/link"
import { FileText, Plus, ExternalLink, Globe, PenLine } from "lucide-react"

export default async function AdminHome() {
  const me = await requireUser()

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
    <div className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-[oklch(0.93_0_0)]">Pages</h1>
          <p className="text-sm text-[oklch(0.45_0_0)] mt-0.5">
            {pages.length} page{pages.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link
          href="/admin/pages/new"
          className="flex items-center gap-1.5 h-8 px-3 rounded-md bg-[oklch(0.58_0.22_25)] hover:bg-[oklch(0.53_0.22_25)] text-white text-xs font-medium transition-colors"
        >
          <Plus size={13} />
          New page
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4">

        {/* LEFT — pages table */}
        <div className="rounded-xl bg-[oklch(0.16_0_0)] border border-[oklch(1_0_0/8%)] overflow-hidden self-start">
          <div className="grid grid-cols-[1fr_72px_90px_90px_72px] gap-3 px-4 py-2.5 border-b border-[oklch(1_0_0/8%)]">
            {["Page", "Locale", "Status", "Updated", ""].map((h) => (
              <span key={h} className="text-xs font-medium text-[oklch(0.45_0_0)]">{h}</span>
            ))}
          </div>

          {pages.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-[oklch(0.45_0_0)]">
              No pages yet.{" "}
              <Link href="/admin/pages/new" className="text-[oklch(0.58_0.22_25)] hover:underline">
                Create one
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[oklch(1_0_0/8%)]">
              {sorted.map((p: any) => (
                <div
                  key={p.id}
                  className="grid grid-cols-[1fr_72px_90px_90px_72px] gap-3 items-center px-4 py-3 hover:bg-[oklch(1_0_0/4%)] transition-colors group"
                >
                  <Link href={`/admin/pages/${p.id}`} className="flex items-center gap-2 min-w-0">
                    <FileText size={13} className="text-[oklch(0.45_0_0)] shrink-0" />
                    <span className="text-sm text-[oklch(0.93_0_0)] truncate group-hover:text-white transition-colors">
                      /{p.slug}
                    </span>
                  </Link>

                  <span className="text-xs text-[oklch(0.55_0_0)]">{p.locale ?? "—"}</span>

                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-md font-medium w-fit ${
                      p.status === "published"
                        ? "bg-[oklch(0.58_0.22_25/15%)] text-[oklch(0.58_0.22_25)]"
                        : "bg-[oklch(1_0_0/6%)] text-[oklch(0.55_0_0)]"
                    }`}
                  >
                    {p.status}
                  </span>

                  <span className="text-xs text-[oklch(0.45_0_0)]">
                    {timeAgo(p.contentUpdatedAt ?? p.updatedAt)}
                  </span>

                  <Link
                    href={`/api/preview/${p.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-[oklch(0.45_0_0)] hover:text-[oklch(0.93_0_0)] transition-colors"
                  >
                    <ExternalLink size={12} />
                    Preview
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl bg-[oklch(0.16_0_0)] border border-[oklch(1_0_0/8%)] p-4">
            <div className="text-xs font-medium text-[oklch(0.45_0_0)] mb-4">Overview</div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[oklch(0.58_0.22_25)]" />
                  <span className="text-xs text-[oklch(0.72_0_0)]">Published</span>
                </div>
                <span className="text-sm font-semibold text-[oklch(0.93_0_0)]">{published.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[oklch(0.32_0_0)]" />
                  <span className="text-xs text-[oklch(0.72_0_0)]">Drafts</span>
                </div>
                <span className="text-sm font-semibold text-[oklch(0.93_0_0)]">{drafts.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe size={12} className="text-[oklch(0.45_0_0)]" />
                  <span className="text-xs text-[oklch(0.72_0_0)]">Total</span>
                </div>
                <span className="text-sm font-semibold text-[oklch(0.93_0_0)]">{pages.length}</span>
              </div>
            </div>

            {pages.length > 0 && (
              <div className="mt-4 h-1.5 rounded-full bg-[oklch(1_0_0/8%)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[oklch(0.58_0.22_25)] transition-all"
                  style={{ width: `${(published.length / pages.length) * 100}%` }}
                />
              </div>
            )}
          </div>

          {drafts.length > 0 && (
            <div className="rounded-xl bg-[oklch(0.16_0_0)] border border-[oklch(1_0_0/8%)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[oklch(1_0_0/8%)]">
                <div className="flex items-center gap-2 text-xs font-medium text-[oklch(0.55_0_0)]">
                  <PenLine size={12} />
                  Unpublished
                </div>
              </div>
              <div className="divide-y divide-[oklch(1_0_0/8%)]">
                {drafts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/admin/pages/${p.id}`}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-[oklch(1_0_0/4%)] transition-colors"
                  >
                    <span className="text-xs text-[oklch(0.72_0_0)] truncate">/{p.slug}</span>
                    <span className="text-xs text-[oklch(0.35_0_0)] ml-2 shrink-0">
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
  )
}
