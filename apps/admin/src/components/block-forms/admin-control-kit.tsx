"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { ChevronRight } from "lucide-react";

export function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-3">{children}</div>;
}

export function MiniLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </span>
  );
}

export function SectionNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-[12px] leading-snug text-muted-foreground/75">
      {children}
    </p>
  );
}

// ── ControlCard ───────────────────────────────────────────────────────────────
// Collapsible card for content items. defaultOpen=false keeps the panel clean.

export function ControlCard({
  title,
  subtitle,
  icon,
  action,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-border/70 bg-muted/10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[44px] w-full items-center gap-2.5 px-3 py-2 text-left"
      >
        {icon ? <span className="shrink-0 text-muted-foreground">{icon}</span> : null}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-foreground">{title}</div>
          {subtitle ? (
            <div className="truncate text-[11px] text-muted-foreground">{subtitle}</div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {action ? (
            <div
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {action}
            </div>
          ) : null}
          <ChevronRight
            className={[
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              open ? "rotate-90" : "",
            ].join(" ")}
          />
        </div>
      </button>
      {open ? (
        <div className="space-y-3 border-t border-border/50 p-3">{children}</div>
      ) : null}
    </div>
  );
}

// ── AdvancedPanel ─────────────────────────────────────────────────────────────

export function AdvancedPanel({
  title = "Advanced",
  defaultOpen = false,
  children,
}: {
  title?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-md border border-border/50 bg-background/30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[40px] w-full items-center gap-2 px-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronRight
          className={[
            "h-3.5 w-3.5 transition-transform",
            open ? "rotate-90" : "",
          ].join(" ")}
        />
        <span>{title}</span>
      </button>
      {open ? (
        <div className="space-y-3 border-t border-border/50 p-3">{children}</div>
      ) : null}
    </div>
  );
}

// ── PresetRow ─────────────────────────────────────────────────────────────────

export function PresetRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <MiniLabel>{label}</MiniLabel>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

// ── PresetButton ──────────────────────────────────────────────────────────────

export function PresetButton({
  children,
  onClick,
  active = false,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={[
        "min-h-[36px] rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors",
        active
          ? "border-primary/70 bg-primary/15 text-primary"
          : "border-border/70 bg-muted/40 text-muted-foreground hover:border-primary/50 hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
