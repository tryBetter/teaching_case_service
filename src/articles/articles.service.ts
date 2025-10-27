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
          select: {
            id: true,
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
   * 查询所有文章（不包括已删除的，不包含文章内容）
   * @returns 所有文章列表（不包含content字段）
   */
  findAll() {
    return this.prisma.article.findMany({
      where: {
        deletedAt: null, // 只查询未删除的文章
      },
      select: {
        id: true,
        title: true,
        // content: false, // 不查询文章内容
        cover: true,
        summary: true,
        keywords: true,
        featured: true,
        published: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
        authorId: true,
        categoryId: true,
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
   * 分页查询文章，支持高级查询参数
   * @param params 查询参数
   * @returns 分页后的文章列表（不包含文章内容）
   */
  async findAllWithPagination(params: {
    page: number;
    limit: number;
    search?: string;
    authorId?: number;
    categoryId?: number;
    published?: boolean;
    featured?: boolean;
    filterConditionIds?: number[];
    orderBy?: string;
  }): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page,
      limit,
      search,
      authorId,
      categoryId,
      published,
      featured,
      filterConditionIds,
      orderBy,
    } = params;

    // 构建查询条件
    const where: Prisma.ArticleWhereInput = {
      deletedAt: null, // 只查询未删除的文章
    };

    // 关键词搜索（模糊匹配标题、内容、摘要）
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { summary: { contains: search } },
      ];
    }

    // 按作者筛选
    if (authorId !== undefined) {
      where.authorId = authorId;
    }

    // 按分类筛选
    if (categoryId !== undefined) {
      where.categoryId = categoryId;
    }

    // 按发布状态筛选
    if (published !== undefined) {
      where.published = published;
    }

    // 按推荐状态筛选
    if (featured !== undefined) {
      where.featured = featured;
    }

    // 按筛选条件ID筛选
    if (filterConditionIds && filterConditionIds.length > 0) {
      where.filterConditions = {
        some: {
          filterConditionId: {
            in: filterConditionIds,
          },
        },
      };
    }

    // 构建排序规则
    let orderByClause: Prisma.ArticleOrderByWithRelationInput = {
      createdAt: 'desc',
    };
    if (orderBy) {
      const [field, direction] = orderBy.split('_');
      if (field === 'createdAt' || field === 'updatedAt') {
        orderByClause = { [field]: direction === 'asc' ? 'asc' : 'desc' };
      }
    }

    // 查询总数
    const total = await this.prisma.article.count({ where });

    // 分页查询，不包含文章内容（content字段）
    const skip = (page - 1) * limit;
    const data = await this.prisma.article.findMany({
      where,
      skip,
      take: limit,
      orderBy: orderByClause,
      select: {
        id: true,
        title: true,
        // content: false, // 不查询文章内容
        cover: true,
        summary: true,
        keywords: true,
        featured: true,
        published: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
        authorId: true,
        categoryId: true,
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

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 根据传入的条件筛选查询文章，传入的条件为标题、是否模糊查询、作者id、是否发布、分类ID、筛选条件ID列表
   * @param title 标题
   * @param contains 是否模糊查询
   * @param authorId 作者id
   * @param published 是否发布
   * @param categoryId 分类ID
   * @param filterConditionIds 筛选条件ID列表
   * @returns 筛选后的文章（不包含文章内容）
   */
  findMany(
    title: string,
    contains: boolean,
    authorId: number,
    published: boolean,
    categoryId: number,
    filterConditionIds: number[],
  ) {
    // 构建查询条件
    const where: Prisma.ArticleWhereInput = {
      deletedAt: null, // 只查询未删除的文章
      ...(title && (contains ? { title: { contains: title } } : { title })),
      ...(authorId !== undefined && { authorId }),
      ...(published !== undefined && { published }),
      ...(categoryId !== undefined && { categoryId }),
      ...(filterConditionIds &&
        filterConditionIds.length > 0 && {
          filterConditions: {
            some: {
              filterConditionId: {
                in: filterConditionIds,
              },
            },
          },
        }),
    };

    return this.prisma.article.findMany({
      where,
      select: {
        id: true,
        title: true,
        // content: false, // 不查询文章内容
        cover: true,
        summary: true,
        keywords: true,
        featured: true,
        published: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
        authorId: true,
        categoryId: true,
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
   * 根据id查询文章和对应的文章评论（包括已删除的）
   * @param id 文章id
   * @param userId 用户ID（可选，如果提供则自动创建浏览历史）
   * @returns 文章和对应的文章评论
   */
  async findOne(id: number, userId?: number) {
    const article = await this.prisma.article.findUnique({
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

    // 如果用户已登录且文章存在，自动添加浏览历史
    if (article && userId) {
      try {
        // 使用 upsert 自动处理已存在的情况
        await this.prisma.viewHistory.upsert({
          where: {
            userId_articleId: {
              userId,
              articleId: id,
            },
          },
          update: {
            updatedAt: new Date(),
          },
          create: {
            userId,
            articleId: id,
          },
        });
      } catch (error) {
        // 如果创建浏览历史失败，记录错误但不影响文章的正常返回
        console.warn(
          `Failed to create view history for user ${userId} and article ${id}:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    return article;
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
          select: {
            id: true,
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
   * 软删除文章
   * @param id 文章id
   * @returns 删除后的文章
   */
  remove(id: number) {
    return this.prisma.article.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * 恢复已删除的文章
   * @param id 文章id
   * @returns 恢复后的文章
   */
  restore(id: number) {
    return this.prisma.article.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  /**
   * 永久删除文章（真删除）
   * @param id 文章id
   * @returns 删除后的文章
   */
  permanentlyDelete(id: number) {
    return this.prisma.article.delete({ where: { id } });
  }
}
