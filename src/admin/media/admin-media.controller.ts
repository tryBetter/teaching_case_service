import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminMediaService } from './admin-media.service';
import { RequireSuperAdmin } from '../decorators/super-admin.decorator';
import { SuperAdminGuard } from '../guards/super-admin.guard';
import { MediaQueryDto } from './dto/media-query.dto';

@ApiTags('后台管理-媒体管理')
@ApiBearerAuth('JWT-auth')
@Controller('admin/media')
@UseGuards(SuperAdminGuard)
export class AdminMediaController {
  constructor(private readonly adminMediaService: AdminMediaService) {}

  @ApiOperation({
    summary: '获取媒体文件列表（支持高级搜索）',
    description:
      '超级管理员获取系统中所有媒体文件列表，支持分页、搜索、排序等功能',
  })
  @ApiResponse({
    status: 200,
    description: '返回媒体文件列表和分页信息',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              type: { type: 'string', enum: ['IMAGE', 'VIDEO'] },
              url: { type: 'string' },
              originalName: { type: 'string' },
              size: { type: 'number' },
              createdAt: { type: 'string', format: 'date-time' },
              articleCount: { type: 'number' },
              articles: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    title: { type: 'string' },
                    author: {
                      type: 'object',
                      properties: {
                        id: { type: 'number' },
                        name: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
            hasNext: { type: 'boolean' },
            hasPrev: { type: 'boolean' },
          },
        },
        filters: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            keyword: { type: 'string' },
            minSize: { type: 'number' },
            maxSize: { type: 'number' },
            startDate: { type: 'string' },
            endDate: { type: 'string' },
            sortBy: { type: 'string' },
            sortOrder: { type: 'string', enum: ['asc', 'desc'] },
          },
        },
      },
    },
  })
  @RequireSuperAdmin()
  @Get()
  async findAll(@Query() queryDto: MediaQueryDto) {
    return this.adminMediaService.findAll(queryDto);
  }

  @ApiOperation({
    summary: '获取单个媒体文件详情',
    description: '超级管理员获取指定媒体文件的详细信息，包括关联的文章',
  })
  @ApiParam({ name: 'id', description: '媒体文件ID' })
  @ApiResponse({
    status: 200,
    description: '返回媒体文件详情',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        type: { type: 'string', enum: ['IMAGE', 'VIDEO'] },
        url: { type: 'string' },
        originalName: { type: 'string' },
        size: { type: 'number' },
        createdAt: { type: 'string', format: 'date-time' },
        articles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              title: { type: 'string' },
              author: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: '媒体文件不存在' })
  @RequireSuperAdmin()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.adminMediaService.findOne(+id);
  }

  @ApiOperation({
    summary: '删除媒体文件',
    description: '超级管理员删除媒体文件',
  })
  @ApiParam({ name: 'id', description: '媒体文件ID' })
  @RequireSuperAdmin()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.adminMediaService.remove(+id);
  }

  @ApiOperation({
    summary: '获取媒体统计信息',
    description: '获取媒体文件相关的统计数据，包括总数、类型分布、大小统计等',
  })
  @ApiResponse({
    status: 200,
    description: '返回媒体统计信息',
    schema: {
      type: 'object',
      properties: {
        totalMedia: { type: 'number' },
        imageCount: { type: 'number' },
        videoCount: { type: 'number' },
        totalSize: { type: 'number' },
        averageSize: { type: 'number' },
        todayUploads: { type: 'number' },
        weekUploads: { type: 'number' },
        monthUploads: { type: 'number' },
      },
    },
  })
  @RequireSuperAdmin()
  @Get('stats/overview')
  async getMediaStats() {
    return this.adminMediaService.getMediaStats();
  }

  @ApiOperation({
    summary: '获取媒体类型分布统计',
    description: '获取不同媒体类型的分布统计信息',
  })
  @ApiResponse({
    status: 200,
    description: '返回媒体类型分布统计',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['IMAGE', 'VIDEO'] },
          count: { type: 'number' },
          totalSize: { type: 'number' },
        },
      },
    },
  })
  @RequireSuperAdmin()
  @Get('stats/distribution')
  async getMediaTypeDistribution() {
    return this.adminMediaService.getMediaTypeDistribution();
  }

  @ApiOperation({
    summary: '获取最近上传的媒体文件',
    description: '获取最近上传的媒体文件列表',
  })
  @ApiQuery({
    name: 'limit',
    description: '返回数量限制',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: '返回最近上传的媒体文件列表',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          type: { type: 'string', enum: ['IMAGE', 'VIDEO'] },
          url: { type: 'string' },
          originalName: { type: 'string' },
          size: { type: 'number' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @RequireSuperAdmin()
  @Get('recent')
  async getRecentMedia(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit) : 10;
    return this.adminMediaService.getRecentMedia(limitNum);
  }

  @ApiOperation({
    summary: '批量删除媒体文件',
    description: '根据ID列表批量删除媒体文件',
  })
  @ApiResponse({
    status: 200,
    description: '返回删除结果',
    schema: {
      type: 'object',
      properties: {
        deletedCount: { type: 'number' },
        failedCount: { type: 'number' },
        errors: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  @RequireSuperAdmin()
  @Delete('batch')
  async batchRemove(@Query('ids') ids: string) {
    const idList = ids
      .split(',')
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id));
    const results = {
      deletedCount: 0,
      failedCount: 0,
      errors: [] as string[],
    };

    for (const id of idList) {
      try {
        await this.adminMediaService.remove(id);
        results.deletedCount++;
      } catch (error) {
        results.failedCount++;
        const message = error instanceof Error ? error.message : String(error);
        results.errors.push(`ID ${id}: ${message}`);
      }
    }

    return results;
  }
}
