import { ApiProperty } from '@nestjs/swagger';

export class CreateArticleDto {
  @ApiProperty({ description: '文章标题', example: '如何学习 NestJS' })
  title: string;

  @ApiProperty({
    description: '文章内容',
    example: '这是一篇关于 NestJS 的学习文章...',
    required: false,
  })
  content?: string;

  @ApiProperty({ description: '是否发布', example: false, required: false })
  published?: boolean;

  @ApiProperty({ description: '作者ID', example: 1 })
  authorId: number;
}
