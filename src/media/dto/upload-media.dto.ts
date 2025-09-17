import { ApiProperty } from '@nestjs/swagger';

export class UploadMediaDto {
  @ApiProperty({
    description: '关联的文章ID列表',
    example: [1, 2, 3],
    type: [Number],
    required: false,
  })
  articleIds?: number[];
}
