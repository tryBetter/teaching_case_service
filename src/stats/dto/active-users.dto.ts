import { ApiProperty } from '@nestjs/swagger';

export class ActiveUserDto {
  @ApiProperty({ description: '用户ID', example: 1 })
  id: number;

  @ApiProperty({ description: '用户名称', example: '张老师' })
  name: string;

  @ApiProperty({ description: '用户邮箱', example: 'teacher@example.com' })
  email: string;

  @ApiProperty({ description: '用户角色', example: '教师' })
  role: string;

  @ApiProperty({ description: '文章数量', example: 15 })
  articleCount: number;

  @ApiProperty({ description: '评论数量', example: 45 })
  commentCount: number;

  @ApiProperty({ description: '笔记数量', example: 12 })
  noteCount: number;

  @ApiProperty({ description: '收藏数量', example: 28 })
  favoriteCount: number;

  @ApiProperty({
    description: '最后活跃时间',
    example: '2024-01-01T00:00:00.000Z',
  })
  lastActiveAt: Date;

  @ApiProperty({ description: '活跃度评分', example: 85.5 })
  activityScore: number;
}

export class ActiveUsersStatsDto {
  @ApiProperty({ description: '活跃用户列表', type: [ActiveUserDto] })
  activeUsers: ActiveUserDto[];

  @ApiProperty({ description: '总活跃用户数', example: 120 })
  totalActiveUsers: number;

  @ApiProperty({ description: '今日活跃用户数', example: 45 })
  todayActiveUsers: number;

  @ApiProperty({ description: '本周活跃用户数', example: 85 })
  weekActiveUsers: number;

  @ApiProperty({ description: '本月活跃用户数', example: 120 })
  monthActiveUsers: number;

  @ApiProperty({ description: '统计时间', example: '2024-01-01T00:00:00.000Z' })
  generatedAt: Date;
}
