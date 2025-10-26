import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ViewHistoryService } from './view-history.service';
import { CreateViewHistoryDto } from './dto/create-view-history.dto';
import { QueryViewHistoryDto } from './dto/query-view-history.dto';
import { CurrentUser } from '../auth/user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/user.interface';

@ApiTags('浏览历史管理')
@ApiBearerAuth('JWT-auth')
@Controller('view-history')
export class ViewHistoryController {
  constructor(private readonly viewHistoryService: ViewHistoryService) {}

  @ApiOperation({
    summary: '添加浏览历史（可选接口）',
    description:
      '手动添加文章浏览历史记录。注意：浏览历史会在用户查看文章详情时自动添加，通常不需要手动调用此接口。',
  })
  @ApiResponse({
    status: 201,
    description: '浏览历史创建或更新成功',
  })
  @Post()
  create(
    @Body() createViewHistoryDto: CreateViewHistoryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.viewHistoryService.create(user.userId, createViewHistoryDto);
  }

  @ApiOperation({
    summary: '获取浏览历史列表',
    description: '获取当前用户的浏览历史列表，支持分页、搜索、过滤和排序',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '页码',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '每页数量',
  })
  @ApiQuery({
    name: 'keyword',
    required: false,
    type: String,
    description: '搜索关键词（文章标题）',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: Number,
    description: '分类ID过滤',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['asc', 'desc'],
    description: '排序方式',
  })
  @ApiResponse({
    status: 200,
    description: '获取浏览历史列表成功',
  })
  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryViewHistoryDto,
  ) {
    return this.viewHistoryService.findAll(user.userId, query);
  }

  @ApiOperation({
    summary: '获取单条浏览历史',
    description: '获取指定文章的浏览历史记录',
  })
  @ApiParam({ name: 'articleId', type: Number, description: '文章ID' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
  })
  @Get(':articleId')
  findOne(
    @Param('articleId') articleId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.viewHistoryService.findOne(user.userId, +articleId);
  }

  @ApiOperation({
    summary: '删除单条浏览历史',
    description: '删除指定文章的浏览历史记录',
  })
  @ApiParam({ name: 'articleId', type: Number, description: '文章ID' })
  @ApiResponse({
    status: 200,
    description: '删除成功',
  })
  @Delete(':articleId')
  remove(
    @Param('articleId') articleId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.viewHistoryService.remove(user.userId, +articleId);
  }

  @ApiOperation({
    summary: '清空所有浏览历史',
    description: '清空当前用户的所有浏览历史记录',
  })
  @ApiResponse({
    status: 200,
    description: '清空成功',
  })
  @Delete('clear/all')
  clearAll(@CurrentUser() user: AuthenticatedUser) {
    return this.viewHistoryService.clearAll(user.userId);
  }

  @ApiOperation({
    summary: '获取用户数据统计',
    description: '获取当前用户的浏览历史、收藏、笔记、评论等数据统计',
  })
  @ApiResponse({
    status: 200,
    description: '获取统计成功',
    schema: {
      type: 'object',
      properties: {
        viewHistoryCount: {
          type: 'number',
          example: 25,
          description: '浏览历史数量',
        },
        favoriteCount: {
          type: 'number',
          example: 12,
          description: '收藏文章数量',
        },
        noteCount: {
          type: 'number',
          example: 8,
          description: '笔记数量',
        },
        commentCount: {
          type: 'number',
          example: 15,
          description: '评论数量',
        },
      },
    },
  })
  @Get('stats/user')
  getUserStats(@CurrentUser() user: AuthenticatedUser) {
    return this.viewHistoryService.getUserStats(user.userId);
  }
}
