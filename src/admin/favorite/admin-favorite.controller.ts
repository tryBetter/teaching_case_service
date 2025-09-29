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
import { AdminFavoriteService } from './admin-favorite.service';
import { RequireSuperAdmin } from '../decorators/super-admin.decorator';
import { SuperAdminGuard } from '../guards/super-admin.guard';

@ApiTags('后台管理-收藏管理')
@ApiBearerAuth('JWT-auth')
@Controller('admin/favorites')
@UseGuards(SuperAdminGuard)
export class AdminFavoriteController {
  constructor(private readonly adminFavoriteService: AdminFavoriteService) {}

  @ApiOperation({
    summary: '获取所有收藏',
    description: '超级管理员获取系统中所有收藏列表',
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
    return this.adminFavoriteService.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
    });
  }

  @ApiOperation({
    summary: '删除收藏',
    description: '超级管理员删除收藏记录',
  })
  @ApiParam({ name: 'userId', description: '用户ID' })
  @ApiParam({ name: 'articleId', description: '文章ID' })
  @RequireSuperAdmin()
  @Delete(':userId/:articleId')
  async remove(
    @Param('userId') userId: string,
    @Param('articleId') articleId: string,
  ) {
    return this.adminFavoriteService.remove(+userId, +articleId);
  }
}
