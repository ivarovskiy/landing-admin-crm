"use client";

import { useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Plus, Trash2, ChevronDown, Copy, Save } from "lucide-react";
import type { FontPreset } from "@/lib/admin-api";

/* ── constants ──────────────────────────────────────────────── */

const DEFAULT_PRESET: Omit<FontPreset, "id" | "name"> = {
  fontFamily: "maru",
  fontSize: 78,
  fontWeight: 500,
  fill: "#fce5ee",
  strokeEnabled: true,
  stroke: "#dd1c47",
  strokeWidthPx: 1,
  shadowEnabled: true,
  shadowColor: "#dd1c47",
  shadowX: 4,
  shadowY: 4,
  letterSpacing: "0.02em",
  textTransform: "none",
};

const FONT_FAMILY_OPTIONS: { value: FontPreset["fontFamily"]; label: string; css: string }[] = [
  { value: "maru", label: "GT Maru", css: "var(--font-maru, Arial, sans-serif)" },
  { value: "maru-oblique", label: "GT Maru Oblique", css: "var(--font-maru-oblique, Arial, sans-serif)" },
];

/* ── color picker popover ───────────────────────────────────── */

function ColorSwatch({ value, onChange, disabled }: {
  value: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="w-5 h-5 rounded border border-[oklch(1_0_0/15%)] disabled:opacity-30 shrink-0"
        style={{ background: value }}
      />
      {open && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
          <div className="absolute z-[101] left-0 top-7 rounded-xl overflow-hidden shadow-2xl border border-[oklch(1_0_0/12%)]">
            <HexColorPicker color={value} onChange={onChange} />
            <div className="bg-[oklch(0.14_0_0)] px-3 py-1.5">
              <span className="text-[10px] font-mono text-[oklch(0.5_0_0)]">{value.toUpperCase()}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MiniToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={[
        "relative shrink-0 w-7 h-4 rounded-full transition-colors duration-150",
        value ? "bg-[oklch(0.58_0.22_25)]" : "bg-[oklch(1_0_0/12%)]",
      ].join(" ")}
    >
      <span className={[
        "absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-150",
        value ? "translate-x-3.5" : "translate-x-0.5",
      ].join(" ")} />
    </button>
  );
}

function FieldInput({ value, onChange, placeholder, mono, className }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={[
        "bg-transparent border border-[oklch(1_0_0/10%)] rounded px-2 py-0.5 text-[11px] text-[oklch(0.78_0_0)] outline-none focus:border-[oklch(0.58_0.22_25/50%)] w-full",
        mono ? "font-mono" : "",
        className ?? "",
      ].join(" ")}
      spellCheck={false}
    />
  );
}

/* ── live preview ───────────────────────────────────────────── */

function PresetPreview({ preset, text }: { preset: FontPreset; text: string }) {
  const fontCss = FONT_FAMILY_OPTIONS.find((f) => f.value === preset.fontFamily)?.css ?? "Arial, sans-serif";
  const style: React.CSSProperties = {
    fontFamily: fontCss,
    fontSize: preset.fontSize,
    fontWeight: preset.fontWeight,
    letterSpacing: preset.letterSpacing,
    textTransform: (preset.textTransform === "none" ? undefined : preset.textTransform) as React.CSSProperties["textTransform"],
    color: preset.fill,
    WebkitTextStroke: preset.strokeEnabled ? `${preset.strokeWidthPx}px ${preset.stroke}` : "0",
    textShadow: preset.shadowEnabled
      ? `${preset.shadowX}px ${preset.shadowY}px 0 ${preset.shadowColor}`
      : "none",
    lineHeight: 1.2,
    display: "block",
  };
  return (
    <div className="mx-3 mt-2 rounded-lg bg-card border border-[oklch(1_0_0/6%)] flex items-center justify-center overflow-auto px-4 py-5">
      <span style={style}>{text || "Preview"}</span>
    </div>
  );
}

