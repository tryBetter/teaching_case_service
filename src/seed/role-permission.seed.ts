import { PrismaService } from '../prisma/prisma.service';
import { CreatedPermission, CreatedRole } from '../roles/roles.service';

export async function seedRolePermissions(prisma: PrismaService) {
  console.log('开始创建默认权限...');

  // 创建默认权限
  const permissions = [
    // 用户管理权限
    {
      code: 'user:create',
      name: '创建用户',
      module: 'user',
      action: 'create',
      description: '允许创建新用户',
    },
    {
      code: 'user:read',
      name: '查看用户',
      module: 'user',
      action: 'read',
      description: '允许查看用户信息',
    },
    {
      code: 'user:update',
      name: '更新用户',
      module: 'user',
      action: 'update',
      description: '允许更新用户信息',
    },
    {
      code: 'user:delete',
      name: '删除用户',
      module: 'user',
      action: 'delete',
      description: '允许删除用户',
    },
    {
      code: 'user:list',
      name: '用户列表',
      module: 'user',
      action: 'list',
      description: '允许查看用户列表',
    },

    // 文章管理权限
    {
      code: 'article:create',
      name: '创建文章',
      module: 'article',
      action: 'create',
      description: '允许创建新文章',
    },
    {
      code: 'article:read',
      name: '查看文章',
      module: 'article',
      action: 'read',
      description: '允许查看文章',
    },
    {
      code: 'article:update',
      name: '更新文章',
      module: 'article',
      action: 'update',
      description: '允许更新文章',
    },
    {
      code: 'article:delete',
      name: '删除文章',
      module: 'article',
      action: 'delete',
      description: '允许删除文章',
    },
    {
      code: 'article:list',
      name: '文章列表',
      module: 'article',
      action: 'list',
      description: '允许查看文章列表',
    },
    {
      code: 'article:publish',
      name: '发布文章',
      module: 'article',
      action: 'publish',
      description: '允许发布文章',
    },

    // 媒体管理权限
    {
      code: 'media:upload',
      name: '上传媒体',
      module: 'media',
      action: 'upload',
      description: '允许上传媒体文件',
    },
    {
      code: 'media:read',
      name: '查看媒体',
      module: 'media',
      action: 'read',
      description: '允许查看媒体文件',
    },
    {
      code: 'media:delete',
      name: '删除媒体',
      module: 'media',
      action: 'delete',
      description: '允许删除媒体文件',
    },
    {
      code: 'media:list',
      name: '媒体列表',
      module: 'media',
      action: 'list',
      description: '允许查看媒体列表',
    },

    // 评论管理权限
    {
      code: 'comment:create',
      name: '创建评论',
      module: 'comment',
      action: 'create',
      description: '允许创建评论',
    },
    {
      code: 'comment:read',
      name: '查看评论',
      module: 'comment',
      action: 'read',
      description: '允许查看评论',
    },
    {
      code: 'comment:update',
      name: '更新评论',
      module: 'comment',
      action: 'update',
      description: '允许更新评论',
    },
    {
      code: 'comment:delete',
      name: '删除评论',
      module: 'comment',
      action: 'delete',
      description: '允许删除评论',
    },
    {
      code: 'comment:list',
      name: '评论列表',
      module: 'comment',
      action: 'list',
      description: '允许查看评论列表',
    },

    // 收藏管理权限
    {
      code: 'favorite:create',
      name: '创建收藏',
      module: 'favorite',
      action: 'create',
      description: '允许创建收藏',
    },
    {
      code: 'favorite:read',
      name: '查看收藏',
      module: 'favorite',
      action: 'read',
      description: '允许查看收藏',
    },
    {
      code: 'favorite:delete',
      name: '删除收藏',
      module: 'favorite',
      action: 'delete',
      description: '允许删除收藏',
    },
    {
      code: 'favorite:list',
      name: '收藏列表',
      module: 'favorite',
      action: 'list',
      description: '允许查看收藏列表',
    },

    // 笔记管理权限
    {
      code: 'note:create',
      name: '创建笔记',
      module: 'note',
      action: 'create',
      description: '允许创建笔记',
    },
    {
      code: 'note:read',
      name: '查看笔记',
      module: 'note',
      action: 'read',
      description: '允许查看笔记',
    },
    {
      code: 'note:update',
      name: '更新笔记',
      module: 'note',
      action: 'update',
      description: '允许更新笔记',
    },
    {
      code: 'note:delete',
      name: '删除笔记',
      module: 'note',
      action: 'delete',
      description: '允许删除笔记',
    },
    {
      code: 'note:list',
      name: '笔记列表',
      module: 'note',
      action: 'list',
      description: '允许查看笔记列表',
    },

    // 系统管理权限
    {
      code: 'system:admin',
      name: '系统管理',
      module: 'system',
      action: 'admin',
      description: '系统管理员权限',
    },
    {
      code: 'role:manage',
      name: '角色管理',
      module: 'role',
      action: 'manage',
      description: '允许管理角色和权限',
    },
  ];

  const createdPermissions: CreatedPermission[] = [];
  for (const permission of permissions) {
    try {
      const created = await prisma.permission.create({
        data: permission,
      });
      createdPermissions.push(created);
      console.log(`创建权限: ${permission.name}`);
    } catch {
      // 权限已存在，跳过
      console.log(`权限已存在: ${permission.name}`);
    }
  }

  console.log('开始创建默认角色...');

  // 创建默认角色
  const roles = [
    {
      name: '超级管理员',
      description: '拥有系统所有权限的超级管理员',
      isSystem: true,
      isActive: true,
    },
    {
      name: '管理员',
      description: '系统管理员，拥有大部分管理权限',
      isSystem: true,
      isActive: true,
    },
    {
      name: '教师组长',
      description: '教师组长角色，拥有教师所有权限，可管理所有教师的案例和资源',
      isSystem: true,
      isActive: true,
    },
    {
      name: '教师',
      description: '教师角色，拥有教学相关权限',
      isSystem: true,
      isActive: true,
    },
    {
      name: '助教组长',
      description: '助教组长角色，拥有助教所有权限，默认关联所有教师',
      isSystem: true,
      isActive: true,
    },
    {
      name: '助教',
      description: '助教角色，拥有辅助教学权限',
      isSystem: true,
      isActive: true,
    },
    {
      name: '学生',
      description: '学生角色，拥有基础学习权限',
      isSystem: true,
      isActive: true,
    },
  ];

  const createdRoles: CreatedRole[] = [];
  for (const role of roles) {
    try {
      const created = await prisma.role.create({
        data: role,
      });
      createdRoles.push(created);
      console.log(`创建角色: ${role.name}`);
    } catch {
      // 角色已存在，跳过
      console.log(`角色已存在: ${role.name}`);
    }
  }

  console.log('开始分配角色权限...');

  // 分配权限给角色
  const rolePermissions = {
    超级管理员: createdPermissions.map((p) => p.code), // 所有权限
    管理员: [
      'user:create',
      'user:read',
      'user:update',
      'user:delete',
      'user:list',
      'article:create',
      'article:read',
      'article:update',
      'article:delete',
      'article:list',
      'article:publish',
      'media:upload',
      'media:read',
      'media:delete',
      'media:list',
      'comment:create',
      'comment:read',
      'comment:update',
      'comment:delete',
      'comment:list',
      'favorite:create',
      'favorite:read',
      'favorite:delete',
      'favorite:list',
      'note:create',
      'note:read',
      'note:update',
      'note:delete',
      'note:list',
      'system:admin',
      'role:manage',
    ],
    教师组长: [
      'user:read',
      'user:list',
      'user:update',
      'article:create',
      'article:read',
      'article:update',
      'article:delete',
      'article:list',
      'article:publish',
      'media:upload',
      'media:read',
      'media:delete',
      'media:list',
      'comment:create',
      'comment:read',
      'comment:update',
      'comment:delete',
      'comment:list',
      'favorite:create',
      'favorite:read',
      'favorite:delete',
      'favorite:list',
      'note:create',
      'note:read',
      'note:update',
      'note:delete',
      'note:list',
    ],
    教师: [
      'user:read',
      'user:list',
      'user:update',
      'article:create',
      'article:read',
      'article:update',
      'article:delete',
      'article:list',
      'article:publish',
      'media:upload',
      'media:read',
      'media:delete',
      'media:list',
      'comment:create',
      'comment:read',
      'comment:update',
      'comment:delete',
      'comment:list',
      'favorite:create',
      'favorite:read',
      'favorite:delete',
      'favorite:list',
      'note:create',
      'note:read',
      'note:update',
      'note:delete',
      'note:list',
    ],
    助教组长: [
      'user:read',
      'user:list',
      // 注意：助教组长不能创建文章（article:create）
      'article:read',
      'article:update',
      'article:list',
      // 注意：助教组长不能发布文章（article:publish）
      // 注意：助教组长不能上传媒体（media:upload）
      'media:read',
      'media:list',
      // 注意：助教组长不能删除媒体（media:delete）
      'comment:create',
      'comment:read',
      'comment:update',
      'comment:delete',
      'comment:list',
      'favorite:create',
      'favorite:read',
      'favorite:delete',
      'favorite:list',
      'note:create',
      'note:read',
      'note:update',
      'note:delete',
      'note:list',
    ],
    助教: [
      'user:read',
      'user:list',
      // 注意：助教不能创建文章（article:create）
      'article:read',
      'article:update',
      'article:list',
      // 注意：助教不能发布文章（article:publish）
      // 注意：助教不能上传媒体（media:upload）
      'media:read',
      'media:list',
      // 注意：助教不能删除媒体（media:delete）
      'comment:create',
      'comment:read',
      'comment:update',
      'comment:delete',
      'comment:list',
      'favorite:create',
      'favorite:read',
      'favorite:delete',
      'favorite:list',
      'note:create',
      'note:read',
      'note:update',
      'note:delete',
      'note:list',
    ],
    学生: [
      'user:read',
      'user:update',
      'article:read',
      'article:list',
      'media:read',
      'media:list',
      'comment:create',
      'comment:read',
      'comment:update',
      'comment:list',
      'favorite:create',
      'favorite:read',
      'favorite:delete',
      'favorite:list',
      'note:create',
      'note:read',
      'note:update',
      'note:delete',
      'note:list',
    ],
  };

  for (const [roleName, permissionCodes] of Object.entries(rolePermissions)) {
    const role = createdRoles.find((r) => r.name === roleName);
    if (!role) continue;

    // 删除现有权限关联
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    // 查找对应的权限ID
    const permissionIds: number[] = [];
    for (const code of permissionCodes) {
      const permission = createdPermissions.find((p) => p.code === code);
      if (permission) {
        permissionIds.push(permission.id);
      }
    }

    // 创建新的权限关联
    const rolePermissionData = permissionIds.map((permissionId) => ({
      roleId: role.id,
      permissionId,
    }));

    await prisma.rolePermission.createMany({
      data: rolePermissionData,
    });

    console.log(`为角色 ${roleName} 分配了 ${permissionIds.length} 个权限`);
  }

  console.log('角色权限初始化完成！');
}
