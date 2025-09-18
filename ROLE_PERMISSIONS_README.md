# 用户角色权限系统文档

## 概述

本系统实现了基于角色的访问控制（RBAC），支持三种用户角色：教师、助教、学生。不同角色具有不同的权限，可以访问和操作不同的模块。

## 角色定义

### 1. 教师 (TEACHER)
- **权限级别**: 最高
- **描述**: 拥有系统的完全管理权限
- **主要职责**: 管理用户、创建和管理文章、管理媒体、管理评论等

### 2. 助教 (ASSISTANT)
- **权限级别**: 中等
- **描述**: 协助教师进行教学管理
- **主要职责**: 创建和管理文章、管理媒体、管理评论，但不能删除用户

### 3. 学生 (STUDENT)
- **权限级别**: 基础
- **描述**: 基础学习功能
- **主要职责**: 查看文章、创建评论、管理个人收藏和笔记

## 权限矩阵

| 功能模块     | 权限         | 教师 | 助教 | 学生 |
| ------------ | ------------ | ---- | ---- | ---- |
| **用户管理** |              |      |      |      |
|              | 创建用户     | ✅    | ❌    | ❌    |
|              | 查看用户列表 | ✅    | ✅    | ❌    |
|              | 查看用户详情 | ✅    | ✅    | ✅    |
|              | 更新用户信息 | ✅    | ❌    | ✅    |
|              | 删除用户     | ✅    | ❌    | ❌    |
| **文章管理** |              |      |      |      |
|              | 创建文章     | ✅    | ✅    | ❌    |
|              | 查看文章     | ✅    | ✅    | ✅    |
|              | 更新文章     | ✅    | ✅    | ❌    |
|              | 删除文章     | ✅    | ❌    | ❌    |
|              | 发布文章     | ✅    | ✅    | ❌    |
| **媒体管理** |              |      |      |      |
|              | 上传媒体     | ✅    | ✅    | ❌    |
|              | 查看媒体     | ✅    | ✅    | ✅    |
|              | 删除媒体     | ✅    | ❌    | ❌    |
|              | 媒体列表     | ✅    | ✅    | ✅    |
| **评论管理** |              |      |      |      |
|              | 创建评论     | ✅    | ✅    | ✅    |
|              | 查看评论     | ✅    | ✅    | ✅    |
|              | 更新评论     | ✅    | ✅    | ✅    |
|              | 删除评论     | ✅    | ✅    | ❌    |
| **收藏管理** |              |      |      |      |
|              | 创建收藏     | ✅    | ✅    | ✅    |
|              | 查看收藏     | ✅    | ✅    | ✅    |
|              | 删除收藏     | ✅    | ✅    | ✅    |
| **笔记管理** |              |      |      |      |
|              | 创建笔记     | ✅    | ✅    | ✅    |
|              | 查看笔记     | ✅    | ✅    | ✅    |
|              | 更新笔记     | ✅    | ✅    | ✅    |
|              | 删除笔记     | ✅    | ✅    | ✅    |
| **系统管理** |              |      |      |      |
|              | 系统管理     | ✅    | ❌    | ❌    |
|              | 角色管理     | ✅    | ❌    | ❌    |

## 权限实现

### 1. 角色枚举
```typescript
export enum UserRole {
  TEACHER = 'TEACHER',
  ASSISTANT = 'ASSISTANT',
  STUDENT = 'STUDENT',
}
```

### 2. 权限枚举
```typescript
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
  
  // 其他权限...
}
```

### 3. 角色权限映射
```typescript
export const ROLE_PERMISSIONS = {
  TEACHER: [
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_LIST,
    // ... 所有权限
  ],
  ASSISTANT: [
    Permission.USER_READ,
    Permission.USER_LIST,
    Permission.ARTICLE_CREATE,
    Permission.ARTICLE_READ,
    Permission.ARTICLE_UPDATE,
    Permission.ARTICLE_LIST,
    Permission.ARTICLE_PUBLISH,
    // ... 部分权限
  ],
  STUDENT: [
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.ARTICLE_READ,
    Permission.ARTICLE_LIST,
    Permission.COMMENT_CREATE,
    Permission.COMMENT_READ,
    Permission.COMMENT_UPDATE,
    // ... 基础权限
  ],
};
```

