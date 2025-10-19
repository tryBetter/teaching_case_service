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

  @ApiProperty({
    description: '上传者用户ID',
    example: 1,
    required: false,
  })
  uploaderId?: number;

  @ApiProperty({
    description: '原始文件名',
    example: 'image.jpg',
    required: false,
  })
  originalName?: string;

  @ApiProperty({
    description: '文件大小（字节）',
    example: 123456,
    required: false,
  })
  size?: number;

  @ApiProperty({
    description: '预览图片的base64字符串',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...',
    required: false,
  })
  previewBase64?: string;
}
