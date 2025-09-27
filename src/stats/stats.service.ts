import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemStatsDto } from './dto/system-stats.dto';
import { HotArticle } from './entities/hot-article.entity';
import { ActiveUser } from './entities/active-user.entity';
import { MediaStats } from './entities/media-stats.entity';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getSystemStats(): Promise<SystemStatsDto> {
    // 获取今日开始时间
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 并行获取各项统计数据
    const [
      totalUsers,
      totalArticles,
      hotArticles,
      activeUsers,
      mediaStats,
      todayVisits,
      totalVisits,
    ] = await Promise.all([
      this.getTotalUsers(),
      this.getTotalArticles(),
      this.getHotArticles(),
      this.getActiveUsers(),
      this.getMediaStats(),
      this.getTodayVisits(today),
      this.getTotalVisits(),
    ]);

    return {
      totalUsers,
      totalArticles,
      todayVisits,
      totalVisits,
      mediaStats,
      hotArticles,
      activeUsers,
      generatedAt: new Date(),
    };
  }

  private async getTotalUsers(): Promise<number> {
    return this.prisma.user.count();
  }

  private async getTotalArticles(): Promise<number> {
    return this.prisma.article.count();
  }

  private async getHotArticles(limit: number = 10): Promise<HotArticle[]> {
    const articles = await this.prisma.article.findMany({
      take: limit,
      orderBy: [{ createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        createdAt: true,
        author: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            comments: true,
            favorites: true,
          },
        },
      },
    });

    return articles.map((article) => ({
      id: article.id,
      title: article.title,
      viewCount: 0, // 暂时设为0，后续可以添加访问统计表
      likeCount: article._count.favorites, // 使用收藏数作为点赞数的近似值
      commentCount: article._count.comments,
      createdAt: article.createdAt,
      authorName: article.author?.name || '未知作者',
    }));
  }

  private async getActiveUsers(limit: number = 10): Promise<ActiveUser[]> {
    // 获取最近30天内有活动的用户
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          {
            articles: {
              some: {
                updatedAt: {
                  gte: thirtyDaysAgo,
                },
              },
            },
          },
          {
            comments: {
              some: {
                createdAt: {
                  gte: thirtyDaysAgo,
                },
              },
            },
          },
          {
            notes: {
              some: {
                updatedAt: {
                  gte: thirtyDaysAgo,
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            articles: true,
            comments: true,
            notes: true,
          },
        },
        articles: {
          select: {
            updatedAt: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        articles: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name || '未知用户',
      email: user.email,
      role: user.role?.name || '未知角色',
      articleCount: user._count.articles,
      commentCount: user._count.comments,
      noteCount: user._count.notes,
      lastActiveAt:
        user.articles[0]?.updatedAt ||
        user.articles[0]?.updatedAt ||
        new Date(),
    }));
  }

  private async getMediaStats(): Promise<MediaStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalMedia, todayUploads, imageStats, videoStats] =
      await Promise.all([
        this.prisma.media.count(),
        this.prisma.media.count({
          where: {
            createdAt: {
              gte: today,
            },
          },
        }),
        this.prisma.media.count({
          where: {
            type: 'IMAGE',
          },
        }),
        this.prisma.media.count({
          where: {
            type: 'VIDEO',
          },
        }),
      ]);

    return {
      totalCount: totalMedia,
      totalSize: 0, // Media表中没有fileSize字段，暂时设为0
      imageCount: imageStats,
      videoCount: videoStats,
      documentCount: 0, // Media表中只有IMAGE和VIDEO类型，文档数量设为0
      todayUploadCount: todayUploads,
      todayUploadSize: 0, // 暂时设为0
    };
  }

  private async getTodayVisits(today: Date): Promise<number> {
    // 由于没有访问日志表，这里使用今日更新的文章数作为近似值
    // 在实际项目中，建议添加专门的访问日志表
    return this.prisma.article.count({
      where: {
        updatedAt: {
          gte: today,
        },
      },
    });
  }

  private async getTotalVisits(): Promise<number> {
    // 使用文章总数作为近似值
    // 在实际项目中，建议添加专门的访问日志表
    return this.prisma.article.count();
  }
}
