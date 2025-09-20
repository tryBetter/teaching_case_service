import { PartialType } from '@nestjs/swagger';
import { CreateFilterConditionTypeDto } from './create-filter-condition-type.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateFilterConditionTypeDto extends PartialType(
  CreateFilterConditionTypeDto,
) {
  @ApiProperty({
    description: '筛选条件类型名称',
    example: '知识点',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({
    description: '筛选条件类型描述',
    example: '文章涉及的知识点分类',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
