import { ApiProperty } from '@nestjs/swagger';

export class TrendDataPointDto {
  @ApiProperty({ description: '日期', example: '2024-01-01' })
  date: string;

  @ApiProperty({ description: '数值', example: 25 })
  value: number;
}

export class UserGrowthTrendDto {
  @ApiProperty({ description: '用户增长趋势数据', type: [TrendDataPointDto] })
  data: TrendDataPointDto[];

  @ApiProperty({ description: '总增长数', example: 150 })
  totalGrowth: number;

  @ApiProperty({ description: '平均日增长', example: 5.0 })
  averageDailyGrowth: number;

  @ApiProperty({ description: '统计时间', example: '2024-01-01T00:00:00.000Z' })
  generatedAt: Date;
}

export class ContentGrowthTrendDto {
  @ApiProperty({ description: '文章增长趋势', type: [TrendDataPointDto] })
  articles: TrendDataPointDto[];

  @ApiProperty({ description: '评论增长趋势', type: [TrendDataPointDto] })
  comments: TrendDataPointDto[];

  @ApiProperty({ description: '收藏增长趋势', type: [TrendDataPointDto] })
  favorites: TrendDataPointDto[];

  @ApiProperty({ description: '统计时间', example: '2024-01-01T00:00:00.000Z' })
  generatedAt: Date;
}

export class VisitTrendDto {
  @ApiProperty({ description: '访问趋势数据', type: [TrendDataPointDto] })
  data: TrendDataPointDto[];

  @ApiProperty({ description: '总访问量', example: 125000 })
  totalVisits: number;

  @ApiProperty({ description: '平均日访问量', example: 4000 })
  averageDailyVisits: number;

  @ApiProperty({ description: '峰值访问量', example: 8500 })
  peakVisits: number;

  @ApiProperty({ description: '峰值日期', example: '2024-01-15' })
  peakDate: string;

  @ApiProperty({ description: '统计时间', example: '2024-01-01T00:00:00.000Z' })
  generatedAt: Date;
}
