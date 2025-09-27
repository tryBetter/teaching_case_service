import { ApiProperty } from '@nestjs/swagger';

export class HotArticle {
  @ApiProperty({ description: '文章ID', example: 1 })
  id: number;

  @ApiProperty({ description: '文章标题', example: '教学案例标题' })
  title: string;

  @ApiProperty({ description: '浏览量', example: 1250 })
  viewCount: number;

  @ApiProperty({ description: '点赞数量', example: 89 })
  likeCount: number;

  @ApiProperty({ description: '评论数量', example: 23 })
  commentCount: number;

  @ApiProperty({ description: '创建时间', example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '作者姓名', example: '张老师' })
  authorName: string;
}
