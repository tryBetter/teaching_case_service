import { Injectable } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建新的评论，支持楼中楼回复功能。可以回复文章或回复其他评论。
   * @param createCommentDto
   * @returns
   */
  create(createCommentDto: CreateCommentDto) {
    return this.prisma.comment.create({
      data: createCommentDto,
    });
  }

  /**
   * 获取所有评论列表，支持按文章ID和作者ID筛选
   * @param articleId 文章ID，可选
   * @param authorId 作者ID，可选
   * @returns 评论列表
   */
  async findAll(articleId?: number, authorId?: number) {
    const where: {
      articleId?: number;
      authorId?: number;
    } = {};

    if (articleId) {
      where.articleId = articleId;
    }

    if (authorId) {
      where.authorId = authorId;
    }

    return this.prisma.comment.findMany({
      where,
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
        replies: {
          include: {
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
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * 根据ID获取单条评论
   * @param id 评论ID
   * @returns 评论详情
   */
  async findOne(id: number) {
    return this.prisma.comment.findUnique({
      where: { id },
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
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  /**
   * 更新评论内容
   * @param id 评论ID
   * @param updateCommentDto 更新数据
   * @returns 更新后的评论
   */
  async update(id: number, updateCommentDto: UpdateCommentDto) {
    return this.prisma.comment.update({
      where: { id },
      data: updateCommentDto,
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
      },
    });
  }

  /**
   * 删除评论
   * @param id 评论ID
   * @returns 被删除的评论
   */
  async remove(id: number) {
    // 先获取要删除的评论信息
    const comment = await this.prisma.comment.findUnique({
      where: { id },
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
      },
    });

    if (!comment) {
      return null;
    }

    // 删除评论（由于设置了 onDelete: NoAction，需要手动处理子评论）
    // 先删除所有子评论
    await this.prisma.comment.deleteMany({
      where: { parentId: id },
    });

    // 再删除主评论
    await this.prisma.comment.delete({
      where: { id },
    });

    return comment;
  }
}
