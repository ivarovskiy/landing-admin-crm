import { ApiProperty } from "@nestjs/swagger"
import { IsIn, IsString, Matches, MinLength } from "class-validator"

export class CreatePageDto {
  @ApiProperty({ example: "about" })
  @IsString()
  @MinLength(2)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "slug must be kebab-case (a-z, 0-9, -)",
  })
  slug!: string

  @ApiProperty({ enum: ["uk", "en"], example: "uk" })
  @IsIn(["uk", "en"])
  locale!: "uk" | "en"
}