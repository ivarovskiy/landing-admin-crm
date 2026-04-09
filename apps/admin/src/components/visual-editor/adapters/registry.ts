import type { BlockVisualEditorDefinition } from "../types";
import { featuresV1Adapter } from "./features-v1";
import { studioAddressV1Adapter } from "./studio-address-v1";
import { heroSliderV1Adapter } from "./hero-slider-v1";
import { headerV1Adapter } from "./header-v1";
import { footerV1Adapter } from "./footer-v1";
import { contentPageV1Adapter } from "./content-page-v1";
import { scrapbookV1Adapter } from "./scrapbook-v1";

const VISUAL_EDITOR_REGISTRY: Record<string, BlockVisualEditorDefinition> = {
  "features:v1": { key: "features:v1", adapter: featuresV1Adapter },
  "studio-address:v1": { key: "studio-address:v1", adapter: studioAddressV1Adapter },
  "hero:slider-v1": { key: "hero:slider-v1", adapter: heroSliderV1Adapter },
  "header:v1": { key: "header:v1", adapter: headerV1Adapter },
  "footer:v1": { key: "footer:v1", adapter: footerV1Adapter },
  "content-page:v1": { key: "content-page:v1", adapter: contentPageV1Adapter },
  "scrapbook:v1": { key: "scrapbook:v1", adapter: scrapbookV1Adapter },
};

/** Get visual editor definition for a block type:variant key */
export function getVisualEditorDef(
  type: string,
  variant: string,
): BlockVisualEditorDefinition | undefined {
  return VISUAL_EDITOR_REGISTRY[`${type}:${variant}`];
}

/** Check if a block has a visual editor adapter */
export function hasVisualEditor(type: string, variant: string): boolean {
  return `${type}:${variant}` in VISUAL_EDITOR_REGISTRY;
}
