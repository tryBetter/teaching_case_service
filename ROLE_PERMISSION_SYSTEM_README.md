# 角色权限系统重构说明

## 概述

本次重构将原有的硬编码角色权限系统改为动态的角色权限管理系统，支持管理员创建角色、配置权限，并灵活分配用户角色。

## 主要变更

### 1. 数据库模型重构

#### 新增表结构：
- **Role（角色表）**：存储角色信息
- **Permission（权限表）**：存储权限信息  
- **RolePermission（角色权限关联表）**：存储角色与权限的关联关系

#### 修改表结构：
- **User表**：将`role`字段改为`roleId`外键关联到Role表

### 2. 功能特性

#### 角色管理
- ✅ 创建角色：支持自定义角色名称、描述
- ✅ 查询角色：获取所有角色列表，包含权限信息
- ✅ 更新角色：修改角色基本信息
- ✅ 删除角色：支持删除非系统角色
- ✅ 系统角色保护：超级管理员、管理员、教师组长、教师、助教组长、助教、学生为系统角色，不可删除

#### 权限管理
- ✅ 创建权限：支持自定义权限代码、名称、模块、操作类型
- ✅ 查询权限：按模块分组显示所有权限
- ✅ 更新权限：修改权限信息
- ✅ 删除权限：删除权限（会同时删除相关角色权限关联）

#### 角色权限分配
- ✅ 为角色分配权限：批量设置角色拥有的权限
- ✅ 查看角色权限：获取指定角色的权限列表
- ✅ 权限同步：当角色权限修改时，所有该角色用户的权限自动同步

#### 用户管理增强
- ✅ 角色分配：创建用户时可指定角色ID
- ✅ 批量创建：Excel导入时支持指定角色ID
- ✅ 默认角色：未指定角色时自动分配为学生角色
- ✅ 角色验证：确保分配的角色存在且可用

### 3. API接口

#### 角色管理接口
```
POST   /roles                    # 创建角色
GET    /roles                    # 获取所有角色
GET    /roles/:id                # 获取角色详情
PATCH  /roles/:id                # 更新角色
DELETE /roles/:id                # 删除角色
```

#### 权限管理接口
```
POST   /roles/permissions        # 创建权限
GET    /roles/permissions        # 获取所有权限
GET    /roles/permissions/:id    # 获取权限详情
PATCH  /roles/permissions/:id    # 更新权限
DELETE /roles/permissions/:id    # 删除权限
```

#### 角色权限分配接口
```
POST   /roles/:id/permissions    # 为角色分配权限
GET    /roles/:id/permissions    # 获取角色权限列表
```

#### 初始化接口
```
POST   /roles/permissions/init   # 创建默认权限
POST   /roles/init               # 创建默认角色
```

### 4. 权限系统

#### 动态权限检查
- ✅ 从数据库读取用户权限，而非硬编码
- ✅ 支持权限变更实时生效
- ✅ 保持原有装饰器语法：`@RequirePermissions([Permission.USER_CREATE])`

#### 权限分类
- **用户管理权限**：user:create, user:read, user:update, user:delete, user:list
- **文章管理权限**：article:create, article:read, article:update, article:delete, article:list, article:publish
- **媒体管理权限**：media:upload, media:read, media:delete, media:list
- **评论管理权限**：comment:create, comment:read, comment:update, comment:delete, comment:list
- **收藏管理权限**：favorite:create, favorite:read, favorite:delete, favorite:list
- **笔记管理权限**：note:create, note:read, note:update, note:delete, note:list
- **系统管理权限**：system:admin, role:manage

### 5. 默认角色权限

#### 超级管理员
- 拥有所有31个权限
- 系统角色，不可删除

#### 管理员  
- 拥有31个权限（与超级管理员相同）
- 系统角色，不可删除

#### 教师组长
- 拥有27个权限（与教师相同）
- 包含用户管理、文章管理、媒体管理、评论管理、收藏管理、笔记管理
- 可查看、修改、删除所有教师的案例和图片、视频资源等
- 系统角色，不可删除

#### 教师
- 拥有27个权限
- 包含用户管理、文章管理、媒体管理、评论管理、收藏管理、笔记管理
- 只能操作自己的案例和资源
- 系统角色，不可删除

#### 助教组长
- 拥有23个权限（与助教相同）
- 包含文章管理（无创建、删除权限）、媒体管理（无上传、删除权限）、评论管理、收藏管理、笔记管理
- 默认关联所有教师，可访问所有教师的资源
- 系统角色，不可删除

#### 助教
- 拥有23个权限
- 包含文章管理（无创建、删除权限）、媒体管理（无上传、删除权限）、评论管理、收藏管理、笔记管理
- 只能访问关联教师的资源
- 系统角色，不可删除

#### 学生
- 拥有19个权限
- 包含基础的文章查看、媒体查看、评论管理、收藏管理、笔记管理
- 系统角色，不可删除

### 6. 使用示例

#### 创建自定义角色
```typescript
// 创建"高级教师"角色
const createRoleDto = {
  name: '高级教师',
  description: '拥有高级权限的教师角色',
  isActive: true
};

// 为角色分配权限
const assignPermissionsDto = {
  permissionIds: [1, 2, 3, 4, 5] // 权限ID数组
};
```

#### 创建用户时指定角色
```typescript
const createUserDto = {
  email: 'teacher@example.com',
  name: '张老师',
  password: 'password123',
  roleId: 3 // 教师角色ID
};
```

#### 权限检查
```typescript
@Controller('users')
@RequirePermissions([Permission.USER_CREATE])
export class UsersController {
  // 只有拥有user:create权限的用户才能访问
}
```

### 7. 管理员账户

系统已创建默认管理员账户：
- **邮箱**：admin@example.com
- **密码**：admin123
- **角色**：超级管理员

### 8. 数据库迁移

已执行数据库迁移：
- 创建Role、Permission、RolePermission表
- 修改User表结构
- 初始化默认角色和权限数据

### 9. 向后兼容

- ✅ 保持原有API接口不变
- ✅ 保持原有装饰器语法不变
- ✅ 用户接口保持userId字段兼容性
- ✅ 权限检查逻辑透明升级

## 总结

新的角色权限系统提供了更灵活、更强大的权限管理能力，支持：

1. **动态权限管理**：管理员可以随时创建、修改、删除角色和权限
2. **细粒度权限控制**：支持模块化的权限设计，便于扩展
3. **实时权限同步**：角色权限修改后，用户权限立即生效
4. **系统安全保障**：系统角色保护，防止误删关键角色
5. **易于维护**：清晰的数据库结构，便于后续维护和扩展

系统现在完全支持管理员创建角色、配置权限、分配用户角色的完整工作流程。
