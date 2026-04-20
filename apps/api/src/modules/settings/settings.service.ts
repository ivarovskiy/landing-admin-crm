import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface ZoomSettings {
  fitViewport?: boolean;
  scale?: number;
}

export interface ScrollToTopSettings {
  enabled?: boolean;
  right?: string;
  bottom?: string;
  showAfter?: number;
  stopOffset?: number;
}

export interface SiteSettingsData {
  zoom?: ZoomSettings;
  scrollToTop?: ScrollToTopSettings;
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
