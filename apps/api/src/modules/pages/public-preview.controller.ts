import { Controller, Get, Param, Query } from "@nestjs/common"
import { ApiTags } from "@nestjs/swagger"
import { PagesService } from "./pages.service"
import { PreviewTokenService } from "./preview-token.service"

@ApiTags("public/preview")
@Controller({ path: "public/preview", version: "1" })
export class PublicPreviewController {
  constructor(
    private readonly pages: PagesService,
    private readonly previewTokens: PreviewTokenService,
  ) {}

  @Get("pages/:id")
  async getPreviewPage(@Param("id") id: string, @Query("token") token: string) {
    this.previewTokens.verify(token, id)
    return this.pages.getPageModelById(id) // зробимо метод нижче
  }
}