## 使用方式

### 1. 角色装饰器
```typescript
// 需要教师角色
@RequireTeacher()
@Delete(':id')
remove(@Param('id') id: string) {
  return this.service.remove(+id);
}

// 需要教师或助教角色
@RequireTeacherOrAssistant()
@Post()
create(@Body() dto: CreateDto) {
  return this.service.create(dto);
}
```

### 2. 权限装饰器
```typescript
// 需要特定权限
@RequirePermissions([Permission.USER_CREATE])
@Post()
create(@Body() dto: CreateUserDto) {
  return this.service.create(dto);
}

// 需要多个权限（任一即可）
@RequirePermissions([Permission.ARTICLE_READ, Permission.ARTICLE_LIST])
@Get()
findAll() {
  return this.service.findAll();
}

// 需要多个权限（全部需要）
@RequirePermissions([Permission.USER_READ, Permission.USER_UPDATE], PermissionsMode.ALL)
@Patch(':id')
update(@Param('id') id: string, @Body() dto: UpdateDto) {
  return this.service.update(+id, dto);
}
```

### 3. 守卫使用
```typescript
@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  // 控制器方法...
}
```

## API 响应

### 权限不足响应
```json
{
  "statusCode": 403,
  "message": "需要以下角色之一: TEACHER",
  "error": "Forbidden"
}
```

```json
{
  "statusCode": 403,
  "message": "需要任一以下权限: user:create, user:update",
  "error": "Forbidden"
}
```

## 数据库设计

### User 表结构
```sql
CREATE TABLE "User" (
  "id" SERIAL PRIMARY KEY,
  "email" VARCHAR UNIQUE NOT NULL,
  "name" VARCHAR,
  "password" VARCHAR NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
```

### 角色枚举
```sql
CREATE TYPE "UserRole" AS ENUM ('TEACHER', 'ASSISTANT', 'STUDENT');
```

## 安全考虑

### 1. 权限验证
- 所有需要权限的接口都会验证用户角色
- 权限检查在守卫层面进行，确保安全性
- 支持细粒度的权限控制

### 2. 数据隔离
- 学生只能查看和修改自己的数据
- 助教可以管理文章和评论，但不能删除用户
- 教师拥有完全的管理权限

### 3. 错误处理
- 权限不足时返回明确的错误信息
- 不暴露系统内部结构
- 统一的错误响应格式

## 扩展性

### 1. 添加新角色
1. 在 `UserRole` 枚举中添加新角色
2. 在 `ROLE_PERMISSIONS` 中定义角色权限
3. 更新权限矩阵文档

### 2. 添加新权限
1. 在 `Permission` 枚举中添加新权限
2. 在 `ROLE_PERMISSIONS` 中为相关角色分配权限
3. 在控制器中使用权限装饰器

### 3. 自定义权限检查
```typescript
// 自定义权限检查函数
export function hasCustomPermission(userRole: string, resource: string, action: string): boolean {
  // 自定义逻辑
  return true;
}
```

## 最佳实践

### 1. 权限设计原则
- **最小权限原则**: 用户只获得完成工作所需的最小权限
- **职责分离**: 不同角色承担不同的职责
- **权限继承**: 高级角色包含低级角色的权限

### 2. 代码组织
- 权限定义集中管理
- 使用装饰器简化权限控制
- 统一的错误处理

### 3. 测试建议
- 为每个角色和权限组合编写测试
- 测试权限不足的情况
- 测试权限边界条件

## 更新日志

### v1.0.0 (2024-01-01)
- ✅ 实现基础角色系统（教师、助教、学生）
- ✅ 定义完整的权限矩阵
- ✅ 实现角色守卫和装饰器
- ✅ 更新用户认证系统支持角色
- ✅ 为关键接口添加权限控制
- ✅ 完整的权限文档和示例
