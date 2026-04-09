import { Body, Controller, Delete, Param, Patch, Post, UseGuards } from "@nestjs/common"
import { ApiOkResponse, ApiTags } from "@nestjs/swagger"
import { Roles } from "../../common/rbac/roles.decorator"
import { RolesGuard } from "../../common/rbac/roles.guard"
import { JwtAuthGuard } from "../auth/jwt-auth.guard"
import { PagesService } from "./pages.service"
import { UpdateBlockDto } from "./dto/update-block.dto"
import { MoveBlockDto } from "./dto/move-block.dto"

@ApiTags("admin/blocks")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "editor")
@Controller({ path: "admin/blocks", version: "1" })
export class AdminBlocksController {
  constructor(private readonly pages: PagesService) { }

  @ApiOkResponse({ schema: { example: { ok: true } } })
  @Patch(":id")
  async updateBlock(@Param("id") id: string, @Body() dto: UpdateBlockDto) {
    await this.pages.updateBlockData(id, dto.data)
    return { ok: true }
  }

  @Post(":id/move")
  @ApiOkResponse({ schema: { example: { ok: true, moved: true } } })
  async move(@Param("id") id: string, @Body() dto: MoveBlockDto) {
    const r = await this.pages.moveBlock(id, dto.direction)
    return { ok: true, ...r }
  }

  @Delete(":id")
  @ApiOkResponse({ schema: { example: { ok: true } } })
  async remove(@Param("id") id: string) {
    return this.pages.deleteBlock(id)
  }
}