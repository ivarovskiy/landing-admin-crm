"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileText, ExternalLink, Search, ChevronRight, ChevronDown, Minus, Globe } from "lucide-react";
import { timeAgo } from "@/lib/time-utils";

export type AdminPageRow = {
  id: string;
  slug: string;
  status?: string;
  updatedAt: string;
  contentUpdatedAt?: string | null;
  parentId?: string | null;
  blocksCount?: number;
  primaryBlock?: { type: string; variant: string } | null;
};

type TreeNode = {
  page: AdminPageRow;
  children: TreeNode[];
};

// ─── Site detection ───────────────────────────────────────────────────────────

const KNOWN_SITES: { id: string; label: string; color: string }[] = [
  { id: "sdc-ballet",  label: "Simply Dance", color: "oklch(0.6 0.18 270)" },
  { id: "ibc-ballet",  label: "IBC Ballet",   color: "oklch(0.58 0.22 25)"  },
];

function siteForSlug(slug: string): { label: string; color: string } | null {
  const s = slug.toLowerCase();
  if (s.includes("ibc") || s === "home") return { label: "IBC Ballet", color: "oklch(0.58 0.22 25)" };
  if (
    s.includes("sds") || s.includes("sdc") || s.includes("simply-dance") ||
    s.includes("junior-company") || s.includes("summer-program") || s.includes("new-student-memo")
  ) return { label: "Simply Dance", color: "oklch(0.6 0.18 270)" };
  return null;
}

// ─── Tree builder ─────────────────────────────────────────────────────────────

function buildTree(pages: AdminPageRow[]): TreeNode[] {
  const childrenMap = new Map<string | null, AdminPageRow[]>();
  for (const p of pages) {
    const key = p.parentId ?? null;
    if (!childrenMap.has(key)) childrenMap.set(key, []);
    childrenMap.get(key)!.push(p);
  }
  function buildNodes(parentId: string | null): TreeNode[] {
    return (childrenMap.get(parentId) ?? []).map((page) => ({
      page,
      children: buildNodes(page.id),
    }));
  }
  return buildNodes(null);
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function PageRow({
  page,
  depth,
  hasChildren,
  isExpanded,
  onToggle,
  now,
}: {
  page: AdminPageRow;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  now: number;
}) {
  const site = siteForSlug(page.slug ?? "");

  return (
    <div className="grid min-h-[48px] grid-cols-[1fr_100px_72px_68px_68px] items-center gap-2 border-b border-border px-3 py-1.5 transition-colors hover:bg-muted/40 last:border-0">
      {/* Page */}
      <div className="flex min-w-0 items-center gap-1" style={{ paddingLeft: depth * 18 }}>
        <button
          type="button"
          onClick={hasChildren ? onToggle : undefined}
          className={[
            "flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors",
            hasChildren ? "text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer" : "cursor-default text-transparent",
          ].join(" ")}
          tabIndex={hasChildren ? 0 : -1}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
          ) : depth > 0 ? (
            <Minus className="h-3 w-3 text-border" />
          ) : null}
        </button>
        <Link href={`/admin/pages/${page.id}`} className="flex min-w-0 items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm font-medium text-foreground">/{page.slug}</span>
        </Link>
      </div>

      {/* Site */}
      <div className="min-w-0">
        {site ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium truncate" style={{ color: site.color }}>
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: site.color }} />
            {site.label}
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground/40">—</span>
        )}
      </div>

      {/* Status */}
      <span className={[
        "w-fit rounded-md px-2 py-0.5 text-[10px] font-semibold leading-none",
        page.status === "published" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
      ].join(" ")}>
        {page.status ?? "draft"}
      </span>

      {/* Updated */}
      <span className="text-[11px] text-muted-foreground tabular-nums">
        {timeAgo(page.contentUpdatedAt ?? page.updatedAt, now)}
      </span>

      {/* Preview */}
      <Link
        href={`/api/preview/${page.id}`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Preview
      </Link>
    </div>
  );
}

// ─── Tree renderer ────────────────────────────────────────────────────────────

