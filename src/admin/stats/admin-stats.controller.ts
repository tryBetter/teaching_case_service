import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminStatsService } from './admin-stats.service';
import { RequireSuperAdmin } from '../decorators/super-admin.decorator';
import { SuperAdminGuard } from '../guards/super-admin.guard';

@ApiTags('后台管理-统计分析')
@ApiBearerAuth('JWT-auth')
@Controller('admin/stats')
@UseGuards(SuperAdminGuard)
export class AdminStatsController {
  constructor(private readonly adminStatsService: AdminStatsService) {}

  @ApiOperation({
    summary: '获取系统统计概览',
    description: '超级管理员获取系统整体统计数据',
  })
  @RequireSuperAdmin()
  @Get('overview')
  async getSystemStats() {
    return this.adminStatsService.getSystemStats();
  }

  @ApiOperation({
    summary: '获取用户统计数据',
    description: '获取用户相关的统计数据',
  })
  @RequireSuperAdmin()
  @Get('users')
  async getUserStats() {
    return this.adminStatsService.getUserStats();
  }

  @ApiOperation({
    summary: '获取内容统计数据',
    description: '获取内容相关的统计数据',
  })
  @RequireSuperAdmin()
  @Get('content')
  async getContentStats() {
    return this.adminStatsService.getContentStats();
  }

  @ApiOperation({
    summary: '获取时间范围统计数据',
    description: '获取指定时间范围内的统计数据',
  })
  @ApiQuery({
    name: 'startDate',
    description: '开始日期',
    example: '2024-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endDate',
    description: '结束日期',
    example: '2024-01-31T23:59:59.999Z',
  })
  @RequireSuperAdmin()
  @Get('time-range')
  async getTimeRangeStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.adminStatsService.getTimeRangeStats(
      new Date(startDate),
      new Date(endDate),
    );
  }
}
