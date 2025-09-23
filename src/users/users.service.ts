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
    return this.prisma.user.create({
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
  }

  findAll() {
    // 查询所有用户，包含角色信息
    return this.prisma.user.findMany({
      include: {
        role: true,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
      },
    });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({ where: { id }, data: updateUserDto });
  }

  remove(id: number) {
    return this.prisma.user.delete({ where: { id } });
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
}
