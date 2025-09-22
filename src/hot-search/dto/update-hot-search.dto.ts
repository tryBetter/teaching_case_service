import { PartialType } from '@nestjs/swagger';
import { CreateHotSearchDto } from './create-hot-search.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsBoolean,
} from 'class-validator';

export class UpdateHotSearchDto extends PartialType(CreateHotSearchDto) {
  @ApiProperty({
    description: '热搜关键词',
    example: 'NestJS 教程',
    required: false,
  })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiProperty({
    description: '热搜描述',
    example: '最新的 NestJS 学习教程和最佳实践',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: '排序权重，数字越大越靠前',
    example: 100,
    required: false,
  })
  @IsNumber()
  @IsInt()
  @IsOptional()
  order?: number;

  @ApiProperty({
    description: '是否启用',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
