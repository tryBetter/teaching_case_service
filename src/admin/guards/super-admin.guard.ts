import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SUPER_ADMIN_KEY } from '../decorators/super-admin.decorator';
import { UserRole } from '../../auth/enums/user-role.enum';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 检查是否需要超级管理员权限
    const requireSuperAdmin = this.reflector.getAllAndOverride<boolean>(
      SUPER_ADMIN_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requireSuperAdmin) {
      return true;
    }

    // 获取用户信息（由全局 JWT Guard 或其他 Guard 设置）
    const request: { user?: { role: UserRole; id: number } } = context
      .switchToHttp()
      .getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('用户未认证');
    }

    // 检查用户角色是否为超级管理员（使用英文枚举值）
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('权限不足，需要超级管理员权限');
    }

    return true;
  }
}
