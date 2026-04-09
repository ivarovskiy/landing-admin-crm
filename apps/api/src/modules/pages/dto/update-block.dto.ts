import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmptyObject, IsObject } from "class-validator"

export class UpdateBlockDto {
  @ApiProperty({ type: "object", additionalProperties: true })
  @IsObject()
  @IsNotEmptyObject()
  data!: Record<string, any>
}