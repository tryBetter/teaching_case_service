import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import type { UploadedFile as UploadedFileInterface } from './interfaces/uploaded-file.interface';
import * as path from 'path';
import * as fs from 'fs';

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

  async uploadFile(file: UploadedFileInterface, articleIds?: number[]) {
    // 确定文件类型和存储目录
    const fileMimetype = file.mimetype;
    const isImage = fileMimetype.startsWith('image/');
    const isVideo = fileMimetype.startsWith('video/');

    let subDir = '';
    let mediaType: 'IMAGE' | 'VIDEO';

    if (isImage) {
      subDir = 'images';
      mediaType = 'IMAGE';
    } else if (isVideo) {
      subDir = 'videos';
      mediaType = 'VIDEO';
    } else {
      throw new Error('不支持的文件类型');
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = path.extname(file.originalname);
    const fileName = `${timestamp}_${randomString}${fileExtension}`;

    // 构建文件路径
    const uploadDir = path.join(process.cwd(), 'uploads', subDir);
    const filePath = path.join(uploadDir, fileName);

    // 确保目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 保存文件
    fs.writeFileSync(filePath, file.buffer);

    // 构建可访问的URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const fileUrl = `${baseUrl}/uploads/${subDir}/${fileName}`;

    // 创建媒体记录
    const media = await this.prisma.media.create({
      data: {
        type: mediaType,
        url: fileUrl,
      },
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

    return {
      id: media.id,
      type: media.type,
      url: media.url,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      createdAt: media.createdAt,
    };
  }
}
