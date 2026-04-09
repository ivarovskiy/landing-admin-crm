"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button, Input, Textarea } from "@acme/ui"
import { BLOCK_LIBRARY, DEFAULT_BLOCK_KEY, findBlockDef } from "@acme/block-library"

export function AddBlockForm({ pageId }: { pageId: string }) {
  const router = useRouter()

  const options = useMemo(
    () => [{ key: "custom", label: "Custom (manual)" }, ...BLOCK_LIBRARY.map((b) => ({ key: b.key, label: b.label }))],
    [],
  )

  const [selected, setSelected] = useState<string>(DEFAULT_BLOCK_KEY)
  const [type, setType] = useState("")
  const [variant, setVariant] = useState("")
  const [json, setJson] = useState("{}")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const def = selected === "custom" ? undefined : findBlockDef(selected)

  useEffect(() => {
    if (selected === "custom") return
    if (!def) return
    setType(def.type)
    setVariant(def.variant)
    setJson(JSON.stringify(def.defaultData ?? {}, null, 2))
  }, [selected, def])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      const data = JSON.parse(json)

      const t = selected === "custom" ? type.trim() : def?.type
      const v = selected === "custom" ? variant.trim() : def?.variant

      if (!t || !v) throw new Error("Type/variant required")

      const r = await fetch(`/api/admin/pages/${pageId}/blocks`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: t, variant: v, data }),
      })

      if (!r.ok) throw new Error(await r.text())
      setJson("{}")
      router.refresh()
    } catch (e: any) {
      setError(e?.message ?? "Create failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 p-3">
      <div className="text-xs font-semibold text-foreground uppercase tracking-wider">Add block</div>

      <div className="space-y-1">
        <div className="text-[11px] font-medium text-muted-foreground">Template</div>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="h-8 w-full rounded-md border border-border bg-muted text-foreground px-2 text-xs"
        >
          {options.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
        {def?.description ? <div className="text-[10px] text-muted-foreground mt-1">{def.description}</div> : null}
      </div>

      {selected === "custom" ? (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <div className="text-[11px] font-medium text-muted-foreground">Type</div>
            <Input value={type} onChange={(e) => setType(e.target.value)} className="h-8 text-xs" />
          </div>
          <div className="space-y-1">
            <div className="text-[11px] font-medium text-muted-foreground">Variant</div>
            <Input value={variant} onChange={(e) => setVariant(e.target.value)} className="h-8 text-xs" />
          </div>
        </div>
      ) : (
        <div className="text-[10px] text-muted-foreground">
          <span className="text-foreground/60">{def?.type}</span>
          <span className="mx-1 text-border">:</span>
          <span className="text-foreground/60">{def?.variant}</span>
        </div>
      )}

      <div className="space-y-1">
        <div className="text-[11px] font-medium text-muted-foreground">Data (JSON)</div>
        <Textarea value={json} onChange={(e) => setJson(e.target.value)} className="min-h-28 font-mono text-xs" />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            try {
              const obj = JSON.parse(json)
              setJson(JSON.stringify(obj, null, 2))
            } catch {
              setError("Invalid JSON")
            }
          }}
          disabled={saving}
          className="text-xs"
        >
          Format
        </Button>

        <Button type="submit" size="sm" disabled={saving} className="text-xs flex-1">
          {saving ? "Creating..." : "Create block"}
        </Button>
      </div>

      {error ? <div className="text-[11px] text-red-500 break-all">{error}</div> : null}
    </form>
  )
}