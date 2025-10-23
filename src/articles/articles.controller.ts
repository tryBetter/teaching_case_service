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
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Public } from '../auth/public.decorator';
import { CurrentUser } from '../auth/user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/user.interface';
import {
  RequirePermissions,
  RequireTeacherLeaderOrTeacher,
  RequireTeacherLeaderOrTeacherOrAssistantLeaderOrAssistant,
} from '../auth/decorators/roles.decorator';
import { RequireSuperAdmin } from '../admin/decorators/super-admin.decorator';
import { SuperAdminGuard } from '../admin/guards/super-admin.guard';
import { Permission } from '../auth/enums/permissions.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminArticlesService } from '../admin/articles/admin-articles.service';

@ApiTags('文章管理')
@ApiBearerAuth('JWT-auth')
@Controller('articles')
@UseGuards(RolesGuard, SuperAdminGuard)
export class ArticlesController {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly adminArticlesService: AdminArticlesService,
  ) {}

  @ApiOperation({
    summary: '创建文章',
    description:
      '【教师和教师组长专用】创建新的教学案例文章。自动将当前登录用户设置为文章作者。文章可以设置为草稿状态或直接发布。支持关联分类、筛选条件、关键词等元数据。适用场景：教师撰写新的教学案例、发布研究成果、分享教学经验。创建后可以通过编辑接口继续完善内容。',
  })
  @ApiResponse({
    status: 201,
    description:
      '文章创建成功，返回新创建的文章完整信息，包括自动生成的ID和时间戳',
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误：标题为空、分类ID无效、筛选条件ID不存在等',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足，仅教师和教师组长可创建文章。助教、学生无此权限',
  })
  @RequireTeacherLeaderOrTeacher()
  @Post()
  create(
    @Body() createArticleDto: CreateArticleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.articlesService.create({
      ...createArticleDto,
      authorId: user.userId,
    });
  }

  @ApiOperation({
    summary: '获取文章列表（分页+筛选）',
    description:
      '【超级管理员专用】获取文章列表，支持多维度筛选和分页。适用场景：后台管理系统文章管理页面、统计分析、内容审核。支持按发布状态、分类、作者、关键词搜索筛选，也支持查看已删除的文章（回收站功能）。',
  })
  @ApiQuery({
    name: 'page',
    description: '页码，从1开始',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: '每页文章数量，建议：10、20、50',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'published',
    description: '发布状态筛选：true-仅已发布，false-仅草稿，不提供-全部',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'categoryId',
    description: '按分类ID筛选文章',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'authorId',
    description: '按作者ID筛选文章，用于查看特定教师的文章',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'search',
    description: '关键词搜索，匹配文章标题或内容',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'includeDeleted',
    description:
      '是否包括已删除的文章。true-包含，false/不提供-不包含。用于回收站功能',
    required: false,
    type: Boolean,
  })
  @ApiResponse({ status: 200, description: '获取文章列表成功' })
  @RequireSuperAdmin()
  @Get()
  async findAllWithPagination(
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

  @Public()
  @ApiOperation({
    summary: '获取所有文章（支持分页和高级查询，公开接口）',
    description:
      '获取文章列表，支持分页和多条件查询。仅返回未删除的文章。适用场景：前端首页文章列表、文章搜索、分类浏览。支持关键词搜索、按作者筛选、按分类筛选、按时间排序等功能。注意：1) 此接口不需要认证，任何人都可访问；2) 此接口不返回文章内容（content字段），只返回标题、摘要等基本信息，文章内容请通过文章详情接口单独获取。',
  })
  @ApiQuery({
    name: 'page',
    description: '页码，从1开始，默认为1',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: '每页数量，默认为10，最大100',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    description: '搜索关键词，模糊匹配文章标题、内容和摘要',
    required: false,
    type: String,
    example: '火箭发动机',
  })
  @ApiQuery({
    name: 'authorId',
    description: '作者ID，筛选指定作者的文章',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'categoryId',
    description: '分类ID，筛选指定分类的文章',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'published',
    description: '发布状态，true-已发布，false-草稿',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'featured',
    description: '是否为推荐文章，true-仅推荐，false-非推荐',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'filterConditionIds',
    description: '筛选条件ID列表，用逗号分隔，例如：1,2,3',
    required: false,
    type: String,
    example: '1,2,3',
  })
  @ApiQuery({
    name: 'orderBy',
    description:
      '排序方式：createdAt_desc(创建时间倒序)、createdAt_asc(创建时间正序)、updatedAt_desc(更新时间倒序)、updatedAt_asc(更新时间正序)',
    required: false,
    type: String,
    example: 'createdAt_desc',
  })
  @ApiResponse({
    status: 200,
    description: '返回分页后的文章列表，包含总数、当前页、总页数等分页信息',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          description: '文章列表',
        },
        total: {
          type: 'number',
          description: '总数',
        },
        page: {
          type: 'number',
          description: '当前页',
        },
        limit: {
          type: 'number',
          description: '每页数量',
        },
        totalPages: {
          type: 'number',
          description: '总页数',
        },
      },
    },
  })
  @Get('all')
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('authorId') authorId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('published') published?: string,
    @Query('featured') featured?: string,
    @Query('filterConditionIds') filterConditionIds?: string,
    @Query('orderBy') orderBy: string = 'createdAt_desc',
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // 解析筛选条件ID列表
    const filterConditionIdsArray = filterConditionIds
      ? filterConditionIds
          .split(',')
          .map((id) => parseInt(id.trim()))
          .filter((id) => !isNaN(id))
      : undefined;

    return await this.articlesService.findAllWithPagination({
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(limit) || 10, 100), // 最大100条
      search,
      authorId: authorId ? parseInt(authorId) : undefined,
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      published:
        published === 'true' ? true : published === 'false' ? false : undefined,
      featured:
        featured === 'true' ? true : featured === 'false' ? false : undefined,
      filterConditionIds: filterConditionIdsArray,
      orderBy,
    });
  }

  @ApiOperation({
    summary: '根据条件筛选查询文章',
    description:
      '根据多个条件筛选查询文章列表。支持按标题、作者、发布状态、分类、筛选条件等多维度查询。注意：此接口不返回文章内容（content字段），只返回文章基本信息。文章内容请通过文章详情接口单独获取。',
  })
  @ApiQuery({ name: 'title', description: '文章标题', required: false })
  @ApiQuery({
    name: 'contains',
    description: '是否模糊查询',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'authorId',
    description: '作者ID',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'published',
    description: '是否发布',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'categoryId',
    description: '文章分类ID',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'filterConditionIds',
    description: '筛选条件ID列表',
    required: false,
    type: [Number],
    isArray: true,
  })
  @Public()
  @ApiResponse({
    status: 200,
    description: '筛选查询成功，返回文章列表（不包含文章内容）',
  })
  @Get('many')
  findMany(
    @Query('title') title: string,
    @Query('contains') contains: boolean,
    @Query('authorId') authorId: number,
    @Query('published') published: boolean,
    @Query('categoryId') categoryId: number,
    @Query('filterConditionIds') filterConditionIds: number[],
  ) {
    return this.articlesService.findMany(
      title,
      contains,
      authorId,
      published,
      categoryId,
      filterConditionIds,
    );
  }

  @ApiOperation({
    summary: '获取回收站文章列表',
    description:
      '【超级管理员专用】获取已删除的文章列表（回收站）。这些文章已被软删除，但数据仍保留在数据库中。支持关键词搜索和分页。适用场景：后台管理系统回收站功能、误删除后恢复文章、定期清理已删除文章。文章可以通过恢复接口恢复，或通过永久删除接口彻底删除。',
  })
  @ApiQuery({
    name: 'page',
    description: '页码，从1开始',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: '每页文章数量',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    description: '搜索关键词，匹配文章标题或内容',
    required: false,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description:
      '返回已删除文章列表，包含删除时间、作者信息、分类信息。按删除时间倒序排列',
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
    summary: '获取文章统计数据',
    description:
      '【超级管理员专用】获取文章相关的完整统计数据。包括：文章总数、发布/草稿/推荐/已删除数量、按分类统计、新增趋势等。适用场景：后台管理系统仪表盘、统计报表、数据分析。',
  })
  @ApiResponse({
    status: 200,
    description: '返回详细的文章统计信息，包括各种维度的统计数据和趋势分析',
  })
  @RequireSuperAdmin()
  @Get('stats')
  async getArticleStats() {
    return this.adminArticlesService.getArticleStats();
  }

  @ApiOperation({
    summary: '获取文章详情',
    description:
      '根据文章ID获取文章的完整信息，包括文章内容、评论、分类、筛选条件等。此接口返回完整的文章内容（content字段）。适用场景：文章阅读页面、文章编辑预览。注意：此接口为公开接口，不需要认证。',
  })
  @ApiParam({ name: 'id', description: '文章ID', example: 1, type: Number })
  @ApiResponse({
    status: 200,
    description: '获取文章成功，返回完整的文章信息，包括文章内容',
  })
  @Public()
  @ApiResponse({ status: 404, description: '文章不存在' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.articlesService.findOne(+id);
  }

  @ApiOperation({
    summary: '更新文章',
    description:
      '【教师组长、教师、助教组长、助教专用】更新文章的标题、内容、摘要、封面、关键词、分类、筛选条件等信息。支持部分更新，只需传递要修改的字段。教师只能更新自己创建的文章，教师组长可以更新所有教师的文章，助教（组长）可以更新关联教师的文章。适用场景：修改文章内容、完善文章信息、修正错误、更新分类标签等。',
  })
  @ApiParam({ name: 'id', description: '要更新的文章ID', example: 1 })
  @ApiBody({
    type: UpdateArticleDto,
    description:
      '更新数据，所有字段都是可选的，只需传递要更新的字段。例如只更新标题：{"title":"新标题"}',
  })
  @ApiResponse({
    status: 200,
    description: '文章更新成功，返回更新后的完整文章信息',
  })
  @ApiResponse({ status: 404, description: '文章不存在或已被删除' })
  @ApiResponse({
    status: 403,
    description:
      '权限不足。教师只能更新自己的文章，助教只能更新关联教师的文章。如果没有更新权限，请联系教师组长或超级管理员',
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误：分类ID无效、筛选条件ID不存在等',
  })
  @RequireTeacherLeaderOrTeacherOrAssistantLeaderOrAssistant()
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateArticleDto: UpdateArticleDto) {
    return this.articlesService.update(+id, updateArticleDto);
  }

  @ApiOperation({ summary: '删除文章（软删除）' })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiResponse({ status: 200, description: '文章删除成功' })
  @ApiResponse({ status: 404, description: '文章不存在' })
  @ApiResponse({ status: 403, description: '权限不足，需要教师组长或教师角色' })
  @RequirePermissions([Permission.ARTICLE_DELETE])
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.articlesService.remove(+id);
  }

  // ==================== 管理员专用功能 ====================

  @ApiOperation({ summary: '恢复已删除的文章' })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiResponse({ status: 200, description: '文章恢复成功' })
  @ApiResponse({ status: 404, description: '文章不存在' })
  @ApiResponse({ status: 400, description: '文章未被删除，无需恢复' })
  @RequireSuperAdmin()
  @Post(':id/restore')
  async restore(@Param('id') id: string) {
    return this.adminArticlesService.restore(+id);
  }

  @ApiOperation({ summary: '永久删除文章（不可恢复）' })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiResponse({ status: 200, description: '文章永久删除成功' })
  @ApiResponse({ status: 404, description: '文章不存在' })
  @ApiResponse({ status: 400, description: '文章存在关联数据，无法永久删除' })
  @RequireSuperAdmin()
  @Delete(':id/permanent')
  async permanentlyDelete(@Param('id') id: string) {
    return this.adminArticlesService.permanentlyDelete(+id);
  }

  @ApiOperation({ summary: '发布文章' })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiResponse({ status: 200, description: '文章发布成功' })
  @ApiResponse({ status: 404, description: '文章不存在' })
  @RequireSuperAdmin()
  @Post(':id/publish')
  async publish(@Param('id') id: string) {
    return this.adminArticlesService.publish(+id);
  }

  @ApiOperation({ summary: '取消发布文章' })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiResponse({ status: 200, description: '取消发布成功' })
  @ApiResponse({ status: 404, description: '文章不存在' })
  @RequireSuperAdmin()
  @Post(':id/unpublish')
  async unpublish(@Param('id') id: string) {
    return this.adminArticlesService.unpublish(+id);
  }

  @ApiOperation({ summary: '设置文章为推荐' })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiResponse({ status: 200, description: '设置推荐成功' })
  @ApiResponse({ status: 404, description: '文章不存在' })
  @RequireSuperAdmin()
  @Post(':id/feature')
  async feature(@Param('id') id: string) {
    return this.adminArticlesService.feature(+id);
  }

  @ApiOperation({ summary: '取消文章推荐' })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiResponse({ status: 200, description: '取消推荐成功' })
  @ApiResponse({ status: 404, description: '文章不存在' })
  @RequireSuperAdmin()
  @Post(':id/unfeature')
  async unfeature(@Param('id') id: string) {
    return this.adminArticlesService.unfeature(+id);
  }
}
