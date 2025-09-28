import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemStatsDto } from './dto/system-stats.dto';
import { HotArticle } from './entities/hot-article.entity';
import { ActiveUser } from './entities/active-user.entity';
import { MediaStats } from './entities/media-stats.entity';
import { OverviewStatsDto } from './dto/overview-stats.dto';
import { UserStatsDto, UserRoleStatsDto } from './dto/user-stats.dto';
import { ContentStatsDto } from './dto/content-stats.dto';
import { VisitStatsDto } from './dto/visit-stats.dto';
import { TimeRangeStatsDto } from './dto/time-range-stats.dto';
import {
  UserGrowthTrendDto,
  ContentGrowthTrendDto,
  VisitTrendDto,
  TrendDataPointDto,
} from './dto/trend-stats.dto';
import {
  PopularContentStatsDto,
  PopularContentDto,
} from './dto/popular-content.dto';
import { ActiveUsersStatsDto, ActiveUserDto } from './dto/active-users.dto';

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
      this.getActiveUsersOld(),
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

  private async getActiveUsersOld(limit: number = 10): Promise<ActiveUser[]> {
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

  // ==================== 新增统计方法 ====================

  /**
   * 获取总体统计数据
   */
  async getOverviewStats(): Promise<OverviewStatsDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalArticles,
      totalComments,
      totalFavorites,
      totalNotes,
      totalMedia,
      todayNewUsers,
      todayNewArticles,
      todayVisits,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.article.count(),
      this.prisma.comment.count(),
      this.prisma.favorite.count(),
      this.prisma.note.count(),
      this.prisma.media.count(),
      this.prisma.user.count({
        where: { createdAt: { gte: today } },
      }),
      this.prisma.article.count({
        where: { createdAt: { gte: today } },
      }),
      this.getTodayVisits(today),
    ]);

    return {
      totalUsers,
      totalArticles,
      totalComments,
      totalFavorites,
      totalNotes,
      totalMedia,
      todayNewUsers,
      todayNewArticles,
      todayVisits,
      generatedAt: new Date(),
    };
  }

  /**
   * 获取用户统计数据
   */
  async getUserStats(): Promise<UserStatsDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsers,
      todayNewUsers,
      weekNewUsers,
      monthNewUsers,
      activeUsers,
      usersByRole,
      roles,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: { createdAt: { gte: today } },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: weekAgo } },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: monthAgo } },
      }),
      this.prisma.user.count({
        where: {
          OR: [
            {
              articles: {
                some: {
                  updatedAt: { gte: thirtyDaysAgo },
                },
              },
            },
            {
              comments: {
                some: {
                  createdAt: { gte: thirtyDaysAgo },
                },
              },
            },
            {
              notes: {
                some: {
                  updatedAt: { gte: thirtyDaysAgo },
                },
              },
            },
          ],
        },
      }),
      this.prisma.user.groupBy({
        by: ['roleId'],
        _count: true,
      }),
      this.prisma.role.findMany(),
    ]);

    const roleStats: UserRoleStatsDto[] = usersByRole.map((userGroup) => {
      const role = roles.find((r) => r.id === userGroup.roleId);
      return {
        roleName: role?.name || '未知角色',
        count: userGroup._count,
        percentage: (userGroup._count / totalUsers) * 100,
      };
    });

    return {
      totalUsers,
      todayNewUsers,
      weekNewUsers,
      monthNewUsers,
      activeUsers,
      roleStats,
      generatedAt: new Date(),
    };
  }

  /**
   * 获取内容统计数据
   */
  async getContentStats(): Promise<ContentStatsDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    const [
      totalArticles,
      publishedArticles,
      draftArticles,
      featuredArticles,
      todayNewArticles,
      weekNewArticles,
      monthNewArticles,
      totalComments,
      todayNewComments,
      totalFavorites,
      totalNotes,
      totalMedia,
      imageCount,
      videoCount,
    ] = await Promise.all([
      this.prisma.article.count(),
      this.prisma.article.count({
        where: { published: true },
      }),
      this.prisma.article.count({
        where: { published: false },
      }),
      this.prisma.article.count({
        where: { featured: true },
      }),
      this.prisma.article.count({
        where: { createdAt: { gte: today } },
      }),
      this.prisma.article.count({
        where: { createdAt: { gte: weekAgo } },
      }),
      this.prisma.article.count({
        where: { createdAt: { gte: monthAgo } },
      }),
      this.prisma.comment.count(),
      this.prisma.comment.count({
        where: { createdAt: { gte: today } },
      }),
      this.prisma.favorite.count(),
      this.prisma.note.count(),
      this.prisma.media.count(),
      this.prisma.media.count({
        where: { type: 'IMAGE' },
      }),
      this.prisma.media.count({
        where: { type: 'VIDEO' },
      }),
    ]);

    return {
      totalArticles,
      publishedArticles,
      draftArticles,
      featuredArticles,
      todayNewArticles,
      weekNewArticles,
      monthNewArticles,
      totalComments,
      todayNewComments,
      totalFavorites,
      totalNotes,
      totalMedia,
      imageCount,
      videoCount,
      generatedAt: new Date(),
    };
  }

  /**
   * 获取访问统计数据
   */
  async getVisitStats(): Promise<VisitStatsDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    const [
      todayVisits,
      yesterdayVisits,
      weekVisits,
      monthVisits,
      totalVisits,
      todayUniqueVisitors,
      weekUniqueVisitors,
      monthUniqueVisitors,
    ] = await Promise.all([
      this.getTodayVisits(today),
      this.getTodayVisits(yesterday),
      this.getTodayVisits(weekAgo),
      this.getTodayVisits(monthAgo),
      this.getTotalVisits(),
      // 由于没有访问日志表，使用近似值
      this.prisma.user.count({
        where: { updatedAt: { gte: today } },
      }),
      this.prisma.user.count({
        where: { updatedAt: { gte: weekAgo } },
      }),
      this.prisma.user.count({
        where: { updatedAt: { gte: monthAgo } },
      }),
    ]);

    const averageDailyVisits = totalVisits / 30; // 假设30天的平均值

    return {
      todayVisits,
      yesterdayVisits,
      weekVisits,
      monthVisits,
      totalVisits,
      todayUniqueVisitors,
      weekUniqueVisitors,
      monthUniqueVisitors,
      averageDailyVisits,
      generatedAt: new Date(),
    };
  }

  /**
   * 获取指定时间范围的统计数据
   */
  async getTimeRangeStats(
    startDate: Date,
    endDate: Date,
  ): Promise<TimeRangeStatsDto> {
    const [users, articles, comments, favorites, notes, visits] =
      await Promise.all([
        this.prisma.user.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),
        this.prisma.article.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),
        this.prisma.comment.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),
        this.prisma.favorite.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),
        this.prisma.note.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),
        this.prisma.article.count({
          where: {
            updatedAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),
      ]);

    return {
      startDate,
      endDate,
      users,
      articles,
      comments,
      favorites,
      notes,
      visits,
      generatedAt: new Date(),
    };
  }

  /**
   * 获取用户增长趋势数据
   */
  async getUserGrowthTrend(days: number = 30): Promise<UserGrowthTrendDto> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const data: TrendDataPointDto[] = [];
    let totalGrowth = 0;

    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await this.prisma.user.count({
        where: {
          createdAt: {
            gte: currentDate,
            lt: nextDate,
          },
        },
      });

      data.push({
        date: currentDate.toISOString().split('T')[0],
        value: count,
      });

      totalGrowth += count;
    }

    return {
      data,
      totalGrowth,
      averageDailyGrowth: totalGrowth / days,
      generatedAt: new Date(),
    };
  }

  /**
   * 获取内容增长趋势数据
   */
  async getContentGrowthTrend(
    days: number = 30,
  ): Promise<ContentGrowthTrendDto> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const articles: TrendDataPointDto[] = [];
    const comments: TrendDataPointDto[] = [];
    const favorites: TrendDataPointDto[] = [];

    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);

      const [articleCount, commentCount, favoriteCount] = await Promise.all([
        this.prisma.article.count({
          where: {
            createdAt: {
              gte: currentDate,
              lt: nextDate,
            },
          },
        }),
        this.prisma.comment.count({
          where: {
            createdAt: {
              gte: currentDate,
              lt: nextDate,
            },
          },
        }),
        this.prisma.favorite.count({
          where: {
            createdAt: {
              gte: currentDate,
              lt: nextDate,
            },
          },
        }),
      ]);

      const dateStr = currentDate.toISOString().split('T')[0];
      articles.push({ date: dateStr, value: articleCount });
      comments.push({ date: dateStr, value: commentCount });
      favorites.push({ date: dateStr, value: favoriteCount });
    }

    return {
      articles,
      comments,
      favorites,
      generatedAt: new Date(),
    };
  }

  /**
   * 获取访问趋势数据
   */
  async getVisitTrend(days: number = 30): Promise<VisitTrendDto> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const data: TrendDataPointDto[] = [];
    let totalVisits = 0;
    let peakVisits = 0;
    let peakDate = '';

    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await this.prisma.article.count({
        where: {
          updatedAt: {
            gte: currentDate,
            lt: nextDate,
          },
        },
      });

      const dateStr = currentDate.toISOString().split('T')[0];
      data.push({ date: dateStr, value: count });

      totalVisits += count;
      if (count > peakVisits) {
        peakVisits = count;
        peakDate = dateStr;
      }
    }

    return {
      data,
      totalVisits,
      averageDailyVisits: totalVisits / days,
      peakVisits,
      peakDate,
      generatedAt: new Date(),
    };
  }

  /**
   * 获取热门内容数据
   */
  async getPopularContent(limit: number = 10): Promise<PopularContentStatsDto> {
    const [popularArticles, popularComments] = await Promise.all([
      this.getPopularArticles(limit),
      this.getPopularComments(limit),
    ]);

    return {
      popularArticles,
      popularComments,
      generatedAt: new Date(),
    };
  }

  private async getPopularArticles(
    limit: number,
  ): Promise<PopularContentDto[]> {
    const articles = await this.prisma.article.findMany({
      take: limit,
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
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
      authorName: article.author?.name || '未知作者',
      viewCount: 0, // 暂时设为0
      likeCount: article._count.favorites,
      commentCount: article._count.comments,
      favoriteCount: article._count.favorites,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    }));
  }

  private async getPopularComments(
    limit: number,
  ): Promise<PopularContentDto[]> {
    const comments = await this.prisma.comment.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    return comments.map((comment) => ({
      id: comment.id,
      title: comment.content.substring(0, 50) + '...',
      authorName: comment.author?.name || '未知作者',
      viewCount: 0,
      likeCount: comment._count.likes,
      commentCount: 0,
      favoriteCount: 0,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    }));
  }

  /**
   * 获取活跃用户数据
   */
  async getActiveUsers(limit: number = 20): Promise<ActiveUsersStatsDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [activeUsers, todayActiveUsers, weekActiveUsers, monthActiveUsers] =
      await Promise.all([
        this.getActiveUsersList(limit),
        this.getActiveUsersCount(today),
        this.getActiveUsersCount(weekAgo),
        this.getActiveUsersCount(monthAgo),
      ]);

    return {
      activeUsers,
      totalActiveUsers: activeUsers.length,
      todayActiveUsers,
      weekActiveUsers,
      monthActiveUsers,
      generatedAt: new Date(),
    };
  }

  private async getActiveUsersList(limit: number): Promise<ActiveUserDto[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          {
            articles: {
              some: {
                updatedAt: { gte: thirtyDaysAgo },
              },
            },
          },
          {
            comments: {
              some: {
                createdAt: { gte: thirtyDaysAgo },
              },
            },
          },
          {
            notes: {
              some: {
                updatedAt: { gte: thirtyDaysAgo },
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
            favorites: true,
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

    return users.map((user) => {
      const activityScore =
        user._count.articles * 10 +
        user._count.comments * 5 +
        user._count.notes * 3 +
        user._count.favorites * 1;

      return {
        id: user.id,
        name: user.name || '未知用户',
        email: user.email,
        role: user.role?.name || '未知角色',
        articleCount: user._count.articles,
        commentCount: user._count.comments,
        noteCount: user._count.notes,
        favoriteCount: user._count.favorites,
        lastActiveAt: user.articles[0]?.updatedAt || new Date(),
        activityScore: Math.round(activityScore * 10) / 10,
      };
    });
  }

  private async getActiveUsersCount(since: Date): Promise<number> {
    return this.prisma.user.count({
      where: {
        OR: [
          {
            articles: {
              some: {
                updatedAt: { gte: since },
              },
            },
          },
          {
            comments: {
              some: {
                createdAt: { gte: since },
              },
            },
          },
          {
            notes: {
              some: {
                updatedAt: { gte: since },
              },
            },
          },
        ],
      },
    });
  }
}
