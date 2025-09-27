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
} from '@nestjs/swagger';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { LikeCommentDto } from './dto/like-comment.dto';
import { Public } from '../auth/public.decorator';
import { CurrentUser } from '../auth/user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/user.interface';

@ApiTags('评论管理')
@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @ApiOperation({
    summary: '创建评论',
    description:
      '创建新的评论，支持楼中楼回复功能。可以回复文章或回复其他评论。',
  })
  @ApiResponse({
    status: 201,
    description: '评论创建成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1, description: '评论ID' },
        content: {
          type: 'string',
          example: '这是一条很有用的评论！',
          description: '评论内容',
        },
        authorId: { type: 'number', example: 1, description: '作者ID' },
        articleId: { type: 'number', example: 1, description: '文章ID' },
        parentId: { type: 'number', example: null, description: '父评论ID' },
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
    status: 400,
    description: '请求参数错误',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: '评论内容不能为空' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @Post()
  create(
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.commentService.create({
      ...createCommentDto,
      authorId: user.userId,
    });
  }

  @ApiOperation({
    summary: '获取所有评论',
    description: '获取所有评论列表，支持按文章ID和作者ID筛选。',
  })
  @ApiQuery({
    name: 'articleId',
    description: '文章ID，筛选指定文章的评论',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'authorId',
    description: '作者ID，筛选指定作者的评论',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: '获取评论列表成功',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1, description: '评论ID' },
          content: {
            type: 'string',
            example: '这是一条很有用的评论！',
            description: '评论内容',
          },
          authorId: { type: 'number', example: 1, description: '作者ID' },
          articleId: { type: 'number', example: 1, description: '文章ID' },
          parentId: { type: 'number', example: null, description: '父评论ID' },
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
          author: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: '张三' },
              email: { type: 'string', example: 'zhangsan@example.com' },
            },
            description: '作者信息',
          },
          article: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              title: { type: 'string', example: '文章标题' },
            },
            description: '文章信息',
          },
          replies: {
            type: 'array',
            items: { type: 'object' },
            description: '子评论列表',
          },
          likeCount: {
            type: 'number',
            example: 5,
            description: '点赞数量',
          },
          isLiked: {
            type: 'boolean',
            example: true,
            description: '当前用户是否已点赞',
          },
          likes: {
            type: 'array',
            items: { type: 'object' },
            description: '点赞列表',
          },
        },
      },
    },
  })
  @Get()
  findAll(
    @Query('articleId') articleId?: string,
    @Query('authorId') authorId?: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.commentService.findAll(
      articleId ? +articleId : undefined,
      authorId ? +authorId : undefined,
      user?.userId,
    );
  }

  @ApiOperation({
    summary: '根据ID获取评论',
    description:
      '根据评论ID获取单条评论的详细信息，包括作者信息、文章信息和子评论。',
  })
  @ApiParam({ name: 'id', description: '评论ID' })
  @ApiResponse({
    status: 200,
    description: '获取评论成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1, description: '评论ID' },
        content: {
          type: 'string',
          example: '这是一条很有用的评论！',
          description: '评论内容',
        },
        authorId: { type: 'number', example: 1, description: '作者ID' },
        articleId: { type: 'number', example: 1, description: '文章ID' },
        parentId: { type: 'number', example: null, description: '父评论ID' },
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
        author: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: '张三' },
            email: { type: 'string', example: 'zhangsan@example.com' },
          },
          description: '作者信息',
        },
        article: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            title: { type: 'string', example: '文章标题' },
          },
          description: '文章信息',
        },
        replies: {
          type: 'array',
          items: { type: 'object' },
          description: '子评论列表',
        },
        likeCount: {
          type: 'number',
          example: 5,
          description: '点赞数量',
        },
        isLiked: {
          type: 'boolean',
          example: true,
          description: '当前用户是否已点赞',
        },
        likes: {
          type: 'array',
          items: { type: 'object' },
          description: '点赞列表',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '评论不存在',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: '评论不存在' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user?: AuthenticatedUser) {
    return this.commentService.findOne(+id, user?.userId);
  }

  @ApiOperation({
    summary: '更新评论',
    description:
      '更新指定评论的内容。只能更新评论内容，不能修改作者、文章等关联信息。',
  })
  @ApiParam({ name: 'id', description: '评论ID' })
  @ApiResponse({
    status: 200,
    description: '评论更新成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1, description: '评论ID' },
        content: {
          type: 'string',
          example: '更新后的评论内容',
          description: '评论内容',
        },
        authorId: { type: 'number', example: 1, description: '作者ID' },
        articleId: { type: 'number', example: 1, description: '文章ID' },
        parentId: { type: 'number', example: null, description: '父评论ID' },
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
    status: 404,
    description: '评论不存在',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: '评论不存在' },
        error: { type: 'string', example: 'Not Found' },
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
        message: { type: 'string', example: '评论内容不能为空' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCommentDto: UpdateCommentDto) {
    return this.commentService.update(+id, updateCommentDto);
  }

  @ApiOperation({
    summary: '删除评论',
    description:
      '删除指定的评论。删除评论时会同时删除所有子评论（楼中楼回复）。',
  })
  @ApiParam({ name: 'id', description: '评论ID' })
  @ApiResponse({
    status: 200,
    description: '评论删除成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1, description: '被删除的评论ID' },
        content: {
          type: 'string',
          example: '这是一条很有用的评论！',
          description: '评论内容',
        },
        authorId: { type: 'number', example: 1, description: '作者ID' },
        articleId: { type: 'number', example: 1, description: '文章ID' },
        parentId: { type: 'number', example: null, description: '父评论ID' },
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
    status: 404,
    description: '评论不存在',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: '评论不存在' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.commentService.remove(+id);
  }

  @ApiOperation({
    summary: '点赞评论',
    description: '对指定评论进行点赞操作。',
  })
  @ApiParam({ name: 'id', description: '评论ID' })
  @ApiResponse({
    status: 201,
    description: '点赞成功',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'number', example: 1, description: '用户ID' },
        commentId: { type: 'number', example: 1, description: '评论ID' },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-01T00:00:00.000Z',
          description: '点赞时间',
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
        comment: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            content: { type: 'string', example: '这是一条很有用的评论！' },
          },
          description: '评论信息',
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
        message: { type: 'string', example: '已经点赞过该评论' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '评论不存在',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: '评论不存在' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @Post(':id/like')
  likeComment(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.commentService.likeComment(+id, user.userId);
  }

  @ApiOperation({
    summary: '取消点赞评论',
    description: '取消对指定评论的点赞操作。',
  })
  @ApiParam({ name: 'id', description: '评论ID' })
  @ApiResponse({
    status: 200,
    description: '取消点赞成功',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'number', example: 1, description: '用户ID' },
        commentId: { type: 'number', example: 1, description: '评论ID' },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-01T00:00:00.000Z',
          description: '点赞时间',
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
        comment: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            content: { type: 'string', example: '这是一条很有用的评论！' },
          },
          description: '评论信息',
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
        message: { type: 'string', example: '未点赞该评论' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @Delete(':id/like')
  unlikeComment(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.commentService.unlikeComment(+id, user.userId);
  }
}
