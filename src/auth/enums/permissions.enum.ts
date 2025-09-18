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

// 角色权限映射
export const ROLE_PERMISSIONS = {
  TEACHER: [
    // 用户管理
    Permission.USER_READ,
    Permission.USER_LIST,
    Permission.USER_UPDATE,

    // 文章管理 - 全部权限
    Permission.ARTICLE_CREATE,
    Permission.ARTICLE_READ,
    Permission.ARTICLE_UPDATE,
    Permission.ARTICLE_DELETE,
    Permission.ARTICLE_LIST,
    Permission.ARTICLE_PUBLISH,

    // 媒体管理 - 全部权限
    Permission.MEDIA_UPLOAD,
    Permission.MEDIA_READ,
    Permission.MEDIA_DELETE,
    Permission.MEDIA_LIST,

    // 评论管理 - 全部权限
    Permission.COMMENT_CREATE,
    Permission.COMMENT_READ,
    Permission.COMMENT_UPDATE,
    Permission.COMMENT_DELETE,
    Permission.COMMENT_LIST,

    // 收藏管理 - 全部权限
    Permission.FAVORITE_CREATE,
    Permission.FAVORITE_READ,
    Permission.FAVORITE_DELETE,
    Permission.FAVORITE_LIST,

    // 笔记管理 - 全部权限
    Permission.NOTE_CREATE,
    Permission.NOTE_READ,
    Permission.NOTE_UPDATE,
    Permission.NOTE_DELETE,
    Permission.NOTE_LIST,

    // 系统管理
    Permission.SYSTEM_ADMIN,
    Permission.ROLE_MANAGE,
  ],

  ASSISTANT: [
    // 用户管理 - 只读
    Permission.USER_READ,
    Permission.USER_LIST,

    // 文章管理 - 创建和编辑，不能删除
    Permission.ARTICLE_CREATE,
    Permission.ARTICLE_READ,
    Permission.ARTICLE_UPDATE,
    Permission.ARTICLE_LIST,
    Permission.ARTICLE_PUBLISH,

    // 媒体管理 - 上传和查看
    Permission.MEDIA_UPLOAD,
    Permission.MEDIA_READ,
    Permission.MEDIA_LIST,

    // 评论管理 - 全部权限
    Permission.COMMENT_CREATE,
    Permission.COMMENT_READ,
    Permission.COMMENT_UPDATE,
    Permission.COMMENT_DELETE,
    Permission.COMMENT_LIST,

    // 收藏管理 - 全部权限
    Permission.FAVORITE_CREATE,
    Permission.FAVORITE_READ,
    Permission.FAVORITE_DELETE,
    Permission.FAVORITE_LIST,

    // 笔记管理 - 全部权限
    Permission.NOTE_CREATE,
    Permission.NOTE_READ,
    Permission.NOTE_UPDATE,
    Permission.NOTE_DELETE,
    Permission.NOTE_LIST,
  ],

  STUDENT: [
    // 用户管理 - 只能查看和更新自己的信息
    Permission.USER_READ,
    Permission.USER_UPDATE,

    // 文章管理 - 只能查看
    Permission.ARTICLE_READ,
    Permission.ARTICLE_LIST,

    // 媒体管理 - 只能查看
    Permission.MEDIA_READ,
    Permission.MEDIA_LIST,

    // 评论管理 - 创建、查看、更新自己的评论
    Permission.COMMENT_CREATE,
    Permission.COMMENT_READ,
    Permission.COMMENT_UPDATE,
    Permission.COMMENT_LIST,

    // 收藏管理 - 全部权限
    Permission.FAVORITE_CREATE,
    Permission.FAVORITE_READ,
    Permission.FAVORITE_DELETE,
    Permission.FAVORITE_LIST,

    // 笔记管理 - 全部权限
    Permission.NOTE_CREATE,
    Permission.NOTE_READ,
    Permission.NOTE_UPDATE,
    Permission.NOTE_DELETE,
    Permission.NOTE_LIST,
  ],
};

export enum PermissionsMode {
  ANY = 'any', // 拥有任一权限即可
  ALL = 'all', // 必须拥有所有权限
}

// 检查用户是否有特定权限
export function hasPermission(
  userRole: string,
  permission: Permission,
): boolean {
  const rolePermissions =
    ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS];
  return rolePermissions ? rolePermissions.includes(permission) : false;
}

// 检查用户是否有任一权限
export function hasAnyPermission(
  userRole: string,
  permissions: Permission[],
): boolean {
  return permissions.some((permission) => hasPermission(userRole, permission));
}

// 检查用户是否有所有权限
export function hasAllPermissions(
  userRole: string,
  permissions: Permission[],
): boolean {
  return permissions.every((permission) => hasPermission(userRole, permission));
}
