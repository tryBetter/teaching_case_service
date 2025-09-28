import {
  Controller,
  Get,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { SystemStatsDto } from './dto/system-stats.dto';
import { OverviewStatsDto } from './dto/overview-stats.dto';
import { UserStatsDto } from './dto/user-stats.dto';
import { ContentStatsDto } from './dto/content-stats.dto';
import { VisitStatsDto } from './dto/visit-stats.dto';
import { TimeRangeStatsDto } from './dto/time-range-stats.dto';
import {
  UserGrowthTrendDto,
  ContentGrowthTrendDto,
  VisitTrendDto,
} from './dto/trend-stats.dto';
import { PopularContentStatsDto } from './dto/popular-content.dto';
import { ActiveUsersStatsDto } from './dto/active-users.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequirePermissions } from '../auth/decorators/roles.decorator';
import { Permission } from '../auth/enums/permissions.enum';

@ApiTags('系统统计')
@ApiBearerAuth('JWT-auth')
@Controller('stats')
@UseGuards(RolesGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @ApiOperation({
    summary: '获取系统统计数据',
    description:
      '获取系统的各项统计数据，包括用户数、文章数、访问量、热门文章、活跃用户等信息',
  })
  @ApiResponse({
    status: 200,
    description: '获取统计数据成功',
    type: SystemStatsDto,
  })
  @ApiResponse({
    status: 403,
    description: '权限不足，需要管理员权限',
  })
  @RequirePermissions([Permission.SYSTEM_ADMIN])
  @Get()
  async getSystemStats(): Promise<SystemStatsDto> {
    return this.statsService.getSystemStats();
  }

  @ApiOperation({
    summary: '获取基础统计数据',
    description: '获取基础的统计数据，包括用户数、文章数等，无需特殊权限',
  })
  @ApiResponse({
    status: 200,
    description: '获取基础统计数据成功',
    schema: {
      type: 'object',
      properties: {
        totalUsers: {
          type: 'number',
          example: 150,
          description: '用户总数',
        },
        totalArticles: {
          type: 'number',
          example: 1250,
          description: '文章总数',
        },
        generatedAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-01T00:00:00.000Z',
          description: '统计时间',
        },
      },
    },
  })
  @Get('basic')
  async getBasicStats() {
    const stats = await this.statsService.getSystemStats();
    return {
      totalUsers: stats.totalUsers,
      totalArticles: stats.totalArticles,
      generatedAt: stats.generatedAt,
    };
  }

  // ==================== 新增统计接口 ====================

  @ApiOperation({
    summary: '获取总体统计数据',
    description: '获取系统总体统计数据，包括用户、文章、评论、收藏等基础数据',
  })
  @ApiResponse({
    status: 200,
    description: '获取总体统计数据成功',
    type: OverviewStatsDto,
  })
  @Get('overview')
  async getOverviewStats(): Promise<OverviewStatsDto> {
    return this.statsService.getOverviewStats();
  }

  @ApiOperation({
    summary: '获取用户统计数据',
    description:
      '获取用户相关统计数据，包括用户总数、新增用户、活跃用户、角色分布等',
  })
  @ApiResponse({
    status: 200,
    description: '获取用户统计数据成功',
    type: UserStatsDto,
  })
  @Get('users')
  async getUserStats(): Promise<UserStatsDto> {
    return this.statsService.getUserStats();
  }

  @ApiOperation({
    summary: '获取内容统计数据',
    description: '获取内容相关统计数据，包括文章、评论、收藏、笔记、媒体文件等',
  })
  @ApiResponse({
    status: 200,
    description: '获取内容统计数据成功',
    type: ContentStatsDto,
  })
  @Get('content')
  async getContentStats(): Promise<ContentStatsDto> {
    return this.statsService.getContentStats();
  }

  @ApiOperation({
    summary: '获取访问统计数据',
    description: '获取访问相关统计数据，包括今日访问量、历史访问量、独立访客等',
  })
  @ApiResponse({
    status: 200,
    description: '获取访问统计数据成功',
    type: VisitStatsDto,
  })
  @Get('visits')
  async getVisitStats(): Promise<VisitStatsDto> {
    return this.statsService.getVisitStats();
  }

  @ApiOperation({
    summary: '获取时间范围统计数据',
    description: '获取指定时间范围内的统计数据',
  })
  @ApiResponse({
    status: 200,
    description: '获取时间范围统计数据成功',
    type: TimeRangeStatsDto,
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
  @Get('time-range')
  async getTimeRangeStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<TimeRangeStatsDto> {
    return this.statsService.getTimeRangeStats(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @ApiOperation({
    summary: '获取用户增长趋势数据',
    description: '获取用户增长趋势数据，支持指定天数',
  })
  @ApiResponse({
    status: 200,
    description: '获取用户增长趋势数据成功',
    type: UserGrowthTrendDto,
  })
  @ApiQuery({
    name: 'days',
    description: '统计天数',
    example: 30,
    required: false,
  })
  @Get('user-growth')
  async getUserGrowthTrend(
    @Query('days', new ParseIntPipe({ optional: true })) days: number = 30,
  ): Promise<UserGrowthTrendDto> {
    return this.statsService.getUserGrowthTrend(days);
  }

  @ApiOperation({
    summary: '获取内容增长趋势数据',
    description: '获取内容增长趋势数据，包括文章、评论、收藏的增长趋势',
  })
  @ApiResponse({
    status: 200,
    description: '获取内容增长趋势数据成功',
    type: ContentGrowthTrendDto,
  })
  @ApiQuery({
    name: 'days',
    description: '统计天数',
    example: 30,
    required: false,
  })
  @Get('content-growth')
  async getContentGrowthTrend(
    @Query('days', new ParseIntPipe({ optional: true })) days: number = 30,
  ): Promise<ContentGrowthTrendDto> {
    return this.statsService.getContentGrowthTrend(days);
  }

  @ApiOperation({
    summary: '获取访问趋势数据',
    description: '获取访问趋势数据，包括每日访问量、峰值等',
  })
  @ApiResponse({
    status: 200,
    description: '获取访问趋势数据成功',
    type: VisitTrendDto,
  })
  @ApiQuery({
    name: 'days',
    description: '统计天数',
    example: 30,
    required: false,
  })
  @Get('visit-trend')
  async getVisitTrend(
    @Query('days', new ParseIntPipe({ optional: true })) days: number = 30,
  ): Promise<VisitTrendDto> {
    return this.statsService.getVisitTrend(days);
  }

  @ApiOperation({
    summary: '获取热门内容数据',
    description: '获取热门内容数据，包括热门文章和热门评论',
  })
  @ApiResponse({
    status: 200,
    description: '获取热门内容数据成功',
    type: PopularContentStatsDto,
  })
  @ApiQuery({
    name: 'limit',
    description: '返回数量限制',
    example: 10,
    required: false,
  })
  @Get('popular-content')
  async getPopularContent(
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ): Promise<PopularContentStatsDto> {
    return this.statsService.getPopularContent(limit);
  }

  @ApiOperation({
    summary: '获取活跃用户数据',
    description: '获取活跃用户数据，包括活跃用户列表和统计信息',
  })
  @ApiResponse({
    status: 200,
    description: '获取活跃用户数据成功',
    type: ActiveUsersStatsDto,
  })
  @ApiQuery({
    name: 'limit',
    description: '返回数量限制',
    example: 20,
    required: false,
  })
  @Get('active-users')
  async getActiveUsers(
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
  ): Promise<ActiveUsersStatsDto> {
    return this.statsService.getActiveUsers(limit);
  }
}
