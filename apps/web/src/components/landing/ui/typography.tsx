import type React from "react";
import { cn } from "@/lib/cn";

type HeadingProps = React.HTMLAttributes<HTMLHeadingElement> & {
  as?: "h1" | "h2" | "h3";
  size?: "hero" | "section";
  align?: "left" | "center" | "right";
  outline?: OutlineStyle;
};

export function OutlineHeading({
  as: As = "h2",
  size = "section",
  align = "center",
  className,
  outline,
  ...props
}: HeadingProps) {
  const sizeClass =
    size === "hero"
      ? "ds-outline--hero"
      : "ds-outline--section";

  const alignClass =
    align === "left" ? "ds-outline--left" : align === "right" ? "ds-outline--right" : "ds-outline--center";

  const vars = outlineStyleToVars(outline);

  return (
    <As
      className={cn("ds-outline", sizeClass, alignClass, className)}
      style={{ ...vars, ...(props as any).style }}
      {...props}
    />
  );
}

export function Kicker({
  className,
  size = "md",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { size?: "sm" | "md" }) {
  return <div className={cn(size === "sm" ? "ds-kicker-sm" : "ds-kicker", className)} {...props} />;
}

export type OutlineStyle = {
  fill?: string;        // напр. "var(--color-outline-fill)"
  stroke?: string;      // напр. "var(--color-primary)"
  strokeWidthPx?: number;
  tracking?: string;    // напр. "0.02em"
  weight?: number;      // 500 = Medium
  filter?: string;      // напр. "drop-shadow(0 2px 0 rgba(...))" або "none"
};

function outlineStyleToVars(style?: OutlineStyle): React.CSSProperties {
  if (!style) return {};
  const v: Record<string, string> = {};
  if (style.fill) v["--outline-fill"] = style.fill;
  if (style.stroke) v["--outline-stroke"] = style.stroke;
  if (typeof style.strokeWidthPx === "number") v["--outline-stroke-width"] = `${style.strokeWidthPx}px`;
  if (style.tracking) v["--outline-tracking"] = style.tracking;
  if (typeof style.weight === "number") v["--outline-weight"] = String(style.weight);
  if (style.filter) v["--outline-filter"] = style.filter;
  return v as React.CSSProperties;
}

type OutlineTextProps = React.HTMLAttributes<HTMLElement> & {
  as?: React.ElementType;
  outline?: OutlineStyle;
  inline?: boolean;
};

export function OutlineText({
  as: As = "span",
  outline,
  inline = true,
  className,
  style,
  ...props
}: OutlineTextProps) {
  const vars = outlineStyleToVars(outline);
  return (
    <As
      className={cn("ds-outline", inline && "ds-outline-inline", className)}
      style={{ ...vars, ...(style ?? {}) }}
      {...props}
    />
  );
}

export type OutlineStampStyle = {
  fill?: string;              // "var(--color-outline-fill)"
  stroke?: string;            // "var(--color-primary)"
  strokeWidthPx?: number;     // 1
  tracking?: string;          // "0.02em"
  weight?: number;            // 500

  shadow?: {
    x?: number;               // 2.6
    y?: number;               // 2.6
    color?: string;           // "var(--color-primary)"
    enabled?: boolean;        // true
  };
};

function stampStyleToVars(style?: OutlineStampStyle): React.CSSProperties {
  if (!style) return {};
  const v: Record<string, string> = {};

  if (style.fill) v["--stamp-fill"] = style.fill;
  if (style.stroke) v["--stamp-stroke"] = style.stroke;
  if (typeof style.strokeWidthPx === "number") v["--stamp-stroke-w"] = `${style.strokeWidthPx}px`;
  if (style.tracking) v["--stamp-tracking"] = style.tracking;
  if (typeof style.weight === "number") v["--stamp-weight"] = String(style.weight);

  if (style.shadow) {
    const { x, y, color, enabled } = style.shadow;
    if (enabled === false) {
      v["--stamp-shadow-x"] = "0px";
      v["--stamp-shadow-y"] = "0px";
    } else {
      if (typeof x === "number") v["--stamp-shadow-x"] = `${x}px`;
      if (typeof y === "number") v["--stamp-shadow-y"] = `${y}px`;
      if (color) v["--stamp-shadow-color"] = color;
    }
  }

  return v as React.CSSProperties;
}

type OutlineStampTextProps = React.HTMLAttributes<HTMLElement> & {
  as?: React.ElementType;
  stamp?: OutlineStampStyle;
};

/**
 * Single-element stamp text. Stroke comes from -webkit-text-stroke and the
 * shadow comes from filter: drop-shadow on .ds-outline-stamp (see components.css).
 * The drop-shadow includes the stroke contour, so the resulting shadow has the
 * same visual thickness as the previous two-span renderer that duplicated the
 * stroked text in shadow color.
 */
export function OutlineStampText({
  as: As = "span",
  stamp,
  className,
  style,
  children,
  ...props
}: OutlineStampTextProps) {
  const vars = stampStyleToVars(stamp);

  return (
    <As
      className={cn("ds-outline-stamp", className)}
      style={{ ...vars, ...(style ?? {}) }}
      {...props}
    >
      {children}
    </As>
  );
}