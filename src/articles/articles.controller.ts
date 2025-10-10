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
  RequireTeacherOrAssistant,
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

  @ApiOperation({ summary: '创建文章' })
  @ApiResponse({ status: 201, description: '文章创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({
    status: 403,
    description: '权限不足，需要教师组长或教师角色',
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

  @ApiOperation({ summary: '获取文章列表（带分页）' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'published', required: false, type: Boolean })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  @ApiQuery({ name: 'authorId', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'includeDeleted',
    required: false,
    type: Boolean,
    description: '是否包括已删除的文章',
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
  @ApiOperation({ summary: '获取所有文章（无分页）' })
  @ApiResponse({ status: 200, description: '获取文章列表成功' })
  @Get('all')
  findAll() {
    return this.articlesService.findAll();
  }

  @ApiOperation({ summary: '根据条件筛选查询文章' })
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
  @ApiResponse({ status: 200, description: '筛选查询成功' })
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

  @ApiOperation({ summary: '根据ID获取文章' })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiOperation({ summary: '获取已删除的文章列表' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: '获取已删除文章列表成功' })
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

  @ApiOperation({ summary: '获取文章统计信息' })
  @ApiResponse({ status: 200, description: '获取统计信息成功' })
  @RequireSuperAdmin()
  @Get('stats')
  async getArticleStats() {
    return this.adminArticlesService.getArticleStats();
  }

  @ApiResponse({ status: 200, description: '获取文章成功' })
  @Public()
  @ApiResponse({ status: 404, description: '文章不存在' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.articlesService.findOne(+id);
  }

  @ApiOperation({ summary: '发布文章' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: '文章ID' },
      },
    },
  })
  @ApiResponse({ status: 200, description: '文章发布成功' })
  @ApiResponse({ status: 404, description: '文章不存在' })
  @ApiResponse({
    status: 403,
    description: '权限不足，需要教师组长或教师角色',
  })
  @ApiOperation({ summary: '更新文章' })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiResponse({ status: 200, description: '文章更新成功' })
  @ApiResponse({ status: 404, description: '文章不存在' })
  @ApiResponse({
    status: 403,
    description: '权限不足，需要教师组长、教师、助教组长或助教角色',
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
