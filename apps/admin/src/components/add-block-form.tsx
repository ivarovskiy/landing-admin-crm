"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Textarea } from "@acme/ui"
import { BLOCK_LIBRARY, BLOCK_PRESETS, DEFAULT_BLOCK_KEY, findBlockDef, findBlockPreset } from "@acme/block-library"

type Tab = "presets" | "library" | "custom"

export function AddBlockForm({ pageId }: { pageId: string }) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("presets")

  // Library tab state
  const libraryOptions = useMemo(() => BLOCK_LIBRARY.map((b) => ({ key: b.key, label: b.label })), [])
  const [selectedLib, setSelectedLib] = useState<string>(DEFAULT_BLOCK_KEY)

  // Custom tab state
  const [type, setType] = useState("")
  const [variant, setVariant] = useState("")
  const [json, setJson] = useState("{}")

  // Shared
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const libDef = findBlockDef(selectedLib)

  useEffect(() => {
    if (tab !== "library" || !libDef) return
    setJson(JSON.stringify(libDef.defaultData ?? {}, null, 2))
  }, [selectedLib, tab, libDef])

  async function submit(blockType: string, blockVariant: string, data: Record<string, any>) {
    setError(null)
    setSaving(true)
    try {
      const r = await fetch(`/api/admin/pages/${pageId}/blocks`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: blockType, variant: blockVariant, data }),
      })
      if (!r.ok) throw new Error(await r.text())
      router.refresh()
    } catch (e: any) {
      setError(e?.message ?? "Create failed")
    } finally {
      setSaving(false)
    }
  }

  async function onSubmitPreset(presetKey: string) {
    const preset = findBlockPreset(presetKey)
    if (!preset) return
    const def = findBlockDef(preset.blockKey)
    if (!def) return
    await submit(def.type, def.variant, preset.data)
  }

  async function onSubmitLibrary(e: React.FormEvent) {
    e.preventDefault()
    if (!libDef) return
    try {
      const data = JSON.parse(json)
      await submit(libDef.type, libDef.variant, data)
    } catch {
      setError("Invalid JSON")
    }
  }

  async function onSubmitCustom(e: React.FormEvent) {
    e.preventDefault()
    if (!type.trim() || !variant.trim()) { setError("Type and variant required"); return }
    try {
      const data = JSON.parse(json)
      await submit(type.trim(), variant.trim(), data)
    } catch {
      setError("Invalid JSON")
    }
  }

  return (
    <div className="p-3 space-y-3">
      <div className="text-xs font-semibold text-foreground uppercase tracking-wider">Add block</div>

      {/* Tabs */}
      <div className="flex rounded-md bg-muted/30 border p-0.5 gap-0.5">
        {([
          { key: "presets" as const, label: "Presets" },
          { key: "library" as const, label: "Library" },
          { key: "custom" as const, label: "Custom" },
        ]).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => { setTab(key); setError(null); }}
            className={[
              "flex-1 rounded px-2 py-1 text-[10px] font-medium transition-all",
              tab === key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {/* PRESETS tab */}
      {tab === "presets" && (
        <div className="space-y-1.5">
          {BLOCK_PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              disabled={saving}
              onClick={() => onSubmitPreset(preset.key)}
              className="w-full text-left rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5 hover:bg-muted/50 hover:border-primary/30 transition-colors disabled:opacity-50 group"
            >
              <div className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">{preset.label}</div>
              {preset.description && (
                <div className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{preset.description}</div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* LIBRARY tab */}
      {tab === "library" && (
        <form onSubmit={onSubmitLibrary} className="space-y-3">
          <div className="space-y-1">
            <div className="text-[11px] font-medium text-muted-foreground">Block type</div>
            <select
              value={selectedLib}
              onChange={(e) => setSelectedLib(e.target.value)}
              className="h-8 w-full rounded-md border border-border bg-muted text-foreground px-2 text-xs"
            >
              {libraryOptions.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
            {libDef?.description && (
              <div className="text-[10px] text-muted-foreground">{libDef.description}</div>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-medium text-muted-foreground">Data (JSON)</div>
              <button
                type="button"
                onClick={() => { try { setJson(JSON.stringify(JSON.parse(json), null, 2)) } catch { setError("Invalid JSON") } }}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Format
              </button>
            </div>
            <Textarea value={json} onChange={(e) => setJson(e.target.value)} className="min-h-28 font-mono text-xs" />
          </div>

          <button type="submit" disabled={saving} className="w-full h-8 rounded-md bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors">
            {saving ? "Adding…" : "Add block"}
          </button>
        </form>
      )}

      {/* CUSTOM tab */}
      {tab === "custom" && (
        <form onSubmit={onSubmitCustom} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground">Type</div>
              <input value={type} onChange={(e) => setType(e.target.value)} className="h-7 w-full rounded-md bg-muted/40 border border-border/60 px-2 text-xs text-foreground focus:outline-none focus:border-primary/60" />
            </div>
            <div className="space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground">Variant</div>
              <input value={variant} onChange={(e) => setVariant(e.target.value)} className="h-7 w-full rounded-md bg-muted/40 border border-border/60 px-2 text-xs text-foreground focus:outline-none focus:border-primary/60" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-medium text-muted-foreground">Data (JSON)</div>
              <button type="button" onClick={() => { try { setJson(JSON.stringify(JSON.parse(json), null, 2)) } catch { setError("Invalid JSON") } }} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                Format
              </button>
            </div>
            <Textarea value={json} onChange={(e) => setJson(e.target.value)} className="min-h-28 font-mono text-xs" />
          </div>

          <button type="submit" disabled={saving} className="w-full h-8 rounded-md bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors">
            {saving ? "Adding…" : "Add block"}
          </button>
        </form>
      )}

      {error && <div className="text-[11px] text-destructive bg-destructive/10 rounded px-2 py-1 break-all">{error}</div>}
    </div>
  )
}
