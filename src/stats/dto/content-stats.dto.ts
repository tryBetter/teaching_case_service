import { ApiProperty } from '@nestjs/swagger';

export class ContentStatsDto {
  @ApiProperty({ description: '文章总数', example: 1250 })
  totalArticles: number;

  @ApiProperty({ description: '已发布文章数', example: 1200 })
  publishedArticles: number;

  @ApiProperty({ description: '草稿文章数', example: 50 })
  draftArticles: number;

  @ApiProperty({ description: '推荐文章数', example: 25 })
  featuredArticles: number;

  @ApiProperty({ description: '今日新增文章', example: 12 })
  todayNewArticles: number;

  @ApiProperty({ description: '本周新增文章', example: 85 })
  weekNewArticles: number;

  @ApiProperty({ description: '本月新增文章', example: 320 })
  monthNewArticles: number;

  @ApiProperty({ description: '评论总数', example: 3500 })
  totalComments: number;

  @ApiProperty({ description: '今日新增评论', example: 45 })
  todayNewComments: number;

  @ApiProperty({ description: '收藏总数', example: 2800 })
  totalFavorites: number;

  @ApiProperty({ description: '笔记总数', example: 1200 })
  totalNotes: number;

  @ApiProperty({ description: '媒体文件总数', example: 850 })
  totalMedia: number;

  @ApiProperty({ description: '图片数量', example: 650 })
  imageCount: number;

  @ApiProperty({ description: '视频数量', example: 200 })
  videoCount: number;

  @ApiProperty({ description: '统计时间', example: '2024-01-01T00:00:00.000Z' })
  generatedAt: Date;
}
