import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { IsObject, IsOptional, IsString, MinLength } from "class-validator"

export class CreateBlockDto {
  @ApiProperty({ example: "hero" })
  @IsString()
  @MinLength(1)
  type!: string

  @ApiProperty({ example: "v1" })
  @IsString()
  @MinLength(1)
  variant!: string

  @ApiPropertyOptional({ type: "object", additionalProperties: true })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>
}