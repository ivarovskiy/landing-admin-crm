"use client";

import { useRef, useState, type ReactNode } from "react";
import { ChevronRight, Monitor, Smartphone } from "lucide-react";

function parseNum(v: string): { num: number; unit: string } | null {
  const m = v.trim().match(/^(-?(?:\d+\.?\d*|\.\d+))(px|em|rem|vw|vh|%|)$/i);
  if (!m) return null;
  const num = parseFloat(m[1]);
  return Number.isFinite(num) ? { num, unit: m[2] } : null;
}

function fmtNum(num: number, unit: string): string {
  if (unit === "px" || unit === "") return `${Math.round(num)}${unit}`;
  return `${Math.round(num * 100) / 100}${unit}`;
}

function scrubStep(unit: string): number {
  return unit === "em" || unit === "rem" || unit === "vw" || unit === "vh" ? 0.1 : 1;
}

function scrubMultiplier(e: React.PointerEvent<HTMLElement>): number {
  if (e.shiftKey) return 10;
  if (e.altKey) return 0.1;
  return 1;
}

type ResponsiveHide = { base?: boolean; md?: boolean; lg?: boolean };
type ViewMode = "desktop" | "ipadPro" | "mobile";

export function InspectorSection({
  title,
  icon,
  defaultOpen = true,
  badge,
  children,
}: {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  badge?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border/60 last:border-b-0">
      <div
        role="button"
        tabIndex={0}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("[data-section-badge]")) return;
          setOpen((v) => !v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if ((e.target as HTMLElement).closest("[data-section-badge]")) return;
            setOpen((v) => !v);
          }
        }}
        className="flex h-9 w-full cursor-pointer select-none items-center gap-2 px-3 transition-colors hover:bg-muted/45"
      >
        <ChevronRight
          className={[
            "h-3 w-3 text-muted-foreground transition-transform duration-150",
            open ? "rotate-90" : "",
          ].join(" ")}
        />
        {icon ? <span className="shrink-0 text-muted-foreground">{icon}</span> : null}
        <span className="flex-1 text-left text-[10px] font-semibold uppercase text-muted-foreground">
          {title}
        </span>
        {badge ? (
          <span className="shrink-0" data-section-badge>
            {badge}
          </span>
        ) : null}
      </div>

      {open ? <div className="space-y-2 px-3 pb-3">{children}</div> : null}
    </div>
  );
}

export function InspectorField({
  label,
  hint,
  stacked = false,
  children,
}: {
  label: string;
  hint?: string;
  stacked?: boolean;
  children: ReactNode;
}) {
  if (stacked) {
    return (
      <div className="space-y-1">
        {label ? <label className="text-[11px] font-medium text-muted-foreground">{label}</label> : null}
        {children}
        {hint ? <p className="text-[10px] leading-snug text-muted-foreground/70">{hint}</p> : null}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-2">
      <label className="truncate text-[11px] font-medium text-muted-foreground">{label}</label>
      <div className="min-w-0">
        {children}
        {hint ? <p className="mt-1 text-[10px] leading-snug text-muted-foreground/70">{hint}</p> : null}
      </div>
    </div>
  );
}

export function InspectorInput({
  value,
  onChange,
  placeholder,
  type = "text",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const scrub = useRef<{
    startX: number;
    startNum: number;
    unit: string;
    step: number;
    moved: boolean;
  } | null>(null);

  const parsed = parseNum(value);
  const scrubable = !!parsed && !focused;

  const onPointerDown = (e: React.PointerEvent<HTMLInputElement>) => {
    if (!scrubable || !parsed) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    scrub.current = {
      startX: e.clientX,
      startNum: parsed.num,
      unit: parsed.unit,
      step: scrubStep(parsed.unit),
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLInputElement>) => {
    const d = scrub.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 3) d.moved = true;
    if (!d.moved) return;
    onChange(fmtNum(d.startNum + dx * d.step * scrubMultiplier(e), d.unit));
  };

  const onPointerUp = () => {
    const d = scrub.current;
    scrub.current = null;
    if (!d?.moved) ref.current?.focus();
  };

  return (
    <input
      ref={ref}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        scrub.current = null;
      }}
      placeholder={placeholder}
      className={[
        "h-7 w-full rounded-sm border border-border/70 bg-muted/80 px-2 text-xs tabular-nums text-foreground",
        "placeholder:text-muted-foreground/40 focus:border-primary/70 focus:outline-none focus:ring-1 focus:ring-ring/70",
        scrubable ? "cursor-ew-resize" : "",
        className,
      ].filter(Boolean).join(" ")}
    />
  );
}

export function InspectorTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={[
        "w-full rounded-sm border border-border/70 bg-muted/80 px-2 py-2 text-xs leading-snug text-foreground resize-y",
        "placeholder:text-muted-foreground/40 focus:border-primary/70 focus:outline-none focus:ring-1 focus:ring-ring/70",
      ].join(" ")}
    />
  );
}

