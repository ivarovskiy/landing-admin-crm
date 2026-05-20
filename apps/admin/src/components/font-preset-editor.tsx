"use client";

import { useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Plus, Trash2, ChevronDown, Copy } from "lucide-react";
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
};

const FONT_FAMILY_OPTIONS: { value: FontPreset["fontFamily"]; label: string; css: string }[] = [
  { value: "maru", label: "GT Maru", css: "var(--font-maru, Arial, sans-serif)" },
  { value: "maru-oblique", label: "GT Maru Oblique", css: "var(--font-maru-oblique, Arial, sans-serif)" },
];

/* ── shared primitives ──────────────────────────────────────── */

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <span className="text-[10px] text-[oklch(0.42_0_0)] w-14 shrink-0">{label}</span>
      <div className="flex-1 flex items-center gap-2 min-w-0">{children}</div>
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

function ColorRow({ label, value, onChange, enabled, onToggle }: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  enabled?: boolean;
  onToggle?: (v: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 relative">
      <span className="text-[10px] text-[oklch(0.42_0_0)] w-14 shrink-0">{label}</span>
      {onToggle !== undefined && (
        <MiniToggle value={enabled ?? false} onChange={onToggle} />
      )}
      <button
        type="button"
        disabled={enabled === false}
        onClick={() => setOpen((v) => !v)}
        className="w-5 h-5 rounded shrink-0 border border-[oklch(1_0_0/15%)] disabled:opacity-30"
        style={{ background: value }}
      />
      <input
        type="text"
        value={value}
        disabled={enabled === false}
        onChange={(e) => {
          const v = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
          if (/^#[0-9a-fA-F]{0,8}$/.test(v)) onChange(v);
        }}
        className="flex-1 min-w-0 bg-transparent border border-[oklch(1_0_0/10%)] rounded px-2 py-0.5 text-[10px] font-mono text-[oklch(0.7_0_0)] outline-none focus:border-[oklch(0.58_0.22_25/50%)] disabled:opacity-30"
        spellCheck={false}
      />
      {open && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
          <div className="absolute z-[101] left-16 top-8 rounded-xl overflow-hidden shadow-2xl border border-[oklch(1_0_0/12%)]">
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

function SliderRow({ label, value, min, max, step, unit, disabled, onChange }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  disabled?: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div className={["flex items-center gap-2 px-3 py-1.5", disabled ? "opacity-30 pointer-events-none" : ""].join(" ")}>
      <span className="text-[10px] text-[oklch(0.42_0_0)] w-14 shrink-0">{label}</span>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-[3px] accent-[oklch(0.58_0.22_25)] cursor-pointer"
      />
      <span className="text-[10px] font-mono text-[oklch(0.5_0_0)] w-10 text-right shrink-0">{value}{unit}</span>
    </div>
  );
}

function Divider() {
  return <div className="mx-3 h-px bg-[oklch(1_0_0/6%)]" />;
}

/* ── live preview ───────────────────────────────────────────── */

function PresetPreview({ preset, text }: { preset: FontPreset; text: string }) {
  const fontCss = FONT_FAMILY_OPTIONS.find((f) => f.value === preset.fontFamily)?.css ?? "Arial, sans-serif";
  const style: React.CSSProperties = {
    fontFamily: fontCss,
    fontSize: Math.min(preset.fontSize, 96),
    fontWeight: preset.fontWeight,
    letterSpacing: preset.letterSpacing,
    color: preset.fill,
    WebkitTextStroke: preset.strokeEnabled ? `${preset.strokeWidthPx}px ${preset.stroke}` : "0",
    textShadow: preset.shadowEnabled ? `${preset.shadowX}px ${preset.shadowY}px 0 ${preset.shadowColor}` : "none",
    lineHeight: 1.15,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "clip",
  };
  return (
    <div className="mx-3 mt-2 mb-1 rounded-lg bg-[oklch(0.1_0_0)] border border-[oklch(1_0_0/6%)] flex items-center justify-center overflow-hidden" style={{ height: 72 }}>
      <span style={style}>{text || "Preview"}</span>
    </div>
  );
}

/* ── preset editor form ─────────────────────────────────────── */

function PresetForm({ preset, onChange }: { preset: FontPreset; onChange: (p: FontPreset) => void }) {
  function patch(u: Partial<FontPreset>) { onChange({ ...preset, ...u }); }

  return (
    <div className="border-t border-[oklch(1_0_0/6%)] py-1">
      <PresetPreview preset={preset} text={preset.name} />

      {/* Name */}
      <Row label="Name">
        <input
          type="text"
          value={preset.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="My heading"
          className="flex-1 bg-transparent border border-[oklch(1_0_0/10%)] rounded px-2 py-0.5 text-[11px] text-[oklch(0.85_0_0)] outline-none focus:border-[oklch(0.58_0.22_25/50%)]"
        />
      </Row>

      {/* Font */}
      <Row label="Font">
        <select
          value={preset.fontFamily}
          onChange={(e) => patch({ fontFamily: e.target.value as FontPreset["fontFamily"] })}
          className="flex-1 bg-[oklch(0.18_0_0)] border border-[oklch(1_0_0/10%)] rounded px-2 py-0.5 text-[11px] text-[oklch(0.75_0_0)] outline-none"
        >
          {FONT_FAMILY_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </Row>

      {/* Size */}
      <Row label="Size">
        <input
          type="number"
          min={1}
          value={preset.fontSize}
          onChange={(e) => { const v = parseInt(e.target.value, 10); if (v > 0) patch({ fontSize: v }); }}
          className="w-16 bg-transparent border border-[oklch(1_0_0/10%)] rounded px-2 py-0.5 text-[11px] font-mono text-[oklch(0.75_0_0)] outline-none focus:border-[oklch(0.58_0.22_25/50%)]"
        />
        <span className="text-[10px] text-[oklch(0.42_0_0)]">px</span>
        {/* Weight chips */}
        <div className="flex gap-1 ml-auto">
          {[400, 500, 700, 900].map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => patch({ fontWeight: w })}
              className={[
                "px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors",
                preset.fontWeight === w
                  ? "bg-[oklch(0.58_0.22_25)] text-white"
                  : "bg-[oklch(1_0_0/6%)] text-[oklch(0.45_0_0)] hover:text-[oklch(0.7_0_0)]",
              ].join(" ")}
            >
              {w}
            </button>
          ))}
        </div>
      </Row>

      {/* Letter spacing */}
      <Row label="Spacing">
        <input
          type="text"
          value={preset.letterSpacing}
          onChange={(e) => patch({ letterSpacing: e.target.value })}
          placeholder="0.02em"
          className="w-20 bg-transparent border border-[oklch(1_0_0/10%)] rounded px-2 py-0.5 text-[11px] font-mono text-[oklch(0.75_0_0)] outline-none focus:border-[oklch(0.58_0.22_25/50%)]"
        />
      </Row>

      <Divider />

      {/* Fill */}
      <ColorRow label="Fill" value={preset.fill} onChange={(v) => patch({ fill: v })} />

      <Divider />

      {/* Stroke */}
      <ColorRow
        label="Stroke"
        value={preset.stroke}
        onChange={(v) => patch({ stroke: v })}
        enabled={preset.strokeEnabled}
        onToggle={(v) => patch({ strokeEnabled: v })}
      />
      <SliderRow label="Width" value={preset.strokeWidthPx} min={0} max={8} step={0.1} unit="px" disabled={!preset.strokeEnabled} onChange={(v) => patch({ strokeWidthPx: v })} />

      <Divider />

      {/* Shadow */}
      <ColorRow
        label="Shadow"
        value={preset.shadowColor}
        onChange={(v) => patch({ shadowColor: v })}
        enabled={preset.shadowEnabled}
        onToggle={(v) => patch({ shadowEnabled: v })}
      />
      <SliderRow label="Offset X" value={preset.shadowX} min={0} max={20} step={0.5} unit="px" disabled={!preset.shadowEnabled} onChange={(v) => patch({ shadowX: v })} />
      <SliderRow label="Offset Y" value={preset.shadowY} min={0} max={20} step={0.5} unit="px" disabled={!preset.shadowEnabled} onChange={(v) => patch({ shadowY: v })} />
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

  function update(p: FontPreset) {
    onChange(presets.map((x) => (x.id === p.id ? p : x)));
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
            {/* Header */}
            <div className="flex items-center gap-1.5 px-2.5 py-2">
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : preset.id)}
                className="flex-1 flex items-center gap-2 min-w-0 text-left"
              >
                <span className="w-3.5 h-3.5 rounded-sm shrink-0 border border-[oklch(1_0_0/10%)]" style={{ background: preset.fill }} />
                <span className="text-[11px] text-[oklch(0.82_0_0)] font-medium truncate">{preset.name || "Untitled"}</span>
                <span className="text-[10px] text-[oklch(0.4_0_0)] shrink-0">{preset.fontSize}px</span>
                <ChevronDown className={["w-3 h-3 text-[oklch(0.4_0_0)] ml-auto shrink-0 transition-transform", isOpen ? "" : "-rotate-90"].join(" ")} />
              </button>
              <button type="button" title="Duplicate" onClick={() => duplicate(preset)} className="text-[oklch(0.38_0_0)] hover:text-[oklch(0.65_0_0)] transition-colors p-0.5">
                <Copy className="w-3 h-3" />
              </button>
              <button type="button" title="Delete" onClick={() => remove(preset.id)} className="text-[oklch(0.38_0_0)] hover:text-[oklch(0.65_0.22_25)] transition-colors p-0.5">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            {isOpen && <PresetForm preset={preset} onChange={update} />}
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
