import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/user-role.enum';
import {
  Permission,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from '../enums/permissions.enum';
import type { AuthenticatedUser } from '../interfaces/user.interface';

export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';
export const PERMISSIONS_MODE_KEY = 'permissions_mode';

export enum PermissionsMode {
  ANY = 'any', // 拥有任一权限即可
  ALL = 'all', // 必须拥有所有权限
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 获取需要的角色
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 获取需要的权限
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 获取权限检查模式
    const permissionsMode =
      this.reflector.getAllAndOverride<PermissionsMode>(PERMISSIONS_MODE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || PermissionsMode.ANY;

    // 如果没有角色和权限要求，则允许访问
    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    // 获取当前用户
    const request: { user: AuthenticatedUser } = context
      .switchToHttp()
      .getRequest();
    const user: AuthenticatedUser = request.user;

    if (!user) {
      throw new ForbiddenException('用户未认证');
    }

    // 检查角色权限
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.includes(user.role);
      if (!hasRequiredRole) {
        throw new ForbiddenException(
          `需要以下角色之一: ${requiredRoles.join(', ')}`,
        );
      }
    }

    // 检查权限
    if (requiredPermissions && requiredPermissions.length > 0) {
      let hasRequiredPermissions = false;

      if (permissionsMode === PermissionsMode.ALL) {
        hasRequiredPermissions = hasAllPermissions(
          user.role,
          requiredPermissions,
        );
      } else {
        hasRequiredPermissions = hasAnyPermission(
          user.role,
          requiredPermissions,
        );
      }

      if (!hasRequiredPermissions) {
        const modeText =
          permissionsMode === PermissionsMode.ALL ? '所有' : '任一';
        throw new ForbiddenException(
          `需要${modeText}以下权限: ${requiredPermissions.join(', ')}`,
        );
      }
    }

    return true;
  }
}
