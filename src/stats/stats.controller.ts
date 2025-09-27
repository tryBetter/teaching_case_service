import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { SystemStatsDto } from './dto/system-stats.dto';
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
}
