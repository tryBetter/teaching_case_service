import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { FavoriteService } from './favorite.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { CurrentUser } from '../auth/user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/user.interface';
import { Public } from '../auth/public.decorator';

@ApiTags('收藏管理')
@Controller('favorite')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @ApiOperation({
    summary: '收藏文章',
    description: '将指定文章添加到当前用户的收藏列表中',
  })
  @ApiResponse({
    status: 201,
    description: '收藏成功',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'number', example: 1, description: '用户ID' },
        articleId: { type: 'number', example: 1, description: '文章ID' },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-01T00:00:00.000Z',
          description: '收藏时间',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: '张三' },
            email: { type: 'string', example: 'zhangsan@example.com' },
          },
          description: '用户信息',
        },
        article: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            title: { type: 'string', example: '文章标题' },
            published: { type: 'boolean', example: true },
          },
          description: '文章信息',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '文章不存在',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: '文章不存在' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: '已经收藏过该文章',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: '已经收藏过该文章' },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  @Post()
  create(
    @Body() createFavoriteDto: CreateFavoriteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.favoriteService.create(user.userId, createFavoriteDto);
  }

  @ApiOperation({
    summary: '获取我的收藏列表',
    description: '获取当前用户收藏的所有文章列表',
  })
  @ApiResponse({
    status: 200,
    description: '获取收藏列表成功',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          userId: { type: 'number', example: 1, description: '用户ID' },
          articleId: { type: 'number', example: 1, description: '文章ID' },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00.000Z',
            description: '收藏时间',
          },
          user: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: '张三' },
              email: { type: 'string', example: 'zhangsan@example.com' },
            },
            description: '用户信息',
          },
          article: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              title: { type: 'string', example: '文章标题' },
              content: { type: 'string', example: '文章内容...' },
              published: { type: 'boolean', example: true },
              createdAt: {
                type: 'string',
                format: 'date-time',
                example: '2024-01-01T00:00:00.000Z',
              },
              author: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  name: { type: 'string', example: '作者' },
                },
                description: '作者信息',
              },
            },
            description: '文章信息',
          },
        },
      },
    },
  })
  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.favoriteService.findAll(user.userId);
  }

  @ApiOperation({
    summary: '检查是否收藏了某篇文章',
    description: '检查当前用户是否收藏了指定的文章',
  })
  @ApiParam({ name: 'articleId', description: '文章ID' })
  @ApiResponse({
    status: 200,
    description: '检查成功',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'number', example: 1, description: '用户ID' },
        articleId: { type: 'number', example: 1, description: '文章ID' },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-01T00:00:00.000Z',
          description: '收藏时间',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: '张三' },
            email: { type: 'string', example: 'zhangsan@example.com' },
          },
          description: '用户信息',
        },
        article: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            title: { type: 'string', example: '文章标题' },
            published: { type: 'boolean', example: true },
          },
          description: '文章信息',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '未收藏该文章',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: '未收藏该文章' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @Get('check/:articleId')
  findOne(
    @Param('articleId') articleId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.favoriteService.findOne(user.userId, +articleId);
  }

  @ApiOperation({
    summary: '取消收藏文章',
    description: '从当前用户的收藏列表中移除指定文章',
  })
  @ApiParam({ name: 'articleId', description: '文章ID' })
  @ApiResponse({
    status: 200,
    description: '取消收藏成功',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'number', example: 1, description: '用户ID' },
        articleId: { type: 'number', example: 1, description: '文章ID' },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-01T00:00:00.000Z',
          description: '收藏时间',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '收藏记录不存在',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: '收藏记录不存在' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @Delete(':articleId')
  remove(
    @Param('articleId') articleId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.favoriteService.remove(user.userId, +articleId);
  }

  @ApiOperation({
    summary: '获取文章收藏数量',
    description: '获取指定文章的收藏数量',
  })
  @ApiParam({ name: 'articleId', description: '文章ID' })
  @ApiResponse({
    status: 200,
    description: '获取收藏数量成功',
    schema: {
      type: 'object',
      properties: {
        articleId: { type: 'number', example: 1, description: '文章ID' },
        count: { type: 'number', example: 15, description: '收藏数量' },
      },
    },
  })
  @Public()
  @Get('count/:articleId')
  getFavoriteCount(@Param('articleId') articleId: string) {
    return this.favoriteService.getFavoriteCount(+articleId);
  }
}
