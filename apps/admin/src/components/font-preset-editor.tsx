"use client";

import { useState, useRef } from "react";
import { HexColorPicker } from "react-colorful";
import { Plus, Trash2, ChevronDown, ChevronRight, Copy } from "lucide-react";
import type { FontPreset } from "@/lib/admin-api";

/* ── defaults ───────────────────────────────────────────────── */

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

const FONT_FAMILY_OPTIONS: { value: FontPreset["fontFamily"]; label: string; cssValue: string }[] = [
  { value: "maru", label: "GT Maru", cssValue: "var(--font-maru, system-ui)" },
  { value: "maru-oblique", label: "GT Maru Oblique", cssValue: "var(--font-maru-oblique, system-ui)" },
];

const FONT_WEIGHT_OPTIONS = [400, 500, 700, 900];

/* ── color swatch button that opens a popover picker ───────── */

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="flex items-center gap-2" ref={ref}>
      <span className="text-[10px] text-[oklch(0.5_0_0)] w-16 shrink-0">{label}</span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-7 h-7 rounded-md border border-[oklch(1_0_0/15%)] shadow-sm"
          style={{ background: value }}
          title={value}
        />
        {open && (
          <>
            <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
            <div className="absolute z-[101] top-9 left-0 rounded-xl overflow-hidden shadow-2xl border border-[oklch(1_0_0/12%)]">
              <HexColorPicker color={value} onChange={onChange} />
              <div className="bg-[oklch(0.18_0_0)] px-3 py-2 flex items-center gap-2">
                <span className="text-[10px] text-[oklch(0.5_0_0)] font-mono uppercase">{value}</span>
              </div>
            </div>
          </>
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          const v = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
          if (/^#[0-9a-fA-F]{0,8}$/.test(v)) onChange(v);
        }}
        className="flex-1 bg-transparent border border-[oklch(1_0_0/10%)] rounded-md px-2 py-1 text-[11px] font-mono text-[oklch(0.8_0_0)] outline-none focus:border-[oklch(0.6_0.15_25)]"
        spellCheck={false}
      />
    </div>
  );
}

/* ── slider row ─────────────────────────────────────────────── */

function SliderField({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-[oklch(0.5_0_0)] w-16 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1 accent-[oklch(0.58_0.22_25)]"
      />
      <span className="text-[11px] text-[oklch(0.7_0_0)] font-mono w-12 text-right">{value}{unit}</span>
    </div>
  );
}

/* ── live preview ───────────────────────────────────────────── */

function PresetPreview({ preset, text }: { preset: FontPreset; text: string }) {
  const fontFamily = FONT_FAMILY_OPTIONS.find((f) => f.value === preset.fontFamily)?.cssValue ?? "system-ui";

  const style: React.CSSProperties = {
    fontFamily,
    fontSize: `${preset.fontSize}px`,
    fontWeight: preset.fontWeight,
    letterSpacing: preset.letterSpacing,
    color: preset.fill,
    WebkitTextStroke: preset.strokeEnabled ? `${preset.strokeWidthPx}px ${preset.stroke}` : "0",
    textShadow: preset.shadowEnabled
      ? `${preset.shadowX}px ${preset.shadowY}px 0 ${preset.shadowColor}`
      : "none",
    lineHeight: 1.1,
    display: "block",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "clip",
    transformOrigin: "left center",
  };

  return (
    <div className="w-full overflow-hidden rounded-lg bg-[oklch(0.12_0_0)] border border-[oklch(1_0_0/8%)] flex items-center justify-center min-h-[80px] px-4 py-3">
      <span style={style}>{text || "Preview"}</span>
    </div>
  );
}

/* ── single preset editor (expanded form) ───────────────────── */

