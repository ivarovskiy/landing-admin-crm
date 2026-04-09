import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiConsumes, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../../common/rbac/roles.guard";
import { Roles } from "../../common/rbac/roles.decorator";
import { MediaService } from "./media.service";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
];

@ApiTags("admin/media")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "editor")
@Controller({ path: "admin/media", version: "1" })
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post("upload")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("No file provided");
    }
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type: ${file.mimetype}. Allowed: ${ALLOWED_MIMES.join(", ")}`,
      );
    }
    return this.media.upload(file);
  }

  @Get()
  @ApiOkResponse({ description: "List media assets" })
  async list(@Query("take") take?: number, @Query("skip") skip?: number) {
    return this.media.list(take ?? 50, skip ?? 0);
  }

  @Delete(":id")
  @ApiOkResponse({ schema: { example: { ok: true } } })
  async remove(@Param("id") id: string) {
    return this.media.delete(id);
  }
}
