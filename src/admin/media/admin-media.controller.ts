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

@ApiTags('后台管理-媒体管理')
@ApiBearerAuth('JWT-auth')
@Controller('admin/media')
@UseGuards(SuperAdminGuard)
export class AdminMediaController {
  constructor(private readonly adminMediaService: AdminMediaService) {}

  @ApiOperation({
    summary: '获取所有媒体文件',
    description: '超级管理员获取系统中所有媒体文件列表',
  })
  @ApiQuery({
    name: 'page',
    description: '页码',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: '每页数量',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'type',
    description: '媒体类型',
    required: false,
    type: String,
    example: 'IMAGE',
  })
  @RequireSuperAdmin()
  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('type') type?: string,
  ) {
    return this.adminMediaService.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      type: type as 'IMAGE' | 'VIDEO',
    });
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
    description: '获取媒体文件相关的统计数据',
  })
  @RequireSuperAdmin()
  @Get('stats/overview')
  async getMediaStats() {
    return this.adminMediaService.getMediaStats();
  }
}