function TreeRows({
  nodes, depth, expanded, onToggle, now,
}: {
  nodes: TreeNode[];
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  now: number;
}) {
  return (
    <>
      {nodes.map((node) => {
        const isExpanded = expanded.has(node.page.id);
        return (
          <div key={node.page.id}>
            <PageRow
              page={node.page}
              depth={depth}
              hasChildren={node.children.length > 0}
              isExpanded={isExpanded}
              onToggle={() => onToggle(node.page.id)}
              now={now}
            />
            {isExpanded && node.children.length > 0 && (
              <TreeRows nodes={node.children} depth={depth + 1} expanded={expanded} onToggle={onToggle} now={now} />
            )}
          </div>
        );
      })}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PagesTable({ pages }: { pages: AdminPageRow[] }) {
  const [search, setSearch] = useState("");
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null); // null = All
  const now = useMemo(() => Date.now(), []);

  // Top-level pages for the left sidebar
  const topLevel = useMemo(
    () => pages.filter((p) => !p.parentId).sort((a, b) => a.slug.localeCompare(b.slug)),
    [pages],
  );

  // Pages visible in the main area (filtered by selected parent)
  const visiblePages = useMemo(() => {
    if (selectedParentId === null) return pages;
    // Collect ids of selectedParent + all descendants
    const ids = new Set<string>();
    ids.add(selectedParentId);
    function collect(parentId: string) {
      for (const p of pages) {
        if (p.parentId === parentId) { ids.add(p.id); collect(p.id); }
      }
    }
    collect(selectedParentId);
    return pages.filter((p) => ids.has(p.id));
  }, [pages, selectedParentId]);

  const tree = useMemo(() => {
    const sorted = [...visiblePages].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    // If filtered to a specific parent, root the tree at that parent's children
    if (selectedParentId !== null) {
      const rootPage = pages.find((p) => p.id === selectedParentId)!;
      if (!rootPage) return buildTree(sorted);
      const childrenMap = new Map<string | null, AdminPageRow[]>();
      for (const p of sorted) {
        const key = p.parentId ?? null;
        if (!childrenMap.has(key)) childrenMap.set(key, []);
        childrenMap.get(key)!.push(p);
      }
      const rootNode: TreeNode = {
        page: rootPage,
        children: (childrenMap.get(selectedParentId) ?? []).map((page) => ({ page, children: [] })),
      };
      return [rootNode];
    }
    return buildTree(sorted);
  }, [visiblePages, selectedParentId, pages]);

  const defaultExpanded = useMemo(() => {
    const ids = new Set<string>();
    function collect(nodes: TreeNode[]) {
      for (const n of nodes) { if (n.children.length > 0) { ids.add(n.page.id); collect(n.children); } }
    }
    collect(tree);
    return ids;
  }, [tree]);

  const [expanded, setExpanded] = useState<Set<string>>(defaultExpanded);

  const onToggle = (id: string) =>
    setExpanded((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const searchTrimmed = search.trim().toLowerCase();
  const flatFiltered = searchTrimmed
    ? pages.filter((p) => p.slug?.toLowerCase().includes(searchTrimmed))
    : null;

  return (
    <div className="flex gap-4">
      {/* ── Left sidebar: parent pages ── */}
      <div className="w-44 shrink-0 space-y-0.5">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2">Sites</p>
        <button
          type="button"
          onClick={() => setSelectedParentId(null)}
          className={[
            "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors",
            selectedParentId === null
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
          ].join(" ")}
        >
          <Globe className="h-3.5 w-3.5 shrink-0" />
          All pages
          <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">{pages.length}</span>
        </button>

        {topLevel.map((p) => {
          const site = siteForSlug(p.slug);
          const childCount = pages.filter((c) => c.parentId === p.id).length;
          const isActive = selectedParentId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedParentId(isActive ? null : p.id)}
              className={[
                "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors",
                isActive ? "bg-primary/10 font-medium" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              ].join(" ")}
              style={isActive && site ? { color: site.color } : undefined}
            >
              {site ? (
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: site.color }} />
              ) : (
                <FileText className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="truncate">{site?.label ?? `/${p.slug}`}</span>
              {childCount > 0 && (
                <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">{childCount}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Main area ── */}
      <div className="min-w-0 flex-1 space-y-3">
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
          {/* Header */}
          <div className="grid grid-cols-[1fr_100px_72px_68px_68px] gap-2 border-b border-border bg-muted/30 px-3 py-2">
            {["Page", "Site", "Status", "Updated", ""].map((h) => (
              <span key={h} className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</span>
            ))}
          </div>

          {flatFiltered !== null ? (
            flatFiltered.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm text-muted-foreground">No pages match &ldquo;{search}&rdquo;</p>
              </div>
            ) : (
              <div>
                {flatFiltered.map((page) => (
                  <PageRow key={page.id} page={page} depth={0} hasChildren={false} isExpanded={false} onToggle={() => {}} now={now} />
                ))}
              </div>
            )
          ) : tree.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-muted-foreground">No pages yet.</p>
            </div>
          ) : (
            <TreeRows nodes={tree} depth={0} expanded={expanded} onToggle={onToggle} now={now} />
          )}
        </div>
      </div>
    </div>
  );
}
