"use client";

import { useState } from "react";
import { Maximize2, ScanLine, Check, Loader2, MonitorSmartphone, ZoomIn, Ruler, LayoutTemplate, EyeOff, ArrowUp, MoveHorizontal, MoveVertical, Eye, Anchor, Link2, Zap, Underline, Layers, Type } from "lucide-react";
import type {
  SiteSettingsData,
  SiteZoomSettings,
  SiteScrollToTopSettings,
  SiteTypographySettings,
  SiteHeaderSettings,
  SiteTextMetrics,
  SiteTypographyViewportProfileKey,
  NavUnderlineMode,
} from "@/lib/admin-api";

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

function TextRow({
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
  value: string | undefined;
  placeholder: string;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="shrink-0 text-[oklch(0.45_0_0)]">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[oklch(0.88_0_0)] leading-none">{label}</p>
        <p className="text-[10px] text-[oklch(0.5_0_0)] mt-0.5 leading-snug">{description}</p>
      </div>
      <input
        type="text"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="w-24 h-7 rounded-md bg-[oklch(1_0_0/6%)] border border-[oklch(1_0_0/10%)] text-xs text-right text-[oklch(0.88_0_0)] tabular-nums px-2 focus:outline-none focus:ring-1 focus:ring-[oklch(0.58_0.22_25)]"
      />
    </div>
  );
}

