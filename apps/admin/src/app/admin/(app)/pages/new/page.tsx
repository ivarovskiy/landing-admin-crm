"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PAGE_TEMPLATES } from "@acme/block-library"
import { ArrowLeft, Check } from "lucide-react"

export default function NewPage() {
  const router = useRouter()
  const [slug, setSlug] = useState("")
  const [locale, setLocale] = useState("uk")
  const [templateKey, setTemplateKey] = useState("blank")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = slug.trim()
    if (!trimmed) { setError("Slug is required"); return }

    setError(null)
    setSaving(true)

    try {
      /* 1. Create page */
      const r = await fetch("/api/admin/pages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: trimmed, locale }),
      })
      if (!r.ok) throw new Error(`Create failed (HTTP ${r.status})`)
      const { page } = (await r.json()) as { page: { id: string } }

      /* 2. Create template blocks sequentially */
      const template = PAGE_TEMPLATES.find((t) => t.key === templateKey)
      if (template) {
        for (const block of template.blocks) {
          const br = await fetch(`/api/admin/pages/${page.id}/blocks`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(block),
          })
          if (!br.ok) throw new Error(`Block create failed (HTTP ${br.status})`)
        }
      }

      router.push(`/admin/pages/${page.id}`)
    } catch (err: any) {
      setError(err?.message ?? "Failed")
      setSaving(false)
    }
  }

  const selectedTemplate = PAGE_TEMPLATES.find((t) => t.key === templateKey)

  return (
    <div className="min-h-screen bg-[oklch(0.13_0_0)] text-[oklch(0.93_0_0)] p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Breadcrumb */}
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs text-[oklch(0.6_0_0)] hover:text-[oklch(0.93_0_0)] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All pages
        </Link>

        <div>
          <h1 className="text-base font-semibold text-[oklch(0.93_0_0)]">New page</h1>
          <p className="text-xs text-[oklch(0.55_0_0)] mt-0.5">Choose a template and set a slug to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Template selection */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[oklch(0.5_0_0)]">Template</p>
            <div className="grid grid-cols-2 gap-2">
              {PAGE_TEMPLATES.map((t) => {
                const active = templateKey === t.key
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTemplateKey(t.key)}
                    className={[
                      "relative text-left rounded-xl border px-4 py-3.5 transition-all",
                      active
                        ? "border-[oklch(0.58_0.22_25)] bg-[oklch(0.58_0.22_25/10%)]"
                        : "border-[oklch(1_0_0/8%)] bg-[oklch(1_0_0/3%)] hover:bg-[oklch(1_0_0/6%)] hover:border-[oklch(1_0_0/16%)]",
                    ].join(" ")}
                  >
                    {active && (
                      <span className="absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-[oklch(0.58_0.22_25)]">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </span>
                    )}
                    <p className={["text-xs font-semibold", active ? "text-[oklch(0.58_0.22_25)]" : "text-[oklch(0.88_0_0)]"].join(" ")}>
                      {t.label}
                    </p>
                    {t.description && (
                      <p className="text-[10px] text-[oklch(0.5_0_0)] mt-0.5 leading-snug">{t.description}</p>
                    )}
                    {t.blocks.length > 0 && (
                      <p className="text-[10px] text-[oklch(0.45_0_0)] mt-1.5">
                        {t.blocks.length} block{t.blocks.length !== 1 ? "s" : ""}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Page details */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[oklch(0.5_0_0)]">Page details</p>
            <div className="rounded-xl border border-[oklch(1_0_0/8%)] bg-[oklch(1_0_0/3%)] divide-y divide-[oklch(1_0_0/6%)]">

              {/* Slug */}
              <div className="flex items-center gap-3 px-4 py-3">
                <label className="w-16 text-xs text-[oklch(0.55_0_0)] shrink-0">Slug</label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="about-us"
                  required
                  className="flex-1 bg-transparent text-xs text-[oklch(0.93_0_0)] placeholder-[oklch(0.4_0_0)] outline-none"
                />
              </div>

              {/* Locale */}
              <div className="flex items-center gap-3 px-4 py-3">
                <label className="w-16 text-xs text-[oklch(0.55_0_0)] shrink-0">Locale</label>
                <select
                  value={locale}
                  onChange={(e) => setLocale(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-[oklch(0.93_0_0)] outline-none appearance-none cursor-pointer"
                >
                  <option value="uk" style={{ background: "#1a1a1a" }}>uk — Ukrainian</option>
                  <option value="en" style={{ background: "#1a1a1a" }}>en — English</option>
                </select>
              </div>

            </div>
            <p className="text-[10px] text-[oklch(0.4_0_0)]">Slug: lowercase letters, numbers and hyphens (e.g. <span className="text-[oklch(0.55_0_0)]">about-us</span>)</p>
          </div>

          {/* Error */}
          {error && (
            <div className="text-[11px] text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="h-9 px-5 rounded-lg bg-[oklch(0.58_0.22_25)] text-white text-xs font-semibold disabled:opacity-50 hover:bg-[oklch(0.54_0.22_25)] transition-colors"
            >
              {saving
                ? selectedTemplate && selectedTemplate.blocks.length > 0
                  ? `Creating ${selectedTemplate.blocks.length} blocks…`
                  : "Creating…"
                : "Create page"
              }
            </button>
            <Link
              href="/admin"
              className="h-9 px-4 rounded-lg border border-[oklch(1_0_0/10%)] text-xs text-[oklch(0.6_0_0)] hover:text-[oklch(0.93_0_0)] hover:border-[oklch(1_0_0/20%)] transition-colors inline-flex items-center"
            >
              Cancel
            </Link>
          </div>

        </form>
      </div>
    </div>
  )
}
