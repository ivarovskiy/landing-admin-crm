"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileText, ExternalLink, Search, ChevronRight, ChevronDown, Minus } from "lucide-react";
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

// ─── Block type labels ────────────────────────────────────────────────────────

const BLOCK_LABELS: Record<string, { label: string; color: string }> = {
  "hero:slider-v1":        { label: "Hero Slider",    color: "oklch(0.55 0.18 200)" },
  "content-page:v1":       { label: "Content Page",   color: "oklch(0.52 0.14 145)" },
  "new-student-memo:v1":   { label: "Student Memo",   color: "oklch(0.55 0.16 60)"  },
  "doc-header:v1":         { label: "Document",       color: "oklch(0.52 0.12 240)" },
  "doc-body:v1":           { label: "Document",       color: "oklch(0.52 0.12 240)" },
  "text-block:v1":         { label: "Text Block",     color: "oklch(0.52 0.08 0)"   },
  "image-block:v1":        { label: "Image Block",    color: "oklch(0.52 0.12 310)" },
  "features:v1":           { label: "Features",       color: "oklch(0.52 0.14 170)" },
  "studio-address:v1":     { label: "Studio Address", color: "oklch(0.52 0.14 80)"  },
  "scrapbook:v1":          { label: "Scrapbook",      color: "oklch(0.52 0.16 330)" },
  "header:v1":             { label: "Header",         color: "oklch(0.46 0.06 0)"   },
  "footer:v1":             { label: "Footer",         color: "oklch(0.46 0.06 0)"   },
};

function blockMeta(block?: { type: string; variant: string } | null) {
  if (!block) return null;
  const key = `${block.type}:${block.variant}`;
  return BLOCK_LABELS[key] ?? BLOCK_LABELS[block.type] ?? { label: block.type, color: "oklch(0.52 0.06 0)" };
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

// ─── Row component ────────────────────────────────────────────────────────────

function PageRow({
  page,
  depth,
  hasChildren,
  isExpanded,
  onToggle,
  isLast,
  now,
}: {
  page: AdminPageRow;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  isLast: boolean;
  now: number;
}) {
  const site = detectSite(page.slug ?? "");
  const block = blockMeta(page.primaryBlock);

  return (
    <div className="grid min-h-[52px] grid-cols-[1fr_130px_110px_80px_76px_80px] items-center gap-2 border-b border-border px-3 py-2 transition-colors hover:bg-muted/40 last:border-0">
      {/* Page column — indented */}
      <div className="flex min-w-0 items-center gap-1" style={{ paddingLeft: depth * 20 }}>
        {/* Expand / collapse / leaf indicator */}
        <button
          type="button"
          onClick={hasChildren ? onToggle : undefined}
          className={[
            "flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors",
            hasChildren ? "text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer" : "cursor-default text-transparent",
          ].join(" ")}
          tabIndex={hasChildren ? 0 : -1}
          aria-label={isExpanded ? "Collapse" : "Expand"}
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

      {/* Block type */}
      <div className="min-w-0">
        {block ? (
          <span
            className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold leading-none tracking-wide"
            style={{ background: block.color + "22", color: block.color }}
          >
            {block.label}
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground/50">—</span>
        )}
      </div>

      {/* Site */}
      <div className="min-w-0">
        {site ? (
          <span className="inline-flex items-center gap-1 truncate text-[11px] font-medium" style={{ color: site.color }}>
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: site.color }} />
            {site.label}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/40">—</span>
        )}
      </div>

      {/* Status */}
      <span
        className={[
          "w-fit rounded-md px-2 py-0.5 text-[10px] font-semibold leading-none",
          page.status === "published"
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground",
        ].join(" ")}
      >
        {page.status ?? "draft"}
      </span>

      {/* Updated */}
      <span className="text-[11px] text-muted-foreground">
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

// ─── Recursive tree renderer ──────────────────────────────────────────────────

function TreeRows({
  nodes,
  depth,
  expanded,
  onToggle,
  now,
}: {
  nodes: TreeNode[];
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  now: number;
}) {
  return (
    <>
      {nodes.map((node, i) => {
        const isExpanded = expanded.has(node.page.id);
        return (
          <div key={node.page.id}>
            <PageRow
              page={node.page}
              depth={depth}
              hasChildren={node.children.length > 0}
              isExpanded={isExpanded}
              onToggle={() => onToggle(node.page.id)}
              isLast={i === nodes.length - 1 && depth === 0}
              now={now}
            />
            {isExpanded && node.children.length > 0 && (
              <TreeRows
                nodes={node.children}
                depth={depth + 1}
                expanded={expanded}
                onToggle={onToggle}
                now={now}
              />
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
  const now = useMemo(() => Date.now(), []);

  const tree = useMemo(() => {
    const sorted = [...pages].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    return buildTree(sorted);
  }, [pages]);

  // All nodes with children start expanded
  const defaultExpanded = useMemo(() => {
    const ids = new Set<string>();
    function collect(nodes: TreeNode[]) {
      for (const n of nodes) {
        if (n.children.length > 0) { ids.add(n.page.id); collect(n.children); }
      }
    }
    collect(tree);
    return ids;
  }, [tree]);

  const [expanded, setExpanded] = useState<Set<string>>(defaultExpanded);

  const onToggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // Search: flat filtered list (bypass tree)
  const searchTrimmed = search.trim().toLowerCase();
  const flatFiltered = searchTrimmed
    ? pages.filter((p) => p.slug?.toLowerCase().includes(searchTrimmed))
    : null;

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
        {/* Header */}
        <div className="grid grid-cols-[1fr_130px_110px_80px_76px_80px] gap-2 border-b border-border bg-muted/30 px-3 py-2">
          {["Page", "Component", "Site", "Status", "Updated", ""].map((h) => (
            <span key={h} className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {h}
            </span>
          ))}
        </div>

        {/* Search results — flat list */}
        {flatFiltered !== null ? (
          flatFiltered.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-muted-foreground">No pages match &ldquo;{search}&rdquo;</p>
            </div>
          ) : (
            <div>
              {flatFiltered.map((page) => (
                <PageRow
                  key={page.id}
                  page={page}
                  depth={0}
                  hasChildren={false}
                  isExpanded={false}
                  onToggle={() => {}}
                  isLast={false}
                  now={now}
                />
              ))}
            </div>
          )
        ) : tree.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">No pages yet.</p>
          </div>
        ) : (
          /* Tree view */
          <TreeRows nodes={tree} depth={0} expanded={expanded} onToggle={onToggle} now={now} />
        )}
      </div>
    </div>
  );
}
