import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminArticlesService } from './admin-articles.service';
import { RequireSuperAdmin } from '../decorators/super-admin.decorator';
import { SuperAdminGuard } from '../guards/super-admin.guard';
import { CreateArticleDto } from '../../articles/dto/create-article.dto';
import { UpdateArticleDto } from '../../articles/dto/update-article.dto';

@ApiTags('后台管理-文章管理')
@ApiBearerAuth('JWT-auth')
@Controller('admin/articles')
@UseGuards(SuperAdminGuard)
export class AdminArticlesController {
  constructor(private readonly adminArticlesService: AdminArticlesService) {}

  @ApiOperation({
    summary: '获取所有文章',
    description: '超级管理员获取系统中所有文章列表，支持分页和筛选',
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
    name: 'published',
    description: '是否发布',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'categoryId',
    description: '分类ID',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'authorId',
    description: '作者ID',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'search',
    description: '搜索关键词（标题或内容）',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'includeDeleted',
    description: '是否包括已删除的文章',
    required: false,
    type: Boolean,
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: '获取文章列表成功',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              title: { type: 'string', example: '文章标题' },
              summary: { type: 'string', example: '文章摘要' },
              published: { type: 'boolean', example: true },
              featured: { type: 'boolean', example: false },
              deletedAt: {
                type: 'string',
                format: 'date-time',
                nullable: true,
                description: '删除时间，null表示未删除',
              },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              author: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  name: { type: 'string', example: '作者姓名' },
                  email: { type: 'string', example: 'author@example.com' },
                },
              },
              category: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  name: { type: 'string', example: '分类名称' },
                },
              },
              _count: {
                type: 'object',
                properties: {
                  comments: { type: 'number', example: 5 },
                  favorites: { type: 'number', example: 12 },
                  notes: { type: 'number', example: 8 },
                },
              },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 1250 },
            totalPages: { type: 'number', example: 125 },
          },
        },
      },
    },
  })
  @RequireSuperAdmin()
  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('published') published?: string,
    @Query('categoryId') categoryId?: string,
    @Query('authorId') authorId?: string,
    @Query('search') search?: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    return this.adminArticlesService.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      published:
        published === 'true' ? true : published === 'false' ? false : undefined,
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      authorId: authorId ? parseInt(authorId) : undefined,
      search,
      includeDeleted: includeDeleted === 'true',
    });
  }

  @ApiOperation({
    summary: '根据ID获取文章详情',
    description: '超级管理员获取指定文章的详细信息',
  })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiResponse({
    status: 200,
    description: '获取文章详情成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        title: { type: 'string', example: '文章标题' },
        content: { type: 'string', example: '文章内容...' },
        summary: { type: 'string', example: '文章摘要' },
        cover: { type: 'string', example: '封面图片URL' },
        keywords: { type: 'array', items: { type: 'string' } },
        published: { type: 'boolean', example: true },
        featured: { type: 'boolean', example: false },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        author: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: '作者姓名' },
            email: { type: 'string', example: 'author@example.com' },
            role: {
              type: 'object',
              properties: {
                name: { type: 'string', example: '教师' },
              },
            },
          },
        },
        category: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: '分类名称' },
            description: { type: 'string', example: '分类描述' },
          },
        },
        filterConditions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: '筛选条件' },
              type: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: '筛选类型' },
                },
              },
            },
          },
        },
        comments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              content: { type: 'string', example: '评论内容' },
              createdAt: { type: 'string', format: 'date-time' },
              author: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 2 },
                  name: { type: 'string', example: '评论者姓名' },
                },
              },
            },
          },
        },
        media: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              url: { type: 'string', example: '媒体文件URL' },
              type: { type: 'string', example: 'IMAGE' },
              originalName: { type: 'string', example: '原始文件名' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: '文章不存在' })
  @RequireSuperAdmin()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.adminArticlesService.findOne(+id);
  }

  @ApiOperation({
    summary: '创建文章',
    description: '超级管理员创建新文章',
  })
  @ApiBody({ type: CreateArticleDto })
  @ApiResponse({
    status: 201,
    description: '文章创建成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        title: { type: 'string', example: '新文章标题' },
        content: { type: 'string', example: '文章内容...' },
        authorId: { type: 'number', example: 1 },
        categoryId: { type: 'number', example: 1 },
        published: { type: 'boolean', example: false },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @RequireSuperAdmin()
  @Post()
  async create(@Body() createArticleDto: CreateArticleDto) {
    return this.adminArticlesService.create(createArticleDto);
  }

  @ApiOperation({
    summary: '更新文章',
    description: '超级管理员更新文章信息',
  })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiBody({ type: UpdateArticleDto })
  @ApiResponse({
    status: 200,
    description: '文章更新成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        title: { type: 'string', example: '更新后的标题' },
        content: { type: 'string', example: '更新后的内容...' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: '文章不存在' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @RequireSuperAdmin()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
  ) {
    return this.adminArticlesService.update(+id, updateArticleDto);
  }

  @ApiOperation({
    summary: '软删除文章',
    description: '超级管理员软删除文章（可恢复）',
  })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiResponse({
    status: 200,
    description: '文章软删除成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        title: { type: 'string', example: '被删除的文章标题' },
        message: { type: 'string', example: '文章已软删除成功' },
      },
    },
  })
  @ApiResponse({ status: 404, description: '文章不存在' })
  @RequireSuperAdmin()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.adminArticlesService.remove(+id);
  }

  @ApiOperation({
    summary: '恢复已删除的文章',
    description: '超级管理员恢复已软删除的文章',
  })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiResponse({
    status: 200,
    description: '文章恢复成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        title: { type: 'string', example: '恢复的文章标题' },
        message: { type: 'string', example: '文章恢复成功' },
      },
    },
  })
  @ApiResponse({ status: 404, description: '文章不存在' })
  @ApiResponse({ status: 400, description: '文章未被删除，无需恢复' })
  @RequireSuperAdmin()
  @Post(':id/restore')
  async restore(@Param('id') id: string) {
    return this.adminArticlesService.restore(+id);
  }

  @ApiOperation({
    summary: '永久删除文章',
    description: '超级管理员永久删除文章（不可恢复，谨慎操作）',
  })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiResponse({
    status: 200,
    description: '文章永久删除成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        title: { type: 'string', example: '被删除的文章标题' },
        message: { type: 'string', example: '文章已永久删除' },
      },
    },
  })
  @ApiResponse({ status: 404, description: '文章不存在' })
  @ApiResponse({ status: 400, description: '文章存在关联数据，无法永久删除' })
  @RequireSuperAdmin()
  @Delete(':id/permanent')
  async permanentlyDelete(@Param('id') id: string) {
    return this.adminArticlesService.permanentlyDelete(+id);
  }

  @ApiOperation({
    summary: '获取已删除的文章列表',
    description: '超级管理员获取所有已软删除的文章',
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
    name: 'search',
    description: '搜索关键词（标题或内容）',
    required: false,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: '获取已删除文章列表成功',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              title: { type: 'string', example: '文章标题' },
              summary: { type: 'string', example: '文章摘要' },
              deletedAt: { type: 'string', format: 'date-time' },
              author: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  name: { type: 'string', example: '作者姓名' },
                  email: { type: 'string', example: 'author@example.com' },
                },
              },
              category: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  name: { type: 'string', example: '分类名称' },
                },
              },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 50 },
            totalPages: { type: 'number', example: 5 },
          },
        },
      },
    },
  })
  @RequireSuperAdmin()
  @Get('deleted/list')
  async findDeleted(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
  ) {
    return this.adminArticlesService.findDeleted({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
    });
  }

  @ApiOperation({
    summary: '发布文章',
    description: '超级管理员发布文章',
  })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiResponse({
    status: 200,
    description: '文章发布成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        title: { type: 'string', example: '文章标题' },
        published: { type: 'boolean', example: true },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: '文章不存在' })
  @RequireSuperAdmin()
  @Post(':id/publish')
  async publish(@Param('id') id: string) {
    return this.adminArticlesService.publish(+id);
  }

  @ApiOperation({
    summary: '取消发布文章',
    description: '超级管理员取消发布文章',
  })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiResponse({
    status: 200,
    description: '文章取消发布成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        title: { type: 'string', example: '文章标题' },
        published: { type: 'boolean', example: false },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: '文章不存在' })
  @RequireSuperAdmin()
  @Post(':id/unpublish')
  async unpublish(@Param('id') id: string) {
    return this.adminArticlesService.unpublish(+id);
  }

  @ApiOperation({
    summary: '设置文章为推荐',
    description: '超级管理员设置文章为推荐',
  })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiResponse({
    status: 200,
    description: '设置推荐成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        title: { type: 'string', example: '文章标题' },
        featured: { type: 'boolean', example: true },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: '文章不存在' })
  @RequireSuperAdmin()
  @Post(':id/feature')
  async feature(@Param('id') id: string) {
    return this.adminArticlesService.feature(+id);
  }

  @ApiOperation({
    summary: '取消文章推荐',
    description: '超级管理员取消文章推荐',
  })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiResponse({
    status: 200,
    description: '取消推荐成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        title: { type: 'string', example: '文章标题' },
        featured: { type: 'boolean', example: false },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: '文章不存在' })
  @RequireSuperAdmin()
  @Post(':id/unfeature')
  async unfeature(@Param('id') id: string) {
    return this.adminArticlesService.unfeature(+id);
  }

  @ApiOperation({
    summary: '获取文章统计信息',
    description: '获取文章相关的统计数据',
  })
  @ApiResponse({
    status: 200,
    description: '获取统计信息成功',
    schema: {
      type: 'object',
      properties: {
        totalArticles: { type: 'number', example: 1250 },
        publishedArticles: { type: 'number', example: 980 },
        draftArticles: { type: 'number', example: 270 },
        featuredArticles: { type: 'number', example: 50 },
        deletedArticles: { type: 'number', example: 30 },
        articlesByCategory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string', example: '科研案例' },
              count: { type: 'number', example: 125 },
            },
          },
        },
        newArticlesToday: { type: 'number', example: 5 },
        newArticlesThisWeek: { type: 'number', example: 25 },
        newArticlesThisMonth: { type: 'number', example: 80 },
      },
    },
  })
  @RequireSuperAdmin()
  @Get('stats/overview')
  async getArticleStats() {
    return this.adminArticlesService.getArticleStats();
  }
}
