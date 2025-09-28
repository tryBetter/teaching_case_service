import { ApiProperty } from '@nestjs/swagger';

export class OverviewStatsDto {
  @ApiProperty({ description: '用户总数', example: 150 })
  totalUsers: number;

  @ApiProperty({ description: '文章总数', example: 1250 })
  totalArticles: number;

  @ApiProperty({ description: '评论总数', example: 3500 })
  totalComments: number;

  @ApiProperty({ description: '收藏总数', example: 2800 })
  totalFavorites: number;

  @ApiProperty({ description: '笔记总数', example: 1200 })
  totalNotes: number;

  @ApiProperty({ description: '媒体文件总数', example: 850 })
  totalMedia: number;

  @ApiProperty({ description: '今日新增用户', example: 5 })
  todayNewUsers: number;

  @ApiProperty({ description: '今日新增文章', example: 12 })
  todayNewArticles: number;

  @ApiProperty({ description: '今日访问量', example: 1250 })
  todayVisits: number;

  @ApiProperty({ description: '统计时间', example: '2024-01-01T00:00:00.000Z' })
  generatedAt: Date;
}
