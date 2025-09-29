import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    // 获取基础统计数据
    const [
      totalUsers,
      totalArticles,
      totalComments,
      totalMedia,
      totalNotes,
      totalFavorites,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.article.count(),
      this.prisma.comment.count(),
      this.prisma.media.count(),
      this.prisma.note.count(),
      this.prisma.favorite.count(),
    ]);

    // 获取最近的活动
    const recentUsers = await this.prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        role: {
          select: { name: true },
        },
      },
    });

    const recentArticles = await this.prisma.article.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        published: true,
        createdAt: true,
        author: {
          select: { name: true, email: true },
        },
      },
    });

    return {
      systemInfo: {
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: this.formatUptime(process.uptime()),
      },
      statistics: {
        totalUsers,
        totalArticles,
        totalComments,
        totalMedia,
        totalNotes,
        totalFavorites,
      },
      recentActivity: {
        recentUsers,
        recentArticles,
      },
    };
  }

  async getHealthStatus() {
    try {
      // 检查数据库连接
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        database: 'healthy',
        storage: 'healthy', // 可以添加文件系统检查
        cache: 'healthy', // 可以添加缓存检查
        overall: 'healthy',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        database: 'unhealthy',
        storage: 'unknown',
        cache: 'unknown',
        overall: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const parts: string[] = [];
    if (days > 0) parts.push(`${days} 天`);
    if (hours > 0) parts.push(`${hours} 小时`);
    if (minutes > 0) parts.push(`${minutes} 分钟`);

    return parts.length > 0 ? parts.join(', ') : '不到1分钟';
  }
}
