import { ApiProperty } from '@nestjs/swagger';

export class Favorite {
  @ApiProperty({ description: '用户ID', example: 1 })
  userId: number;

  @ApiProperty({ description: '文章ID', example: 1 })
  articleId: number;

  @ApiProperty({
    description: '收藏时间',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '用户信息',
  })
  user?: any;

  @ApiProperty({
    description: '文章信息',
  })
  article?: any;
}
