import type { ComponentType } from "react";
import { FeaturesV1Form } from "./features-v1-form";
import { StudioAddressV1Form } from "./studio-address-v1-form";
import { HeaderV1Form } from "./header-v1-form";
import { HeroSliderV1Form } from "./hero-slider-v1-form";
import { FooterV1Form } from "./footer-v1-form";
import { ContentPageV1Form } from "./content-page-v1-form";
import { ScrapbookV1Form } from "./scrapbook-v1-form";
import { TextBlockV1Form } from "./text-block-v1-form";
import { DocHeaderV1Form } from "./doc-header-v1-form";
import { DocBodyV1Form } from "./doc-body-v1-form";
import { NewStudentMemoV1Form } from "./new-student-memo-v1-form";

export type BlockFormProps = {
  value: any;
  onChange: (next: any) => void;
  viewMode: "desktop" | "ipadPro" | "mobile";
};

const REGISTRY: Record<string, ComponentType<BlockFormProps>> = {
  "features:v1": FeaturesV1Form,
  "studio-address:v1": StudioAddressV1Form,
  "header:v1": HeaderV1Form,
  "hero:slider-v1": HeroSliderV1Form,
  "footer:v1": FooterV1Form,
  "content-page:v1": ContentPageV1Form,
  "scrapbook:v1": ScrapbookV1Form,
  "text-block:v1": TextBlockV1Form,
  "doc-header:v1": DocHeaderV1Form,
  "doc-body:v1": DocBodyV1Form,
  "new-student-memo:v1": NewStudentMemoV1Form,
};

export function getBlockForm(type: string, variant: string) {
  return REGISTRY[`${type}:${variant}`];
}