/* ── preset editor form ─────────────────────────────────────── */

function PresetForm({ preset, onSave }: {
  preset: FontPreset;
  onSave: (p: FontPreset) => void;
}) {
  const [draft, setDraft] = useState<FontPreset>(preset);
  const [previewText, setPreviewText] = useState("Preview");
  const isDirty = JSON.stringify(draft) !== JSON.stringify(preset);

  function patch(u: Partial<FontPreset>) { setDraft((d) => ({ ...d, ...u })); }

  return (
    <div className="border-t border-[oklch(1_0_0/6%)]">
      {/* Preview */}
      <PresetPreview preset={draft} text={previewText} />

      {/* Preview text input */}
      <div className="mx-3 mt-1.5 mb-2">
        <input
          type="text"
          value={previewText}
          onChange={(e) => setPreviewText(e.target.value)}
          placeholder="Type preview text…"
          className="w-full bg-[oklch(1_0_0/4%)] border border-[oklch(1_0_0/8%)] rounded px-2.5 py-1 text-[11px] text-[oklch(0.6_0_0)] placeholder:text-[oklch(0.35_0_0)] outline-none focus:border-[oklch(0.58_0.22_25/40%)] text-center"
        />
      </div>

      <div className="px-3 space-y-2 py-2">

        {/* Name */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[oklch(0.42_0_0)] w-14 shrink-0">Name</span>
          <FieldInput value={draft.name} onChange={(v) => patch({ name: v })} placeholder="My heading" />
        </div>

        {/* Font + Weight grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-[oklch(0.42_0_0)]">Font</span>
            <select
              value={draft.fontFamily}
              onChange={(e) => patch({ fontFamily: e.target.value as FontPreset["fontFamily"] })}
              className="bg-[oklch(0.18_0_0)] border border-[oklch(1_0_0/10%)] rounded px-2 py-0.5 text-[10px] text-[oklch(0.72_0_0)] outline-none w-full"
            >
              {FONT_FAMILY_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-[oklch(0.42_0_0)]">Weight</span>
            <div className="flex gap-1">
              {[400, 500, 700, 900].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => patch({ fontWeight: w })}
                  className={[
                    "flex-1 py-0.5 rounded text-[9px] font-bold transition-colors",
                    draft.fontWeight === w
                      ? "bg-[oklch(0.58_0.22_25)] text-white"
                      : "bg-[oklch(1_0_0/6%)] text-[oklch(0.42_0_0)] hover:text-[oklch(0.7_0_0)]",
                  ].join(" ")}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Size + Spacing grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-[oklch(0.42_0_0)]">Size</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={1}
                value={draft.fontSize}
                onChange={(e) => { const v = parseInt(e.target.value, 10); if (v > 0) patch({ fontSize: v }); }}
                className="w-full bg-transparent border border-[oklch(1_0_0/10%)] rounded px-2 py-0.5 text-[11px] font-mono text-[oklch(0.75_0_0)] outline-none focus:border-[oklch(0.58_0.22_25/50%)]"
              />
              <span className="text-[10px] text-[oklch(0.38_0_0)] shrink-0">px</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-[oklch(0.42_0_0)]">Spacing</span>
            <FieldInput value={draft.letterSpacing} onChange={(v) => patch({ letterSpacing: v })} placeholder="0.02em" mono />
          </div>
        </div>

        {/* Transform */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[oklch(0.42_0_0)] w-14 shrink-0">Transform</span>
          <div className="flex gap-1 flex-1">
            {(["none", "uppercase", "lowercase"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => patch({ textTransform: t })}
                className={[
                  "flex-1 py-0.5 rounded text-[9px] transition-colors capitalize",
                  (draft.textTransform ?? "none") === t
                    ? "bg-[oklch(0.58_0.22_25)] text-white font-semibold"
                    : "bg-[oklch(1_0_0/6%)] text-[oklch(0.42_0_0)] hover:text-[oklch(0.7_0_0)]",
                ].join(" ")}
              >
                {t === "none" ? "Def" : t === "uppercase" ? "AA" : "aa"}
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-[oklch(1_0_0/6%)]" />

        {/* Fill */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[oklch(0.42_0_0)] w-14 shrink-0">Fill</span>
          <ColorSwatch value={draft.fill} onChange={(v) => patch({ fill: v })} />
          <FieldInput value={draft.fill} onChange={(v) => { if (/^#[0-9a-fA-F]{0,8}$/.test(v)) patch({ fill: v }); }} mono />
        </div>

        <div className="h-px bg-[oklch(1_0_0/6%)]" />

        {/* Stroke row */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[oklch(0.42_0_0)] w-14 shrink-0">Stroke</span>
          <MiniToggle value={draft.strokeEnabled} onChange={(v) => patch({ strokeEnabled: v })} />
          <ColorSwatch value={draft.stroke} onChange={(v) => patch({ stroke: v })} disabled={!draft.strokeEnabled} />
          <FieldInput value={draft.stroke} onChange={(v) => { if (/^#[0-9a-fA-F]{0,8}$/.test(v)) patch({ stroke: v }); }} mono className={!draft.strokeEnabled ? "opacity-30 pointer-events-none" : ""} />
        </div>

        {/* Stroke width */}
        <div className={["flex items-center gap-2", !draft.strokeEnabled ? "opacity-30 pointer-events-none" : ""].join(" ")}>
          <span className="text-[10px] text-[oklch(0.42_0_0)] w-14 shrink-0">Width</span>
          <input type="range" min={0} max={8} step={0.1} value={draft.strokeWidthPx}
            onChange={(e) => patch({ strokeWidthPx: Number(e.target.value) })}
            className="flex-1 h-[3px] accent-[oklch(0.58_0.22_25)]" />
          <span className="text-[10px] font-mono text-[oklch(0.45_0_0)] w-9 text-right shrink-0">{draft.strokeWidthPx}px</span>
        </div>

        <div className="h-px bg-[oklch(1_0_0/6%)]" />

        {/* Shadow row */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[oklch(0.42_0_0)] w-14 shrink-0">Shadow</span>
          <MiniToggle value={draft.shadowEnabled} onChange={(v) => patch({ shadowEnabled: v })} />
          <ColorSwatch value={draft.shadowColor} onChange={(v) => patch({ shadowColor: v })} disabled={!draft.shadowEnabled} />
          <FieldInput value={draft.shadowColor} onChange={(v) => { if (/^#[0-9a-fA-F]{0,8}$/.test(v)) patch({ shadowColor: v }); }} mono className={!draft.shadowEnabled ? "opacity-30 pointer-events-none" : ""} />
        </div>

        {/* Shadow X/Y grid */}
        <div className={["grid grid-cols-2 gap-2", !draft.shadowEnabled ? "opacity-30 pointer-events-none" : ""].join(" ")}>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[oklch(0.42_0_0)] shrink-0">X</span>
            <input type="range" min={0} max={20} step={0.5} value={draft.shadowX}
              onChange={(e) => patch({ shadowX: Number(e.target.value) })}
              className="flex-1 h-[3px] accent-[oklch(0.58_0.22_25)]" />
            <span className="text-[10px] font-mono text-[oklch(0.45_0_0)] w-7 text-right shrink-0">{draft.shadowX}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[oklch(0.42_0_0)] shrink-0">Y</span>
            <input type="range" min={0} max={20} step={0.5} value={draft.shadowY}
              onChange={(e) => patch({ shadowY: Number(e.target.value) })}
              className="flex-1 h-[3px] accent-[oklch(0.58_0.22_25)]" />
            <span className="text-[10px] font-mono text-[oklch(0.45_0_0)] w-7 text-right shrink-0">{draft.shadowY}</span>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="px-3 pb-3">
        <button
          type="button"
          disabled={!isDirty}
          onClick={() => onSave(draft)}
          className={[
            "w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all",
            isDirty
              ? "bg-[oklch(0.58_0.22_25)] text-white hover:bg-[oklch(0.52_0.22_25)]"
              : "bg-[oklch(1_0_0/6%)] text-[oklch(0.38_0_0)] cursor-default",
          ].join(" ")}
        >
          <Save className="w-3 h-3" />
          {isDirty ? "Save preset" : "Saved"}
        </button>
      </div>
    </div>
  );
}

/* ── main component ─────────────────────────────────────────── */

export function FontPresetEditor({ presets, onChange }: {
  presets: FontPreset[];
  onChange: (presets: FontPreset[]) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  function addPreset() {
    const id = `fp-${Date.now()}`;
    const p: FontPreset = { ...DEFAULT_PRESET, id, name: "New Preset" };
    onChange([...presets, p]);
    setOpenId(id);
  }

  function save(updated: FontPreset) {
    onChange(presets.map((p) => (p.id === updated.id ? updated : p)));
  }

  function remove(id: string) {
    onChange(presets.filter((p) => p.id !== id));
    if (openId === id) setOpenId(null);
  }

  function duplicate(preset: FontPreset) {
    const id = `fp-${Date.now()}`;
    const clone: FontPreset = { ...preset, id, name: `${preset.name} copy` };
    const idx = presets.findIndex((p) => p.id === preset.id);
    const next = [...presets];
    next.splice(idx + 1, 0, clone);
    onChange(next);
    setOpenId(id);
  }

  return (
    <div className="space-y-1 px-2 pb-4">
      {presets.length === 0 && (
        <p className="text-[11px] text-[oklch(0.38_0_0)] text-center py-5">
          No presets — add one below.
        </p>
      )}

      {presets.map((preset) => {
        const isOpen = openId === preset.id;
        return (
          <div key={preset.id} className="rounded-lg border border-[oklch(1_0_0/8%)] bg-[oklch(1_0_0/3%)] overflow-hidden">
            <div className="flex items-center gap-1.5 px-2.5 py-2">
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : preset.id)}
                className="flex-1 flex items-center gap-2 min-w-0 text-left"
              >
                <span className="w-3.5 h-3.5 rounded-sm shrink-0 border border-[oklch(1_0_0/10%)]" style={{ background: preset.fill }} />
                <span className="text-[11px] text-[oklch(0.82_0_0)] font-medium truncate">{preset.name || "Untitled"}</span>
                <span className="text-[10px] text-[oklch(0.4_0_0)] shrink-0">{preset.fontSize}px</span>
                <ChevronDown className={["w-3 h-3 text-[oklch(0.4_0_0)] ml-auto shrink-0 transition-transform duration-150", isOpen ? "" : "-rotate-90"].join(" ")} />
              </button>
              <button type="button" title="Duplicate" onClick={() => duplicate(preset)} className="text-[oklch(0.38_0_0)] hover:text-[oklch(0.65_0_0)] transition-colors p-0.5">
                <Copy className="w-3 h-3" />
              </button>
              <button type="button" title="Delete" onClick={() => remove(preset.id)} className="text-[oklch(0.38_0_0)] hover:text-[oklch(0.65_0.22_25)] transition-colors p-0.5">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            {isOpen && <PresetForm key={preset.id} preset={preset} onSave={save} />}
          </div>
        );
      })}

      <button
        type="button"
        onClick={addPreset}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-[oklch(1_0_0/10%)] text-[10px] text-[oklch(0.4_0_0)] hover:text-[oklch(0.65_0_0)] hover:border-[oklch(1_0_0/18%)] transition-colors mt-1"
      >
        <Plus className="w-3 h-3" />
        New Preset
      </button>
    </div>
  );
}
