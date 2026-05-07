"use client"

import { useState } from "react"
import Link from "next/link"
import { FileText, ExternalLink, Search } from "lucide-react"

function detectSite(slug: string): { label: string; color: string } | null {
  const s = slug.toLowerCase()
  if (s.includes("ibc") || s === "home") return { label: "IBC Ballet", color: "oklch(0.58 0.22 25)" }
  if (s.includes("sds") || s.includes("sdc") || s.includes("simply-dance") || s.includes("junior-company") || s.includes("summer-program") || s.includes("new-student-memo"))
    return { label: "Simply Dance Studio", color: "oklch(0.6 0.18 270)" }
  return null
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function PagesTable({ pages }: { pages: any[] }) {
  const [search, setSearch] = useState("")

  const sorted = [...pages].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  const filtered = search.trim()
    ? sorted.filter((p) => p.slug?.toLowerCase().includes(search.trim().toLowerCase()))
    : sorted

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[oklch(0.4_0_0)] pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search pages…"
          className="w-full h-8 pl-8 pr-3 rounded-lg bg-[oklch(1_0_0/4%)] border border-[oklch(1_0_0/8%)] text-xs text-[oklch(0.93_0_0)] placeholder-[oklch(0.4_0_0)] outline-none focus:border-[oklch(1_0_0/18%)] transition-colors"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[oklch(1_0_0/8%)] bg-[oklch(1_0_0/3%)] overflow-hidden">
        <div className="grid grid-cols-[1fr_100px_80px_72px_64px] gap-3 px-4 py-2 border-b border-[oklch(1_0_0/8%)]">
          {["Page", "Site", "Status", "Updated", ""].map((h) => (
            <span key={h} className="text-[10px] font-semibold uppercase tracking-wider text-[oklch(0.4_0_0)]">{h}</span>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-xs text-[oklch(0.45_0_0)]">
              {search ? `No pages match "${search}"` : "No pages yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[oklch(1_0_0/6%)]">
            {filtered.map((p: any) => {
              const site = detectSite(p.slug ?? "")
              return (
                <div
                  key={p.id}
                  className="grid grid-cols-[1fr_100px_80px_72px_64px] gap-3 items-center px-4 py-3 hover:bg-[oklch(1_0_0/4%)] transition-colors group"
                >
                  <Link href={`/admin/pages/${p.id}`} className="flex items-center gap-2 min-w-0">
                    <FileText className="h-3.5 w-3.5 text-[oklch(0.4_0_0)] shrink-0" />
                    <span className="text-xs text-[oklch(0.88_0_0)] truncate group-hover:text-white transition-colors font-medium">
                      /{p.slug}
                    </span>
                  </Link>

                  <span className="min-w-0">
                    {site ? (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-medium truncate"
                        style={{ color: site.color }}
                      >
                        <span
                          className="w-1 h-1 rounded-full shrink-0"
                          style={{ background: site.color }}
                        />
                        {site.label}
                      </span>
                    ) : (
                      <span className="text-[10px] text-[oklch(0.35_0_0)]">—</span>
                    )}
                  </span>

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
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
