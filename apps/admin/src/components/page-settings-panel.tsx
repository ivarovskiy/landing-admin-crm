"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  X,
  Globe,
  Trash2,
  Copy,
  Upload,
  ArrowDownCircle,
  ScrollText,
  Grid3x3,
  FileText,
  ChevronRight,
} from "lucide-react";

/* ----------------------------------------------------------------
   Types
   ---------------------------------------------------------------- */
export type PageCanvasSettings = {
  canvasScroll: boolean;
  showGrid: boolean;
};

/* ----------------------------------------------------------------
   PageSettingsPanel — standalone floating panel
   ---------------------------------------------------------------- */
export function PageSettingsPanel({
  pageId,
  slug,
  status,
  parentId,
  allPages,
  canvasSettings,
  onCanvasSettingsChange,
  onClose,
}: {
  pageId: string;
  slug: string;
  status: string;
  parentId?: string | null;
  allPages?: Array<{ id: string; slug: string; parentId?: string | null }>;
  canvasSettings: PageCanvasSettings;
  onCanvasSettingsChange: (s: Partial<PageCanvasSettings>) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const [slugValue, setSlugValue] = useState(slug);
  const [parentValue, setParentValue] = useState<string>(parentId ?? "");
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveParent() {
    setError(null);
    setSaving("parent");
    try {
      const r = await fetch(`/api/admin/pages/${pageId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ parentId: parentValue || null }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed to save parent");
    } finally {
      setSaving(null);
    }
  }

  // Possible parents = all pages except: self + any descendant of self
  const parentOptions = (allPages ?? []).filter((p) => {
    if (p.id === pageId) return false;
    // walk up p's chain; if it hits pageId, this candidate is a descendant — exclude
    let cursor: string | null | undefined = p.parentId ?? null;
    let steps = 0;
    while (cursor && steps < 16) {
      if (cursor === pageId) return false;
      const next = (allPages ?? []).find((x) => x.id === cursor);
      cursor = next?.parentId ?? null;
      steps++;
    }
    return true;
  });

  async function saveSlug() {
    setError(null);
    setSaving("slug");
    try {
      const r = await fetch(`/api/admin/pages/${pageId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: slugValue.trim() }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed");
    } finally {
      setSaving(null);
    }
  }

  async function togglePublish() {
    setError(null);
    const action = status === "published" ? "unpublish" : "publish";
    setSaving(action);
    try {
      const r = await fetch(`/api/admin/pages/${pageId}/${action}`, { method: "POST" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed");
    } finally {
      setSaving(null);
    }
  }

  async function duplicate() {
    setError(null);
    setSaving("duplicate");
    try {
      const r = await fetch(`/api/admin/pages/${pageId}/duplicate`, { method: "POST" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = (await r.json()) as { page: { id: string } };
      router.push(`/admin/pages/${data.page.id}`);
    } catch (e: any) {
      setError(e?.message ?? "Failed");
    } finally {
      setSaving(null);
    }
  }

  const isPublished = status === "published";

  return (
    /* Backdrop */
    <div
      className="absolute inset-0 z-40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Panel */}
      <div className="absolute top-3 right-3 bottom-3 w-[280px] flex flex-col bg-card/95 backdrop-blur-md rounded-xl border border-border/50 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-border/50 shrink-0">
          <span className="text-xs font-semibold text-foreground">Page Settings</span>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-5 h-5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* ---- Publish ---- */}
          <div className="px-3 py-3">
            <button
              type="button"
              disabled={saving !== null}
              onClick={togglePublish}
              className={[
                "w-full flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors disabled:opacity-50",
                isPublished
                  ? "bg-muted/40 hover:bg-muted/60"
                  : "bg-primary/10 hover:bg-primary/15 border border-primary/20",
              ].join(" ")}
            >
              <div className="flex items-center gap-2.5">
                {isPublished
                  ? <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
                  : <Upload className="h-4 w-4 text-primary" />
                }
                <div className="text-left">
                  <p className={["text-xs font-semibold", isPublished ? "text-foreground" : "text-primary"].join(" ")}>
                    {saving === "publish" || saving === "unpublish" ? "Working…" : isPublished ? "Unpublish" : "Publish"}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                    {isPublished ? "Move back to draft" : "Make page live"}
                  </p>
                </div>
              </div>
              <span className={[
                "text-[10px] font-medium px-1.5 py-0.5 rounded-md shrink-0",
                isPublished
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground",
              ].join(" ")}>
                {isPublished ? "live" : "draft"}
              </span>
            </button>
          </div>

          <Divider />

          {/* ---- Page info ---- */}
          <Section label="Page">
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground font-medium">Slug</label>
              <div className="flex gap-1.5">
                <input
                  value={slugValue}
                  onChange={(e) => setSlugValue(e.target.value)}
                  className="flex-1 h-7 rounded-md bg-muted/40 border border-border/60 px-2 text-xs text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-colors"
                />
                <button
                  type="button"
                  disabled={saving !== null || slugValue.trim() === slug}
                  onClick={saveSlug}
                  className="h-7 px-2 rounded-md bg-primary text-primary-foreground text-xs font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors shrink-0"
                >
                  {saving === "slug" ? "…" : "Save"}
                </button>
              </div>
            </div>

            <div className="space-y-1.5 mt-2.5">
              <label className="text-[10px] text-muted-foreground font-medium">Parent page</label>
              <div className="flex gap-1.5">
                <select
                  value={parentValue}
                  onChange={(e) => setParentValue(e.target.value)}
                  className="flex-1 h-7 rounded-md bg-muted/40 border border-border/60 px-2 text-xs text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-colors"
                >
                  <option value="">— No parent (top-level)</option>
                  {parentOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      /{p.slug}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={saving !== null || (parentValue || null) === (parentId ?? null)}
                  onClick={saveParent}
                  className="h-7 px-2 rounded-md bg-primary text-primary-foreground text-xs font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors shrink-0"
                >
                  {saving === "parent" ? "…" : "Save"}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground/70 leading-tight">
                Child pages inherit this parent's header & footer. Organizational only — URL stays flat.
              </p>
            </div>
          </Section>

          <Divider />

          {/* ---- Canvas ---- */}
          <Section label="Canvas">
            <Toggle
              icon={<ScrollText className="h-3.5 w-3.5" />}
              label="Canvas scroll"
              description="Allow scrolling the canvas"
              value={canvasSettings.canvasScroll}
              onChange={(v) => onCanvasSettingsChange({ canvasScroll: v })}
            />
            <Toggle
              icon={<Grid3x3 className="h-3.5 w-3.5" />}
              label="Dot grid"
              description="Show background dot grid"
              value={canvasSettings.showGrid}
              onChange={(v) => onCanvasSettingsChange({ showGrid: v })}
            />
          </Section>

          <Divider />

          {/* ---- Actions ---- */}
          <Section label="Actions">
            <ActionBtn
              icon={<Copy className="h-3.5 w-3.5" />}
              label="Duplicate page"
              disabled={saving !== null}
              onClick={duplicate}
            />
            <Link
              href={`/admin/pages/${pageId}/delete`}
              className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete page</span>
            </Link>
          </Section>

          {error && (
            <div className="mx-3 mb-3 text-[11px] text-destructive bg-destructive/10 rounded px-2 py-1">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------
   Sub-components
   ---------------------------------------------------------------- */
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-3 py-3 space-y-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-border/60 mx-3" />;
}

function Toggle({
  icon, label, description, value, onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="w-full flex items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-muted/60"
    >
      <span className={value ? "text-primary" : "text-muted-foreground"}>{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground leading-none mb-0.5">{label}</p>
        <p className="text-[10px] text-muted-foreground truncate">{description}</p>
      </div>
      <div className={["w-7 h-4 rounded-full transition-colors shrink-0", value ? "bg-primary" : "bg-muted-foreground/30"].join(" ")}>
        <div className={["w-3 h-3 rounded-full bg-white shadow-sm mt-0.5 transition-transform", value ? "translate-x-3.5" : "translate-x-0.5"].join(" ")} />
      </div>
    </button>
  );
}

function ActionBtn({
  icon, label, className = "", disabled, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  className?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={["w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-foreground hover:bg-muted transition-colors text-left disabled:opacity-50", className].join(" ")}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
