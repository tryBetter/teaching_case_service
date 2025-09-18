import { ApiProperty } from '@nestjs/swagger';

export class Comment {
  @ApiProperty({ description: '评论ID', example: 1 })
  id: number;

  @ApiProperty({
    description: '评论内容',
    example: '这是一条很有用的评论！',
  })
  content: string;

  @ApiProperty({
    description: '创建时间',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '更新时间',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: '评论作者ID',
    example: 1,
  })
  authorId: number;

  @ApiProperty({
    description: '被评论的文章ID',
    example: 1,
  })
  articleId: number;

  @ApiProperty({
    description: '父评论ID，用于楼中楼回复',
    example: 1,
    required: false,
  })
  parentId?: number;

  @ApiProperty({
    description: '作者信息',
  })
  author?: any;

  @ApiProperty({
    description: '文章信息',
  })
  article?: any;

  @ApiProperty({
    description: '子评论列表',
    type: 'array',
    items: { type: 'object' },
  })
  replies?: any[];
}
