import { ApiProperty } from '@nestjs/swagger';

export class Media {
  @ApiProperty({ description: '媒体ID', example: 1 })
  id: number;

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
    description: '创建时间',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '关联的文章列表',
    type: 'array',
    items: { type: 'object' },
    required: false,
  })
  articles?: any[];
}