function PresetForm({
  preset,
  onChange,
}: {
  preset: FontPreset;
  onChange: (p: FontPreset) => void;
}) {
  function patch(update: Partial<FontPreset>) {
    onChange({ ...preset, ...update });
  }

  return (
    <div className="space-y-3 pt-3">
      {/* Preview */}
      <PresetPreview preset={preset} text={preset.name || "Preview"} />

      {/* Name */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[oklch(0.5_0_0)] w-16 shrink-0">Name</span>
        <input
          type="text"
          value={preset.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="My heading"
          className="flex-1 bg-transparent border border-[oklch(1_0_0/10%)] rounded-md px-2 py-1 text-[12px] text-[oklch(0.88_0_0)] outline-none focus:border-[oklch(0.6_0.15_25)]"
        />
      </div>

      {/* Font family */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[oklch(0.5_0_0)] w-16 shrink-0">Font</span>
        <select
          value={preset.fontFamily}
          onChange={(e) => patch({ fontFamily: e.target.value as FontPreset["fontFamily"] })}
          className="flex-1 bg-[oklch(0.18_0_0)] border border-[oklch(1_0_0/10%)] rounded-md px-2 py-1 text-[11px] text-[oklch(0.8_0_0)] outline-none"
        >
          {FONT_FAMILY_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* Font weight */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[oklch(0.5_0_0)] w-16 shrink-0">Weight</span>
        <div className="flex gap-1">
          {FONT_WEIGHT_OPTIONS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => patch({ fontWeight: w })}
              className={[
                "px-2 py-0.5 rounded text-[10px] font-semibold transition-colors",
                preset.fontWeight === w
                  ? "bg-[oklch(0.58_0.22_25)] text-white"
                  : "bg-[oklch(1_0_0/6%)] text-[oklch(0.55_0_0)] hover:text-[oklch(0.8_0_0)]",
              ].join(" ")}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Size */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[oklch(0.5_0_0)] w-16 shrink-0">Size</span>
        <input
          type="number"
          min={1}
          value={preset.fontSize}
          onChange={(e) => { const v = parseInt(e.target.value, 10); if (v > 0) patch({ fontSize: v }); }}
          className="w-20 bg-transparent border border-[oklch(1_0_0/10%)] rounded-md px-2 py-1 text-[11px] font-mono text-[oklch(0.8_0_0)] outline-none focus:border-[oklch(0.6_0.15_25)]"
        />
        <span className="text-[10px] text-[oklch(0.5_0_0)]">px</span>
      </div>

      {/* Letter spacing */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[oklch(0.5_0_0)] w-16 shrink-0">Spacing</span>
        <input
          type="text"
          value={preset.letterSpacing}
          onChange={(e) => patch({ letterSpacing: e.target.value })}
          placeholder="0.02em"
          className="flex-1 bg-transparent border border-[oklch(1_0_0/10%)] rounded-md px-2 py-1 text-[11px] font-mono text-[oklch(0.8_0_0)] outline-none focus:border-[oklch(0.6_0.15_25)]"
        />
      </div>

      <div className="h-px bg-[oklch(1_0_0/6%)]" />

      {/* Fill color */}
      <ColorPicker label="Fill" value={preset.fill} onChange={(v) => patch({ fill: v })} />

      <div className="h-px bg-[oklch(1_0_0/6%)]" />

      {/* Stroke */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[oklch(0.5_0_0)] w-16 shrink-0">Stroke</span>
        <button
          type="button"
          onClick={() => patch({ strokeEnabled: !preset.strokeEnabled })}
          className={[
            "relative w-7 h-4 rounded-full shrink-0 transition-colors duration-200",
            preset.strokeEnabled ? "bg-[oklch(0.58_0.22_25)]" : "bg-[oklch(1_0_0/12%)]",
          ].join(" ")}
        >
          <span className={["absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200", preset.strokeEnabled ? "translate-x-3.5" : "translate-x-0.5"].join(" ")} />
        </button>
      </div>
      {preset.strokeEnabled && (
        <>
          <ColorPicker label="Color" value={preset.stroke} onChange={(v) => patch({ stroke: v })} />
          <SliderField label="Width" value={preset.strokeWidthPx} min={0} max={8} step={0.1} unit="px" onChange={(v) => patch({ strokeWidthPx: v })} />
        </>
      )}

      <div className="h-px bg-[oklch(1_0_0/6%)]" />

      {/* Shadow */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[oklch(0.5_0_0)] w-16 shrink-0">Shadow</span>
        <button
          type="button"
          onClick={() => patch({ shadowEnabled: !preset.shadowEnabled })}
          className={[
            "relative w-7 h-4 rounded-full shrink-0 transition-colors duration-200",
            preset.shadowEnabled ? "bg-[oklch(0.58_0.22_25)]" : "bg-[oklch(1_0_0/12%)]",
          ].join(" ")}
        >
          <span className={["absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200", preset.shadowEnabled ? "translate-x-3.5" : "translate-x-0.5"].join(" ")} />
        </button>
      </div>
      {preset.shadowEnabled && (
        <>
          <ColorPicker label="Color" value={preset.shadowColor} onChange={(v) => patch({ shadowColor: v })} />
          <SliderField label="Offset X" value={preset.shadowX} min={0} max={20} step={0.5} unit="px" onChange={(v) => patch({ shadowX: v })} />
          <SliderField label="Offset Y" value={preset.shadowY} min={0} max={20} step={0.5} unit="px" onChange={(v) => patch({ shadowY: v })} />
        </>
      )}
    </div>
  );
}

/* ── main FontPresetEditor ──────────────────────────────────── */

export function FontPresetEditor({
  presets,
  onChange,
}: {
  presets: FontPreset[];
  onChange: (presets: FontPreset[]) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  function addPreset() {
    const id = `fp-${Date.now()}`;
    const newPreset: FontPreset = { ...DEFAULT_PRESET, id, name: "New Preset" };
    const next = [...presets, newPreset];
    onChange(next);
    setOpenId(id);
  }

  function updatePreset(updated: FontPreset) {
    onChange(presets.map((p) => (p.id === updated.id ? updated : p)));
  }

  function deletePreset(id: string) {
    onChange(presets.filter((p) => p.id !== id));
    if (openId === id) setOpenId(null);
  }

  function duplicatePreset(preset: FontPreset) {
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
        <p className="text-[11px] text-[oklch(0.45_0_0)] text-center py-6">
          No presets yet — create your first one below.
        </p>
      )}

      {presets.map((preset) => {
        const isOpen = openId === preset.id;
        return (
          <div
            key={preset.id}
            className="rounded-lg border border-[oklch(1_0_0/8%)] bg-[oklch(0.16_0_0)] overflow-hidden"
          >
            {/* Header row */}
            <div className="flex items-center gap-2 px-3 py-2">
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : preset.id)}
                className="flex-1 flex items-center gap-2 min-w-0 text-left"
              >
                {/* Color swatch */}
                <span
                  className="w-4 h-4 rounded-sm shrink-0 border border-[oklch(1_0_0/10%)]"
                  style={{ background: preset.fill }}
                />
                <span className="text-[12px] text-[oklch(0.85_0_0)] truncate">{preset.name || "Untitled"}</span>
                <span className="text-[10px] text-[oklch(0.45_0_0)] shrink-0">{preset.fontSize}px</span>
                {isOpen ? (
                  <ChevronDown className="w-3 h-3 text-[oklch(0.5_0_0)] ml-auto shrink-0" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-[oklch(0.5_0_0)] ml-auto shrink-0" />
                )}
              </button>
              <button
                type="button"
                title="Duplicate"
                onClick={() => duplicatePreset(preset)}
                className="text-[oklch(0.45_0_0)] hover:text-[oklch(0.7_0_0)] transition-colors p-0.5"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="Delete"
                onClick={() => deletePreset(preset.id)}
                className="text-[oklch(0.45_0_0)] hover:text-[oklch(0.65_0.2_25)] transition-colors p-0.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Expanded form */}
            {isOpen && (
              <div className="px-3 pb-3 border-t border-[oklch(1_0_0/6%)]">
                <PresetForm preset={preset} onChange={updatePreset} />
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={addPreset}
        className="w-full flex items-center justify-center gap-1.5 py-2 mt-2 rounded-lg border border-dashed border-[oklch(1_0_0/12%)] text-[11px] text-[oklch(0.5_0_0)] hover:text-[oklch(0.7_0_0)] hover:border-[oklch(1_0_0/20%)] transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        New Preset
      </button>
    </div>
  );
}
