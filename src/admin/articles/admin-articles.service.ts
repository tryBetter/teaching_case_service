import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ArticlesService } from '../../articles/articles.service';
import { CreateArticleDto } from '../../articles/dto/create-article.dto';
import { UpdateArticleDto } from '../../articles/dto/update-article.dto';
import type { Prisma } from '../../../generated/prisma';

@Injectable()
export class AdminArticlesService {
  constructor(
    private prisma: PrismaService,
    private articlesService: ArticlesService,
  ) {}

  async findAll(options: {
    page: number;
    limit: number;
    published?: boolean;
    categoryId?: number;
    authorId?: number;
    search?: string;
    includeDeleted?: boolean; // 是否包括已删除的文章
  }) {
    const {
      page,
      limit,
      published,
      categoryId,
      authorId,
      search,
      includeDeleted,
    } = options;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: Prisma.ArticleWhereInput = {};

    // 默认不包括已删除的文章
    if (!includeDeleted) {
      where.deletedAt = null;
    }

    if (published !== undefined) {
      where.published = published;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (authorId) {
      where.authorId = authorId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ];
    }

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              comments: true,
              favorites: true,
              notes: true,
            },
          },
        },
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      data: articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: {
              select: {
                name: true,
              },
            },
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        filterConditions: {
          include: {
            // 移除type字段，因为ArticleFilterCondition没有type关联
          },
        },
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        media: {
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
    });

    if (!article) {
      throw new Error('文章不存在');
    }

    return article;
  }

  async create(createArticleDto: CreateArticleDto) {
    return this.articlesService.create(createArticleDto);
  }

  async update(id: number, updateArticleDto: UpdateArticleDto) {
    return this.articlesService.update(id, updateArticleDto);
  }

  async remove(id: number) {
    const article = await this.prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      throw new Error('文章不存在');
    }

    if (article.deletedAt) {
      throw new Error('文章已被删除');
    }

    await this.articlesService.remove(id);

    return {
      id: article.id,
      title: article.title,
      message: '文章已软删除成功',
    };
  }

  /**
   * 恢复已删除的文章
   * @param id 文章id
   * @returns 恢复结果
   */
  async restore(id: number) {
    const article = await this.prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      throw new Error('文章不存在');
    }

    if (!article.deletedAt) {
      throw new Error('文章未被删除，无需恢复');
    }

    await this.articlesService.restore(id);

    return {
      id: article.id,
      title: article.title,
      message: '文章恢复成功',
    };
  }

  /**
   * 永久删除文章（真删除）
   * @param id 文章id
   * @returns 删除结果
   */
  async permanentlyDelete(id: number) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: {
        comments: true,
        favorites: true,
        notes: true,
      },
    });

    if (!article) {
      throw new Error('文章不存在');
    }

    // 检查是否有关联数据
    const hasRelatedData =
      article.comments.length > 0 ||
      article.favorites.length > 0 ||
      article.notes.length > 0;

    if (hasRelatedData) {
      throw new Error(
        '文章存在关联数据（评论、收藏或笔记），无法永久删除。请先删除相关数据或使用软删除。',
      );
    }

    await this.articlesService.permanentlyDelete(id);

    return {
      id: article.id,
      title: article.title,
      message: '文章已永久删除',
    };
  }

  /**
   * 获取已删除的文章列表
   * @param options 查询选项
   * @returns 已删除的文章列表
   */
  async findDeleted(options: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.ArticleWhereInput = {
      deletedAt: { not: null }, // 只查询已删除的文章
    };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ];
    }

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        skip,
        take: limit,
        orderBy: { deletedAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      data: articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async publish(id: number) {
    return this.articlesService.publish(id);
  }

  async unpublish(id: number) {
    const article = await this.prisma.article.update({
      where: { id },
      data: { published: false },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return article;
  }

  async feature(id: number) {
    const article = await this.prisma.article.update({
      where: { id },
      data: { featured: true },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return article;
  }

  async unfeature(id: number) {
    const article = await this.prisma.article.update({
      where: { id },
      data: { featured: false },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return article;
  }

  async getArticleStats() {
    const [
      totalArticles,
      publishedArticles,
      draftArticles,
      featuredArticles,
      deletedArticles,
      articlesByCategory,
      newArticlesToday,
      newArticlesThisWeek,
      newArticlesThisMonth,
    ] = await Promise.all([
      this.prisma.article.count({
        where: { deletedAt: null }, // 只统计未删除的
      }),

      this.prisma.article.count({
        where: { published: true, deletedAt: null },
      }),

      this.prisma.article.count({
        where: { published: false, deletedAt: null },
      }),

      this.prisma.article.count({
        where: { featured: true, deletedAt: null },
      }),

      this.prisma.article.count({
        where: { deletedAt: { not: null } }, // 已删除的文章数量
      }),

      // 按分类统计文章数量（不包括已删除的）
      this.prisma.article
        .groupBy({
          by: ['categoryId'],
          where: { deletedAt: null },
          _count: {
            id: true,
          },
          orderBy: {
            _count: {
              id: 'desc',
            },
          },
        })
        .then(async (results) => {
          const categoryIds = results.map((r) => r.categoryId);
          const categories = await this.prisma.category.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true },
          });

          return results.map((result) => {
            const category = categories.find((c) => c.id === result.categoryId);
            return {
              category: category?.name || '未知分类',
              count: result._count.id,
            };
          });
        }),

      // 今日新增文章（不包括已删除的）
      this.prisma.article.count({
        where: {
          deletedAt: null,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),

      // 本周新增文章（不包括已删除的）
      this.prisma.article.count({
        where: {
          deletedAt: null,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // 本月新增文章（不包括已删除的）
      this.prisma.article.count({
        where: {
          deletedAt: null,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    return {
      totalArticles,
      publishedArticles,
      draftArticles,
      featuredArticles,
      deletedArticles,
      articlesByCategory,
      newArticlesToday,
      newArticlesThisWeek,
      newArticlesThisMonth,
    };
  }
}
