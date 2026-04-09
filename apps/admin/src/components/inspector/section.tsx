"use client";

import { useRef, useState, type ReactNode } from "react";
import { ChevronRight, Smartphone, Monitor } from "lucide-react";

type ResponsiveHide = { base?: boolean; md?: boolean; lg?: boolean };
type ViewMode = "desktop" | "mobile";

/**
 * Collapsible inspector section — like Figma's right panel sections.
 *
 * Usage:
 *   <InspectorSection title="Content" defaultOpen>
 *     <InspectorField label="Title">
 *       <input ... />
 *     </InspectorField>
 *   </InspectorSection>
 */
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
          // Don't toggle when clicking badge actions
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
        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-muted/50 transition-colors cursor-pointer select-none"
      >
        <ChevronRight
          className={[
            "h-3 w-3 text-muted-foreground transition-transform duration-150",
            open ? "rotate-90" : "",
          ].join(" ")}
        />

        {icon && (
          <span className="text-muted-foreground shrink-0">{icon}</span>
        )}

        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex-1 text-left">
          {title}
        </span>

        {badge && <span className="shrink-0" data-section-badge>{badge}</span>}
      </div>

      {open && <div className="px-4 pb-3 space-y-2.5">{children}</div>}
    </div>
  );
}

/**
 * A single field row inside an inspector section.
 *
 * Layout: label on left (fixed width), control on right (flex).
 * Or stacked if `stacked` is true.
 */
export function InspectorField({
  label,
  hint,
  stacked = true,
  children,
}: {
  label: string;
  hint?: string;
  stacked?: boolean;
  children: ReactNode;
}) {
  if (!stacked) {
    return (
      <div className="flex items-start gap-3">
        <label className="text-[11px] font-medium text-muted-foreground w-20 shrink-0 pt-1.5 text-right">
          {label}
        </label>
        <div className="flex-1 min-w-0">
          {children}
          {hint && (
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">
              {hint}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {label && (
        <label className="text-[11px] font-medium text-muted-foreground">
          {label}
        </label>
      )}
      {children}
      {hint && (
        <p className="text-[10px] text-muted-foreground/70">{hint}</p>
      )}
    </div>
  );
}

/**
 * Compact text input styled for inspector.
 */
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
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={[
        "w-full h-7 border bg-muted text-foreground px-2 text-xs",
        "focus:outline-none focus:ring-1 focus:ring-ring",
        "placeholder:text-muted-foreground/50",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

/**
 * Compact textarea styled for inspector.
 */
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
        "w-full border bg-muted text-foreground px-2 py-1.5 text-xs resize-y",
        "focus:outline-none focus:ring-1 focus:ring-ring",
        "placeholder:text-muted-foreground/50",
      ].join(" ")}
    />
  );
}

/**
 * Compact select styled for inspector.
 */
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
      className="w-full h-7 border bg-muted text-foreground px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/**
 * Number input with optional stepper.
 */
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
  return (
    <input
      type="number"
      value={value ?? ""}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === "" ? undefined : Number(v));
      }}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      className={[
        "w-full h-7 border bg-muted text-foreground px-2 text-xs tabular-nums",
        "focus:outline-none focus:ring-1 focus:ring-ring",
        "placeholder:text-muted-foreground/50",
      ].join(" ")}
    />
  );
}

/**
 * Toggle switch for boolean values.
 */
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
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2"
    >
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
      {label && (
        <span className="text-[11px] text-muted-foreground">{label}</span>
      )}
    </button>
  );
}

/**
 * Segmented control (like Figma's alignment buttons).
 */
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
    <div className="flex rounded-md border bg-muted/30 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.title}
          onClick={() => onChange(o.value)}
          className={[
            "flex-1 flex items-center justify-center rounded px-2 py-1 text-[10px] font-medium transition-all",
            o.value === value
              ? "bg-muted text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Responsive visibility toggle — shows 📱 and 🖥️ icons.
 * The icon matching the current viewMode is highlighted (active viewport).
 * Clicking either icon toggles that breakpoint's visibility.
 *
 * Usage:
 *   <InspectorResponsiveToggle
 *     label="Tagline"
 *     hide={subtitleHide}
 *     onChange={(next) => onChange({ ...value, subtitleHide: next })}
 *     viewMode={viewMode}
 *   />
 */
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
  const mobileHidden  = hide.base === true;
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
      <span className="text-xs text-muted-foreground flex-1 truncate">{label}</span>

      {/* Mobile toggle */}
      <button
        type="button"
        onClick={toggleMobile}
        title={mobileHidden ? "Hidden on mobile — click to show" : "Visible on mobile — click to hide"}
        className={[
          "flex items-center justify-center rounded-md px-1.5 py-1 transition-all",
          viewMode === "mobile"
            ? "bg-muted ring-1 ring-border"          // active viewport — highlighted
            : "opacity-60 hover:opacity-100",
          mobileHidden
            ? "text-muted-foreground/40"
            : "text-emerald-500",
        ].join(" ")}
      >
        <Smartphone className="h-3 w-3" />
      </button>

      {/* Desktop toggle */}
      <button
        type="button"
        onClick={toggleDesktop}
        title={desktopHidden ? "Hidden on desktop — click to show" : "Visible on desktop — click to hide"}
        className={[
          "flex items-center justify-center rounded-md px-1.5 py-1 transition-all",
          viewMode === "desktop"
            ? "bg-muted ring-1 ring-border"          // active viewport — highlighted
            : "opacity-60 hover:opacity-100",
          desktopHidden
            ? "text-muted-foreground/40"
            : "text-blue-400",
        ].join(" ")}
      >
        <Monitor className="h-3 w-3" />
      </button>
    </div>
  );
}

/**
 * Color swatch + native picker + text input.
 * - Click the swatch → opens native color picker
 * - Text input accepts any CSS color (hex, rgb, hsl, var(...))
 * - Swatch previews the current value visually
 */
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

  // Determine if value is a plain hex/rgb color (previewable) or a CSS variable
  const isPreviewable = value && !value.startsWith("var(") && !value.startsWith("--");

  return (
    <div className="flex items-center gap-1.5">
      {/* Swatch — click to open native picker */}
      <button
        type="button"
        title="Pick color"
        onClick={() => pickerRef.current?.click()}
        className="h-7 w-7 shrink-0 rounded border border-border/60 overflow-hidden relative"
        style={{ background: isPreviewable ? value : "transparent" }}
      >
        {!isPreviewable && (
          <div className="absolute inset-0 bg-gradient-to-br from-red-400 via-green-400 to-blue-400 opacity-60" />
        )}
        <input
          ref={pickerRef}
          type="color"
          value={isPreviewable ? (value.startsWith("#") ? value : "#000000") : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          tabIndex={-1}
        />
      </button>

      {/* Text input — manual entry for any CSS value */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "#000 or var(--...)"}
        className={[
          "flex-1 h-7 border bg-muted text-foreground px-2 text-xs font-mono",
          "focus:outline-none focus:ring-1 focus:ring-ring",
          "placeholder:text-muted-foreground/50",
        ].join(" ")}
      />
    </div>
  );
}
