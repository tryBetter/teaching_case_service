import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoriteService {
  constructor(private prisma: PrismaService) {}

  /**
   * 收藏文章
   * @param userId 用户ID
   * @param createFavoriteDto 收藏DTO
   * @returns 收藏记录
   */
  async create(userId: number, createFavoriteDto: CreateFavoriteDto) {
    const { articleId } = createFavoriteDto;

    // 检查文章是否存在
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      throw new NotFoundException('文章不存在');
    }

    // 检查是否已经收藏
    const existingFavorite = await this.prisma.favorite.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
    });

    if (existingFavorite) {
      throw new ConflictException('已经收藏过该文章');
    }

    // 创建收藏记录
    return this.prisma.favorite.create({
      data: {
        userId,
        articleId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        article: {
          select: {
            id: true,
            title: true,
            published: true,
          },
        },
      },
    });
  }

  /**
   * 获取用户的所有收藏
   * @param userId 用户ID
   * @param options 分页选项
   * @returns 收藏列表（只返回已发布的案例）
   */
  async findAll(userId?: number, options?: { page?: number; limit?: number }) {
    const { page, limit } = options || {};
    // 构建查询条件：包含用户ID过滤和只返回已发布的文章
    const where = {
      ...(userId ? { userId } : {}),
      article: {
        published: true, // 只返回已发布的案例
      },
    };

    const include = {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      article: {
        select: {
          id: true,
          title: true,
          cover: true,
          keywords: true,
          published: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    };

    // 先获取总数（只统计已发布的文章）
    const total = await this.prisma.favorite.count({ where });

    // 如果提供了分页参数，返回分页数据
    if (page && limit) {
      const skip = (page - 1) * limit;
      const data = await this.prisma.favorite.findMany({
        where,
        include,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    // 否则返回所有数据（但统一返回格式）
    const data = await this.prisma.favorite.findMany({
      where,
      include,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      data,
      total,
      page: 1,
      limit: total,
      totalPages: 1,
    };
  }

  /**
   * 检查用户是否收藏了某篇文章
   * @param userId 用户ID
   * @param articleId 文章ID
   * @returns 收藏记录
   * @throws NotFoundException 如果未收藏该文章
   */
  async findOne(userId: number, articleId: number) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        article: {
          select: {
            id: true,
            title: true,
            published: true,
          },
        },
      },
    });

    if (!favorite) {
      throw new NotFoundException('未收藏该文章');
    }

    return favorite;
  }

  /**
   * 取消收藏文章
   * @param userId 用户ID
   * @param articleId 文章ID
   * @returns 删除结果
   */
  async remove(userId: number, articleId: number) {
    // 检查收藏是否存在
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
    });

    if (!favorite) {
      throw new NotFoundException('收藏记录不存在');
    }

    // 删除收藏记录
    return this.prisma.favorite.delete({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
    });
  }

  /**
   * 获取文章的收藏数量
   * @param articleId 文章ID
   * @returns 收藏数量
   */
  async getFavoriteCount(articleId: number) {
    return this.prisma.favorite.count({
      where: { articleId },
    });
  }
}
