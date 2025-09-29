import { SetMetadata } from '@nestjs/common';

export const SUPER_ADMIN_KEY = 'super_admin';

/**
 * 超级管理员装饰器
 * 标记只有超级管理员才能访问的接口
 */
export const RequireSuperAdmin = () => SetMetadata(SUPER_ADMIN_KEY, true);
