import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FavoriteService } from './favorite.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { CurrentUser } from '../auth/user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/user.interface';
import { Public } from '../auth/public.decorator';

@ApiTags('收藏管理')
@ApiBearerAuth('JWT-auth')
@Controller('favorite')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @ApiOperation({
    summary: '收藏文章',
    description:
      '将指定文章添加到当前用户的收藏列表中。如果文章不存在会返回404错误，如果已经收藏过该文章会返回409冲突错误。收藏成功后返回完整的收藏记录信息，包括用户和文章的详细信息。',
  })
  @ApiResponse({
    status: 201,
    description: '收藏成功，返回完整的收藏记录信息',
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'number',
          example: 1,
          description: '收藏用户的ID，来自JWT令牌中的用户信息',
        },
        articleId: {
          type: 'number',
          example: 1,
          description: '被收藏的文章ID，来自请求体参数',
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-01T00:00:00.000Z',
          description: '收藏创建时间，由系统自动生成',
        },
        user: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              example: 1,
              description: '用户唯一标识',
            },
            name: {
              type: 'string',
              example: '张三',
              description: '用户姓名，可能为null',
            },
            email: {
              type: 'string',
              example: 'zhangsan@example.com',
              description: '用户邮箱地址',
            },
          },
          description: '收藏用户的详细信息',
        },
        article: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              example: 1,
              description: '文章唯一标识',
            },
            title: {
              type: 'string',
              example: '如何学习NestJS框架',
              description: '文章标题',
            },
            published: {
              type: 'boolean',
              example: true,
              description: '文章是否已发布',
            },
          },
          description: '被收藏文章的详细信息',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
    schema: {
      type: 'object',
      properties: {
        statusCode: {
          type: 'number',
          example: 400,
          description: 'HTTP状态码',
        },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: ['articleId must be a number'],
          description: '具体的参数验证错误信息',
        },
        error: {
          type: 'string',
          example: 'Bad Request',
          description: '错误类型',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '未授权访问，需要有效的JWT令牌',
    schema: {
      type: 'object',
      properties: {
        statusCode: {
          type: 'number',
          example: 401,
          description: 'HTTP状态码',
        },
        message: {
          type: 'string',
          example: 'Unauthorized',
          description: '错误信息',
        },
        error: {
          type: 'string',
          example: 'Unauthorized',
          description: '错误类型',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '指定的文章不存在',
    schema: {
      type: 'object',
      properties: {
        statusCode: {
          type: 'number',
          example: 404,
          description: 'HTTP状态码',
        },
        message: {
          type: 'string',
          example: '文章不存在',
          description: '具体的错误信息',
        },
        error: {
          type: 'string',
          example: 'Not Found',
          description: '错误类型',
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: '用户已经收藏过该文章，不能重复收藏',
    schema: {
      type: 'object',
      properties: {
        statusCode: {
          type: 'number',
          example: 409,
          description: 'HTTP状态码',
        },
        message: {
          type: 'string',
          example: '已经收藏过该文章',
          description: '具体的错误信息',
        },
        error: {
          type: 'string',
          example: 'Conflict',
          description: '错误类型',
        },
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
    description:
      '获取当前用户收藏的所有文章列表。返回按收藏时间倒序排列的收藏记录，每条记录包含完整的用户信息、文章信息和作者信息。需要用户认证，只能查看自己的收藏列表。',
  })
  @ApiResponse({
    status: 200,
    description: '获取收藏列表成功，返回按收藏时间倒序排列的收藏记录数组',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          userId: {
            type: 'number',
            example: 1,
            description: '收藏用户的ID',
          },
          articleId: {
            type: 'number',
            example: 1,
            description: '被收藏的文章ID',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00.000Z',
            description: '收藏创建时间，用于排序',
          },
          user: {
            type: 'object',
            properties: {
              id: {
                type: 'number',
                example: 1,
                description: '用户唯一标识',
              },
              name: {
                type: 'string',
                example: '张三',
                description: '用户姓名，可能为null',
              },
              email: {
                type: 'string',
                example: 'zhangsan@example.com',
                description: '用户邮箱地址',
              },
            },
            description: '收藏用户的详细信息',
          },
          article: {
            type: 'object',
            properties: {
              id: {
                type: 'number',
                example: 1,
                description: '文章唯一标识',
              },
              title: {
                type: 'string',
                example: '如何学习NestJS框架',
                description: '文章标题',
              },
              content: {
                type: 'string',
                example: '这是一篇关于NestJS框架学习的详细教程...',
                description: '文章内容，可能为null',
              },
              published: {
                type: 'boolean',
                example: true,
                description: '文章是否已发布',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                example: '2024-01-01T00:00:00.000Z',
                description: '文章创建时间',
              },
              author: {
                type: 'object',
                properties: {
                  id: {
                    type: 'number',
                    example: 2,
                    description: '作者用户ID',
                  },
                  name: {
                    type: 'string',
                    example: '李四',
                    description: '作者姓名，可能为null',
                  },
                },
                description: '文章作者的基本信息',
              },
            },
            description: '被收藏文章的详细信息，包含作者信息',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '未授权访问，需要有效的JWT令牌',
    schema: {
      type: 'object',
      properties: {
        statusCode: {
          type: 'number',
          example: 401,
          description: 'HTTP状态码',
        },
        message: {
          type: 'string',
          example: 'Unauthorized',
          description: '错误信息',
        },
        error: {
          type: 'string',
          example: 'Unauthorized',
          description: '错误类型',
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
    description:
      '检查当前用户是否收藏了指定的文章。如果已收藏，返回完整的收藏记录信息；如果未收藏，返回404错误。此接口用于前端判断是否显示"已收藏"状态。',
  })
  @ApiParam({
    name: 'articleId',
    description: '要检查的文章ID，必须是正整数',
    example: 1,
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: '检查成功，返回收藏记录信息',
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'number',
          example: 1,
          description: '用户ID',
        },
        articleId: {
          type: 'number',
          example: 1,
          description: '文章ID',
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-01T00:00:00.000Z',
          description: '收藏时间',
        },
        user: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              example: 1,
            },
            name: {
              type: 'string',
              example: '张三',
            },
            email: {
              type: 'string',
              example: 'zhangsan@example.com',
            },
          },
          description: '用户信息',
        },
        article: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              example: 1,
            },
            title: {
              type: 'string',
              example: '文章标题',
            },
            published: {
              type: 'boolean',
              example: true,
            },
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
        statusCode: {
          type: 'number',
          example: 404,
        },
        message: {
          type: 'string',
          example: '评论不存在',
        },
        error: {
          type: 'string',
          example: 'Not Found',
        },
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
    description:
      '从当前用户的收藏列表中移除指定文章。如果收藏记录不存在会返回404错误。取消收藏成功后返回被删除的收藏记录信息。',
  })
  @ApiParam({
    name: 'articleId',
    description: '要取消收藏的文章ID，必须是正整数',
    example: 1,
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: '取消收藏成功',
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'number',
          example: 1,
          description: '用户ID',
        },
        articleId: {
          type: 'number',
          example: 1,
          description: '文章ID',
        },
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
        statusCode: {
          type: 'number',
          example: 404,
        },
        message: {
          type: 'string',
          example: '收藏记录不存在',
        },
        error: {
          type: 'string',
          example: 'Not Found',
        },
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
    description:
      '获取指定文章的收藏数量。这是一个公开接口，无需用户认证，用于在文章详情页显示收藏统计信息。返回文章ID和对应的收藏总数。',
  })
  @ApiParam({
    name: 'articleId',
    description: '要查询收藏数量的文章ID，必须是正整数',
    example: 1,
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: '获取收藏数量成功，返回文章ID和收藏总数',
    schema: {
      type: 'object',
      properties: {
        articleId: {
          type: 'number',
          example: 1,
          description: '文章唯一标识',
        },
        count: {
          type: 'number',
          example: 15,
          description: '该文章的收藏总数，最小值为0',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误，articleId格式不正确',
    schema: {
      type: 'object',
      properties: {
        statusCode: {
          type: 'number',
          example: 400,
          description: 'HTTP状态码',
        },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: ['articleId must be a number'],
          description: '具体的参数验证错误信息',
        },
        error: {
          type: 'string',
          example: 'Bad Request',
          description: '错误类型',
        },
      },
    },
  })
  @Public()
  @Get('count/:articleId')
  getFavoriteCount(@Param('articleId') articleId: string) {
    return this.favoriteService.getFavoriteCount(+articleId);
  }
}
