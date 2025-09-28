import { ApiProperty } from '@nestjs/swagger';

export class UserRoleStatsDto {
  @ApiProperty({ description: '角色名称', example: '教师' })
  roleName: string;

  @ApiProperty({ description: '用户数量', example: 45 })
  count: number;

  @ApiProperty({ description: '占比百分比', example: 30.0 })
  percentage: number;
}

export class UserStatsDto {
  @ApiProperty({ description: '用户总数', example: 150 })
  totalUsers: number;

  @ApiProperty({ description: '今日新增用户', example: 5 })
  todayNewUsers: number;

  @ApiProperty({ description: '本周新增用户', example: 25 })
  weekNewUsers: number;

  @ApiProperty({ description: '本月新增用户', example: 85 })
  monthNewUsers: number;

  @ApiProperty({ description: '活跃用户数（最近30天）', example: 120 })
  activeUsers: number;

  @ApiProperty({ description: '按角色统计', type: [UserRoleStatsDto] })
  roleStats: UserRoleStatsDto[];

  @ApiProperty({ description: '统计时间', example: '2024-01-01T00:00:00.000Z' })
  generatedAt: Date;
}
