import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MediaService } from '../../media/media.service';

@Injectable()
export class AdminMediaService {
  constructor(
    private prisma: PrismaService,
    private mediaService: MediaService,
  ) {}

  async findAll(options: {
    page: number;
    limit: number;
    type?: 'IMAGE' | 'VIDEO';
  }) {
    const { page, limit, type } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (type) {
      where.type = type;
    }

    const [media, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          articles: {
            select: {
              id: true,
            },
          },
        },
      }),
      this.prisma.media.count({ where }),
    ]);

    return {
      data: media,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
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

  async getMediaStats() {
    const [totalMedia, imageCount, videoCount, totalSize] = await Promise.all([
      this.prisma.media.count(),

      this.prisma.media.count({
        where: { type: 'IMAGE' },
      }),

      this.prisma.media.count({
        where: { type: 'VIDEO' },
      }),

      this.prisma.media.aggregate({
        _sum: {
          id: true,
        },
      }),
    ]);

    return {
      totalMedia,
      imageCount,
      videoCount,
      totalSize: totalSize._sum.id || 0,
    };
  }
}
