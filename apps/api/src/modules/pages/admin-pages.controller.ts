import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common"
import { ApiOkResponse, ApiTags } from "@nestjs/swagger"
import { Roles } from "../../common/rbac/roles.decorator"
import { RolesGuard } from "../../common/rbac/roles.guard"
import { JwtAuthGuard } from "../auth/jwt-auth.guard"
import { PagesService } from "./pages.service"
import { PreviewTokenService } from "./preview-token.service"
import { AdminPageResponseDto } from "../pages/dto/admin-pages.dto"
import { CreatePageDto } from "./dto/create-page.dto"
import { AdminPageShortResponseDto } from "./dto/admin-page-short.dto"
import { UpdatePageDto } from "./dto/update-page.dto"
import { CreateBlockDto } from "./dto/create-block.dto"

@ApiTags("admin/pages")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "editor", "viewer")
@Controller({ path: "admin/pages", version: "1" })
export class AdminPagesController {
  constructor(
    private readonly pages: PagesService,
    private readonly previewTokens: PreviewTokenService,
  ) { }

  @Get()
  async listPages(@Query("skip") skip?: string, @Query("take") take?: string) {
    return this.pages.listAdminPages({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
    })
  }

  @Post(":id/preview-token")
  @Roles("admin", "editor")
  @ApiOkResponse({ schema: { example: { token: "jwt...", expiresAt: "2026-01-01T00:00:00.000Z" } } })
  async createPreviewToken(@Param("id") id: string) {
    // (опційно) перевірити, що сторінка існує:
    await this.pages.ensureExists(id)
    return this.previewTokens.create(id)
  }

  @ApiOkResponse({ type: AdminPageResponseDto })
  @Get(":id")
  async getPage(@Param("id") id: string): Promise<AdminPageResponseDto> {
    const page = await this.pages.getAdminPageById(id)
    return { page: page as any }
  }

  @Post(":id/publish")
  @Roles("admin", "editor")
  @ApiOkResponse({ schema: { example: { ok: true } } })
  async publish(@Param("id") id: string) {
    await this.pages.publishPage(id)
    return { ok: true }
  }

  @Post(":id/unpublish")
  @Roles("admin", "editor")
  @ApiOkResponse({ schema: { example: { ok: true } } })
  async unpublish(@Param("id") id: string) {
    await this.pages.unpublishPage(id)
    return { ok: true }
  }

  @Post()
  @Roles("admin", "editor")
  @ApiOkResponse({ schema: { example: { page: { id: "…", slug: "about", locale: "uk", status: "draft" } } } })
  async create(@Body() dto: CreatePageDto) {
    const page = await this.pages.createPage(dto)
    return { page }
  }

  @Post(":id/duplicate")
  @Roles("admin", "editor")
  @ApiOkResponse({ type: AdminPageShortResponseDto })
  async duplicate(@Param("id") id: string): Promise<AdminPageShortResponseDto> {
    const page = await this.pages.duplicatePage(id)
    return { page: page as any }
  }

  @Patch(":id")
  @Roles("admin", "editor")
  @ApiOkResponse({ schema: { example: { page: { id: "…", slug: "about-us" } } } })
  async update(@Param("id") id: string, @Body() dto: UpdatePageDto) {
    const page = await this.pages.updatePage(id, dto)
    return { page }
  }

  @Delete(":id")
  @Roles("admin")
  @ApiOkResponse({ schema: { example: { ok: true } } })
  async remove(@Param("id") id: string) {
    return this.pages.deletePage(id)
  }

  @Post(":id/blocks")
  @Roles("admin", "editor")
  @ApiOkResponse({ schema: { example: { block: { id: "…", type: "hero", variant: "v1", order: 8 } } } })
  async createBlock(@Param("id") id: string, @Body() dto: CreateBlockDto) {
    const block = await this.pages.createBlock(id, dto)
    return { block }
  }
}