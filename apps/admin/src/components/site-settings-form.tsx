"use client";

import { useState } from "react";
import { Maximize2, ScanLine, Check, Loader2, MonitorSmartphone, ZoomIn, Ruler, LayoutTemplate, EyeOff } from "lucide-react";
import type { SiteSettingsData, SiteZoomSettings } from "@/lib/admin-api";

/* ----------------------------------------------------------------
   Sub-components
---------------------------------------------------------------- */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wider text-[oklch(0.5_0_0)]">
      {children}
    </p>
  );
}

function ToggleRow({
  icon,
  label,
  description,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[oklch(1_0_0/4%)] group"
    >
      <span className={["shrink-0 transition-colors", value ? "text-[oklch(0.58_0.22_25)]" : "text-[oklch(0.45_0_0)] group-hover:text-[oklch(0.6_0_0)]"].join(" ")}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[oklch(0.88_0_0)] leading-none">{label}</p>
        <p className="text-[10px] text-[oklch(0.5_0_0)] mt-0.5 leading-snug">{description}</p>
      </div>
      <div className={["relative w-7 h-4 rounded-full shrink-0 transition-colors duration-200", value ? "bg-[oklch(0.58_0.22_25)]" : "bg-[oklch(1_0_0/12%)]"].join(" ")}>
        <div className={["absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200", value ? "translate-x-3.5" : "translate-x-0.5"].join(" ")} />
      </div>
    </button>
  );
}

function NumberRow({
  icon,
  label,
  description,
  value,
  placeholder,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: number | undefined;
  placeholder: string;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="shrink-0 text-[oklch(0.45_0_0)]">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[oklch(0.88_0_0)] leading-none">{label}</p>
        <p className="text-[10px] text-[oklch(0.5_0_0)] mt-0.5 leading-snug">{description}</p>
      </div>
      <input
        type="number"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          onChange(isNaN(n) ? undefined : n);
        }}
        className="w-20 h-7 rounded-md bg-[oklch(1_0_0/6%)] border border-[oklch(1_0_0/10%)] text-xs text-right text-[oklch(0.88_0_0)] tabular-nums px-2 focus:outline-none focus:ring-1 focus:ring-[oklch(0.58_0.22_25)]"
      />
    </div>
  );
}

