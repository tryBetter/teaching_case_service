import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../../auth/auth.guard';
import { SUPER_ADMIN_KEY } from '../decorators/super-admin.decorator';
import { UserRole } from '../../auth/enums/user-role.enum';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 首先检查JWT认证
    const jwtGuard = new JwtAuthGuard(this.reflector);
    const isAuthenticated = await jwtGuard.canActivate(context);
    if (!isAuthenticated) {
      return false;
    }

    // 检查是否需要超级管理员权限
    const requireSuperAdmin = this.reflector.getAllAndOverride<boolean>(
      SUPER_ADMIN_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requireSuperAdmin) {
      return true;
    }

    // 获取用户信息
    const request: { user: { role: UserRole } } = context
      .switchToHttp()
      .getRequest();
    const user: { role: UserRole } = request.user;

    if (!user) {
      throw new ForbiddenException('用户信息不存在');
    }

    // 检查用户角色是否为超级管理员（使用英文枚举值）
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('权限不足，需要超级管理员权限');
    }

    return true;
  }
}
