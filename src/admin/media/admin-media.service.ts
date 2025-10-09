import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MediaService } from '../../media/media.service';
import { MediaQueryDto, MediaStatsDto } from './dto/media-query.dto';
import type { Prisma } from '../../../generated/prisma';

@Injectable()
export class AdminMediaService {
  constructor(
    private prisma: PrismaService,
    private mediaService: MediaService,
  ) {}

  async findAll(queryDto: MediaQueryDto) {
    const {
      page = 1,
      limit = 10,
      type,
      keyword,
      minSize,
      maxSize,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = queryDto;

    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: Prisma.MediaWhereInput = {};

    // 媒体类型过滤
    if (type) {
      where.type = type;
    }

    // 文件名关键词搜索
    if (keyword) {
      where.OR = [
        {
          originalName: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
        {
          url: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
      ];
    }

    // 文件大小范围过滤
    if (minSize !== undefined || maxSize !== undefined) {
      where.size = {};
      if (minSize !== undefined) {
        where.size.gte = minSize;
      }
      if (maxSize !== undefined) {
        where.size.lte = maxSize;
      }
    }

    // 日期范围过滤
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // 构建排序条件
    const orderBy: Prisma.MediaOrderByWithRelationInput = {};
    if (sortBy === 'size') {
      orderBy.size = sortOrder;
    } else if (sortBy === 'type') {
      orderBy.type = sortOrder;
    } else if (sortBy === 'originalName') {
      orderBy.originalName = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const [media, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          uploader: {
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
          articles: {
            select: {
              id: true,
              article: {
                select: {
                  id: true,
                  title: true,
                  author: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.media.count({ where }),
    ]);

    // 格式化返回数据
    const formattedMedia = media.map((item) => {
      const articlesList = item.articles as Array<{
        article: {
          id: number;
          title: string;
          author: { id: number; name: string };
        };
      }>;
      return {
        ...item,
        articleCount: articlesList.length,
        articles: articlesList.map((art) => art.article),
      };
    });

    return {
      data: formattedMedia,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      filters: {
        type,
        keyword,
        minSize,
        maxSize,
        startDate,
        endDate,
        sortBy,
        sortOrder,
      },
    };
  }

  async findOne(id: number) {
    const media = await this.prisma.media.findUnique({
      where: { id },
      include: {
        uploader: {
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
        articles: {
          include: {
            article: {
              select: {
                id: true,
                title: true,
                author: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!media) {
      throw new Error('媒体文件不存在');
    }

    // 转换关联文章数据格式
    const articlesList = media.articles as Array<{
      article: {
        id: number;
        title: string;
        author: { id: number; name: string };
      };
    }>;
    const formattedMedia = {
      ...media,
      articles: articlesList.map((am) => am.article),
    };

    return formattedMedia;
  }

  async remove(id: number) {
    const media = await this.prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      throw new Error('媒体文件不存在');
    }

    await this.mediaService.remove(id);

    return {
      id: media.id,
      originalName:
        media.originalName ||
        (media.url ? media.url.split('/').pop() : '未知文件') ||
        '未知文件',
      message: '媒体文件删除成功',
    };
  }

  async getMediaStats(): Promise<MediaStatsDto> {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalMedia,
      imageCount,
      videoCount,
      sizeStats,
      todayUploads,
      weekUploads,
      monthUploads,
    ] = await Promise.all([
      this.prisma.media.count(),
      this.prisma.media.count({
        where: { type: 'IMAGE' },
      }),
      this.prisma.media.count({
        where: { type: 'VIDEO' },
      }),
      this.prisma.media.aggregate({
        _sum: {
          size: true,
        },
        _avg: {
          size: true,
        },
      }),
      this.prisma.media.count({
        where: {
          createdAt: {
            gte: todayStart,
          },
        },
      }),
      this.prisma.media.count({
        where: {
          createdAt: {
            gte: weekStart,
          },
        },
      }),
      this.prisma.media.count({
        where: {
          createdAt: {
            gte: monthStart,
          },
        },
      }),
    ]);

    return {
      totalMedia,
      imageCount,
      videoCount,
      totalSize: sizeStats._sum.size || 0,
      averageSize: Math.round(sizeStats._avg.size || 0),
      todayUploads,
      weekUploads,
      monthUploads,
    };
  }

  /**
   * 获取媒体类型分布统计
   */
  async getMediaTypeDistribution() {
    const stats = await this.prisma.media.groupBy({
      by: ['type'],
      _count: {
        type: true,
      },
      _sum: {
        size: true,
      },
    });

    return stats.map((stat) => ({
      type: stat.type,
      count: stat._count.type,
      totalSize: stat._sum.size || 0,
    }));
  }

  /**
   * 获取最近上传的媒体文件
   */
  async getRecentMedia(limit: number = 10) {
    return this.prisma.media.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        type: true,
        url: true,
        originalName: true,
        size: true,
        createdAt: true,
      },
    });
  }
}
