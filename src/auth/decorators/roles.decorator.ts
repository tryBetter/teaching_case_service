import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';
import { Permission, PermissionsMode } from '../enums/permissions.enum';
import {
  ROLES_KEY,
  PERMISSIONS_KEY,
  PERMISSIONS_MODE_KEY,
} from '../guards/roles.guard';

/**
 * 角色装饰器 - 指定需要的用户角色
 * @param roles 需要的用户角色数组
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/**
 * 权限装饰器 - 指定需要的权限
 * @param permissions 需要的权限数组
 * @param mode 权限检查模式，默认为 ANY（拥有任一权限即可）
 */
export const RequirePermissions = (
  permissions: Permission[],
  mode: PermissionsMode = PermissionsMode.ANY,
) => {
  return (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor,
  ) => {
    if (propertyKey && descriptor) {
      SetMetadata(PERMISSIONS_KEY, permissions)(
        target,
        propertyKey,
        descriptor,
      );
      SetMetadata(PERMISSIONS_MODE_KEY, mode)(target, propertyKey, descriptor);
    }
  };
};

/**
 * 教师角色装饰器
 */
export const RequireTeacher = () => Roles(UserRole.TEACHER);

/**
 * 助教角色装饰器
 */
export const RequireAssistant = () => Roles(UserRole.ASSISTANT);

/**
 * 学生角色装饰器
 */
export const RequireStudent = () => Roles(UserRole.STUDENT);

/**
 * 教师或助教角色装饰器
 */
export const RequireTeacherOrAssistant = () =>
  Roles(UserRole.TEACHER, UserRole.ASSISTANT);

/**
 * 所有角色装饰器
 */
export const RequireAnyRole = () =>
  Roles(UserRole.TEACHER, UserRole.ASSISTANT, UserRole.STUDENT);
