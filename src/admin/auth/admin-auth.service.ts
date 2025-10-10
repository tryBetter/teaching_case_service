import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { UserRole, normalizeRoleName } from '../../auth/enums/user-role.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(adminLoginDto: AdminLoginDto) {
    const user = await this.validateSuperAdmin(
      adminLoginDto.email,
      adminLoginDto.password,
    );

    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 检查是否为超级管理员角色（使用英文枚举值）
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        '权限不足，只有超级管理员才能登录后台管理系统',
      );
    }

    const payload = {
      email: user.email,
      sub: user.id,
      name: user.name,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        roleId: user.roleId,
      },
    };
  }

  async checkSuperAdminStatus(token: string) {
    try {
      const payload: { sub: number } = this.jwtService.verify(token);

      // 从数据库验证用户信息
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          role: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('用户不存在');
      }

      const isSuperAdmin = normalizeRoleName(user.role.name) === UserRole.ADMIN;

      return {
        isSuperAdmin,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: normalizeRoleName(user.role.name), // 转换为英文枚举值
        },
      };
    } catch {
      throw new UnauthorizedException('无效的令牌');
    }
  }

  private async validateSuperAdmin(
    email: string,
    password: string,
  ): Promise<{
    id: number;
    email: string;
    name: string | null;
    role: UserRole;
    roleId: number;
  } | null> {
    console.log(`尝试登录: ${email}`);

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
      },
    });

    if (!user) {
      console.log(`用户不存在: ${email}`);
      return null;
    }

    console.log(`找到用户: ${user.email}, 角色: ${user.role.name}`);

    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log(`密码匹配: ${passwordMatch}`);

    if (user && passwordMatch) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return {
        ...result,
        role: normalizeRoleName(result.role.name), // 转换为英文枚举值
      };
    }
    return null;
  }
}
