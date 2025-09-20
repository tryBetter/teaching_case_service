import { PartialType } from '@nestjs/swagger';
import { CreateArticleDto } from './create-article.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsBoolean,
  IsNumber,
  IsInt,
  IsPositive,
  IsArray,
} from 'class-validator';

export class UpdateArticleDto extends PartialType(CreateArticleDto) {
  @ApiProperty({
    description: '文章分类ID',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsInt()
  @IsPositive()
  @IsOptional()
  categoryId?: number;

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
