import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma';

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

  async create(createArticleDto: CreateArticleDto) {
    const { filterConditionIds, ...articleData } = createArticleDto;

    // 验证分类是否存在
    const category = await this.prisma.category.findUnique({
      where: { id: articleData.categoryId },
    });
    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    // 验证筛选条件是否存在
    if (filterConditionIds && filterConditionIds.length > 0) {
      const filterConditions = await this.prisma.filterCondition.findMany({
        where: { id: { in: filterConditionIds } },
      });
      if (filterConditions.length !== filterConditionIds.length) {
        throw new NotFoundException('部分筛选条件不存在');
      }
    }

    // 创建文章并关联筛选条件
    return this.prisma.article.create({
      data: {
        ...articleData,
        filterConditions: filterConditionIds
          ? {
              create: filterConditionIds.map((filterConditionId) => ({
                filterConditionId,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        filterConditions: {
          include: {
            filterCondition: {
              include: {
                type: true,
              },
            },
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * 查询所有文章
   * @returns 所有文章
   */
  findAll() {
    return this.prisma.article.findMany({
      include: {
        category: true,
        filterConditions: {
          include: {
            filterCondition: {
              include: {
                type: true,
              },
            },
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
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
    return this.prisma.article.findMany({
      where,
      include: {
        category: true,
        filterConditions: {
          include: {
            filterCondition: {
              include: {
                type: true,
              },
            },
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * 根据id查询文章和对应的文章评论
   * @param id 文章id
   * @returns 文章和对应的文章评论
   */
  findOne(id: number) {
    return this.prisma.article.findUnique({
      where: { id },
      include: {
        comments: true,
        category: true,
        filterConditions: {
          include: {
            filterCondition: {
              include: {
                type: true,
              },
            },
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * 更新文章
   * @param id 文章id
   * @param updateArticleDto 更新文章dto
   * @returns 更新后的文章
   */
  async update(id: number, updateArticleDto: UpdateArticleDto) {
    const { filterConditionIds, ...articleData } = updateArticleDto;

    // 验证分类是否存在（如果提供了分类ID）
    if (articleData.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: articleData.categoryId },
      });
      if (!category) {
        throw new NotFoundException('分类不存在');
      }
    }

    // 验证筛选条件是否存在（如果提供了筛选条件ID）
    if (filterConditionIds && filterConditionIds.length > 0) {
      const filterConditions = await this.prisma.filterCondition.findMany({
        where: { id: { in: filterConditionIds } },
      });
      if (filterConditions.length !== filterConditionIds.length) {
        throw new NotFoundException('部分筛选条件不存在');
      }
    }

    // 更新文章
    return this.prisma.article.update({
      where: { id },
      data: {
        ...articleData,
        // 如果提供了筛选条件，先删除现有的关联，再创建新的关联
        ...(filterConditionIds !== undefined && {
          filterConditions: {
            deleteMany: {},
            create: filterConditionIds.map((filterConditionId) => ({
              filterConditionId,
            })),
          },
        }),
      },
      include: {
        category: true,
        filterConditions: {
          include: {
            filterCondition: {
              include: {
                type: true,
              },
            },
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
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