export function InspectorSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-7 w-full rounded-sm border border-border/70 bg-muted/80 px-2 text-xs text-foreground focus:border-primary/70 focus:outline-none focus:ring-1 focus:ring-ring/70"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function InspectorNumber({
  value,
  onChange,
  min,
  max,
  step = 1,
  placeholder,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const scrub = useRef<{ startX: number; startVal: number; moved: boolean } | null>(null);

  const clamp = (v: number) => {
    let r = v;
    if (min !== undefined) r = Math.max(min, r);
    if (max !== undefined) r = Math.min(max, r);
    return r;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLInputElement>) => {
    if (focused) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    scrub.current = { startX: e.clientX, startVal: value ?? 0, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLInputElement>) => {
    const d = scrub.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 3) d.moved = true;
    if (!d.moved) return;
    const next = d.startVal + dx * step * scrubMultiplier(e);
    onChange(clamp(Math.round(next / step) * step));
  };

  const onPointerUp = () => {
    const d = scrub.current;
    scrub.current = null;
    if (!d?.moved) ref.current?.focus();
  };

  return (
    <input
      ref={ref}
      type="number"
      value={value ?? ""}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === "" ? undefined : clamp(Number(v)));
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        scrub.current = null;
      }}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      className={[
        "h-7 w-full rounded-sm border border-border/70 bg-muted/80 px-2 text-xs tabular-nums text-foreground",
        "placeholder:text-muted-foreground/40 focus:border-primary/70 focus:outline-none focus:ring-1 focus:ring-ring/70",
        !focused ? "cursor-ew-resize" : "",
      ].join(" ")}
    />
  );
}

export function InspectorToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-2 text-left">
      <div
        className={[
          "relative h-4 w-7 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-muted-foreground/20",
        ].join(" ")}
      >
        <div
          className={[
            "absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-3.5" : "translate-x-0.5",
          ].join(" ")}
        />
      </div>
      {label ? <span className="text-[11px] text-muted-foreground">{label}</span> : null}
    </button>
  );
}

export function InspectorSegment<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; title?: string }[];
}) {
  return (
    <div className="flex h-7 rounded-sm border border-border/70 bg-muted/45 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.title}
          onClick={() => onChange(o.value)}
          className={[
            "flex flex-1 items-center justify-center rounded-[3px] px-2 text-[10px] font-medium transition-all",
            o.value === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function InspectorResponsiveToggle({
  label,
  hide,
  onChange,
  viewMode,
}: {
  label: string;
  hide: ResponsiveHide;
  onChange: (next: ResponsiveHide) => void;
  viewMode: ViewMode;
}) {
  const mobileHidden = hide.base === true;
  const desktopHidden = hide.md === true && hide.lg === true;

  function toggleMobile() {
    onChange({ ...hide, base: !hide.base });
  }

  function toggleDesktop() {
    const shouldHide = !(hide.md === true && hide.lg === true);
    onChange({ ...hide, md: shouldHide, lg: shouldHide });
  }

  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="flex-1 truncate text-[11px] text-muted-foreground">{label}</span>
      <button
        type="button"
        onClick={toggleMobile}
        title={mobileHidden ? "Hidden on mobile - click to show" : "Visible on mobile - click to hide"}
        className={[
          "flex h-6 w-6 items-center justify-center rounded-sm transition-all",
          viewMode === "mobile" ? "bg-muted ring-1 ring-border" : "opacity-60 hover:opacity-100",
          mobileHidden ? "text-muted-foreground/40" : "text-emerald-500",
        ].join(" ")}
      >
        <Smartphone className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={toggleDesktop}
        title={desktopHidden ? "Hidden on desktop - click to show" : "Visible on desktop - click to hide"}
        className={[
          "flex h-6 w-6 items-center justify-center rounded-sm transition-all",
          viewMode !== "mobile" ? "bg-muted ring-1 ring-border" : "opacity-60 hover:opacity-100",
          desktopHidden ? "text-muted-foreground/40" : "text-blue-400",
        ].join(" ")}
      >
        <Monitor className="h-3 w-3" />
      </button>
    </div>
  );
}

export function InspectorColorInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const isPreviewable = value && !value.startsWith("var(") && !value.startsWith("--");

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        title="Pick color"
        onClick={() => pickerRef.current?.click()}
        className="relative h-7 w-7 shrink-0 overflow-hidden rounded-sm border border-border/70"
        style={{ background: isPreviewable ? value : "transparent" }}
      >
        {!isPreviewable ? (
          <div className="absolute inset-0 bg-gradient-to-br from-red-400 via-green-400 to-blue-400 opacity-60" />
        ) : null}
        <input
          ref={pickerRef}
          type="color"
          value={isPreviewable && value.startsWith("#") ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          tabIndex={-1}
        />
      </button>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "#000 or var(--...)"}
        className={[
          "h-7 min-w-0 flex-1 rounded-sm border border-border/70 bg-muted/80 px-2 font-mono text-xs text-foreground",
          "placeholder:text-muted-foreground/50 focus:border-primary/70 focus:outline-none focus:ring-1 focus:ring-ring/70",
        ].join(" ")}
      />
    </div>
  );
}
