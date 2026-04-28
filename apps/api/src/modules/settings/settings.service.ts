import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface ZoomSettings {
  /** Master switch for CSS zoom on .landing-stack */
  enableZoom?: boolean;
  /** Reference canvas width in px (default 1480) */
  designWidth?: number;
  /** Min viewport width (px) at which CSS zoom activates (default 768) */
  zoomBreakpoint?: number;
  /** Coefficient applied on top of auto-zoom (default 1.0) */
  scale?: number;
  /** Fit page height to viewport using header + hero dimensions */
  fitViewport?: boolean;
  /** Set <meta viewport> to a fixed width so the browser scales natively */
  normalizeViewport?: boolean;
  /** Width value used in meta viewport when normalizeViewport is on (default 1320) */
  normalizeViewportWidth?: number;
  /** Hide the vertical scrollbar visually (scrolling still works) */
  hideScrollbar?: boolean;
  /** Apply viewport meta + CSS zoom synchronously before first paint to eliminate FOUC. Off by default. */
  preventInitialFlicker?: boolean;
}

export interface ScrollToTopSettings {
  enabled?: boolean;
  right?: string;
  bottom?: string;
  showAfter?: number;
  stopOffset?: number;
}

export interface TypographySettings {
  /** Auto-scale stamp stroke + shadow proportionally to font-size (em-based).
   *  Per-size overrides below always win over this when both are enabled. */
  linkStampScale?: boolean;

  /** How the stamp shadow is rendered on every stamp title.
   *  - `'drop'` (default): single offset duplicate via `filter: drop-shadow`.
   *    Renders correctly on Chromium/Firefox, but on iPad/Safari the filter
   *    pipeline captures the painted fill of the source element, which can
   *    show as thin cream "wedges" inside hollow glyph holes (O, U, R, S, etc).
   *  - `'extruded'`: same offset and colour, but rendered via a single-layer
   *    `text-shadow` instead of `filter: drop-shadow`. text-shadow uses only
   *    the glyph silhouette so there is no cross-browser fill leakage.
   *  When undefined, behaves like `'drop'`. */
  stampShadowStyle?: 'drop' | 'extruded';

  /* ── Section title (104px) — homepage-header, features-title, studio-address__title ── */
  /** Override stroke width at 104px. Also drives the link-mode stroke em-ratio when enabled. */
  sectionTitleStrokeEnabled?: boolean;
  /** Stroke width when sectionTitleStrokeEnabled is on (e.g. "3.38px") */
  sectionTitleStrokeW?: string;
  /** Override text-shadow offset at 104px. Also drives the link-mode shadow em-ratio when enabled. */
  sectionTitleShadowEnabled?: boolean;
  /** Shadow offset when sectionTitleShadowEnabled is on (e.g. "5.56px"). Used as `<offset> <offset> 0`. */
  sectionTitleShadowOffset?: string;

  /* ── Hero title (78px) — content-header, hero-title ── */
  heroTitleStrokeEnabled?: boolean;
  heroTitleStrokeW?: string;
  heroTitleShadowEnabled?: boolean;
  heroTitleShadowOffset?: string;

  /* ── Subtitle (47px) — typo-subtitle ── */
  subtitleStrokeEnabled?: boolean;
  subtitleStrokeW?: string;
  subtitleShadowEnabled?: boolean;
  subtitleShadowOffset?: string;
}

export type NavUnderlineMode = 'parent' | 'all' | 'none';

export interface HeaderSettings {
  /** Controls the hover/active underline under desktop nav links.
   *  - `'parent'` (default): only items that have children get the underline,
   *    plus subnav children inside the open dropdown.
   *  - `'all'`: every top-level item underlines on hover/active, including
   *    childless ones, plus subnav children.
   *  - `'none'`: no underline anywhere in the desktop nav.
   *  When undefined, the renderer falls back to `'parent'` (current behavior). */
  navUnderlineMode?: NavUnderlineMode;
}

export interface SiteSettingsData {
  zoom?: ZoomSettings;
  scrollToTop?: ScrollToTopSettings;
  typography?: TypographySettings;
  header?: HeaderSettings;
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get() {
    return this.prisma.siteSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default' },
      update: {},
    });
  }

  async update(data: SiteSettingsData) {
    const payload = data as Record<string, any>;
    return this.prisma.siteSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...payload },
      update: payload,
    });
  }
}