function SliderRow({
  icon,
  label,
  description,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="px-4 py-3 space-y-3">
      <div className="flex items-center gap-3">
        <span className="shrink-0 text-[oklch(0.45_0_0)]">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[oklch(0.88_0_0)] leading-none">{label}</p>
          <p className="text-[10px] text-[oklch(0.5_0_0)] mt-0.5">{description}</p>
        </div>
        <span className="text-xs font-semibold tabular-nums text-[oklch(0.88_0_0)] shrink-0 w-10 text-right">
          {format(value)}
        </span>
      </div>

      <div className="relative h-1 rounded-full bg-[oklch(1_0_0/10%)]">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-[oklch(0.58_0.22_25)]"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow border border-[oklch(0_0_0/10%)] pointer-events-none"
          style={{ left: `calc(${pct}% - 6px)` }}
        />
      </div>

      <div className="flex justify-between text-[9px] text-[oklch(0.38_0_0)]">
        <span>{format(min)}</span>
        <span>{format((min + max) / 2)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "idle" | "saving" | "saved" | "error" }) {
  if (status === "idle") return null;
  if (status === "saving") return (
    <span className="inline-flex items-center gap-1 text-[10px] text-[oklch(0.5_0_0)]">
      <Loader2 className="h-2.5 w-2.5 animate-spin" /> Saving…
    </span>
  );
  if (status === "saved") return (
    <span className="inline-flex items-center gap-1 text-[10px] text-[oklch(0.55_0.18_145)]">
      <Check className="h-2.5 w-2.5" /> Saved
    </span>
  );
  return <span className="text-[10px] text-red-400">Save failed</span>;
}

/* ----------------------------------------------------------------
   Main
---------------------------------------------------------------- */

export function SiteSettingsForm({ initialSettings }: { initialSettings: SiteSettingsData }) {
  const [zoom, setZoom] = useState<SiteZoomSettings>({
    enableZoom: initialSettings?.zoom?.enableZoom !== false,
    designWidth: initialSettings?.zoom?.designWidth,
    zoomBreakpoint: initialSettings?.zoom?.zoomBreakpoint,
    scale: initialSettings?.zoom?.scale ?? 1,
    fitViewport: initialSettings?.zoom?.fitViewport === true,
    normalizeViewport: initialSettings?.zoom?.normalizeViewport === true,
    normalizeViewportWidth: initialSettings?.zoom?.normalizeViewportWidth,
    hideScrollbar: initialSettings?.zoom?.hideScrollbar === true,
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save(next: SiteZoomSettings) {
    setStatus("saving");
    try {
      const r = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ zoom: next }),
      });
      if (!r.ok) throw new Error();
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  function update(patch: Partial<SiteZoomSettings>) {
    const next = { ...zoom, ...patch };
    setZoom(next);
    save(next);
  }

  return (
    <div className="space-y-6">

      {/* ---- Zoom section ---- */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <SectionLabel>Zoom & Viewport</SectionLabel>
          <StatusBadge status={status} />
        </div>

        <div className="rounded-xl border border-[oklch(1_0_0/8%)] bg-[oklch(1_0_0/3%)] divide-y divide-[oklch(1_0_0/6%)] overflow-hidden">

          {/* Master switch */}
          <ToggleRow
            icon={<ZoomIn className="h-3.5 w-3.5" />}
            label="Enable CSS zoom"
            description="Scales landing-stack to fit the viewport width (desktop only)"
            value={zoom.enableZoom !== false}
            onChange={(v) => update({ enableZoom: v })}
          />

          {/* Design width */}
          <NumberRow
            icon={<Ruler className="h-3.5 w-3.5" />}
            label="Design width (px)"
            description="Reference canvas width — zoom target (default 1480)"
            value={zoom.designWidth}
            placeholder="1480"
            onChange={(v) => update({ designWidth: v })}
          />

          {/* Zoom breakpoint */}
          <NumberRow
            icon={<LayoutTemplate className="h-3.5 w-3.5" />}
            label="Zoom breakpoint (px)"
            description="Min viewport width at which zoom activates (default 768)"
            value={zoom.zoomBreakpoint}
            placeholder="768"
            onChange={(v) => update({ zoomBreakpoint: v })}
          />

          {/* Scale coefficient */}
          <SliderRow
            icon={<ScanLine className="h-3.5 w-3.5" />}
            label="Zoom coefficient"
            description="Multiplied on top of the auto-calculated zoom value"
            value={Math.round((zoom.scale ?? 1) * 100)}
            min={50}
            max={100}
            step={1}
            format={(v) => `${v}%`}
            onChange={(v) => update({ scale: v / 100 })}
          />

          {/* Fit screen */}
          <ToggleRow
            icon={<Maximize2 className="h-3.5 w-3.5" />}
            label="Fit screen"
            description="Scale page to fit viewport height using header + hero dimensions"
            value={zoom.fitViewport === true}
            onChange={(v) => update({ fitViewport: v })}
          />

          {/* Normalize viewport */}
          <ToggleRow
            icon={<MonitorSmartphone className="h-3.5 w-3.5" />}
            label="Normalize viewport"
            description="Sets <meta viewport> to a fixed width — browser scales natively"
            value={zoom.normalizeViewport === true}
            onChange={(v) => update({ normalizeViewport: v })}
          />

          {/* Hide scrollbar */}
          <ToggleRow
            icon={<EyeOff className="h-3.5 w-3.5" />}
            label="Hide scrollbar"
            description="Hides the vertical scrollbar visually — scrolling still works"
            value={zoom.hideScrollbar === true}
            onChange={(v) => update({ hideScrollbar: v })}
          />

          {/* Viewport width — only relevant when normalizeViewport is on */}
          <NumberRow
            icon={<MonitorSmartphone className="h-3.5 w-3.5 opacity-50" />}
            label="Viewport width (px)"
            description="Width used in meta viewport when normalize is on (default 1320)"
            value={zoom.normalizeViewportWidth}
            placeholder="1320"
            onChange={(v) => update({ normalizeViewportWidth: v })}
          />

        </div>
      </div>

    </div>
  );
}
