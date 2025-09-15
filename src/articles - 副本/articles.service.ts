import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js'; // 导入我们创建的 PrismaService
import { Article, User } from '../../generated/prisma'; // 导入 Prisma 自动生成的类型
// 假设你已经定义了 DTOs (Data Transfer Objects) 用于数据验证
// import { CreateArticleDto } from './dto/create-article.dto';
// import { UpdateArticleDto } from './dto/update-article.dto';

@Injectable()
export class ArticlesService {
  /**
   * 这里的魔法发生了！
   * 我们通过 NestJS 的构造函数注入了 PrismaService。
   * NestJS 会自动将 PrismaService 的单例对象赋值给 this.prisma。
   * this.prisma 现在就是一个功能齐全的 Prisma Client 实例。
   */
  constructor(private prisma: PrismaService) {}

  // --- 增 (Create) ---
  async createArticle(
    // createDto: CreateArticleDto,
    authorId: number,
    data: { title: string; content?: string },
  ): Promise<Article> {
    return this.prisma.article.create({
      data: {
        title: data.title,
        content: data.content,
        author: {
          connect: { id: authorId },
        },
      },
    });
  }

  // --- 查 (Read) ---
  async findAllArticles(): Promise<Article[]> {
    return this.prisma.article.findMany({
      where: { published: true }, // 例如，只查找已发布的文章
      include: { author: true }, // 同时返回作者信息
    });
  }

  async findArticleById(id: number): Promise<Article | null> {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: {
        comments: true, // 同时返回文章的所有评论
      },
    });

    if (!article) {
      throw new NotFoundException(`ID 为 ${id} 的文章不存在`);
    }

    return article;
  }

  // --- 改 (Update) ---
  async updateArticle(
    id: number,
    // updateDto: UpdateArticleDto
    data: { title?: string; content?: string; published?: boolean },
  ): Promise<Article> {
    return this.prisma.article.update({
      where: { id },
      data,
    });
  }

  // --- 删 (Delete) ---
  async deleteArticle(id: number): Promise<Article> {
    // 需要先确保文章存在，否则 update/delete 会抛出找不到记录的错误
    const articleExists = await this.prisma.article.findUnique({
      where: { id },
    });
    if (!articleExists) {
      throw new NotFoundException(`ID 为 ${id} 的文章不存在`);
    }

    return this.prisma.article.delete({
      where: { id },
    });
  }
}
