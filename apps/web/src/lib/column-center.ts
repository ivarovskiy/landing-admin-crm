export type ColumnCenterMode = 1 | 2 | 3 | 4;

/**
 * Computes the X position (layout px) of the text-zone column center line.
 * All measurements are in layout px (CSS zoom-corrected, 1440px design basis).
 *
 * Modes (for imgSide="right" — image on right, text on left):
 *   1: midpoint(0, mediaEdgePx)              — slide left-edge to media left-edge (no gap)
 *   2: midpoint(outerMarginPx, mediaEdgePx)  — outer margin to media left-edge (no gap)
 *   3: midpoint(outerMarginPx, gapBoundaryPx) — outer margin to gap boundary (text col right face)
 *   4: midpoint(0, gapBoundaryPx)            — slide left-edge to gap boundary
 * Mirror symmetry applies for imgSide="left".
 *
 * Reuse this function for: guideline rendering, group centering, individual element centering.
 */
export function computeColumnCenterX(
  mode: ColumnCenterMode,
  mediaEdgePx: number,
  gapBoundaryPx: number,
  outerMarginPx: number,
  slideWidthPx: number,
  imgSide: "left" | "right",
): number {
  if (imgSide === "right") {
    switch (mode) {
      case 1: return mediaEdgePx / 2;
      case 2: return (outerMarginPx + mediaEdgePx) / 2;
      case 3: return (outerMarginPx + gapBoundaryPx) / 2;
      case 4: return gapBoundaryPx / 2;
    }
  } else {
    const rightMargin = slideWidthPx - outerMarginPx;
    switch (mode) {
      case 1: return (mediaEdgePx + slideWidthPx) / 2;
      case 2: return (mediaEdgePx + rightMargin) / 2;
      case 3: return (gapBoundaryPx + rightMargin) / 2;
      case 4: return (gapBoundaryPx + slideWidthPx) / 2;
    }
  }
}
