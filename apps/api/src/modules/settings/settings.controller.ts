import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/rbac/roles.guard';
import { Roles } from '../../common/rbac/roles.decorator';
import { SettingsService, type SiteSettingsData } from './settings.service';

@ApiTags('admin/settings')
@Controller({ version: '1' })
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  /** Public — read-only, no auth required */
  @Get('public/settings')
  @ApiOkResponse({ description: 'Site settings (public)' })
  getPublic() {
    return this.settings.get();
  }

  /** Admin — read */
  @Get('admin/settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiOkResponse({ description: 'Site settings' })
  get() {
    return this.settings.get();
  }

  /** Admin — update */
  @Patch('admin/settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiOkResponse({ description: 'Updated site settings' })
  update(@Body() body: SiteSettingsData) {
    return this.settings.update(body);
  }
}
