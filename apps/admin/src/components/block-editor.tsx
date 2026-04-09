"use client"

import { useState } from "react"
import { Button, Textarea } from "@acme/ui";
import { useRouter } from "next/navigation"

export function BlockEditor({ blockId, initial }: { blockId: string; initial: any }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(() => JSON.stringify(initial ?? {}, null, 2))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [saved, setSaved] = useState(false)

  async function save() {
    setError(null)
    setSaving(true)
    try {
      const data = JSON.parse(value)
      const r = await fetch(`/api/admin/blocks/${blockId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data }),
      })
      if (!r.ok) {
        const t = await r.text()
        throw new Error(t || `HTTP ${r.status}`)
      }
      setSaved(true)
      setOpen(false)
      router.refresh()
    } catch (e: any) {
      setError(e?.message ?? "Save failed")
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        Edit JSON
      </Button>
    )
  }

  return (
    <div className="space-y-2">
      <Textarea value={value} onChange={(e) => setValue(e.target.value)} className="min-h-40 font-mono" />
      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setOpen(false)} disabled={saving}>
          Cancel
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            try {
              const obj = JSON.parse(value)
              setValue(JSON.stringify(obj, null, 2))
            } catch {
              setError("Invalid JSON")
            }
          }}
          disabled={saving}
        >
          Format
        </Button>
      </div>
      {saved ? <div className="text-sm text-green-600">Saved</div> : null}
    </div>
  )
}