function SelectRow<T extends string>({
  icon,
  label,
  description,
  value,
  options,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="shrink-0 text-[oklch(0.45_0_0)]">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[oklch(0.88_0_0)] leading-none">{label}</p>
        <p className="text-[10px] text-[oklch(0.5_0_0)] mt-0.5 leading-snug">{description}</p>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-7 rounded-md bg-[oklch(1_0_0/6%)] border border-[oklch(1_0_0/10%)] text-xs text-[oklch(0.88_0_0)] px-2 focus:outline-none focus:ring-1 focus:ring-[oklch(0.58_0.22_25)]"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[oklch(0.18_0_0)]">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
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

type SettingsTab = "layout" | "typography" | "header";
type TypographyMetricScope = "all" | SiteTypographyViewportProfileKey;

const SETTINGS_TABS: { value: SettingsTab; label: string }[] = [
  { value: "layout", label: "Layout" },
  { value: "typography", label: "Typography" },
  { value: "header", label: "Header" },
];

const TYPOGRAPHY_METRIC_SCOPE_OPTIONS: { value: TypographyMetricScope; label: string }[] = [
  { value: "all", label: "All / Default" },
  { value: "mobile", label: "Mobile <= 767" },
  { value: "tablet", label: "Tablet 768-1199" },
  { value: "ipadPro", label: "iPad Pro 1200-1439" },
  { value: "desktop", label: "Desktop >= 1440" },
];

const TEXT_METRIC_GROUPS: {
  key: keyof Pick<
    SiteTypographySettings,
    | "contentHeader"
    | "homepageHeader"
    | "subtitle"
    | "bodyText"
    | "sectionHeader"
    | "textHeader"
    | "promoHeader"
    | "teachersHeader"
    | "body"
    | "bodyItalic"
    | "heroTitle"
    | "nav"
    | "meta"
  >;
  label: string;
  description: string;
  defaults: { fontSize: string; lineHeight: string; letterSpacing: string };
}[] = [
  {
    key: "nav",
    label: "Nav / Header Meta",
    description: "Desktop nav links and top phone / portal text.",
    defaults: { fontSize: "16px", lineHeight: "24px", letterSpacing: "0" },
  },
  {
    key: "contentHeader",
    label: "Hero / Content Header",
    description: "78px stamp titles, including hero slider titles.",
    defaults: { fontSize: "78px", lineHeight: "86px", letterSpacing: "0.02em" },
  },
  {
    key: "homepageHeader",
    label: "Homepage / Section Title",
    description: "104px stamp titles, e.g. Our School.",
    defaults: { fontSize: "104px", lineHeight: "126px", letterSpacing: "0.02em" },
  },
  {
    key: "subtitle",
    label: "Subtitle Stamp",
    description: "47px oblique stamp subtitles.",
    defaults: { fontSize: "47px", lineHeight: "60px", letterSpacing: "0.01em" },
  },
  {
    key: "bodyText",
    label: "Body Text",
    description: "20px body copy style.",
    defaults: { fontSize: "20px", lineHeight: "29.4px", letterSpacing: "0.007em" },
  },
  {
    key: "sectionHeader",
    label: "Section Header",
    description: "22px uppercase spaced headers.",
    defaults: { fontSize: "22px", lineHeight: "1.51", letterSpacing: "0.327em" },
  },
  {
    key: "textHeader",
    label: "Text Header",
    description: "22px uppercase spaced text-header variant.",
    defaults: { fontSize: "22px", lineHeight: "1.51", letterSpacing: "0.321em" },
  },
  {
    key: "teachersHeader",
    label: "Teachers Header",
    description: "22px uppercase teachers-list style.",
    defaults: { fontSize: "22px", lineHeight: "33.2px", letterSpacing: "0.327em" },
  },
  {
    key: "promoHeader",
    label: "Promo Header",
    description: "26px uppercase promo style.",
    defaults: { fontSize: "26px", lineHeight: "38px", letterSpacing: "0.327em" },
  },
  {
    key: "body",
    label: "Body",
    description: "Responsive regular body style.",
    defaults: { fontSize: "20px", lineHeight: "1.47", letterSpacing: "0.007em" },
  },
  {
    key: "bodyItalic",
    label: "Body Italic",
    description: "Responsive italic body style.",
    defaults: { fontSize: "27px", lineHeight: "1.30", letterSpacing: "0" },
  },
  {
    key: "heroTitle",
    label: "Legacy Hero Title",
    description: "typo-hero-title class if used by older blocks.",
    defaults: { fontSize: "78px", lineHeight: "0.92", letterSpacing: "0.02em" },
  },
  {
    key: "meta",
    label: "Meta",
    description: "Generic typo-meta class.",
    defaults: { fontSize: "16px", lineHeight: "1.05", letterSpacing: "0" },
  },
];

function TabsRow({
  value,
  onChange,
}: {
  value: SettingsTab;
  onChange: (v: SettingsTab) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-xl border border-[oklch(1_0_0/8%)] bg-[oklch(1_0_0/3%)] p-1">
      {SETTINGS_TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={[
            "h-8 rounded-lg text-xs font-semibold transition-colors",
            value === tab.value
              ? "bg-[oklch(0.58_0.22_25)] text-white"
              : "text-[oklch(0.58_0_0)] hover:bg-[oklch(1_0_0/6%)] hover:text-[oklch(0.88_0_0)]",
          ].join(" ")}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function MetricInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string | undefined;
  placeholder: string;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <label className="space-y-1">
      <span className="block text-[9px] font-medium uppercase tracking-wide text-[oklch(0.48_0_0)]">
        {label}
      </span>
      <input
        type="text"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="w-full h-7 rounded-md bg-[oklch(1_0_0/6%)] border border-[oklch(1_0_0/10%)] text-xs text-[oklch(0.88_0_0)] px-2 focus:outline-none focus:ring-1 focus:ring-[oklch(0.58_0.22_25)]"
      />
    </label>
  );
}

function TextMetricCard({
  label,
  description,
  value,
  defaults,
  onChange,
}: {
  label: string;
  description: string;
  value: SiteTextMetrics | undefined;
  defaults: { fontSize: string; lineHeight: string; letterSpacing: string };
  onChange: (next: SiteTextMetrics | undefined) => void;
}) {
  const patch = (key: keyof SiteTextMetrics, v: string | undefined) => {
    const next = { ...(value ?? {}), [key]: v };
    if (!next.fontSize && !next.lineHeight && !next.letterSpacing) {
      onChange(undefined);
    } else {
      onChange(next);
    }
  };

  return (
    <div className="px-4 py-3 space-y-3">
      <div className="flex items-start gap-3">
        <Type className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[oklch(0.45_0_0)]" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[oklch(0.88_0_0)] leading-none">{label}</p>
          <p className="text-[10px] text-[oklch(0.5_0_0)] mt-0.5 leading-snug">{description}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <MetricInput
          label="Size"
          value={value?.fontSize}
          placeholder={defaults.fontSize}
          onChange={(v) => patch("fontSize", v)}
        />
        <MetricInput
          label="Line"
          value={value?.lineHeight}
          placeholder={defaults.lineHeight}
          onChange={(v) => patch("lineHeight", v)}
        />
        <MetricInput
          label="Spacing"
          value={value?.letterSpacing}
          placeholder={defaults.letterSpacing}
          onChange={(v) => patch("letterSpacing", v)}
        />
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
  const [activeTab, setActiveTab] = useState<SettingsTab>("layout");
  const [typographyMetricScope, setTypographyMetricScope] =
    useState<TypographyMetricScope>("all");
  const [zoom, setZoom] = useState<SiteZoomSettings>({
    enableZoom: initialSettings?.zoom?.enableZoom !== false,
    designWidth: initialSettings?.zoom?.designWidth,
    zoomBreakpoint: initialSettings?.zoom?.zoomBreakpoint,
    scale: initialSettings?.zoom?.scale,
    fitViewport: initialSettings?.zoom?.fitViewport === true,
    normalizeViewport: initialSettings?.zoom?.normalizeViewport === true,
    normalizeViewportWidth: initialSettings?.zoom?.normalizeViewportWidth,
    hideScrollbar: initialSettings?.zoom?.hideScrollbar === true,
    preventInitialFlicker: initialSettings?.zoom?.preventInitialFlicker === true,
  });
  const [scrollToTop, setScrollToTop] = useState<SiteScrollToTopSettings>({
    enabled: initialSettings?.scrollToTop?.enabled !== false,
    right: initialSettings?.scrollToTop?.right,
    bottom: initialSettings?.scrollToTop?.bottom,
    showAfter: initialSettings?.scrollToTop?.showAfter,
    stopOffset: initialSettings?.scrollToTop?.stopOffset,
  });
  const [typography, setTypography] = useState<SiteTypographySettings>({
    linkStampScale: initialSettings?.typography?.linkStampScale === true,
    linkStampStrokeWAt104: initialSettings?.typography?.linkStampStrokeWAt104,
    linkStampShadowOffsetAt104: initialSettings?.typography?.linkStampShadowOffsetAt104,
    stampShadowStyle:
      initialSettings?.typography?.stampShadowStyle === "extruded" ||
      initialSettings?.typography?.stampShadowStyle === "layered"
        ? initialSettings.typography.stampShadowStyle
        : "drop",

    sectionTitleStrokeEnabled: initialSettings?.typography?.sectionTitleStrokeEnabled === true,
    sectionTitleStrokeW: initialSettings?.typography?.sectionTitleStrokeW,
    sectionTitleShadowEnabled: initialSettings?.typography?.sectionTitleShadowEnabled === true,
    sectionTitleShadowOffset: initialSettings?.typography?.sectionTitleShadowOffset,

    heroTitleStrokeEnabled: initialSettings?.typography?.heroTitleStrokeEnabled === true,
    heroTitleStrokeW: initialSettings?.typography?.heroTitleStrokeW,
    heroTitleShadowEnabled: initialSettings?.typography?.heroTitleShadowEnabled === true,
    heroTitleShadowOffset: initialSettings?.typography?.heroTitleShadowOffset,

    subtitleStrokeEnabled: initialSettings?.typography?.subtitleStrokeEnabled === true,
    subtitleStrokeW: initialSettings?.typography?.subtitleStrokeW,
    subtitleShadowEnabled: initialSettings?.typography?.subtitleShadowEnabled === true,
    subtitleShadowOffset: initialSettings?.typography?.subtitleShadowOffset,

    contentHeader: initialSettings?.typography?.contentHeader,
    homepageHeader: initialSettings?.typography?.homepageHeader,
    subtitle: initialSettings?.typography?.subtitle,
    bodyText: initialSettings?.typography?.bodyText,
    sectionHeader: initialSettings?.typography?.sectionHeader,
    textHeader: initialSettings?.typography?.textHeader,
    promoHeader: initialSettings?.typography?.promoHeader,
    teachersHeader: initialSettings?.typography?.teachersHeader,
    body: initialSettings?.typography?.body,
    bodyItalic: initialSettings?.typography?.bodyItalic,
    heroTitle: initialSettings?.typography?.heroTitle,
    nav: initialSettings?.typography?.nav,
    meta: initialSettings?.typography?.meta,
    viewportProfiles: initialSettings?.typography?.viewportProfiles,
  });
  const [header, setHeader] = useState<SiteHeaderSettings>({
    navUnderlineMode: initialSettings?.header?.navUnderlineMode ?? "parent",
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save(body: SiteSettingsData) {
    setStatus("saving");
    try {
      const r = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
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
    save({ zoom: next });
  }

  function updateScrollToTop(patch: Partial<SiteScrollToTopSettings>) {
    const next = { ...scrollToTop, ...patch };
    setScrollToTop(next);
    save({ scrollToTop: next });
  }

  function updateTypography(patch: Partial<SiteTypographySettings>) {
    const next = { ...typography, ...patch };
    setTypography(next);
    save({ typography: next });
  }

  function updateHeader(patch: Partial<SiteHeaderSettings>) {
    const next = { ...header, ...patch };
    setHeader(next);
    save({ header: next });
  }

  function getTextMetricValue(
    key: (typeof TEXT_METRIC_GROUPS)[number]["key"],
  ): SiteTextMetrics | undefined {
    if (typographyMetricScope === "all") {
      return typography[key] as SiteTextMetrics | undefined;
    }
    return typography.viewportProfiles?.[typographyMetricScope]?.[key];
  }

  function updateTextMetricValue(
    key: (typeof TEXT_METRIC_GROUPS)[number]["key"],
    next: SiteTextMetrics | undefined,
  ) {
    if (typographyMetricScope === "all") {
      updateTypography({ [key]: next } as Partial<SiteTypographySettings>);
      return;
    }

    const viewportProfiles = { ...(typography.viewportProfiles ?? {}) };
    const currentProfile = { ...(viewportProfiles[typographyMetricScope] ?? {}) };

    if (next) {
      currentProfile[key] = next;
    } else {
      delete currentProfile[key];
    }

    const hasProfileValues = TEXT_METRIC_GROUPS.some((group) => currentProfile[group.key]);
    if (hasProfileValues) {
      viewportProfiles[typographyMetricScope] = currentProfile;
    } else {
      delete viewportProfiles[typographyMetricScope];
    }

    updateTypography({ viewportProfiles });
  }

  return (
    <div className="space-y-6">
      <TabsRow value={activeTab} onChange={setActiveTab} />

      {activeTab === "layout" ? (
        <>
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
            description="Reference canvas width — zoom target. Required when CSS zoom is enabled."
            value={zoom.designWidth}
            placeholder="1440"
            onChange={(v) => update({ designWidth: v })}
          />

          {/* Zoom breakpoint */}
          <NumberRow
            icon={<LayoutTemplate className="h-3.5 w-3.5" />}
            label="Zoom breakpoint (px)"
            description="Min viewport width at which zoom activates. Optional — zoom always activates when empty."
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

          {/* Prevent initial flicker (opt-in FOUC fix) */}
          <ToggleRow
            icon={<Zap className="h-3.5 w-3.5" />}
            label="Prevent initial flicker"
            description="Apply viewport + zoom before first paint via inline script (opt-in FOUC fix)"
            value={zoom.preventInitialFlicker === true}
            onChange={(v) => update({ preventInitialFlicker: v })}
          />

          {/* Viewport width — only relevant when normalizeViewport is on */}
          <NumberRow
            icon={<MonitorSmartphone className="h-3.5 w-3.5 opacity-50" />}
            label="Viewport width (px)"
            description="Width used in meta viewport when normalize is on. Required when Normalize viewport is enabled."
            value={zoom.normalizeViewportWidth}
            placeholder="1320"
            onChange={(v) => update({ normalizeViewportWidth: v })}
          />

        </div>
      </div>

      {/* ---- Scroll-to-top section ---- */}
      <div className="space-y-2">
        <SectionLabel>Scroll-to-top button</SectionLabel>

        <div className="rounded-xl border border-[oklch(1_0_0/8%)] bg-[oklch(1_0_0/3%)] divide-y divide-[oklch(1_0_0/6%)] overflow-hidden">

          <ToggleRow
            icon={<ArrowUp className="h-3.5 w-3.5" />}
            label="Enable"
            description="Show the floating up-arrow button on desktop"
            value={scrollToTop.enabled !== false}
            onChange={(v) => updateScrollToTop({ enabled: v })}
          />

          <TextRow
            icon={<MoveHorizontal className="h-3.5 w-3.5" />}
            label="Right offset"
            description="CSS distance from viewport right edge (e.g. 28px, 4vw)"
            value={scrollToTop.right}
            placeholder="28px"
            onChange={(v) => updateScrollToTop({ right: v })}
          />

          <TextRow
            icon={<MoveVertical className="h-3.5 w-3.5" />}
            label="Bottom offset"
            description="CSS distance from viewport bottom edge"
            value={scrollToTop.bottom}
            placeholder="32px"
            onChange={(v) => updateScrollToTop({ bottom: v })}
          />

          <NumberRow
            icon={<Eye className="h-3.5 w-3.5" />}
            label="Show after (px)"
            description="ScrollY threshold at which the button appears (default 400)"
            value={scrollToTop.showAfter}
            placeholder="400"
            onChange={(v) => updateScrollToTop({ showAfter: v })}
          />

          <NumberRow
            icon={<Anchor className="h-3.5 w-3.5" />}
            label="Stop offset (px)"
            description="Distance from document bottom where button locks (sticky-until-footer). 0 = disabled"
            value={scrollToTop.stopOffset}
            placeholder="0"
            onChange={(v) => updateScrollToTop({ stopOffset: v })}
          />

        </div>
      </div>

        </>
      ) : null}

      {activeTab === "typography" ? (
        <>
      {/* ---- Typography section ---- */}
      <div className="space-y-2">
        <SectionLabel>Typography</SectionLabel>

        <div className="rounded-xl border border-[oklch(1_0_0/8%)] bg-[oklch(1_0_0/3%)] divide-y divide-[oklch(1_0_0/6%)] overflow-hidden">
          <ToggleRow
            icon={<Link2 className="h-3.5 w-3.5" />}
            label="Link stroke & shadow to font-size"
            description="Stamp headings auto-scale stroke + shadow proportionally (em-based). Per-size overrides below win."
            value={typography.linkStampScale === true}
            onChange={(v) => updateTypography({ linkStampScale: v })}
          />
          <TextRow
            icon={<Ruler className="h-3.5 w-3.5 opacity-50" />}
            label="Link stroke at 104px"
            description="Stroke width at the 104px reference. Drives the link-mode em-ratio across all linked sizes. Default 2.6px (= 0.025em)."
            value={typography.linkStampStrokeWAt104}
            placeholder="2.6px"
            onChange={(v) => updateTypography({ linkStampStrokeWAt104: v })}
          />
          <TextRow
            icon={<Ruler className="h-3.5 w-3.5 opacity-50" />}
            label="Link shadow at 104px"
            description="Shadow offset at the 104px reference. Drives the link-mode em-ratio across all linked sizes. Default 5.56px (= 0.0535em)."
            value={typography.linkStampShadowOffsetAt104}
            placeholder="5.56px"
            onChange={(v) => updateTypography({ linkStampShadowOffsetAt104: v })}
          />
          {typography.linkStampScale && (() => {
            const strokeRef = parseFloat(typography.linkStampStrokeWAt104 ?? "") || 2.6;
            const shadowRef = parseFloat(typography.linkStampShadowOffsetAt104 ?? "") || 5.56;
            const fmt = (n: number) => `${(Math.round(n * 100) / 100).toFixed(2)}px`;
            const sizes = [
              { label: "Title", px: 104 },
              { label: "Tagline", px: 78 },
            ];
            return (
              <div className="px-4 py-3 flex gap-3">
                {sizes.map(({ label, px }) => {
                  const stroke = fmt((px * strokeRef) / 104);
                  const shadow = fmt((px * shadowRef) / 104);
                  return (
                    <div key={label} className="flex-1 rounded-lg bg-[oklch(1_0_0/5%)] px-3 py-2.5 space-y-1.5">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[oklch(0.5_0_0)]">
                        {label} · {px}px
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-[oklch(0.55_0_0)]">stroke</span>
                        <span className="font-mono text-[11px] font-semibold text-foreground">{stroke}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-[oklch(0.55_0_0)]">shadow</span>
                        <span className="font-mono text-[11px] font-semibold text-foreground">{shadow}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
          <SelectRow<"drop" | "extruded" | "layered">
            icon={<Layers className="h-3.5 w-3.5" />}
            label="Stamp shadow style"
            description="Drop keeps the current filter shadow. Extruded uses text-shadow. Layered uses a real duplicate stamp behind the text for a closer iPad-safe fallback."
            value={
              typography.stampShadowStyle === "extruded" || typography.stampShadowStyle === "layered"
                ? typography.stampShadowStyle
                : "drop"
            }
            options={[
              { value: "drop", label: "Drop shadow (classic stamp)" },
              { value: "extruded", label: "Extruded (no holes)" },
              { value: "layered", label: "Layered duplicate (iPad-safe)" },
            ]}
            onChange={(v) => updateTypography({ stampShadowStyle: v })}
          />
        </div>
      </div>

      {/* ---- Text metrics section ---- */}
      <div className="space-y-2">
        <SectionLabel>Text Metrics Overrides</SectionLabel>

        <div className="rounded-xl border border-[oklch(1_0_0/8%)] bg-[oklch(1_0_0/3%)] divide-y divide-[oklch(1_0_0/6%)] overflow-hidden">
          <SelectRow<TypographyMetricScope>
            icon={<MonitorSmartphone className="h-3.5 w-3.5" />}
            label="Screen scope"
            description="All / Default keeps the current global behavior. Screen scopes override only the fields filled here."
            value={typographyMetricScope}
            options={TYPOGRAPHY_METRIC_SCOPE_OPTIONS}
            onChange={setTypographyMetricScope}
          />
          {TEXT_METRIC_GROUPS.map((group) => (
            <TextMetricCard
              key={group.key}
              label={group.label}
              description={group.description}
              defaults={group.defaults}
              value={getTextMetricValue(group.key)}
              onChange={(next) => updateTextMetricValue(group.key, next)}
            />
          ))}
        </div>
      </div>

      {/* ---- Section title (104px) ---- */}
      <div className="space-y-2">
        <SectionLabel>Header / Block Title (104px)</SectionLabel>

        <div className="rounded-xl border border-[oklch(1_0_0/8%)] bg-[oklch(1_0_0/3%)] divide-y divide-[oklch(1_0_0/6%)] overflow-hidden">
          <ToggleRow
            icon={<Link2 className="h-3.5 w-3.5" />}
            label="Override stroke"
            description="Fixed stroke width on 104px section titles (homepage-header, features, studio-address). Also drives the link-mode em-ratio when enabled."
            value={typography.sectionTitleStrokeEnabled === true}
            onChange={(v) => updateTypography({ sectionTitleStrokeEnabled: v })}
          />
          <TextRow
            icon={<Ruler className="h-3.5 w-3.5 opacity-50" />}
            label="Stroke width"
            description="CSS length (e.g. 3.38px). Applied only when the toggle above is on."
            value={typography.sectionTitleStrokeW}
            placeholder="3.38px"
            onChange={(v) => updateTypography({ sectionTitleStrokeW: v })}
          />
          <ToggleRow
            icon={<Link2 className="h-3.5 w-3.5" />}
            label="Override shadow"
            description="Fixed text-shadow offset on 104px section titles. Also drives the link-mode shadow em-ratio when enabled."
            value={typography.sectionTitleShadowEnabled === true}
            onChange={(v) => updateTypography({ sectionTitleShadowEnabled: v })}
          />
          <TextRow
            icon={<Ruler className="h-3.5 w-3.5 opacity-50" />}
            label="Shadow offset"
            description="CSS length (e.g. 5.56px). Used for both X and Y offsets. Applied only when the toggle above is on."
            value={typography.sectionTitleShadowOffset}
            placeholder="5.56px"
            onChange={(v) => updateTypography({ sectionTitleShadowOffset: v })}
          />
        </div>
      </div>

      {/* ---- Hero title (78px) ---- */}
      <div className="space-y-2">
        <SectionLabel>Header / Content & Slider (78px)</SectionLabel>

        <div className="rounded-xl border border-[oklch(1_0_0/8%)] bg-[oklch(1_0_0/3%)] divide-y divide-[oklch(1_0_0/6%)] overflow-hidden">
          <ToggleRow
            icon={<Link2 className="h-3.5 w-3.5" />}
            label="Override stroke"
            description="Fixed stroke width on 78px stamp titles (content-header, hero-title)."
            value={typography.heroTitleStrokeEnabled === true}
            onChange={(v) => updateTypography({ heroTitleStrokeEnabled: v })}
          />
          <TextRow
            icon={<Ruler className="h-3.5 w-3.5 opacity-50" />}
            label="Stroke width"
            description="CSS length (e.g. 2.6px). Applied only when the toggle above is on."
            value={typography.heroTitleStrokeW}
            placeholder="2.6px"
            onChange={(v) => updateTypography({ heroTitleStrokeW: v })}
          />
          <ToggleRow
            icon={<Link2 className="h-3.5 w-3.5" />}
            label="Override shadow"
            description="Fixed text-shadow offset on 78px stamp titles."
            value={typography.heroTitleShadowEnabled === true}
            onChange={(v) => updateTypography({ heroTitleShadowEnabled: v })}
          />
          <TextRow
            icon={<Ruler className="h-3.5 w-3.5 opacity-50" />}
            label="Shadow offset"
            description="CSS length (e.g. 4.15px). Used for both X and Y offsets."
            value={typography.heroTitleShadowOffset}
            placeholder="4.15px"
            onChange={(v) => updateTypography({ heroTitleShadowOffset: v })}
          />
        </div>
      </div>

      {/* ---- Subtitle (47px) ---- */}
      <div className="space-y-2">
        <SectionLabel>Header Tagline (47px)</SectionLabel>

        <div className="rounded-xl border border-[oklch(1_0_0/8%)] bg-[oklch(1_0_0/3%)] divide-y divide-[oklch(1_0_0/6%)] overflow-hidden">
          <ToggleRow
            icon={<Link2 className="h-3.5 w-3.5" />}
            label="Override stroke"
            description="Fixed stroke width on .typo-subtitle."
            value={typography.subtitleStrokeEnabled === true}
            onChange={(v) => updateTypography({ subtitleStrokeEnabled: v })}
          />
          <TextRow
            icon={<Ruler className="h-3.5 w-3.5 opacity-50" />}
            label="Stroke width"
            description="CSS length (e.g. 3.6px). Applied only when the toggle above is on."
            value={typography.subtitleStrokeW}
            placeholder="3.6px"
            onChange={(v) => updateTypography({ subtitleStrokeW: v })}
          />
          <ToggleRow
            icon={<Link2 className="h-3.5 w-3.5" />}
            label="Override shadow"
            description="Add a fixed text-shadow on .typo-subtitle (base class has none)."
            value={typography.subtitleShadowEnabled === true}
            onChange={(v) => updateTypography({ subtitleShadowEnabled: v })}
          />
          <TextRow
            icon={<Ruler className="h-3.5 w-3.5 opacity-50" />}
            label="Shadow offset"
            description="CSS length. Used for both X and Y offsets."
            value={typography.subtitleShadowOffset}
            placeholder="2.5px"
            onChange={(v) => updateTypography({ subtitleShadowOffset: v })}
          />
        </div>
      </div>

        </>
      ) : null}

      {activeTab === "header" ? (
        <>
      {/* ---- Header section ---- */}
      <div className="space-y-2">
        <SectionLabel>Header</SectionLabel>

        <div className="rounded-xl border border-[oklch(1_0_0/8%)] bg-[oklch(1_0_0/3%)] divide-y divide-[oklch(1_0_0/6%)] overflow-hidden">
          <SelectRow<NavUnderlineMode>
            icon={<Underline className="h-3.5 w-3.5" />}
            label="Nav underline mode"
            description="Controls the hover/active underline under desktop nav links. Parent = only items with children (current behavior). All = also underline childless top items. None = no underline anywhere."
            value={header.navUnderlineMode ?? "parent"}
            options={[
              { value: "parent", label: "Parent only (default)" },
              { value: "all", label: "All items" },
              { value: "none", label: "None" },
            ]}
            onChange={(v) => updateHeader({ navUnderlineMode: v })}
          />
        </div>
      </div>
        </>
      ) : null}

    </div>
  );
}
