import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NoteService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建笔记
   * @param userId 用户ID
   * @param createNoteDto 创建笔记DTO
   * @returns 创建的笔记记录
   */
  async create(userId: number, createNoteDto: CreateNoteDto) {
    const { content, articleId } = createNoteDto;

    // 检查文章是否存在
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      throw new NotFoundException('文章不存在');
    }

    // 创建笔记
    return this.prisma.note.create({
      data: {
        content,
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
   * 获取用户的所有笔记
   * @param userId 用户ID
   * @returns 用户笔记列表
   */
  async findAll(userId: number) {
    return this.prisma.note.findMany({
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
        updatedAt: 'desc',
      },
    });
  }

  /**
   * 获取指定文章的笔记列表
   * @param articleId 文章ID
   * @param userId 用户ID（可选，如果提供则只返回该用户的笔记）
   * @returns 文章笔记列表
   */
  async findByArticle(articleId: number, userId?: number) {
    const where: { articleId: number; userId?: number } = { articleId };

    if (userId) {
      where.userId = userId;
    }

    return this.prisma.note.findMany({
      where,
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
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * 根据ID获取笔记详情
   * @param id 笔记ID
   * @param userId 用户ID（可选，如果提供则验证权限）
   * @returns 笔记详情
   */
  async findOne(id: number, userId?: number) {
    const note = await this.prisma.note.findUnique({
      where: { id },
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
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!note) {
      throw new NotFoundException('笔记不存在');
    }

    // 如果提供了userId，验证用户是否有权限查看此笔记
    if (userId && note.userId !== userId) {
      throw new ForbiddenException('无权查看此笔记');
    }

    return note;
  }

  /**
   * 更新笔记
   * @param id 笔记ID
   * @param userId 用户ID
   * @param updateNoteDto 更新笔记DTO
   * @returns 更新后的笔记
   */
  async update(id: number, userId: number, updateNoteDto: UpdateNoteDto) {
    // 检查笔记是否存在且属于当前用户
    const existingNote = await this.prisma.note.findUnique({
      where: { id },
    });

    if (!existingNote) {
      throw new NotFoundException('笔记不存在');
    }

    if (existingNote.userId !== userId) {
      throw new ForbiddenException('无权修改此笔记');
    }

    // 更新笔记
    return this.prisma.note.update({
      where: { id },
      data: updateNoteDto,
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
   * 删除笔记
   * @param id 笔记ID
   * @param userId 用户ID
   * @returns 删除结果
   */
  async remove(id: number, userId: number) {
    // 检查笔记是否存在且属于当前用户
    const existingNote = await this.prisma.note.findUnique({
      where: { id },
    });

    if (!existingNote) {
      throw new NotFoundException('笔记不存在');
    }

    if (existingNote.userId !== userId) {
      throw new ForbiddenException('无权删除此笔记');
    }

    // 删除笔记
    return this.prisma.note.delete({
      where: { id },
    });
  }

  /**
   * 获取用户的笔记统计信息
   * @param userId 用户ID
   * @returns 笔记统计信息
   */
  async getNoteStats(userId: number) {
    const totalNotes = await this.prisma.note.count({
      where: { userId },
    });

    const recentNotes = await this.prisma.note.count({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 最近7天
        },
      },
    });

    return {
      totalNotes,
      recentNotes,
    };
  }
}
