import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import type { UploadedFile as UploadedFileInterface } from './interfaces/uploaded-file.interface';
import * as path from 'path';
import * as fs from 'fs';
import { PreviewGeneratorUtil } from './utils/preview-generator.util';
import { URL } from 'url';

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

  async findAll(options?: {
    userId?: number;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const { userId, page, limit } = options || {};

    // 如果指定了userId，查询该用户上传的媒体
    // 或者与该用户文章关联的媒体
    const where = userId
      ? {
          OR: [
            // 用户上传的媒体
            { uploaderId: userId },
            // 或者与用户文章关联的媒体
            {
              articles: {
                some: {
                  article: {
                    authorId: userId,
                  },
                },
              },
            },
          ],
        }
      : {};

    const include = {
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
                  email: true,
                },
              },
            },
          },
        },
      },
    };

    // 如果提供了分页参数，返回分页数据
    if (page && limit) {
      const skip = (page - 1) * limit;
      const [rawData, total] = await Promise.all([
        this.prisma.media.findMany({
          where,
          include,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.media.count({ where }),
      ]);

      // 为没有预览的视频文件生成预览
      const data = await Promise.all(
        rawData.map((media) => this.generateVideoPreviewIfNeeded(media)),
      );

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    // 否则返回所有数据（保持向后兼容）
    const rawData = await this.prisma.media.findMany({
      where,
      include,
      orderBy: { createdAt: 'desc' },
    });

    // 为没有预览的视频文件生成预览（限制处理数量以避免性能问题）
    const data = await Promise.all(
      rawData
        .slice(0, 50)
        .map((media) => this.generateVideoPreviewIfNeeded(media)),
    );

    return data as any;
  }

  async findOne(id: number): Promise<any> {
    const media = await this.prisma.media.findUnique({
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

    if (media) {
      return await this.generateVideoPreviewIfNeeded(media);
    }

    return media;
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

  async uploadFile(
    file: UploadedFileInterface,
    articleIds?: number[],
    uploaderId?: number,
  ) {
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

    // 生成预览图片base64
    let previewBase64: string | null = null;
    try {
      console.log(
        `开始生成预览，文件类型: ${fileMimetype}, 文件名: ${file.originalname}`,
      );
      previewBase64 = await PreviewGeneratorUtil.generatePreview(
        file.buffer,
        fileMimetype,
        file.originalname,
      );
      console.log(`预览生成成功: ${file.originalname}`);
    } catch (error) {
      console.error(`生成预览图片失败: ${file.originalname}`, error);
      // 预览生成失败不影响文件上传，继续执行
    }

    // 创建媒体记录
    const media = await this.prisma.media.create({
      data: {
        type: mediaType,
        url: fileUrl,
        originalName: file.originalname,
        size: file.size,
        previewBase64,
        uploaderId, // 记录上传者ID
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
      previewBase64: media.previewBase64,
      createdAt: media.createdAt,
    };
  }

  /**
   * 为现有视频文件生成预览（如果没有的话）
   */
  private async generateVideoPreviewIfNeeded(media: {
    id: number;
    type: string;
    previewBase64?: string | null;
    originalName?: string | null;
    url: string;
    [key: string]: any;
  }): Promise<any> {
    if (media?.type === 'VIDEO' && !media?.previewBase64) {
      try {
        console.log(`为视频文件生成预览: ${media.originalName}`);
        // 从URL中提取文件路径
        let filePath: string;
        try {
          const url = new URL(media.url);
          filePath = path.join(process.cwd(), url.pathname);
        } catch {
          // 如果不是完整URL，直接处理路径
          const urlPath = media.url.replace(/^https?:\/\/[^/]+/, '');
          filePath = path.join(process.cwd(), urlPath);
        }

        if (fs.existsSync(filePath)) {
          const buffer = fs.readFileSync(filePath);
          const previewBase64 = await PreviewGeneratorUtil.generateVideoPreview(
            buffer,
            media.originalName || 'video.mp4',
          );

          // 更新数据库中的预览字段
          await this.prisma.media.update({
            where: { id: media.id },
            data: { previewBase64 },
          });

          media.previewBase64 = previewBase64;
          console.log(`视频预览生成成功: ${media.id}`);
        } else {
          console.warn(`视频文件不存在，无法生成预览: ${filePath}`);
        }
      } catch (error) {
        console.error(`为视频${media.id}生成预览失败:`, error);
      }
    }
    return media;
  }
}
