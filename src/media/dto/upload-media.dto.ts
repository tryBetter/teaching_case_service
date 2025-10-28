import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsArray, IsNumber } from 'class-validator';

export class UploadMediaDto {
  @ApiProperty({
    description: '关联的文章ID列表',
    example: [1, 2, 3],
    type: [Number],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: '文章ID列表必须是数组' })
  @IsNumber({}, { each: true, message: '文章ID必须是数字' })
  articleIds?: number[];
}
