import type React from "react";
import { getBlockKey } from "@acme/block-library";
import { blockRegistry } from "./blocks/registry";
import type { BlockModel } from "./blocks/types";
import { Container } from "@/components/landing/ui";
import { PreviewScrollListener } from "./preview-scroll-listener";
import { LiveBlockWrapper } from "./live-block-wrapper";
import { LandingZoom } from "./landing-zoom";

type Layout = {
  anchor?: string;
  container?: "contained" | "full";
  order?: { md?: number; lg?: number };
  hide?: { base?: boolean; md?: boolean; lg?: boolean };
  spacingBefore?: number;
  spacingAfter?: number;
};

function getLayout(block: BlockModel): Layout {
  const raw = (block.data ?? {})._layout;
  return raw && typeof raw === "object" ? (raw as Layout) : {};
}

function cssVarStyle(layout: Layout, dbOrder: number) {
  const displayBase = layout.hide?.base ? "none" : "block";
  const displayMd = layout.hide?.md ? "none" : "block";
  const displayLg = layout.hide?.lg ? "none" : "block";

  return {
    ["--order-base" as any]: dbOrder,
    ["--order-md" as any]: layout.order?.md,
    ["--order-lg" as any]: layout.order?.lg,

    ["--display-base" as any]: displayBase,
    ["--display-md" as any]: displayMd,
    ["--display-lg" as any]: displayLg,

    ...(layout.spacingBefore != null && {
      ["--spacing-before" as any]: `${layout.spacingBefore}px`,
    }),
    ...(layout.spacingAfter != null && {
      ["--spacing-after" as any]: `${layout.spacingAfter}px`,
    }),
  } as React.CSSProperties;
}

type ZoomSettings = {
  enableZoom?: boolean;
  designWidth?: number;
  zoomBreakpoint?: number;
  scale?: number;
  fitViewport?: boolean;
  normalizeViewport?: boolean;
  normalizeViewportWidth?: number;
  hideScrollbar?: boolean;
};

export function PageRenderer({ blocks, zoomSettings }: { blocks: BlockModel[]; zoomSettings?: ZoomSettings | null }) {
  const sorted = (blocks ?? []).slice().sort((a, b) => a.order - b.order);

  return (
    <div className="landing-stack">
      <PreviewScrollListener />
      <LandingZoom
        enableZoom={zoomSettings?.enableZoom !== false}
        designWidth={zoomSettings?.designWidth}
        zoomBreakpoint={zoomSettings?.zoomBreakpoint}
        scale={zoomSettings?.scale ?? 1}
        fitViewport={zoomSettings?.fitViewport === true}
        normalizeViewport={zoomSettings?.normalizeViewport === true}
        normalizeViewportWidth={zoomSettings?.normalizeViewportWidth}
        hideScrollbar={zoomSettings?.hideScrollbar === true}
      />
      {sorted.map((block) => {

        const key = getBlockKey(block.type, block.variant);
        const Comp = blockRegistry[key];
        const layout = getLayout(block);

        if (!Comp) {
          return (
            <div
              key={block.id}
              data-block-id={block.id}
              className="landing-section"
              style={cssVarStyle(layout, block.order)}
            >
              <Container>
                <div className="unsupported-block">
                  <div className="unsupported-block__label">
                    Unsupported block: <span className="unsupported-block__key">{key}</span>
                  </div>
                </div>
              </Container>
            </div>
          );
        }

        return (
          <div
            key={block.id}
            id={layout.anchor}
            data-block-id={block.id}
            className="landing-section"
            style={cssVarStyle(layout, block.order)}
          >
            <LiveBlockWrapper blockId={block.id} blockKey={key} serverData={block.data} />
          </div>
        );
      })}

    </div>
  );
}
