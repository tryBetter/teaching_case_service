import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
// 假设你已经定义了 DTOs
// import { CreateArticleDto } from './dto/create-article.dto';
// import { UpdateArticleDto } from './dto/update-article.dto';

/**
 * @Controller('articles') 告诉 NestJS 这个类处理所有路由前缀为 /articles 的请求。
 * 例如，下面的 @Get() 方法将对应 GET /articles 请求。
 */
@Controller('articles')
export class ArticlesController {
  // 通过构造函数注入 ArticlesService
  constructor(private readonly articlesService: ArticlesService) {}

  // POST /articles
  @Post()
  create(
    // @Body() 用于获取请求体中的数据
    // TODO: 使用 CreateArticleDto 来验证数据
    @Body()
    createArticleDto: { title: string; content?: string; authorId: number },
  ) {
    const { authorId, ...data } = createArticleDto;
    return this.articlesService.createArticle(authorId, data);
  }

  // GET /articles
  @Get()
  findAll() {
    return this.articlesService.findAllArticles();
  }

  // GET /articles/:id
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    // ParseIntPipe 会自动将字符串 id 转换为数字，如果转换失败会报错
    return this.articlesService.findArticleById(id);
  }

  // PATCH /articles/:id
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    // TODO: 使用 UpdateArticleDto 来验证数据
    @Body()
    updateArticleDto: { title?: string; content?: string; published?: boolean },
  ) {
    return this.articlesService.updateArticle(id, updateArticleDto);
  }

  // DELETE /articles/:id
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.articlesService.deleteArticle(id);
  }
}
