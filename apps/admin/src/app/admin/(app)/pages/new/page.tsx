"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PAGE_TEMPLATES } from "@acme/block-library";
import { ArrowLeft, Check } from "lucide-react";

const GROUP_ORDER = ["IBC Ballet", "Simply Dance Studio", "Generic"];
const GROUP_COLORS: Record<string, string> = {
  "IBC Ballet": "oklch(0.58 0.22 25)",
  "Simply Dance Studio": "oklch(0.6 0.18 270)",
  Generic: "oklch(0.5 0 0)",
};

export default function NewPage() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [locale, setLocale] = useState("uk");
  const [templateKey, setTemplateKey] = useState("blank");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = slug.trim();
    if (!trimmed) {
      setError("Slug is required");
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const r = await fetch("/api/admin/pages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: trimmed, locale }),
      });
      if (!r.ok) throw new Error(`Create failed (HTTP ${r.status})`);
      const { page } = (await r.json()) as { page: { id: string } };

      const template = PAGE_TEMPLATES.find((t) => t.key === templateKey);
      if (template) {
        for (const block of template.blocks) {
          const br = await fetch(`/api/admin/pages/${page.id}/blocks`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(block),
          });
          if (!br.ok) throw new Error(`Block create failed (HTTP ${br.status})`);
        }
      }

      router.push(`/admin/pages/${page.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
      setSaving(false);
    }
  }

  const selectedTemplate = PAGE_TEMPLATES.find((t) => t.key === templateKey);
  const allGroups = [...new Set(PAGE_TEMPLATES.map((t) => t.group ?? "Generic"))];
  const ordered = [
    ...GROUP_ORDER.filter((g) => allGroups.includes(g)),
    ...allGroups.filter((g) => !GROUP_ORDER.includes(g)),
  ];
  const groups = ordered
    .map((name) => ({ name, tpls: PAGE_TEMPLATES.filter((t) => (t.group ?? "Generic") === name) }))
    .filter((g) => g.tpls.length > 0);

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          href="/admin"
          className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All pages
        </Link>

        <div>
          <h1 className="text-xl font-semibold text-foreground">New page</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choose a template and set a slug to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Template</p>

            {groups.map(({ name, tpls }) => {
              const color = GROUP_COLORS[name] ?? "oklch(0.5 0 0)";
              return (
                <div key={name} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
                    <p className="text-xs font-semibold text-muted-foreground">{name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {tpls.map((t) => {
                      const active = templateKey === t.key;
                      return (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => setTemplateKey(t.key)}
                          className={[
                            "relative text-left rounded-xl border px-4 py-3.5 transition-all",
                            active
                              ? "border-primary bg-primary/10"
                              : "border-border bg-card hover:border-primary/35 hover:bg-muted/55",
                          ].join(" ")}
                        >
                          {active && (
                            <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                              <Check className="h-3 w-3 text-primary-foreground" />
                            </span>
                          )}
                          <p className={["text-sm font-semibold", active ? "text-primary" : "text-foreground"].join(" ")}>
                            {t.label}
                          </p>
                          {t.description && (
                            <p className="mt-1 text-xs leading-snug text-muted-foreground">{t.description}</p>
                          )}
                          {t.blocks.length > 0 && (
                            <p className="mt-2 text-xs text-muted-foreground/75">
                              {t.blocks.length} block{t.blocks.length !== 1 ? "s" : ""}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Page details</p>
            <div className="divide-y divide-border rounded-xl border border-border bg-card">
              <div className="flex items-center gap-3 px-4 py-3">
                <label className="w-16 shrink-0 text-sm text-muted-foreground">Slug</label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="about-us"
                  required
                  className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
                />
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <label className="w-16 shrink-0 text-sm text-muted-foreground">Locale</label>
                <select
                  value={locale}
                  onChange={(e) => setLocale(e.target.value)}
                  className="flex-1 cursor-pointer appearance-none bg-transparent text-sm text-foreground outline-none"
                >
                  <option value="uk">uk - Ukrainian</option>
                  <option value="en">en - English</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Slug: lowercase letters, numbers and hyphens (e.g. <span className="text-foreground/70">about-us</span>)
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="h-11 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {saving
                ? selectedTemplate && selectedTemplate.blocks.length > 0
                  ? `Creating ${selectedTemplate.blocks.length} blocks...`
                  : "Creating..."
                : "Create page"}
            </button>
            <Link
              href="/admin"
              className="inline-flex h-11 items-center rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
