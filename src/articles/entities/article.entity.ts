import { ApiProperty } from '@nestjs/swagger';

export class Article {
  @ApiProperty({ description: '文章ID', example: 1 })
  id: number;

  @ApiProperty({ description: '文章标题', example: '如何学习 NestJS' })
  title: string;

  @ApiProperty({
    description: '文章内容',
    example: '这是一篇关于 NestJS 的学习文章...',
    required: false,
  })
  content?: string;

  @ApiProperty({
    description: '文章封面图片URL',
    example: 'https://example.com/cover.jpg',
    required: false,
  })
  cover?: string;

  @ApiProperty({
    description: '文章简介',
    example: '本文介绍了 NestJS 的基本概念和使用方法...',
    required: false,
  })
  summary?: string;

  @ApiProperty({ description: '是否发布', example: false })
  published: boolean;

  @ApiProperty({ description: '创建时间', example: '2023-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间', example: '2023-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ description: '作者ID', example: 1 })
  authorId: number;

  @ApiProperty({ description: '分类ID', example: 1 })
  categoryId: number;

  @ApiProperty({ description: '作者信息', required: false })
  author?: any;

  @ApiProperty({ description: '分类信息', required: false })
  category?: any;

  @ApiProperty({ description: '筛选条件列表', required: false })
  filterConditions?: any[];

  @ApiProperty({ description: '评论列表', required: false })
  comments?: any[];

  @ApiProperty({ description: '媒体文件列表', required: false })
  media?: any[];
}
