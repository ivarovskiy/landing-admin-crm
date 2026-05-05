import type { BlockComponent } from "./types";
import { getBlockKey } from "@acme/block-library";

import { FooterV1 } from "./sections/footer-v1";
import { HeaderV1 } from "./sections/header-v1";
import { HeroSliderV1 } from "./sections/hero-slider-v1";
import { FeaturesV1 } from "./sections/features-v1";
import { StudioAddressV1 } from "./sections/studio-address-v1";
import { ContentPageV1 } from "./sections/content-page-v1";
import { ScrapbookV1 } from "./sections/scrapbook-v1";
import { TextBlockV1 } from "./sections/text-block-v1";
import { DocHeaderV1 } from "./sections/doc-header-v1";
import { DocBodyV1 } from "./sections/doc-body-v1";
import { ScrollStoryV1 } from "./sections/scroll-story-v1";
import { NewStudentMemoV1 } from "./sections/new-student-memo-v1";

const K = getBlockKey;

export const blockRegistry: Record<string, BlockComponent> = {
  [K("header", "v1")]: HeaderV1,
  [K("hero", "slider-v1")]: HeroSliderV1,
  [K("features", "v1")]: FeaturesV1,
  [K("studio-address", "v1")]: StudioAddressV1,
  [K("content-page", "v1")]: ContentPageV1,
  [K("footer", "v1")]: FooterV1,
  [K("scrapbook", "v1")]: ScrapbookV1,
  [K("text-block", "v1")]: TextBlockV1,
  [K("doc-header", "v1")]: DocHeaderV1,
  [K("doc-body", "v1")]: DocBodyV1,
  [K("scroll-story", "v1")]: ScrollStoryV1,
  [K("new-student-memo", "v1")]: NewStudentMemoV1,
};