import { Injectable } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '../../generated/prisma';

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

  create(createArticleDto: CreateArticleDto) {
    return this.prisma.article.create({ data: createArticleDto });
  }

  /**
   * 查询所有文章
   * @returns 所有文章
   */
  findAll() {
    return this.prisma.article.findMany();
  }

  /**
   * 根据传入的条件筛选查询文章，传入的条件为标题、是否模糊查询、作者id、是否发布
   * @param title 标题
   * @param contains 是否模糊查询
   * @param authorId 作者id
   * @param published 是否发布
   * @returns 筛选后的文章
   */
  findMany(
    title: string,
    contains: boolean,
    authorId: number,
    published: boolean,
  ) {
    // 修复：findMany 需要传入对象 { where }
    const where: Prisma.ArticleWhereInput = {
      ...(title && (contains ? { title: { contains: title } } : { title })),
      ...(authorId !== undefined && { authorId }),
      ...(published !== undefined && { published }),
    };
    return this.prisma.article.findMany({ where });
  }

  /**
   * 根据id查询文章和对应的文章评论
   * @param id 文章id
   * @returns 文章和对应的文章评论
   */
  findOne(id: number) {
    return this.prisma.article.findUnique({
      where: { id },
      include: { comments: true },
    });
  }

  /**
   * 更新文章
   * @param id 文章id
   * @param updateArticleDto 更新文章dto
   * @returns 更新后的文章
   */
  update(id: number, updateArticleDto: UpdateArticleDto) {
    return this.prisma.article.update({
      where: { id },
      data: updateArticleDto,
    });
  }

  /**
   * 发布文章
   * @param id 文章id
   * @returns 发布后的文章
   */
  publish(id: number) {
    return this.prisma.article.update({
      where: { id },
      data: { published: true },
    });
  }

  /**
   * 删除文章
   * @param id 文章id
   * @returns 删除后的文章
   */
  remove(id: number) {
    return this.prisma.article.delete({ where: { id } });
  }
}
