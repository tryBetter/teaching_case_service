import { ApiProperty } from '@nestjs/swagger';

export class TimeRangeStatsDto {
  @ApiProperty({ description: '开始时间', example: '2024-01-01T00:00:00.000Z' })
  startDate: Date;

  @ApiProperty({ description: '结束时间', example: '2024-01-31T23:59:59.999Z' })
  endDate: Date;

  @ApiProperty({ description: '时间范围内的用户数', example: 45 })
  users: number;

  @ApiProperty({ description: '时间范围内的文章数', example: 120 })
  articles: number;

  @ApiProperty({ description: '时间范围内的评论数', example: 350 })
  comments: number;

  @ApiProperty({ description: '时间范围内的收藏数', example: 280 })
  favorites: number;

  @ApiProperty({ description: '时间范围内的笔记数', example: 150 })
  notes: number;

  @ApiProperty({ description: '时间范围内的访问量', example: 12500 })
  visits: number;

  @ApiProperty({ description: '统计时间', example: '2024-01-01T00:00:00.000Z' })
  generatedAt: Date;
}
