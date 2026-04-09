"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input } from "@acme/ui";
import {
  Settings,
  Globe,
  Trash2,
  Copy,
  Upload,
  ArrowDownCircle,
  X,
} from "lucide-react";

export function PageSettingsDropdown({
  pageId,
  slug,
  status,
}: {
  pageId: string;
  slug: string;
  status: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [slugValue, setSlugValue] = useState(slug);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

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
      const r = await fetch(`/api/admin/pages/${pageId}/${action}`, {
        method: "POST",
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      router.refresh();
      setOpen(false);
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
      const r = await fetch(`/api/admin/pages/${pageId}/duplicate`, {
        method: "POST",
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = (await r.json()) as { page: { id: string } };
      router.push(`/admin/pages/${data.page.id}`);
    } catch (e: any) {
      setError(e?.message ?? "Failed");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => setOpen((v) => !v)}
        title="Page settings"
      >
        <Settings className="h-4 w-4" />
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 rounded-lg border bg-card shadow-lg z-50">
          <div className="p-3 space-y-3">
            {/* Slug */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Slug
              </label>
              <div className="flex gap-1.5">
                <Input
                  value={slugValue}
                  onChange={(e) => setSlugValue(e.target.value)}
                  className="h-8 text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={saving !== null || slugValue.trim() === slug}
                  onClick={saveSlug}
                  className="h-8 text-xs shrink-0"
                >
                  {saving === "slug" ? "..." : "Save"}
                </Button>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Actions */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={togglePublish}
                disabled={saving !== null}
                className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted transition-colors text-left"
              >
                {status === "published" ? (
                  <>
                    <ArrowDownCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Unpublish</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-medium">Publish</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={duplicate}
                disabled={saving !== null}
                className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted transition-colors text-left"
              >
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Duplicate page</span>
              </button>

              <div className="h-px bg-border my-1" />

              <Link
                href={`/admin/pages/${pageId}/delete`}
                className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-red-50 transition-colors text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete page</span>
              </Link>
            </div>

            {error && (
              <div className="text-[11px] text-red-600 bg-red-50 rounded px-2 py-1">
                {error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
