import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
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
  ApiBody,
} from '@nestjs/swagger';
import { NoteService } from './note.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { CurrentUser } from '../auth/user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/user.interface';
import { Public } from '../auth/public.decorator';

@ApiTags('笔记管理')
@ApiBearerAuth('JWT-auth')
@Controller('note')
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  @ApiOperation({
    summary: '创建笔记',
    description:
      '为指定文章创建新的笔记。笔记内容不能为空，支持字符串、JSON 字符串、Markdown 等大部分特殊格式的字符串数据。',
  })
  @ApiResponse({
    status: 201,
    description: '笔记创建成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1, description: '笔记ID' },
        content: {
          type: 'string',
          example: '这篇文章很有用，特别是关于NestJS的依赖注入部分。',
          description: '笔记内容',
        },
        userId: { type: 'number', example: 1, description: '用户ID' },
        articleId: { type: 'number', example: 1, description: '文章ID' },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-01T00:00:00.000Z',
          description: '创建时间',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-01T00:00:00.000Z',
          description: '更新时间',
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
            title: { type: 'string', example: '如何学习NestJS' },
            published: { type: 'boolean', example: true },
          },
          description: '文章信息',
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
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'content should not be empty',
            'articleId must be a positive number',
          ],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '未授权访问，需要有效的JWT令牌',
  })
  @ApiResponse({
    status: 404,
    description: '指定的文章不存在',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: '文章不存在' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiBody({
    description:
      '创建笔记请求体。content 支持字符串、JSON 字符串、Markdown 等特殊格式字符串。',
    schema: {
      type: 'object',
      required: ['content', 'articleId'],
      properties: {
        content: {
          type: 'string',
          description:
            '笔记内容，支持字符串、JSON 对象转换的字符串、Markdown 等大部分特殊格式字符串',
        },
        articleId: { type: 'number', example: 1, minimum: 1 },
      },
      examples: {
        plain: {
          summary: '纯文本',
          value: {
            content: '这是一篇关于 NestJS 的文章，内容很有用。',
            articleId: 1,
          },
        },
        jsonString: {
          summary: 'JSON 字符串',
          value: {
            content:
              '{"type":"note","data":{"title":"学习笔记","content":"这篇文章很有用"}}',
            articleId: 1,
          },
        },
        markdown: {
          summary: 'Markdown 字符串',
          value: {
            content:
              '# 学习笔记\n\n## 重点内容\n- 依赖注入\n- 装饰器\n\n```ts\n@Injectable()\nexport class AppService {}\n```',
            articleId: 1,
          },
        },
      },
    },
  })
  @Post()
  create(
    @Body() createNoteDto: CreateNoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.noteService.create(user.userId, createNoteDto);
  }

  @ApiOperation({
    summary: '获取我的笔记列表',
    description:
      '获取当前用户的所有笔记，按更新时间倒序排列。包含用户和文章基本信息。注意：1) 此接口不返回笔记内容（content字段），只返回笔记ID、时间等基本信息；2) 不返回关联文章的内容，只返回文章标题、ID等基本信息。如需查看完整内容，请使用笔记详情接口。',
  })
  @ApiResponse({
    status: 200,
    description: '获取笔记列表成功（分页返回 data+pagination；未分页返回数组）',
    schema: {
      oneOf: [
        {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1, description: '笔记ID' },
                  // 注意：列表接口不返回笔记内容 content 字段
                  userId: { type: 'number', example: 1, description: '用户ID' },
                  articleId: {
                    type: 'number',
                    example: 1,
                    description: '文章ID',
                  },
                  createdAt: {
                    type: 'string',
                    format: 'date-time',
                    example: '2024-01-01T00:00:00.000Z',
                    description: '创建时间',
                  },
                  updatedAt: {
                    type: 'string',
                    format: 'date-time',
                    example: '2024-01-01T00:00:00.000Z',
                    description: '更新时间',
                  },
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'number', example: 1 },
                      name: { type: 'string', example: '张三' },
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
                      id: { type: 'number', example: 1 },
                      title: { type: 'string', example: '如何学习NestJS' },
                      summary: {
                        type: 'string',
                        example: '本文介绍了NestJS的基本概念和使用方法...',
                        description: '文章概述',
                      },
                      cover: {
                        type: 'string',
                        example: 'https://example.com/cover.jpg',
                        description: '封面图URL',
                      },
                      // 注意：列表接口不返回文章内容 content 字段
                      published: { type: 'boolean', example: true },
                      createdAt: {
                        type: 'string',
                        format: 'date-time',
                        example: '2024-01-01T00:00:00.000Z',
                      },
                      author: {
                        type: 'object',
                        properties: {
                          id: { type: 'number', example: 2 },
                          name: { type: 'string', example: '李四' },
                        },
                        description: '文章作者信息',
                      },
                    },
                    description:
                      '文章基本信息（包含概述和封面图，不包含文章内容）',
                  },
                },
              },
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 10 },
                total: { type: 'number', example: 42 },
                totalPages: { type: 'number', example: 5 },
              },
            },
          },
        },
        {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1, description: '笔记ID' },
              userId: { type: 'number', example: 1, description: '用户ID' },
              articleId: { type: 'number', example: 1, description: '文章ID' },
              createdAt: {
                type: 'string',
                format: 'date-time',
                example: '2024-01-01T00:00:00.000Z',
                description: '创建时间',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                example: '2024-01-01T00:00:00.000Z',
                description: '更新时间',
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
                  title: { type: 'string', example: '如何学习NestJS' },
                  summary: {
                    type: 'string',
                    example: '本文介绍了NestJS的基本概念和使用方法...',
                    description: '文章概述',
                  },
                  cover: {
                    type: 'string',
                    example: 'https://example.com/cover.jpg',
                    description: '封面图URL',
                  },
                  published: { type: 'boolean', example: true },
                  createdAt: {
                    type: 'string',
                    format: 'date-time',
                    example: '2024-01-01T00:00:00.000Z',
                  },
                  author: {
                    type: 'object',
                    properties: {
                      id: { type: 'number', example: 2 },
                      name: { type: 'string', example: '李四' },
                    },
                    description: '文章作者信息',
                  },
                },
                description: '文章基本信息（包含概述和封面图，不包含文章内容）',
              },
            },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: '未授权访问，需要有效的JWT令牌',
  })
  @ApiQuery({
    name: 'userId',
    description: '用户ID（不提供则返回所有用户笔记，仅超级管理员可用）',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'page',
    description: '页码（起始为 1）',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: '每页数量（最大建议 100）',
    required: false,
    type: Number,
    example: 10,
  })
  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('userId') userId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // 如果明确提供了userId，使用该userId；否则不传递userId（返回所有数据）
    const targetUserId = userId ? +userId : undefined;
    return this.noteService.findAll(targetUserId, {
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
    });
  }

  @ApiOperation({
    summary: '获取文章笔记列表',
    description:
      '获取指定文章的所有笔记。如果用户已登录，可以查看所有笔记；如果未登录，只能查看公开文章的笔记。注意：此接口不返回笔记内容（content字段），只返回笔记ID、时间等基本信息。如需查看完整笔记内容，请使用笔记详情接口。',
  })
  @ApiParam({
    name: 'articleId',
    description: '文章ID',
    example: 1,
    type: 'number',
  })
  @ApiQuery({
    name: 'userId',
    description: '用户ID，可选参数，如果提供则只返回该用户的笔记',
    required: false,
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: '获取文章笔记列表成功',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1, description: '笔记ID' },
          // 注意：列表接口不返回笔记内容 content 字段
          userId: { type: 'number', example: 1, description: '用户ID' },
          articleId: { type: 'number', example: 1, description: '文章ID' },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00.000Z',
            description: '创建时间',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00.000Z',
            description: '更新时间',
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
              title: { type: 'string', example: '如何学习NestJS' },
              published: { type: 'boolean', example: true },
            },
            description: '文章基本信息（不包含文章内容）',
          },
        },
      },
    },
  })
  @Public()
  @Get('article/:articleId')
  findByArticle(
    @Param('articleId') articleId: string,
    @Query('userId') userId?: string,
  ) {
    return this.noteService.findByArticle(
      +articleId,
      userId ? +userId : undefined,
    );
  }

  @ApiOperation({
    summary: '获取笔记详情',
    description:
      '根据笔记ID获取笔记详情。用户只能查看自己的笔记，除非是公开访问。此接口返回完整的笔记信息，包括关联文章的完整内容（content字段）。',
  })
  @ApiParam({
    name: 'id',
    description: '笔记ID',
    example: 1,
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: '获取笔记详情成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1, description: '笔记ID' },
        content: {
          type: 'string',
          example: '这篇文章很有用，特别是关于NestJS的依赖注入部分。',
          description: '笔记内容',
        },
        userId: { type: 'number', example: 1, description: '用户ID' },
        articleId: { type: 'number', example: 1, description: '文章ID' },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-01T00:00:00.000Z',
          description: '创建时间',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-01T00:00:00.000Z',
          description: '更新时间',
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
            title: { type: 'string', example: '如何学习NestJS' },
            content: { type: 'string', example: '文章内容...' },
            published: { type: 'boolean', example: true },
            author: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 2 },
                name: { type: 'string', example: '李四' },
              },
              description: '文章作者信息',
            },
          },
          description: '文章信息',
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: '无权查看此笔记',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: '无权查看此笔记' },
        error: { type: 'string', example: 'Forbidden' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '笔记不存在',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: '笔记不存在' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user?: AuthenticatedUser) {
    return this.noteService.findOne(+id, user?.userId);
  }

  @ApiOperation({
    summary: '更新笔记',
    description: '更新指定笔记的内容。用户只能更新自己的笔记。',
  })
  @ApiParam({
    name: 'id',
    description: '笔记ID',
    example: 1,
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: '笔记更新成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1, description: '笔记ID' },
        content: {
          type: 'string',
          example:
            '更新后的笔记内容，这篇文章很有用，特别是关于NestJS的依赖注入部分。',
          description: '更新后的笔记内容',
        },
        userId: { type: 'number', example: 1, description: '用户ID' },
        articleId: { type: 'number', example: 1, description: '文章ID' },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-01T00:00:00.000Z',
          description: '创建时间',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-01T12:00:00.000Z',
          description: '更新时间',
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
            title: { type: 'string', example: '如何学习NestJS' },
            published: { type: 'boolean', example: true },
          },
          description: '文章信息',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
  })
  @ApiResponse({
    status: 401,
    description: '未授权访问，需要有效的JWT令牌',
  })
  @ApiResponse({
    status: 403,
    description: '无权修改此笔记',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: '无权修改此笔记' },
        error: { type: 'string', example: 'Forbidden' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '笔记不存在',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: '笔记不存在' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiBody({
    description:
      '更新笔记请求体。content 支持字符串、JSON 字符串、Markdown 等特殊格式字符串。',
    schema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description:
            '笔记内容，支持字符串、JSON 对象转换的字符串、Markdown 等大部分特殊格式字符串',
        },
      },
      examples: {
        plain: {
          summary: '纯文本',
          value: {
            content: '更新后的笔记内容，增加了若干要点说明。',
          },
        },
        jsonString: {
          summary: 'JSON 字符串',
          value: {
            content:
              '{"updated":true,"type":"note","data":{"title":"学习笔记","content":"这篇文章很有用"}}',
          },
        },
        markdown: {
          summary: 'Markdown 字符串',
          value: {
            content:
              '# 更新后的笔记\n\n## 新内容\n- 更新项目1\n- 更新项目2\n\n```json\n{"key":"value"}\n```',
          },
        },
      },
    },
  })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateNoteDto: UpdateNoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.noteService.update(+id, user.userId, updateNoteDto);
  }

  @ApiOperation({
    summary: '删除笔记',
    description: '删除指定的笔记。用户只能删除自己的笔记。',
  })
  @ApiParam({
    name: 'id',
    description: '笔记ID',
    example: 1,
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: '笔记删除成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1, description: '笔记ID' },
        content: {
          type: 'string',
          example: '这篇文章很有用，特别是关于NestJS的依赖注入部分。',
          description: '被删除的笔记内容',
        },
        userId: { type: 'number', example: 1, description: '用户ID' },
        articleId: { type: 'number', example: 1, description: '文章ID' },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-01T00:00:00.000Z',
          description: '创建时间',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-01T00:00:00.000Z',
          description: '更新时间',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '未授权访问，需要有效的JWT令牌',
  })
  @ApiResponse({
    status: 403,
    description: '无权删除此笔记',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: '无权删除此笔记' },
        error: { type: 'string', example: 'Forbidden' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '笔记不存在',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: '笔记不存在' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.noteService.remove(+id, user.userId);
  }

  @ApiOperation({
    summary: '获取笔记统计信息',
    description:
      '获取当前用户的笔记统计信息，包括总笔记数和最近7天创建的笔记数。',
  })
  @ApiResponse({
    status: 200,
    description: '获取统计信息成功',
    schema: {
      type: 'object',
      properties: {
        totalNotes: {
          type: 'number',
          example: 25,
          description: '用户总笔记数',
        },
        recentNotes: {
          type: 'number',
          example: 3,
          description: '最近7天创建的笔记数',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '未授权访问，需要有效的JWT令牌',
  })
  @Get('stats/me')
  getNoteStats(@CurrentUser() user: AuthenticatedUser) {
    return this.noteService.getNoteStats(user.userId);
  }
}
