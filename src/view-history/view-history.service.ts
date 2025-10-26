import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateViewHistoryDto } from './dto/create-view-history.dto';
import { QueryViewHistoryDto } from './dto/query-view-history.dto';

@Injectable()
export class ViewHistoryService {
  constructor(private prisma: PrismaService) {}

  /**
   * 添加浏览历史（如果已存在则更新更新时间）
   * @param userId 用户ID
   * @param createViewHistoryDto 浏览历史DTO
   * @returns 浏览历史记录
   */
  async create(userId: number, createViewHistoryDto: CreateViewHistoryDto) {
    const { articleId } = createViewHistoryDto;

    // 检查文章是否存在
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      throw new NotFoundException('文章不存在');
    }

    // 使用 upsert：如果已存在则更新，不存在则创建
    const viewHistory = await this.prisma.viewHistory.upsert({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
      update: {
        updatedAt: new Date(),
      },
      create: {
        userId,
        articleId,
      },
      include: {
        article: {
          select: {
            id: true,
            title: true,
            cover: true,
            summary: true,
            published: true,
            createdAt: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return viewHistory;
  }

  /**
   * 获取用户的浏览历史列表
   * @param userId 用户ID
   * @param queryDto 查询条件
   * @returns 浏览历史列表
   */
  async findAll(userId: number, queryDto?: QueryViewHistoryDto) {
    const { page, limit, keyword, categoryId, sort = 'desc' } = queryDto || {};

    // 构建基础查询条件
    const articleWhere: Record<string, unknown> = {
      deletedAt: null, // 不显示已删除的文章
    };

    // 如果有关键词，添加标题模糊搜索
    if (keyword) {
      articleWhere.title = {
        contains: keyword,
        mode: 'insensitive', // 不区分大小写
      };
    }

    // 如果有分类过滤
    if (categoryId) {
      articleWhere.categoryId = categoryId;
    }

    const where = {
      userId,
      article: articleWhere,
    };

    // 构建include
    const include = {
      article: {
        select: {
          id: true,
          title: true,
          cover: true,
          summary: true,
          published: true,
          keywords: true,
          featured: true,
          createdAt: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      },
    };

    // 如果提供了分页参数
    if (page && limit) {
      const skip = (page - 1) * limit;

      // 先获取总数
      const total = await this.prisma.viewHistory.count({ where });

      // 获取数据
      const data = await this.prisma.viewHistory.findMany({
        where,
        include,
        orderBy: { updatedAt: sort },
        skip,
        take: limit,
      });

      return {
        data,
        total,
        totalPages: Math.ceil(total / limit),
      };
    }

    // 不提供分页参数，返回所有数据
    const [data, total] = await Promise.all([
      this.prisma.viewHistory.findMany({
        where,
        include,
        orderBy: { updatedAt: sort },
      }),
      this.prisma.viewHistory.count({ where }),
    ]);

    return {
      data,
      total,
      totalPages: 1,
    };
  }

  /**
   * 获取单条浏览历史
   * @param userId 用户ID
   * @param articleId 文章ID
   * @returns 浏览历史记录
   */
  async findOne(userId: number, articleId: number) {
    const viewHistory = await this.prisma.viewHistory.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
      include: {
        article: {
          select: {
            id: true,
            title: true,
            cover: true,
            summary: true,
            published: true,
            keywords: true,
            featured: true,
            createdAt: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            author: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!viewHistory) {
      throw new NotFoundException('浏览历史不存在');
    }

    return viewHistory;
  }

  /**
   * 删除单条浏览历史
   * @param userId 用户ID
   * @param articleId 文章ID
   * @returns 删除结果
   */
  async remove(userId: number, articleId: number) {
    // 检查是否存在
    const viewHistory = await this.prisma.viewHistory.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
    });

    if (!viewHistory) {
      throw new NotFoundException('浏览历史不存在');
    }

    // 删除记录
    return this.prisma.viewHistory.delete({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
    });
  }

  /**
   * 清空用户的所有浏览历史
   * @param userId 用户ID
   * @returns 删除的记录数
   */
  async clearAll(userId: number) {
    const result = await this.prisma.viewHistory.deleteMany({
      where: { userId },
    });

    return {
      deletedCount: result.count,
    };
  }
}
