import { requireUser } from "@/lib/auth";
import { fetchAdminPages } from "@/lib/admin-api";
import Link from "next/link";
import { Plus, Globe, PenLine } from "lucide-react";
import { PagesTable, type AdminPageRow } from "./pages-table";

function timeAgo(date: string, now: number) {
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default async function AdminHome() {
  await requireUser();

  let pages: AdminPageRow[] = [];
  try {
    const data = await fetchAdminPages() as { items?: AdminPageRow[] };
    pages = data.items ?? [];
  } catch {}

  const now = Date.now();
  const published = pages.filter((p) => p.status === "published");
  const drafts = pages.filter((p) => p.status !== "published");

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Pages</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {pages.length} page{pages.length !== 1 ? "s" : ""} total
            </p>
          </div>
          <Link
            href="/admin/pages/new"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New page
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_260px]">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">All pages</p>
            <PagesTable pages={pages} />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Overview</p>
              <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-sm text-muted-foreground">Published</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{published.length}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/35" />
                    <span className="text-sm text-muted-foreground">Drafts</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{drafts.length}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Total</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{pages.length}</span>
                </div>

                {pages.length > 0 && (
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(published.length / pages.length) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            {drafts.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unpublished</p>
                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                  <div className="divide-y divide-border">
                    {drafts.map((p) => (
                      <Link
                        key={p.id}
                        href={`/admin/pages/${p.id}`}
                        className="flex min-h-12 items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-muted/60"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <PenLine className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="truncate text-sm font-medium text-foreground">/{p.slug}</span>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {timeAgo(p.contentUpdatedAt ?? p.updatedAt, now)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
