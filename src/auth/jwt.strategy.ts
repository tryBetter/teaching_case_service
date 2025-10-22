import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeRoleName } from './enums/user-role.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: {
    sub: number;
    email: string;
    name: string;
    role: string;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        roleId: true,
        avatar: true,
        major: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    const roleName = user.role
      ? String((user.role as { name: string }).name)
      : '学生';

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: normalizeRoleName(roleName),
      roleId: user.roleId,
      avatar: user.avatar as string | null,
      major: user.major as string | null,
      userId: user.id, // 保持向后兼容
    };
  }
}
