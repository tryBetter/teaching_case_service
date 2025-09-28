import { ApiProperty } from '@nestjs/swagger';

export class PopularContentDto {
  @ApiProperty({ description: '内容ID', example: 1 })
  id: number;

  @ApiProperty({ description: '内容标题', example: '热门教学案例' })
  title: string;

  @ApiProperty({ description: '作者名称', example: '张老师' })
  authorName: string;

  @ApiProperty({ description: '访问量', example: 1250 })
  viewCount: number;

  @ApiProperty({ description: '点赞数', example: 89 })
  likeCount: number;

  @ApiProperty({ description: '评论数', example: 23 })
  commentCount: number;

  @ApiProperty({ description: '收藏数', example: 45 })
  favoriteCount: number;

  @ApiProperty({ description: '创建时间', example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({
    description: '最后更新时间',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

export class PopularContentStatsDto {
  @ApiProperty({ description: '热门文章', type: [PopularContentDto] })
  popularArticles: PopularContentDto[];

  @ApiProperty({ description: '热门评论', type: [PopularContentDto] })
  popularComments: PopularContentDto[];

  @ApiProperty({ description: '统计时间', example: '2024-01-01T00:00:00.000Z' })
  generatedAt: Date;
}
