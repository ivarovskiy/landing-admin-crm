"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Badge } from "@acme/ui";
import { BlockJsonPanel } from "@/components/block-json-panel";
import { getBlockForm } from "@/components/block-forms";
import { hasVisualEditor } from "@/components/visual-editor/adapters/registry";
import { VisualEditorPanel } from "@/components/visual-editor/visual-editor-panel";
import {
  Save,
  RotateCcw,
  Code,
  SlidersHorizontal,
  Layers,
  AlertCircle,
  Check,
} from "lucide-react";

export function BlockEditPanel({
  blockId,
  title,
  type,
  variant,
  initial,
  viewMode,
  externalSelectedElementId,
  onElementSelect,
  onDraftChange,
}: {
  blockId: string;
  title: string;
  type: string;
  variant: string;
  initial: any;
  viewMode: "desktop" | "mobile";
  externalSelectedElementId?: string | null;
  onElementSelect?: (elementId: string | null) => void;
  onDraftChange?: (blockId: string, data: any) => void;
}) {
  const router = useRouter();
  const Form = useMemo(() => getBlockForm(type, variant), [type, variant]);
  const hasVisual = useMemo(() => hasVisualEditor(type, variant), [type, variant]);

  const [mode, setMode] = useState<"visual" | "form" | "json">(() =>
    hasVisual ? "visual" : Form ? "form" : "json",
  );
  const [draft, setDraft] = useState<any>(initial ?? {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Notify parent of draft changes for live preview (debounced)
  const onDraftChangeRef = useRef(onDraftChange);
  onDraftChangeRef.current = onDraftChange;
  useEffect(() => {
    const timer = setTimeout(() => {
      onDraftChangeRef.current?.(blockId, draft);
    }, 200);
    return () => clearTimeout(timer);
  }, [blockId, draft]);

  useEffect(() => {
    setDraft(initial ?? {});
    setError(null);
    setSaved(false);
    setMode(hasVisual ? "visual" : Form ? "form" : "json");
  }, [blockId, Form, hasVisual, initial]);

  const dirty = JSON.stringify(draft ?? {}) !== JSON.stringify(initial ?? {});

  // Ctrl+S / Cmd+S to save
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (dirty && !saving) save();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  async function save() {
    setError(null);
    setSaving(true);
    try {
      const r = await fetch(`/api/admin/blocks/${blockId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data: draft }),
      });
      if (!r.ok) throw new Error(await r.text());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  /* ---------- JSON mode ---------- */
  if (mode === "json" || (!Form && !hasVisual)) {
    return (
      <div className="flex flex-col h-full">
        <InspectorHeader
          title={title}
          type={type}
          variant={variant}
          mode={mode}
          hasForm={!!Form}
          hasVisual={hasVisual}
          onModeChange={setMode}
          dirty={dirty}
        />
        <div className="flex-1 overflow-y-auto">
          <BlockJsonPanel blockId={blockId} title={title} initial={initial} />
        </div>
      </div>
    );
  }

  /* ---------- Visual / Form mode ---------- */
  return (
    <div className="flex flex-col h-full">
      <InspectorHeader
        title={title}
        type={type}
        variant={variant}
        mode={mode}
        hasForm={!!Form}
        hasVisual={hasVisual}
        onModeChange={setMode}
        dirty={dirty}
      />

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {mode === "visual" && hasVisual ? (
          <VisualEditorPanel
            type={type}
            variant={variant}
            draft={draft}
            onChange={setDraft}
            externalSelectedElementId={externalSelectedElementId}
            onElementSelect={onElementSelect}
          />
        ) : Form ? (
          <div className="p-4">
            <Form value={draft} onChange={setDraft} viewMode={viewMode} />
          </div>
        ) : null}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-3 mb-2 flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2">
          <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
          <span className="text-xs text-red-700 break-all">{error}</span>
        </div>
      )}

      {/* Save bar */}
      <div className="border-t bg-card px-3 py-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!dirty || saving}
            onClick={() => setDraft(initial ?? {})}
            className="text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>

          <div className="flex-1" />

          {saved && (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <Check className="h-3 w-3" />
              Saved
            </span>
          )}

          <Button
            type="button"
            size="sm"
            disabled={!dirty || saving}
            onClick={save}
            className="text-xs"
          >
            <Save className="h-3 w-3 mr-1" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Inspector header ---------- */

function InspectorHeader({
  title,
  type,
  variant,
  mode,
  hasForm,
  hasVisual,
  onModeChange,
  dirty,
}: {
  title: string;
  type: string;
  variant: string;
  mode: "visual" | "form" | "json";
  hasForm: boolean;
  hasVisual: boolean;
  onModeChange: (m: "visual" | "form" | "json") => void;
  dirty: boolean;
}) {
  const tabs: { key: "visual" | "form" | "json"; label: string; icon: React.ReactNode; show: boolean }[] = [
    { key: "visual", label: "Visual", icon: <Layers className="h-3 w-3" />, show: hasVisual },
    { key: "form", label: "Inspector", icon: <SlidersHorizontal className="h-3 w-3" />, show: hasForm },
    { key: "json", label: "JSON", icon: <Code className="h-3 w-3" />, show: true },
  ];

  const visibleTabs = tabs.filter((t) => t.show);

  return (
    <div className="border-b px-4 py-3 shrink-0">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate">{title}</span>
            {dirty && (
              <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" title="Unsaved changes" />
            )}
          </div>
        </div>

        {visibleTabs.length > 1 && (
          <div className="flex rounded-md border bg-muted/30 p-0.5 shrink-0">
            {visibleTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => onModeChange(tab.key)}
                className={[
                  "flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium transition-all",
                  mode === tab.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
