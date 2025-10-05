import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../../users/users.service';
import { ExcelService } from '../../users/services/excel.service';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { UpdateUserDto } from '../../users/dto/update-user.dto';
import { BatchCreateUserResult } from '../../users/dto/batch-create-user.dto';
import type { Response } from 'express';

@Injectable()
export class AdminUsersService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private excelService: ExcelService,
  ) {}

  async findAll(options: {
    page: number;
    limit: number;
    role?: string;
    search?: string;
  }) {
    const { page, limit, role, search } = options;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};

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

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        articles: {
          select: {
            id: true,
            title: true,
            published: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            article: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        notes: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            article: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        favorites: {
          select: {
            createdAt: true,
            article: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    return user;
  }

  async create(createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  async remove(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    await this.usersService.remove(id);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      message: '用户删除成功',
    };
  }

  /**
   * 禁用用户（软删除）
   * @param id 用户ID
   */
  async disable(id: number) {
    const user = await this.usersService.disable(id);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      message: '用户已禁用',
    };
  }

  /**
   * 启用用户
   * @param id 用户ID
   */
  async enable(id: number) {
    const user = await this.usersService.enable(id);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      message: '用户已启用',
    };
  }

  async batchCreate(file: Express.Multer.File) {
    if (!file) {
      throw new Error('请上传Excel文件');
    }

    // 验证文件类型
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('只支持Excel文件格式(.xlsx, .xls)');
    }

    // 解析Excel文件
    const users = this.excelService.parseUserExcel(file.buffer);

    // 批量创建用户
    return this.usersService.batchCreate(users);
  }

  async downloadTemplate(res: Response) {
    const templateBuffer = this.excelService.generateUserTemplate();

    // 使用URL编码处理中文文件名
    const filename = encodeURIComponent('用户导入模板.xlsx');

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename*=UTF-8''${filename}`,
      'Content-Length': templateBuffer.length.toString(),
      'Cache-Control': 'no-cache',
      'Access-Control-Expose-Headers': 'Content-Disposition',
    });

    res.send(templateBuffer);
  }

  async getUserStats() {
    const [
      totalUsers,
      usersByRole,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
    ] = await Promise.all([
      this.prisma.user.count(),

      // 按角色统计用户数量
      this.prisma.user
        .groupBy({
          by: ['roleId'],
          _count: {
            id: true,
          },
          orderBy: {
            _count: {
              id: 'desc',
            },
          },
        })
        .then(async (results) => {
          const roleIds = results.map((r) => r.roleId);
          const roles = await this.prisma.role.findMany({
            where: { id: { in: roleIds } },
            select: { id: true, name: true },
          });

          return results.map((result) => {
            const role = roles.find((r) => r.id === result.roleId);
            return {
              role: role?.name || '未知角色',
              count: result._count.id,
            };
          });
        }),

      // 今日新增用户
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),

      // 本周新增用户
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // 本月新增用户
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    return {
      totalUsers,
      usersByRole,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
    };
  }
}
