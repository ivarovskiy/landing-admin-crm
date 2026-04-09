import { ApiProperty } from "@nestjs/swagger"

export class AdminPageShortDto {
  @ApiProperty() id!: string
  @ApiProperty() slug!: string
  @ApiProperty() locale!: string
  @ApiProperty({ enum: ["draft", "published"] }) status!: "draft" | "published"
}

export class AdminPageShortResponseDto {
  @ApiProperty({ type: AdminPageShortDto })
  page!: AdminPageShortDto
}