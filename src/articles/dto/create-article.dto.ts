import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsInt,
  IsPositive,
  IsArray,
} from 'class-validator';

export class CreateArticleDto {
  @ApiProperty({ description: '文章标题', example: '如何学习 NestJS' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: '文章内容',
    example: '这是一篇关于 NestJS 的学习文章...',
    required: false,
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ description: '是否发布', example: false, required: false })
  @IsBoolean()
  @IsOptional()
  published?: boolean;

  @ApiProperty({ description: '作者ID', example: 1 })
  @IsNumber()
  @IsInt()
  @IsPositive()
  authorId: number;

  @ApiProperty({
    description: '文章分类ID',
    example: 1,
    required: true,
  })
  @IsNumber()
  @IsInt()
  @IsPositive()
  categoryId: number;

  @ApiProperty({
    description: '筛选条件ID列表',
    example: [1, 2, 3],
    type: [Number],
    required: false,
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @IsOptional()
  filterConditionIds?: number[];
}
