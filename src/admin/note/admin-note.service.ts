import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminNoteService {
  constructor(private prisma: PrismaService) {}

  async findAll(options: { page: number; limit: number }) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [notes, total] = await Promise.all([
      this.prisma.note.findMany({
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
      this.prisma.note.count(),
    ]);

    return {
      data: notes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async remove(id: number) {
    const note = await this.prisma.note.findUnique({
      where: { id },
    });

    if (!note) {
      throw new Error('笔记不存在');
    }

    await this.prisma.note.delete({
      where: { id },
    });

    return {
      id: note.id,
      content: note.content,
      message: '笔记删除成功',
    };
  }
}
