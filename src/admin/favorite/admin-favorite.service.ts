import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminFavoriteService {
  constructor(private prisma: PrismaService) {}

  async findAll(options: { page: number; limit: number }) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      this.prisma.favorite.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      }),
      this.prisma.favorite.count(),
    ]);

    return {
      data: favorites,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async remove(userId: number, articleId: number) {
    const favorite = await this.prisma.favorite.findUnique({
      where: { 
        userId_articleId: {
          userId,
          articleId
        }
      },
    });

    if (!favorite) {
      throw new Error('收藏记录不存在');
    }

    await this.prisma.favorite.delete({
      where: { 
        userId_articleId: {
          userId,
          articleId
        }
      },
    });

    return {
      userId,
      articleId,
      message: '收藏记录删除成功',
    };
  }
}