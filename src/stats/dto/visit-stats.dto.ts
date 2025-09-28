import { ApiProperty } from '@nestjs/swagger';

export class VisitStatsDto {
  @ApiProperty({ description: '今日访问量', example: 1250 })
  todayVisits: number;

  @ApiProperty({ description: '昨日访问量', example: 1180 })
  yesterdayVisits: number;

  @ApiProperty({ description: '本周访问量', example: 8500 })
  weekVisits: number;

  @ApiProperty({ description: '本月访问量', example: 35000 })
  monthVisits: number;

  @ApiProperty({ description: '总访问量', example: 125000 })
  totalVisits: number;

  @ApiProperty({ description: '今日独立访客', example: 450 })
  todayUniqueVisitors: number;

  @ApiProperty({ description: '本周独立访客', example: 2800 })
  weekUniqueVisitors: number;

  @ApiProperty({ description: '本月独立访客', example: 12000 })
  monthUniqueVisitors: number;

  @ApiProperty({ description: '平均每日访问量', example: 1200 })
  averageDailyVisits: number;

  @ApiProperty({ description: '统计时间', example: '2024-01-01T00:00:00.000Z' })
  generatedAt: Date;
}
