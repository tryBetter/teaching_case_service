import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { normalizeRoleName } from './enums/user-role.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<{
    id: number;
    email: string;
    name: string | null;
    role: string;
    roleId: number;
  } | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
      },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _password, ...result } = user;
      return {
        ...result,
        role: normalizeRoleName(result.role.name), // 转换为枚举值
      };
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
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
        userId: user.id, // 保持向后兼容
      },
    };
  }
}
