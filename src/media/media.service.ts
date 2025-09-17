import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '../../generated/prisma';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';

@Injectable()
export class MediaService {
  constructor(private prisma: PrismaService) {}

  async create(createMediaDto: CreateMediaDto) {
    const { articleIds, ...mediaData } = createMediaDto;

    // 创建媒体文件
    const media = await this.prisma.media.create({
      data: mediaData,
    });

    // 如果有关联的文章ID，创建关联关系
    if (articleIds && articleIds.length > 0) {
      await this.prisma.articleMedia.createMany({
        data: articleIds.map((articleId) => ({
          mediaId: media.id,
          articleId,
        })),
      });
    }

    return media;
  }

  async findAll(userId?: number) {
    const where = userId
      ? {
          articles: {
            some: {
              article: {
                authorId: userId,
              },
            },
          },
        }
      : {};

    return this.prisma.media.findMany({
      where,
      include: {
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
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.media.findUnique({
      where: { id },
      include: {
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
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async update(id: number, updateMediaDto: UpdateMediaDto) {
    const { articleIds, ...mediaData } = updateMediaDto;

    // 更新媒体文件基本信息
    const media = await this.prisma.media.update({
      where: { id },
      data: mediaData,
    });

    // 如果提供了新的文章ID列表，更新关联关系
    if (articleIds !== undefined) {
      // 删除现有关联
      await this.prisma.articleMedia.deleteMany({
        where: { mediaId: id },
      });

      // 创建新关联
      if (articleIds.length > 0) {
        await this.prisma.articleMedia.createMany({
          data: articleIds.map((articleId) => ({
            mediaId: id,
            articleId,
          })),
        });
      }
    }

    return media;
  }

  async remove(id: number) {
    // 删除关联关系（由于设置了 onDelete: Cascade，这会自动处理）
    await this.prisma.articleMedia.deleteMany({
      where: { mediaId: id },
    });

    // 删除媒体文件
    return this.prisma.media.delete({
      where: { id },
    });
  }
}
