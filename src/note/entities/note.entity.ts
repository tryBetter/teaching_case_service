import { ApiProperty } from '@nestjs/swagger';

export class Note {
  @ApiProperty({ description: '笔记ID', example: 1 })
  id: number;

  @ApiProperty({
    description: '笔记内容',
    example: '这篇文章很有用，特别是关于NestJS的依赖注入部分。',
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
    description: '用户ID',
    example: 1,
  })
  userId: number;

  @ApiProperty({
    description: '文章ID',
    example: 1,
  })
  articleId: number;

  @ApiProperty({
    description: '用户信息',
  })
  user?: any;

  @ApiProperty({
    description: '文章信息',
  })
  article?: any;
}
