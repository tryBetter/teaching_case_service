import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateFilterConditionTypeDto {
  @ApiProperty({
    description: '筛选条件类型名称',
    example: '知识点',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: '筛选条件类型描述',
    example: '文章涉及的知识点分类',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
