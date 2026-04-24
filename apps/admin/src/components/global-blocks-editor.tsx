"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, Layout, LayoutPanelTop, AlertCircle, Globe2 } from "lucide-react"
import type { GlobalBlock } from "@/lib/admin-api"
import { getBlockForm } from "@/components/block-forms"

type SaveStatus = "idle" | "saving" | "saved" | "error"
type PageLite = { id: string; slug: string; parentId: string | null }

function SaveBadge({ status }: { status: SaveStatus }) {
  if (status === "idle") return null
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-[oklch(0.5_0_0)]">
        <Loader2 className="h-2.5 w-2.5 animate-spin" /> Saving…
      </span>
    )
  }
  if (status === "saved") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-[oklch(0.55_0.18_145)]">
        <Check className="h-2.5 w-2.5" /> Saved
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-red-400">
      <AlertCircle className="h-2.5 w-2.5" /> Save failed
    </span>
  )
}

function scopeParam(scope: string | null) {
  return scope ? `?scope=${encodeURIComponent(scope)}` : ""
}

function BlockSection({
  icon,
  title,
  blockKey,
  scope,
}: {
  icon: React.ReactNode
  title: string
  blockKey: "header" | "footer"
  scope: string | null
}) {
  const [block, setBlock] = useState<GlobalBlock | null>(null)
  const [data, setData] = useState<any>({})
  const [status, setStatus] = useState<SaveStatus>("idle")
  const [loadError, setLoadError] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false
    setStatus("idle")
    setLoadError(null)

    fetch(`/api/admin/global-blocks/${blockKey}${scopeParam(scope)}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<GlobalBlock>
      })
      .then((b) => {
        if (cancelled) return
        setBlock(b)
        setData(b.data ?? {})
      })
      .catch((e) => {
        if (cancelled) return
        setLoadError(e?.message ?? "Failed to load")
      })

    return () => {
      cancelled = true
    }
  }, [blockKey, scope])

  const type = block?.type ?? blockKey
  const variant = block?.variant ?? "v1"
  const Form = getBlockForm(type, variant)

  async function save(next: any) {
    setStatus("saving")
    try {
      const r = await fetch(`/api/admin/global-blocks/${blockKey}${scopeParam(scope)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data: next }),
      })
      if (!r.ok) throw new Error()
      setStatus("saved")
      setTimeout(() => setStatus("idle"), 1500)
    } catch {
      setStatus("error")
      setTimeout(() => setStatus("idle"), 2500)
    }
  }

  function onChange(next: any) {
    setData(next)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => save(next), 500)
  }

  return (
    <section className="rounded-xl border border-[oklch(1_0_0/8%)] bg-[oklch(1_0_0/3%)] overflow-hidden">
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-[oklch(1_0_0/6%)]">
        <div className="flex items-center gap-2">
          <span className="text-[oklch(0.58_0.22_25)]">{icon}</span>
          <div>
            <p className="text-xs font-semibold text-[oklch(0.88_0_0)] leading-none">{title}</p>
            <p className="text-[10px] text-[oklch(0.5_0_0)] mt-0.5">
              {type}:{variant}
            </p>
          </div>
        </div>
        <SaveBadge status={status} />
      </header>

      <div className="p-4">
        {loadError ? (
          <p className="text-xs text-red-400">Failed to load: {loadError}</p>
        ) : !block ? (
          <p className="text-xs text-[oklch(0.5_0_0)]">Loading…</p>
        ) : Form ? (
          <Form value={data} onChange={onChange} viewMode="desktop" />
        ) : (
          <p className="text-xs text-[oklch(0.55_0_0)]">
            No form registered for <code>{type}:{variant}</code>.
          </p>
        )}
      </div>
    </section>
  )
}

function ScopePicker({
  scope,
  allPages,
}: {
  scope: string | null
  allPages: PageLite[]
}) {
  const router = useRouter()

  // Only top-level pages (parentId === null) are suggested as scopes.
  const topLevel = allPages.filter((p) => !p.parentId)

  function onChange(v: string) {
    const next = v === "site" ? "" : v
    const url = next ? `/admin/globals?scope=${encodeURIComponent(next)}` : `/admin/globals`
    router.push(url)
  }

  return (
    <div className="rounded-xl border border-[oklch(1_0_0/8%)] bg-[oklch(1_0_0/3%)] p-4 space-y-1.5">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-[oklch(0.5_0_0)]">
        Scope
      </label>
      <select
        value={scope ?? "site"}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-8 rounded-md bg-[oklch(1_0_0/6%)] border border-[oklch(1_0_0/10%)] px-2 text-xs text-[oklch(0.88_0_0)] focus:outline-none focus:border-[oklch(0.58_0.22_25)]"
      >
        <option value="site">🌐 Site default (fallback)</option>
        {topLevel.map((p) => (
          <option key={p.id} value={p.id}>
            /{p.slug}
          </option>
        ))}
      </select>
      <p className="text-[10px] text-[oklch(0.5_0_0)] leading-tight pt-1">
        Pick a top-level page to edit its own header/footer. Any page in its subtree
        inherits these unless it has its own scope defined.
      </p>
    </div>
  )
}

export function GlobalBlocksEditor({
  scope,
  allPages,
}: {
  scope: string | null
  allPages: PageLite[]
}) {
  return (
    <div className="space-y-4">
      <ScopePicker scope={scope} allPages={allPages} />

      <BlockSection
        icon={<LayoutPanelTop className="h-4 w-4" />}
        title="Header"
        blockKey="header"
        scope={scope}
      />
      <BlockSection
        icon={<Layout className="h-4 w-4" />}
        title="Footer"
        blockKey="footer"
        scope={scope}
      />

      {scope === null && (
        <div className="flex items-center gap-2 text-[10px] text-[oklch(0.5_0_0)] px-1">
          <Globe2 className="h-3 w-3" />
          <span>Editing site-wide defaults — used when no parent scope is set.</span>
        </div>
      )}
    </div>
  )
}
