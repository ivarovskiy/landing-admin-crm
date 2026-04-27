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
  /** Auto-scale stamp stroke + shadow proportionally to font-size (em-based) */
  linkStampScale?: boolean;
  /** Override stroke width for 104px section titles (features, studio-address, homepage-header) */
  sectionTitleStrokeEnabled?: boolean;
  /** Stroke width value when sectionTitleStrokeEnabled is on (e.g. "3.38px") */
  sectionTitleStrokeW?: string;
}

export interface SiteSettingsData {
  zoom?: ZoomSettings;
  scrollToTop?: ScrollToTopSettings;
  typography?: TypographySettings;
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
