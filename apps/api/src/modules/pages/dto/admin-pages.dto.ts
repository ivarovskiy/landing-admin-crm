import { ApiProperty } from "@nestjs/swagger"

export class AdminBlockDto {
  @ApiProperty() id!: string
  @ApiProperty() type!: string
  @ApiProperty() variant!: string
  @ApiProperty() order!: number

  @ApiProperty({ type: "object", additionalProperties: true, nullable: true })
  data!: Record<string, any> | null

  @ApiProperty({ type: "string", format: "date-time" })
  createdAt!: Date

  @ApiProperty({ type: "string", format: "date-time" })
  updatedAt!: Date
}

export class AdminPageDto {
  @ApiProperty() id!: string
  @ApiProperty() slug!: string
  @ApiProperty() locale!: string
  @ApiProperty({ enum: ["draft", "published"] })
  status!: "draft" | "published"

  @ApiProperty({ type: "object", additionalProperties: true, nullable: true })
  seo!: Record<string, any> | null

  @ApiProperty({ type: "object", additionalProperties: true, nullable: true })
  settings!: Record<string, any> | null

  @ApiProperty({ type: "string", format: "date-time" })
  createdAt!: Date

  @ApiProperty({ type: "string", format: "date-time" })
  updatedAt!: Date

  @ApiProperty({ type: "string", format: "date-time", nullable: true })
  publishedAt!: Date | null

  @ApiProperty({ type: [AdminBlockDto] })
  blocks!: AdminBlockDto[]
}

export class AdminPageResponseDto {
  @ApiProperty({ type: AdminPageDto })
  page!: AdminPageDto
}