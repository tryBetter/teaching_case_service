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
} from '../auth/decorators/roles.decorator';
import { Permission } from '../auth/enums/permissions.enum';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('文章管理')
@Controller('articles')
@UseGuards(RolesGuard)
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @ApiOperation({ summary: '创建文章' })
  @ApiResponse({ status: 201, description: '文章创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 403, description: '权限不足，需要教师或助教角色' })
  @RequireTeacherOrAssistant()
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

  @Public()
  @ApiOperation({ summary: '获取所有文章' })
  @ApiResponse({ status: 200, description: '获取文章列表成功' })
  @Get()
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
  @Post('publish')
  publish(@Body('id') id: string) {
    return this.articlesService.publish(+id);
  }

  @ApiOperation({ summary: '更新文章' })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiResponse({ status: 200, description: '文章更新成功' })
  @ApiResponse({ status: 404, description: '文章不存在' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateArticleDto: UpdateArticleDto) {
    return this.articlesService.update(+id, updateArticleDto);
  }

  @ApiOperation({ summary: '删除文章' })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiResponse({ status: 200, description: '文章删除成功' })
  @ApiResponse({ status: 404, description: '文章不存在' })
  @ApiResponse({ status: 403, description: '权限不足，需要教师角色' })
  @RequirePermissions([Permission.ARTICLE_DELETE])
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.articlesService.remove(+id);
  }
}
