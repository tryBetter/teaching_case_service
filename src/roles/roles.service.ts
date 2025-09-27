import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { CreateTeacherAssistantDto } from './dto/create-teacher-assistant.dto';

export interface CreatedPermission {
  id: number;
  code: string;
  name: string;
  module: string;
  action: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatedRole {
  id: number;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  // ==================== 角色管理 ====================

  async createRole(createRoleDto: CreateRoleDto) {
    // 检查角色名称是否已存在
    const existingRole = await this.prisma.role.findUnique({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw new ConflictException('角色名称已存在');
    }

    return this.prisma.role.create({
      data: createRoleDto,
    });
  }

  async findAllRoles() {
    return this.prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findRoleById(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    return role;
  }

  async updateRole(id: number, updateRoleDto: UpdateRoleDto) {
    const role = await this.findRoleById(id);

    // 检查角色名称是否已存在（排除当前角色）
    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingRole = await this.prisma.role.findUnique({
        where: { name: updateRoleDto.name },
      });

      if (existingRole) {
        throw new ConflictException('角色名称已存在');
      }
    }

    return this.prisma.role.update({
      where: { id },
      data: updateRoleDto,
    });
  }

  async deleteRole(id: number) {
    const role = await this.findRoleById(id);

    // 系统角色不能删除
    if (role.isSystem) {
      throw new ForbiddenException('系统角色不能删除');
    }

    // 检查是否有用户使用该角色
    const userCount = await this.prisma.user.count({
      where: { roleId: id },
    });

    if (userCount > 0) {
      throw new ConflictException('该角色下还有用户，无法删除');
    }

    // 删除角色权限关联
    await this.prisma.rolePermission.deleteMany({
      where: { roleId: id },
    });

    return this.prisma.role.delete({
      where: { id },
    });
  }

  // ==================== 权限管理 ====================

  async createPermission(createPermissionDto: CreatePermissionDto) {
    // 检查权限代码是否已存在
    const existingPermission = await this.prisma.permission.findUnique({
      where: { code: createPermissionDto.code },
    });

    if (existingPermission) {
      throw new ConflictException('权限代码已存在');
    }

    return this.prisma.permission.create({
      data: createPermissionDto,
    });
  }

  async findAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });
  }

  async findPermissionById(id: number) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!permission) {
      throw new NotFoundException('权限不存在');
    }

    return permission;
  }

  async updatePermission(id: number, updatePermissionDto: UpdatePermissionDto) {
    const permission = await this.findPermissionById(id);

    // 检查权限代码是否已存在（排除当前权限）
    if (
      updatePermissionDto.code &&
      updatePermissionDto.code !== permission.code
    ) {
      const existingPermission = await this.prisma.permission.findUnique({
        where: { code: updatePermissionDto.code },
      });

      if (existingPermission) {
        throw new ConflictException('权限代码已存在');
      }
    }

    return this.prisma.permission.update({
      where: { id },
      data: updatePermissionDto,
    });
  }

  async deletePermission(id: number) {
    await this.findPermissionById(id);

    // 删除角色权限关联
    await this.prisma.rolePermission.deleteMany({
      where: { permissionId: id },
    });

    return this.prisma.permission.delete({
      where: { id },
    });
  }

  // ==================== 角色权限分配 ====================

  async assignPermissionsToRole(
    roleId: number,
    assignPermissionsDto: AssignPermissionsDto,
  ) {
    const role = await this.findRoleById(roleId);

    // 验证权限ID是否存在
    const permissions = await this.prisma.permission.findMany({
      where: {
        id: {
          in: assignPermissionsDto.permissionIds,
        },
      },
    });

    if (permissions.length !== assignPermissionsDto.permissionIds.length) {
      throw new NotFoundException('部分权限不存在');
    }

    // 删除现有权限关联
    await this.prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    // 创建新的权限关联
    const rolePermissions = assignPermissionsDto.permissionIds.map(
      (permissionId) => ({
        roleId,
        permissionId,
      }),
    );

    await this.prisma.rolePermission.createMany({
      data: rolePermissions,
    });

    // 返回更新后的角色信息
    return this.findRoleById(roleId);
  }

  async getRolePermissions(roleId: number) {
    await this.findRoleById(roleId);

    return this.prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        permission: true,
      },
    });
  }

  // ==================== 权限检查 ====================

  async getUserPermissions(userId: number): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.role) {
      return [];
    }

    return user.role.rolePermissions.map((rp) => rp.permission.code);
  }

  async checkUserPermission(
    userId: number,
    permissionCode: string,
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permissionCode);
  }

  // ==================== 批量操作 ====================

  async createDefaultPermissions(): Promise<CreatedPermission[]> {
    const defaultPermissions = [
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
    for (const permission of defaultPermissions) {
      try {
        const created = await this.createPermission(permission);
        createdPermissions.push(created);
      } catch (error) {
        // 权限已存在，跳过
        if (error instanceof ConflictException) {
          continue;
        }
        throw error;
      }
    }

    return createdPermissions;
  }

  async createDefaultRoles(): Promise<CreatedRole[]> {
    const defaultRoles = [
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
        description:
          '教师组长角色，拥有教师所有权限，可管理所有教师的案例和资源',
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
    for (const role of defaultRoles) {
      try {
        const created = await this.createRole(role);
        createdRoles.push(created);
      } catch (error) {
        // 角色已存在，跳过
        if (error instanceof ConflictException) {
          continue;
        }
        throw error;
      }
    }

    return createdRoles;
  }

  // ==================== 教师-助教关联管理 ====================

  async createTeacherAssistantRelation(createDto: CreateTeacherAssistantDto) {
    // 验证教师和助教是否存在
    const teacher = await this.prisma.user.findUnique({
      where: { id: createDto.teacherId },
      include: { role: true },
    });

    const assistant = await this.prisma.user.findUnique({
      where: { id: createDto.assistantId },
      include: { role: true },
    });

    if (!teacher) {
      throw new NotFoundException('教师不存在');
    }

    if (!assistant) {
      throw new NotFoundException('助教不存在');
    }

    // 验证角色：教师和助教
    if (teacher.role.name !== '教师') {
      throw new ConflictException('指定用户不是教师角色');
    }

    if (assistant.role.name !== '助教') {
      throw new ConflictException('指定用户不是助教角色');
    }

    // 检查是否已经存在关联
    const existingRelation = await this.prisma.teacherAssistant.findUnique({
      where: {
        teacherId_assistantId: {
          teacherId: createDto.teacherId,
          assistantId: createDto.assistantId,
        },
      },
    });

    if (existingRelation) {
      throw new ConflictException('该教师和助教已经存在关联关系');
    }

    return this.prisma.teacherAssistant.create({
      data: createDto,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assistant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async getTeacherAssistantRelations() {
    return this.prisma.teacherAssistant.findMany({
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            role: {
              select: {
                name: true,
              },
            },
          },
        },
        assistant: {
          select: {
            id: true,
            name: true,
            email: true,
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getTeachersByAssistant(assistantId: number) {
    const assistant = await this.prisma.user.findUnique({
      where: { id: assistantId },
      include: { role: true },
    });

    if (!assistant) {
      throw new NotFoundException('助教不存在');
    }

    if (assistant.role.name !== '助教') {
      throw new ConflictException('指定用户不是助教角色');
    }

    return this.prisma.teacherAssistant.findMany({
      where: { assistantId },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async getAssistantsByTeacher(teacherId: number) {
    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId },
      include: { role: true },
    });

    if (!teacher) {
      throw new NotFoundException('教师不存在');
    }

    if (teacher.role.name !== '教师') {
      throw new ConflictException('指定用户不是教师角色');
    }

    return this.prisma.teacherAssistant.findMany({
      where: { teacherId },
      include: {
        assistant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async deleteTeacherAssistantRelation(id: number) {
    const relation = await this.prisma.teacherAssistant.findUnique({
      where: { id },
    });

    if (!relation) {
      throw new NotFoundException('关联关系不存在');
    }

    return this.prisma.teacherAssistant.delete({
      where: { id },
    });
  }

  async checkAssistantCanAccessTeacherResource(
    assistantId: number,
    teacherId: number,
  ): Promise<boolean> {
    // 检查用户是否为助教组长
    const assistant = await this.prisma.user.findUnique({
      where: { id: assistantId },
      include: { role: true },
    });

    if (!assistant) {
      return false;
    }

    // 如果是助教组长，可以访问所有教师的资源
    if (assistant.role.name === '助教组长') {
      return true;
    }

    // 如果是普通助教，检查是否有明确的关联关系
    const relation = await this.prisma.teacherAssistant.findUnique({
      where: {
        teacherId_assistantId: {
          teacherId,
          assistantId,
        },
      },
    });

    return !!relation;
  }
}
