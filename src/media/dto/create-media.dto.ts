import { ApiProperty } from '@nestjs/swagger';

export class CreateMediaDto {
  @ApiProperty({
    description: '媒体类型',
    example: 'IMAGE',
    enum: ['IMAGE', 'VIDEO'],
  })
  type: 'IMAGE' | 'VIDEO';

  @ApiProperty({
    description: '媒体文件URL',
    example: 'https://example.com/image.jpg',
  })
  url: string;

  @ApiProperty({
    description: '关联的文章ID列表',
    example: [1, 2, 3],
    type: [Number],
    required: false,
  })
  articleIds?: number[];
}
