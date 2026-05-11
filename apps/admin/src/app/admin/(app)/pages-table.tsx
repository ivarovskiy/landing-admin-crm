"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileText, ExternalLink, Search } from "lucide-react";
import { timeAgo } from "@/lib/time-utils";

export type AdminPageRow = {
  id: string;
  slug: string;
  status?: string;
  updatedAt: string;
  contentUpdatedAt?: string | null;
};

function detectSite(slug: string): { label: string; color: string } | null {
  const s = slug.toLowerCase();
  if (s.includes("ibc") || s === "home") return { label: "IBC Ballet", color: "oklch(0.58 0.22 25)" };
  if (
    s.includes("sds") ||
    s.includes("sdc") ||
    s.includes("simply-dance") ||
    s.includes("junior-company") ||
    s.includes("summer-program") ||
    s.includes("new-student-memo")
  ) {
    return { label: "Simply Dance Studio", color: "oklch(0.6 0.18 270)" };
  }
  return null;
}

export function PagesTable({ pages }: { pages: AdminPageRow[] }) {
  const [search, setSearch] = useState("");
  const now = useMemo(() => Date.now(), []);

  const sorted = [...pages].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  const filtered = search.trim()
    ? sorted.filter((p) => p.slug?.toLowerCase().includes(search.trim().toLowerCase()))
    : sorted;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search pages..."
          className="h-11 w-full rounded-lg border border-border bg-card pl-10 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/70 focus:ring-1 focus:ring-ring/70"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="grid grid-cols-[1fr_120px_92px_86px_82px] gap-3 border-b border-border px-4 py-3">
          {["Page", "Site", "Status", "Updated", ""].map((h) => (
            <span key={h} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {h}
            </span>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              {search ? `No pages match "${search}"` : "No pages yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((p) => {
              const site = detectSite(p.slug ?? "");
              return (
                <div
                  key={p.id}
                  className="grid min-h-14 grid-cols-[1fr_120px_92px_86px_82px] items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/55"
                >
                  <Link href={`/admin/pages/${p.id}`} className="flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm font-medium text-foreground">/{p.slug}</span>
                  </Link>

                  <span className="min-w-0">
                    {site ? (
                      <span
                        className="inline-flex items-center gap-1 truncate text-xs font-medium"
                        style={{ color: site.color }}
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: site.color }} />
                        {site.label}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </span>

                  <span
                    className={[
                      "w-fit rounded-md px-2 py-1 text-xs font-medium",
                      p.status === "published"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                    ].join(" ")}
                  >
                    {p.status}
                  </span>

                  <span className="text-xs text-muted-foreground">
                    {timeAgo(p.contentUpdatedAt ?? p.updatedAt, now)}
                  </span>

                  <Link
                    href={`/api/preview/${p.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-10 items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Preview
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
