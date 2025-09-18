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
   * @returns 收藏列表
   */
  async findAll(userId: number) {
    return this.prisma.favorite.findMany({
      where: { userId },
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
            content: true,
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * 检查用户是否收藏了某篇文章
   * @param userId 用户ID
   * @param articleId 文章ID
   * @returns 收藏记录或null
   */
  async findOne(userId: number, articleId: number) {
    return this.prisma.favorite.findUnique({
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
