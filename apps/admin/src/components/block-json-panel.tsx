"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Textarea } from "@acme/ui";

function tryParseJson(value: string): { ok: true; data: any } | { ok: false; error: string } {
  try {
    return { ok: true, data: JSON.parse(value) };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Invalid JSON" };
  }
}

export function BlockJsonPanel({
  blockId,
  title,
  initial,
}: {
  blockId: string;
  title: string;
  initial: any;
}) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const initialPretty = useMemo(() => JSON.stringify(initial ?? {}, null, 2), [initial]);

  const [value, setValue] = useState(initialPretty);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue(initialPretty);
    setSavedAt(null);
    setError(null);
  }, [blockId, initialPretty]);

  const dirty = value !== initialPretty;

  const parsed = useMemo(() => tryParseJson(value), [value]);
  const isValid = parsed.ok;

  function format() {
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setValue(JSON.stringify(parsed.data, null, 2));
    setError(null);
  }

  function reset() {
    setValue(initialPretty);
    setError(null);
  }

  async function save() {
    setError(null);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    setSaving(true);
    try {
      const r = await fetch(`/api/admin/blocks/${blockId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data: parsed.data }),
      });

      if (!r.ok) throw new Error(await r.text());
      setSavedAt(Date.now());
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setSavedAt(Date.now());
      setError(null);
    } catch {
      setError("Clipboard blocked");
    }
  }

  // Hotkeys
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const mod = isMac ? e.metaKey : e.ctrlKey;

      if (!mod) return;

      // Cmd/Ctrl+S => save
      if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!saving) save();
      }

      // Cmd/Ctrl+Shift+F => format
      if (e.key.toLowerCase() === "f" && e.shiftKey) {
        e.preventDefault();
        format();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saving, parsed.ok, value]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-xl border p-4 pb-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">Editing</div>
          <div className="font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Hotkeys: <span className="font-mono">Ctrl/Cmd+S</span> save ·{" "}
            <span className="font-mono">Ctrl/Cmd+Shift+F</span> format
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isValid ? <span className="text-xs text-red-600">Invalid JSON</span> : null}
          {dirty ? <span className="text-xs text-amber-600">Unsaved</span> : null}
          {savedAt ? <span className="text-xs text-green-600">Saved</span> : null}
        </div>
      </div>

      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError(null);
        }}
        className="min-h-[60vh] font-mono text-xs"
        spellCheck={false}
      />

      {error ? <div className="text-sm text-red-600 break-all">{error}</div> : null}
      {!error && !isValid ? (
        <div className="text-sm text-red-600 break-all">{parsed.ok ? "" : parsed.error}</div>
      ) : null}

      </div>

      <div className="z-10 mt-2 flex shrink-0 flex-wrap gap-2 border-t border-border/60 bg-card/95 px-3 py-2.5">
        <Button type="button" variant="secondary" onClick={format} disabled={saving}>
          Format
        </Button>
        <Button type="button" variant="secondary" onClick={reset} disabled={saving || !dirty}>
          Reset
        </Button>
        <Button type="button" variant="secondary" onClick={copy} disabled={saving}>
          Copy
        </Button>
        <Button type="button" onClick={save} disabled={saving || !dirty || !isValid}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
