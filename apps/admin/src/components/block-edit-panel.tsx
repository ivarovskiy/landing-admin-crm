"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
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
  allPages,
  externalSelectedElementId,
  externalDraftUpdate,
  onElementSelect,
  onDraftChange,
  onBlockReset,
}: {
  blockId: string;
  title: string;
  type: string;
  variant: string;
  initial: any;
  viewMode: "desktop" | "ipadPro" | "mobile";
  allPages?: Array<{ id: string; slug: string; parentId?: string | null }>;
  externalSelectedElementId?: string | null;
  externalDraftUpdate?: { blockId: string; data: any; version: number } | null;
  onElementSelect?: (elementId: string | null) => void;
  onDraftChange?: (blockId: string, data: any) => void;
  onBlockReset?: (blockId: string) => void;
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

  // Tracks the last externalDraftUpdate version we applied — prevents stale
  // pendingDrafts from re-applying after a Reset.
  const lastAppliedExternalVersion = useRef<number>(0);

  useEffect(() => {
    setDraft(initial ?? {});
    setError(null);
    setSaved(false);
    setMode(hasVisual ? "visual" : Form ? "form" : "json");
    lastAppliedExternalVersion.current = 0;
  }, [blockId, Form, hasVisual, initial]);

  useEffect(() => {
    if (!externalDraftUpdate || externalDraftUpdate.blockId !== blockId) return;
    if (externalDraftUpdate.version <= lastAppliedExternalVersion.current) return;
    lastAppliedExternalVersion.current = externalDraftUpdate.version;
    setDraft(externalDraftUpdate.data ?? {});
  }, [blockId, externalDraftUpdate]);

  const dirty = useMemo(
    () => JSON.stringify(draft ?? {}) !== JSON.stringify(initial ?? {}),
    [draft, initial],
  );

  // Ctrl+S / Cmd+S to save
  const save = useCallback(async () => {
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
      onBlockReset?.(blockId);
    } catch (e: any) {
      setError(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }, [blockId, draft, router, onBlockReset]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (dirty && !saving) save();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [dirty, save, saving]);

  /* ---------- JSON mode ---------- */
  if (mode === "json" || (!Form && !hasVisual)) {
    return (
      <div className="flex h-full min-h-0 flex-col">
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
        <div className="min-h-0 flex-1 overflow-hidden">
          <BlockJsonPanel blockId={blockId} title={title} initial={initial} />
        </div>
      </div>
    );
  }

  /* ---------- Visual / Form mode ---------- */
  return (
    <div className="flex h-full min-h-0 flex-col">
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
      <div className="min-h-0 flex-1 overflow-y-auto">
        {mode === "visual" && hasVisual ? (
          <VisualEditorPanel
            blockId={blockId}
            type={type}
            variant={variant}
            draft={draft}
            onChange={setDraft}
            externalSelectedElementId={externalSelectedElementId}
            onElementSelect={onElementSelect}
          />
        ) : Form ? (
          <div className="p-3">
            <Form blockId={blockId} value={draft} onChange={setDraft} viewMode={viewMode} allPages={allPages} />
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

      <FloatingSaveBar
        dirty={dirty}
        saving={saving}
        saved={saved}
        onReset={() => {
          setDraft(initial ?? {});
          onBlockReset?.(blockId);
        }}
        onSave={save}
      />
    </div>
  );
}

/* ---------- Floating save bar ---------- */

function FloatingSaveBar({
  dirty,
  saving,
  saved,
  onReset,
  onSave,
}: {
  dirty: boolean;
  saving: boolean;
  saved: boolean;
  onReset: () => void;
  onSave: () => void;
}) {
  const visible = dirty || saving || saved;

  // Absolute fixed position (top/left). null = default bottom-center via CSS.
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const dragRef = useRef<{
    startX: number; startY: number;
    startTop: number; startLeft: number;
  } | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  function onDragHandlePointerDown(e: React.PointerEvent) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    isDragging.current = true;

    // Snapshot the bar's current rendered position
    const rect = barRef.current?.getBoundingClientRect();
    const startTop = rect ? rect.top : window.innerHeight - 24 - 44;
    const startLeft = rect ? rect.left : (window.innerWidth - 160) / 2;

    dragRef.current = { startX: e.clientX, startY: e.clientY, startTop, startLeft };
    setPos({ top: startTop, left: startLeft });
  }

  function onDragHandlePointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    setPos({
      top: d.startTop + (e.clientY - d.startY),
      left: d.startLeft + (e.clientX - d.startX),
    });
  }

  function onDragHandlePointerUp() {
    dragRef.current = null;
    isDragging.current = false;
  }

  if (typeof document === "undefined") return null;

  const barStyle: CSSProperties = pos
    ? {
        position: "fixed",
        top: pos.top,
        left: pos.left,
        zIndex: 99998,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 8px",
        borderRadius: 14,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.2)",
        pointerEvents: visible ? "all" : "none",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.2s ease, background 0.35s ease, border-color 0.35s ease",
        background: saved ? "rgba(16, 185, 129, 0.92)" : "rgba(15, 15, 26, 0.88)",
        border: `1px solid ${saved ? "rgba(52, 211, 153, 0.5)" : "rgba(255,255,255,0.1)"}`,
        whiteSpace: "nowrap",
        userSelect: "none",
      }
    : {
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 99998,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 8px",
        borderRadius: 14,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.2)",
        pointerEvents: visible ? "all" : "none",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.2s ease, background 0.35s ease, border-color 0.35s ease",
        background: saved ? "rgba(16, 185, 129, 0.92)" : "rgba(15, 15, 26, 0.88)",
        border: `1px solid ${saved ? "rgba(52, 211, 153, 0.5)" : "rgba(255,255,255,0.1)"}`,
        whiteSpace: "nowrap",
        userSelect: "none",
      };

  return createPortal(
    <div ref={barRef} style={barStyle}>
      {/* Drag handle */}
      <div
        onPointerDown={onDragHandlePointerDown}
        onPointerMove={onDragHandlePointerMove}
        onPointerUp={onDragHandlePointerUp}
        onPointerCancel={onDragHandlePointerUp}
        title="Drag to reposition"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 20,
          height: 30,
          cursor: "grab",
          color: saved ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.3)",
          flexShrink: 0,
          touchAction: "none",
        }}
      >
        {/* 6-dot grip */}
        <svg width="8" height="14" viewBox="0 0 8 14" fill="currentColor">
          <circle cx="2" cy="2" r="1.2"/><circle cx="6" cy="2" r="1.2"/>
          <circle cx="2" cy="7" r="1.2"/><circle cx="6" cy="7" r="1.2"/>
          <circle cx="2" cy="12" r="1.2"/><circle cx="6" cy="12" r="1.2"/>
        </svg>
      </div>

      {/* Reset */}
      <button
        type="button"
        disabled={!dirty || saving}
        onClick={onReset}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          height: 30,
          padding: "0 10px",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "transparent",
          color: saved ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.65)",
          fontSize: 12,
          fontWeight: 500,
          cursor: "pointer",
          opacity: !dirty || saving ? 0.4 : 1,
          transition: "opacity 0.15s",
        }}
      >
        <RotateCcw style={{ width: 12, height: 12 }} />
        Reset
      </button>

      {/* Save / Saved */}
      <button
        type="button"
        disabled={(!dirty && !saved) || saving}
        onClick={onSave}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          height: 30,
          padding: "0 14px",
          borderRadius: 8,
          border: "none",
          background: saved ? "rgba(255,255,255,0.22)" : "rgba(99,102,241,0.9)",
          color: "#fff",
          fontSize: 12,
          fontWeight: 600,
          cursor: saving ? "default" : "pointer",
          transition: "background 0.25s ease",
          boxShadow: saved ? "none" : "0 2px 8px rgba(99,102,241,0.4)",
        }}
      >
        {saved ? (
          <Check style={{ width: 12, height: 12 }} />
        ) : saving ? null : (
          <Save style={{ width: 12, height: 12 }} />
        )}
        {saving ? "Saving…" : saved ? "Saved" : "Save"}
      </button>
    </div>,
    document.body,
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
    <div className="border-b border-border/60 px-3 py-2.5 shrink-0">
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
          <div className="flex h-7 rounded-md border border-border/70 bg-muted/35 p-0.5 shrink-0">
            {visibleTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => onModeChange(tab.key)}
                className={[
                  "flex items-center gap-1 rounded px-2 text-[10px] font-medium transition-all",
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
