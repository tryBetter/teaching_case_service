import { ApiProperty } from '@nestjs/swagger';

export class CommentLike {
  @ApiProperty({ description: '用户ID', example: 1 })
  userId: number;

  @ApiProperty({ description: '评论ID', example: 1 })
  commentId: number;

  @ApiProperty({
    description: '点赞时间',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '用户信息',
  })
  user?: any;

  @ApiProperty({
    description: '评论信息',
  })
  comment?: any;
}
