export enum Permission {
  // 用户管理权限
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_LIST = 'user:list',

  // 文章管理权限
  ARTICLE_CREATE = 'article:create',
  ARTICLE_READ = 'article:read',
  ARTICLE_UPDATE = 'article:update',
  ARTICLE_DELETE = 'article:delete',
  ARTICLE_LIST = 'article:list',
  ARTICLE_PUBLISH = 'article:publish',

  // 媒体管理权限
  MEDIA_UPLOAD = 'media:upload',
  MEDIA_READ = 'media:read',
  MEDIA_DELETE = 'media:delete',
  MEDIA_LIST = 'media:list',

  // 评论管理权限
  COMMENT_CREATE = 'comment:create',
  COMMENT_READ = 'comment:read',
  COMMENT_UPDATE = 'comment:update',
  COMMENT_DELETE = 'comment:delete',
  COMMENT_LIST = 'comment:list',

  // 收藏管理权限
  FAVORITE_CREATE = 'favorite:create',
  FAVORITE_READ = 'favorite:read',
  FAVORITE_DELETE = 'favorite:delete',
  FAVORITE_LIST = 'favorite:list',

  // 笔记管理权限
  NOTE_CREATE = 'note:create',
  NOTE_READ = 'note:read',
  NOTE_UPDATE = 'note:update',
  NOTE_DELETE = 'note:delete',
  NOTE_LIST = 'note:list',

  // 系统管理权限
  SYSTEM_ADMIN = 'system:admin',
  ROLE_MANAGE = 'role:manage',
}

// 注意：角色权限映射已移至数据库管理，这里保留兼容性
// 新的权限检查将从数据库动态读取

export enum PermissionsMode {
  ANY = 'any', // 拥有任一权限即可
  ALL = 'all', // 必须拥有所有权限
}

// 注意：以下函数已被弃用，新的权限检查将通过 RolesService 从数据库动态读取
// 保留这些函数是为了向后兼容，但建议使用 RolesService.checkUserPermission 方法

// 检查用户是否有特定权限（已弃用）
export function hasPermission(
  _userRole: string,
  _permission: Permission,
): boolean {
  // 返回 false，强制使用数据库权限检查
  return false;
}

// 检查用户是否有任一权限（已弃用）
export function hasAnyPermission(
  _userRole: string,
  _permissions: Permission[],
): boolean {
  // 返回 false，强制使用数据库权限检查
  return false;
}

// 检查用户是否有所有权限（已弃用）
export function hasAllPermissions(
  _userRole: string,
  _permissions: Permission[],
): boolean {
  // 返回 false，强制使用数据库权限检查
  return false;
}
