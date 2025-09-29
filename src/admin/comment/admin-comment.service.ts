import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CommentService } from '../../comment/comment.service';

@Injectable()
export class AdminCommentService {
  constructor(
    private prisma: PrismaService,
    private commentService: CommentService,
  ) {}

  async findAll(options: { page: number; limit: number }) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
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
            },
          },
          _count: {
            select: {
              likes: true,
              replies: true,
            },
          },
        },
      }),
      this.prisma.comment.count(),
    ]);

    return {
      data: comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async remove(id: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new Error('评论不存在');
    }

    await this.commentService.remove(id);

    return {
      id: comment.id,
      content: comment.content,
      message: '评论删除成功',
    };
  }

  async getCommentStats() {
    const [totalComments, todayComments, thisWeekComments, thisMonthComments] =
      await Promise.all([
        this.prisma.comment.count(),

        this.prisma.comment.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),

        this.prisma.comment.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),

        this.prisma.comment.count({
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
      ]);

    return {
      totalComments,
      todayComments,
      thisWeekComments,
      thisMonthComments,
    };
  }
}
