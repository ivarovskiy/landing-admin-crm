"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { ChevronRight } from "lucide-react";

export function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-1.5">{children}</div>;
}

export function MiniLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </span>
  );
}

export function SectionNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md border border-border/60 bg-muted/20 px-2 py-1.5 text-[10px] leading-snug text-muted-foreground/75">
      {children}
    </p>
  );
}

export function ControlCard({
  title,
  subtitle,
  icon,
  action,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2 rounded-md border border-border/70 bg-muted/10 p-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {icon ? <span className="shrink-0 text-muted-foreground">{icon}</span> : null}
          <div className="min-w-0">
            <div className="truncate text-[11px] font-semibold text-foreground">{title}</div>
            {subtitle ? <div className="truncate text-[10px] text-muted-foreground">{subtitle}</div> : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </div>
  );
}

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
        onClick={() => setOpen((value) => !value)}
        className="flex h-7 w-full items-center gap-1.5 px-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronRight className={["h-3 w-3 transition-transform", open ? "rotate-90" : ""].join(" ")} />
        <span>{title}</span>
      </button>
      {open ? <div className="space-y-1.5 border-t border-border/50 p-2">{children}</div> : null}
    </div>
  );
}

export function PresetRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <MiniLabel>{label}</MiniLabel>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

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
        "rounded-sm border px-2 py-1 text-[10px] font-medium transition-colors",
        active
          ? "border-primary/70 bg-primary/15 text-primary"
          : "border-border/70 bg-muted/40 text-muted-foreground hover:border-primary/50 hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
