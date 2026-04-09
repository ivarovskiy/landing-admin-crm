import type React from "react";

export type ResponsiveHide = { base?: boolean; md?: boolean; lg?: boolean };

type DisplayMode = "block" | "flex" | "grid" | "inline-block";

/**
 * Returns className + style props for responsive visibility.
 * Uses the `.ds-responsive-display` CSS class with CSS custom properties.
 *
 * Usage: <div {...hideToResponsiveClasses(hide, "block")} />
 */
export function hideToResponsiveClasses(
  hide?: ResponsiveHide,
  visible: DisplayMode = "block"
): { className: string; style: React.CSSProperties } {
  return {
    className: "ds-responsive-display",
    style: {
      ["--ds-display-base" as any]: hide?.base ? "none" : visible,
      ["--ds-display-md" as any]: hide?.md ? "none" : visible,
      ["--ds-display-lg" as any]: hide?.lg ? "none" : visible,
    },
  };
}
