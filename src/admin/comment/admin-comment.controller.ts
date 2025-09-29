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
import { AdminCommentService } from './admin-comment.service';
import { RequireSuperAdmin } from '../decorators/super-admin.decorator';
import { SuperAdminGuard } from '../guards/super-admin.guard';

@ApiTags('后台管理-评论管理')
@ApiBearerAuth('JWT-auth')
@Controller('admin/comments')
@UseGuards(SuperAdminGuard)
export class AdminCommentController {
  constructor(private readonly adminCommentService: AdminCommentService) {}

  @ApiOperation({
    summary: '获取所有评论',
    description: '超级管理员获取系统中所有评论列表',
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
  @RequireSuperAdmin()
  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.adminCommentService.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
    });
  }

  @ApiOperation({
    summary: '删除评论',
    description: '超级管理员删除评论',
  })
  @ApiParam({ name: 'id', description: '评论ID' })
  @RequireSuperAdmin()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.adminCommentService.remove(+id);
  }

  @ApiOperation({
    summary: '获取评论统计信息',
    description: '获取评论相关的统计数据',
  })
  @RequireSuperAdmin()
  @Get('stats/overview')
  async getCommentStats() {
    return this.adminCommentService.getCommentStats();
  }
}
