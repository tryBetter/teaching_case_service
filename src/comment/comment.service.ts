import { Injectable } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { LikeCommentDto } from './dto/like-comment.dto';
import { PrismaService } from '../prisma/prisma.service';

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
   * @param currentUserId 当前用户ID，用于判断是否已点赞
   * @returns 评论列表
   */
  async findAll(
    articleId?: number,
    authorId?: number,
    currentUserId?: number,
    options?: { page?: number; limit?: number },
  ) {
    const { page, limit } = options || {};
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

    const include = {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
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
              avatar: true,
            },
          },
          likes: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
        },
      },
      likes: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      },
    };

    // 如果提供了分页参数，返回分页数据
    if (page && limit) {
      const skip = (page - 1) * limit;
      const [comments, total] = await Promise.all([
        this.prisma.comment.findMany({
          where,
          include,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.comment.count({ where }),
      ]);

      // 为每个评论添加点赞统计和当前用户点赞状态
      const data = await Promise.all(
        comments.map(async (comment) => {
          const likeCount = comment.likes.length;
          const isLiked = currentUserId
            ? await this.isCommentLiked(comment.id, currentUserId)
            : false;

          // 处理子评论的点赞数据
          const repliesWithLikes = await Promise.all(
            comment.replies.map(async (reply) => {
              const replyLikeCount = reply.likes.length;
              const isReplyLiked = currentUserId
                ? await this.isCommentLiked(reply.id, currentUserId)
                : false;

              return {
                ...reply,
                likeCount: replyLikeCount,
                isLiked: isReplyLiked,
              };
            }),
          );

          return {
            ...comment,
            likeCount,
            isLiked,
            replies: repliesWithLikes,
          };
        }),
      );

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    // 否则返回所有数据（保持向后兼容）
    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        include,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.comment.count({ where }),
    ]);

    // 为每个评论添加点赞统计和当前用户点赞状态
    const data = await Promise.all(
      comments.map(async (comment) => {
        const likeCount = comment.likes.length;
        const isLiked = currentUserId
          ? await this.isCommentLiked(comment.id, currentUserId)
          : false;

        // 处理子评论的点赞数据
        const repliesWithLikes = await Promise.all(
          comment.replies.map(async (reply) => {
            const replyLikeCount = reply.likes.length;
            const isReplyLiked = currentUserId
              ? await this.isCommentLiked(reply.id, currentUserId)
              : false;

            return {
              ...reply,
              likeCount: replyLikeCount,
              isLiked: isReplyLiked,
            };
          }),
        );

        return {
          ...comment,
          likeCount,
          isLiked,
          replies: repliesWithLikes,
        };
      }),
    );

    return {
      data,
      total,
      page: 1,
      limit: total,
      totalPages: 1,
    };
  }

  /**
   * 根据ID获取单条评论
   * @param id 评论ID
   * @param currentUserId 当前用户ID，用于判断是否已点赞
   * @returns 评论详情
   */
  async findOne(id: number, currentUserId?: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
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
            likes: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        likes: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!comment) {
      return null;
    }

    // 添加点赞统计和当前用户点赞状态
    const likeCount = comment.likes.length;
    const isLiked = currentUserId
      ? await this.isCommentLiked(comment.id, currentUserId)
      : false;

    // 处理子评论的点赞数据
    const repliesWithLikes = await Promise.all(
      comment.replies.map(async (reply) => {
        const replyLikeCount = reply.likes.length;
        const isReplyLiked = currentUserId
          ? await this.isCommentLiked(reply.id, currentUserId)
          : false;

        return {
          ...reply,
          likeCount: replyLikeCount,
          isLiked: isReplyLiked,
        };
      }),
    );

    return {
      ...comment,
      likeCount,
      isLiked,
      replies: repliesWithLikes,
    };
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
            avatar: true,
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
            avatar: true,
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

  /**
   * 点赞评论
   * @param commentId 评论ID
   * @param userId 用户ID
   * @returns 点赞结果
   */
  async likeComment(commentId: number, userId: number) {
    // 检查评论是否存在
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error('评论不存在');
    }

    // 检查是否已经点赞
    const existingLike = await this.prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    });

    if (existingLike) {
      throw new Error('已经点赞过该评论');
    }

    // 创建点赞记录
    return this.prisma.commentLike.create({
      data: {
        userId,
        commentId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
          },
        },
      },
    });
  }

  /**
   * 取消点赞评论
   * @param commentId 评论ID
   * @param userId 用户ID
   * @returns 取消点赞结果
   */
  async unlikeComment(commentId: number, userId: number) {
    // 检查点赞记录是否存在
    const existingLike = await this.prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
          },
        },
      },
    });

    if (!existingLike) {
      throw new Error('未点赞该评论');
    }

    // 删除点赞记录
    await this.prisma.commentLike.delete({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    });

    return existingLike;
  }

  /**
   * 检查用户是否已点赞评论
   * @param commentId 评论ID
   * @param userId 用户ID
   * @returns 是否已点赞
   */
  async isCommentLiked(commentId: number, userId: number): Promise<boolean> {
    const like = await this.prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    });

    return !!like;
  }

  /**
   * 获取评论的点赞数量
   * @param commentId 评论ID
   * @returns 点赞数量
   */
  async getCommentLikeCount(commentId: number): Promise<number> {
    return this.prisma.commentLike.count({
      where: { commentId },
    });
  }
}
