import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  BatchCreateUserDto,
  BatchCreateUserResult,
} from './dto/batch-create-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '../../generated/prisma';
import { UserRole, normalizeRoleName } from '../auth/enums/user-role.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}
  async create(createUserDto: CreateUserDto) {
    // 如果没有指定角色ID，查找默认的学生角色
    let roleId = createUserDto.roleId;
    if (!roleId) {
      const defaultRole = await this.prisma.role.findFirst({
        where: { name: '学生', isActive: true },
      });
      if (!defaultRole) {
        throw new NotFoundException('未找到默认角色');
      }
      roleId = defaultRole.id;
    } else {
      // 验证角色是否存在
      const role = await this.prisma.role.findUnique({
        where: { id: roleId, isActive: true },
      });
      if (!role) {
        throw new NotFoundException('指定的角色不存在或已禁用');
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // 创建用户
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        name: createUserDto.name,
        password: hashedPassword,
        roleId,
      },
      include: {
        role: true,
      },
    });

    // 如果创建的是教师，自动关联所有助教组长
    if (normalizeRoleName(user.role.name) === UserRole.TEACHER) {
      await this.associateTeacherWithAssistantLeaders(user.id);
    }

    return user;
  }

  findAll() {
    // 查询所有用户，包含角色信息
    return this.prisma.user.findMany({
      include: {
        role: true,
      },
    });
  }

  /**
   * 分页查询用户列表（与admin接口统一）
   */
  async findAllPaginated(options: {
    page: number;
    limit: number;
    role?: string;
    search?: string;
  }) {
    const { page, limit, role, search } = options;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: Prisma.UserWhereInput = {};

    if (role) {
      where.role = {
        name: role,
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          role: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          _count: {
            select: {
              articles: true,
              comments: true,
              notes: true,
              favorites: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  findOne(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    // 如果更新密码，需要加密
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });
  }

  async remove(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    await this.prisma.user.delete({ where: { id } });

    return {
      ...user,
      message: '用户删除成功',
    };
  }

  /**
   * 禁用用户（软删除）
   * @param id 用户ID
   */
  async disable(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { status: 'INACTIVE' },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    return {
      ...updatedUser,
      message: '用户已禁用',
    };
  }

  /**
   * 启用用户
   * @param id 用户ID
   */
  async enable(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE' },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    return {
      ...updatedUser,
      message: '用户已启用',
    };
  }

  /**
   * 批量创建用户
   * @param users 用户数据数组
   * @returns 批量创建结果
   */
  async batchCreate(
    users: BatchCreateUserDto[],
  ): Promise<BatchCreateUserResult> {
    const result: BatchCreateUserResult = {
      successCount: 0,
      failureCount: 0,
      totalCount: users.length,
      successUsers: [],
      failedUsers: [],
    };

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      try {
        // 检查邮箱是否已存在
        const existingUser = await this.prisma.user.findUnique({
          where: { email: user.email },
        });

        if (existingUser) {
          result.failedUsers.push({
            user,
            error: '邮箱已存在',
            row: i + 2, // +2 因为Excel从第2行开始（第1行是标题）
          });
          result.failureCount++;
          continue;
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(user.password, 10);

        // 如果没有指定角色ID，查找默认的学生角色
        let roleId = user.roleId;
        if (!roleId) {
          const defaultRole = await this.prisma.role.findFirst({
            where: { name: '学生', isActive: true },
          });
          if (!defaultRole) {
            result.failedUsers.push({
              user,
              error: '未找到默认角色',
              row: i + 2,
            });
            result.failureCount++;
            continue;
          }
          roleId = defaultRole.id;
        } else {
          // 验证角色是否存在
          const role = await this.prisma.role.findUnique({
            where: { id: roleId, isActive: true },
          });
          if (!role) {
            result.failedUsers.push({
              user,
              error: '指定的角色不存在或已禁用',
              row: i + 2,
            });
            result.failureCount++;
            continue;
          }
        }

        // 创建用户
        const createdUser = await this.prisma.user.create({
          data: {
            email: user.email,
            name: user.name,
            password: hashedPassword,
            roleId,
          },
          include: {
            role: true,
          },
        });

        result.successUsers.push({
          email: createdUser.email,
          name: createdUser.name || undefined,
          password: '[已加密]',
          roleId: createdUser.roleId,
        });
        result.successCount++;
      } catch (error) {
        result.failedUsers.push({
          user,
          error:
            (error instanceof Error ? error.message : String(error)) ||
            '创建用户失败',
          row: i + 2,
        });
        result.failureCount++;
      }
    }

    return result;
  }

  /**
   * 将教师与所有助教组长关联
   * @param teacherId 教师ID
   */
  private async associateTeacherWithAssistantLeaders(teacherId: number) {
    // 查找所有助教组长
    const assistantLeaders = await this.prisma.user.findMany({
      where: {
        role: {
          name: '助教组长',
        },
      },
    });

    // 为每个助教组长创建与教师的关联关系
    const relations = assistantLeaders.map((assistantLeader) => ({
      teacherId,
      assistantId: assistantLeader.id,
    }));

    if (relations.length > 0) {
      await this.prisma.teacherAssistant.createMany({
        data: relations,
        skipDuplicates: true, // 跳过已存在的关联
      });
    }
  }
}
