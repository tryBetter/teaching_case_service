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
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@ApiTags('文章管理')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @ApiOperation({ summary: '创建文章' })
  @ApiResponse({ status: 201, description: '文章创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @Post()
  create(@Body() createArticleDto: CreateArticleDto) {
    return this.articlesService.create(createArticleDto);
  }

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
  @ApiResponse({ status: 200, description: '筛选查询成功' })
  @Get('many')
  findMany(
    @Query('title') title: string,
    @Query('contains') contains: boolean,
    @Query('authorId') authorId: number,
    @Query('published') published: boolean,
  ) {
    return this.articlesService.findMany(title, contains, authorId, published);
  }

  @ApiOperation({ summary: '根据ID获取文章' })
  @ApiParam({ name: 'id', description: '文章ID' })
  @ApiResponse({ status: 200, description: '获取文章成功' })
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
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.articlesService.remove(+id);
  }
}
