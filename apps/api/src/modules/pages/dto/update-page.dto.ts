import { ApiPropertyOptional } from "@nestjs/swagger"
import { IsOptional, IsString, Matches, MinLength } from "class-validator"

export class UpdatePageDto {
  @ApiPropertyOptional({ example: "about-us" })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "slug must be kebab-case (a-z, 0-9, -)",
  })
  slug?: string
}