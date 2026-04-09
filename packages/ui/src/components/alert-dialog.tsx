"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "../cn";
import { Slot } from "../slot";

// ─── Context ──────────────────────────────────────────────────────────────────

interface AlertDialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AlertDialogContext = React.createContext<AlertDialogContextValue | null>(null);

function useAlertDialog(): AlertDialogContextValue {
  const ctx = React.useContext(AlertDialogContext);
  if (!ctx) throw new Error("AlertDialog components must be used within <AlertDialog>");
  return ctx;
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export interface AlertDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  children?: React.ReactNode;
}

export function AlertDialog({
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
  children,
}: AlertDialogProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolled;

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolled(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  return (
    <AlertDialogContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </AlertDialogContext.Provider>
  );
}

// ─── Trigger ──────────────────────────────────────────────────────────────────

export interface AlertDialogTriggerProps
  extends React.ComponentProps<"button"> {
  asChild?: boolean;
}

export function AlertDialogTrigger({
  asChild,
  children,
  onClick,
  ...props
}: AlertDialogTriggerProps) {
  const { onOpenChange } = useAlertDialog();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    onOpenChange(true);
  };

  if (asChild) {
    return (
      <Slot
        {...(props as React.HTMLAttributes<HTMLElement>)}
        onClick={handleClick as React.MouseEventHandler<HTMLElement>}
      >
        {children}
      </Slot>
    );
  }

  return (
    <button type="button" {...props} onClick={handleClick}>
      {children}
    </button>
  );
}

// ─── Portal ───────────────────────────────────────────────────────────────────

export function AlertDialogPortal({ children }: { children?: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

// ─── Overlay ─────────────────────────────────────────────────────────────────

export function AlertDialogOverlay({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("fixed inset-0 z-50 bg-black/50 backdrop-blur-sm", className)}
      {...props}
    />
  );
}

// ─── Content ─────────────────────────────────────────────────────────────────

export function AlertDialogContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { open, onOpenChange } = useAlertDialog();

  // ESC to close
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <div
        role="alertdialog"
        aria-modal="true"
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-full max-w-lg",
          "-translate-x-1/2 -translate-y-1/2",
          "rounded-xl border bg-background p-6 shadow-lg",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </AlertDialogPortal>
  );
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

export function AlertDialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-2 text-left", className)} {...props} />;
}

export function AlertDialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

export function AlertDialogTitle({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="heading"
      aria-level={2}
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  );
}

export function AlertDialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

// ─── Action buttons ───────────────────────────────────────────────────────────

const baseBtn =
  "inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
  "disabled:pointer-events-none disabled:opacity-50";

/** Confirm button — does NOT auto-close; consumer controls it via their onClick handler. */
export function AlertDialogAction({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(baseBtn, "bg-primary text-primary-foreground hover:bg-primary/90", className)}
      {...props}
    />
  );
}

/** Cancel button — closes the dialog automatically. */
export function AlertDialogCancel({
  className,
  onClick,
  ...props
}: React.ComponentProps<"button">) {
  const { onOpenChange } = useAlertDialog();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    onOpenChange(false);
  };

  return (
    <button
      type="button"
      className={cn(baseBtn, "border bg-background hover:bg-muted", className)}
      onClick={handleClick}
      {...props}
    />
  );
}
