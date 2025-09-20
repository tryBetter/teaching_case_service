import { Injectable, ConflictException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  BatchCreateUserDto,
  BatchCreateUserResult,
} from './dto/batch-create-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../auth/enums/user-role.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}
  async create(createUserDto: CreateUserDto) {
    // 加密密码
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // 创建用户
    return this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });
  }

  findAll() {
    // 查询所有用户
    return this.prisma.user.findMany();
  }

  findOne(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
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

        // 创建用户
        const createdUser = await this.prisma.user.create({
          data: {
            email: user.email,
            name: user.name,
            password: hashedPassword,
            role: user.role || 'STUDENT',
          },
        });

        result.successUsers.push({
          email: createdUser.email,
          name: createdUser.name || undefined,
          password: '[已加密]',
          role: createdUser.role as UserRole,
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
