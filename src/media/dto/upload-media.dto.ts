import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class UploadMediaDto {
  @ApiProperty({
    description: '关联的文章ID列表，可选参数，不传表示不关联任何文章',
    example: [1, 2, 3],
    type: [Number],
    required: false,
  })
  @IsOptional()
  articleIds?: number[];
}
