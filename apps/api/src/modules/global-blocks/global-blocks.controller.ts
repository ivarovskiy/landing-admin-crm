import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/rbac/roles.guard';
import { Roles } from '../../common/rbac/roles.decorator';
import { GlobalBlocksService, type GlobalBlockPayload } from './global-blocks.service';

function parseScope(raw?: string | null): string | null {
  if (!raw || raw === '' || raw === 'site' || raw === 'null') return null;
  return raw;
}

@ApiTags('global-blocks')
@Controller({ version: '1' })
export class GlobalBlocksController {
  constructor(private readonly globals: GlobalBlocksService) {}

  /** Public — resolved global blocks for a specific page (walks parent chain) */
  @Get('public/global-blocks/for-page/:pageId')
  @ApiOkResponse({ description: 'Global blocks resolved for a page' })
  getResolvedForPage(@Param('pageId') pageId: string) {
    return this.globals.resolveForPage(pageId);
  }

  /** Public — site-wide defaults only (back-compat) */
  @Get('public/global-blocks')
  @ApiOkResponse({ description: 'Site-wide global blocks' })
  getPublicSiteWide() {
    return this.globals.getAllForScope(null);
  }

  /** Admin — list active scopes (parent ids that have at least one block + null for site-wide) */
  @Get('admin/global-blocks/scopes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiOkResponse({ description: 'List of active scope ids' })
  listScopes() {
    return this.globals.listScopes();
  }

  /** Admin — read one by key for a given scope (?scope=site|<pageId>) */
  @Get('admin/global-blocks/:key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiOkResponse({ description: 'Global block by key for a scope' })
  get(@Param('key') key: string, @Query('scope') scope?: string) {
    return this.globals.ensure(parseScope(scope), key);
  }

  /** Admin — update one by key for a given scope */
  @Patch('admin/global-blocks/:key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiOkResponse({ description: 'Updated global block' })
  update(
    @Param('key') key: string,
    @Body() body: GlobalBlockPayload,
    @Query('scope') scope?: string,
  ) {
    return this.globals.update(parseScope(scope), key, body);
  }
}
