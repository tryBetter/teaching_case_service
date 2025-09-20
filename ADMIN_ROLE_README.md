# 管理员角色功能说明

## 概述

在原有的教师、助教、学生角色基础上，新增了管理员角色，具有调用接口的最高权限。

## 角色层次结构

```
管理员 (ADMIN) - 级别 4 (最高权限)
    ↓
教师 (TEACHER) - 级别 3
    ↓
助教 (ASSISTANT) - 级别 2
    ↓
学生 (STUDENT) - 级别 1 (基础权限)
```

## 管理员权限

管理员拥有系统中所有权限，包括：

### 用户管理权限
- `USER_CREATE` - 创建用户
- `USER_READ` - 查看用户信息
- `USER_UPDATE` - 更新用户信息
- `USER_DELETE` - 删除用户
- `USER_LIST` - 查看用户列表

### 文章管理权限
- `ARTICLE_CREATE` - 创建文章
- `ARTICLE_READ` - 查看文章
- `ARTICLE_UPDATE` - 更新文章
- `ARTICLE_DELETE` - 删除文章
- `ARTICLE_LIST` - 查看文章列表
- `ARTICLE_PUBLISH` - 发布文章

### 媒体管理权限
- `MEDIA_UPLOAD` - 上传媒体文件
- `MEDIA_READ` - 查看媒体文件
- `MEDIA_DELETE` - 删除媒体文件
- `MEDIA_LIST` - 查看媒体列表

### 评论管理权限
- `COMMENT_CREATE` - 创建评论
- `COMMENT_READ` - 查看评论
- `COMMENT_UPDATE` - 更新评论
- `COMMENT_DELETE` - 删除评论
- `COMMENT_LIST` - 查看评论列表

### 收藏管理权限
- `FAVORITE_CREATE` - 创建收藏
- `FAVORITE_READ` - 查看收藏
- `FAVORITE_DELETE` - 删除收藏
- `FAVORITE_LIST` - 查看收藏列表

### 笔记管理权限
- `NOTE_CREATE` - 创建笔记
- `NOTE_READ` - 查看笔记
- `NOTE_UPDATE` - 更新笔记
- `NOTE_DELETE` - 删除笔记
- `NOTE_LIST` - 查看笔记列表

### 系统管理权限
- `SYSTEM_ADMIN` - 系统管理
- `ROLE_MANAGE` - 角色管理

## 技术实现

### 1. 角色枚举更新

```typescript
export enum UserRole {
  ADMIN = 'ADMIN',      // 新增管理员角色
  TEACHER = 'TEACHER',
  ASSISTANT = 'ASSISTANT',
  STUDENT = 'STUDENT',
}
```

### 2. 角色层次结构

```typescript
export const ROLE_HIERARCHY = {
  [UserRole.ADMIN]: 4,      // 最高级别
  [UserRole.TEACHER]: 3,
  [UserRole.ASSISTANT]: 2,
  [UserRole.STUDENT]: 1,
};
```

### 3. 权限映射

```typescript
export const ROLE_PERMISSIONS = {
  ADMIN: [
    // 管理员拥有所有权限
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_LIST,
    // ... 所有其他权限
  ],
  // ... 其他角色权限
};
```

### 4. 装饰器支持

```typescript
// 管理员专用装饰器
@RequireAdmin()

// 管理员或教师装饰器
@RequireAdminOrTeacher()

// 所有角色装饰器（包含管理员）
@RequireAnyRole()
```

## 数据库更新

### Prisma Schema 更新

```prisma
enum UserRole {
  ADMIN      // 管理员
  TEACHER    // 教师
  ASSISTANT  // 助教
  STUDENT    // 学生
}
```

### 迁移文件

已创建迁移文件 `20250920164916_add_admin_role`，将 ADMIN 角色添加到数据库中。

## Excel 批量导入支持

### 角色映射

Excel 文件中的角色列支持以下值：

| Excel 中的值 | 对应的角色 |
| ------------ | ---------- |
| 管理员       | ADMIN      |
| ADMIN        | ADMIN      |
| 教师         | TEACHER    |
| TEACHER      | TEACHER    |
| 助教         | ASSISTANT  |
| ASSISTANT    | ASSISTANT  |
| 学生         | STUDENT    |
| STUDENT      | STUDENT    |

### 模板示例

Excel 导入模板现在包含管理员示例：

| 邮箱              | 姓名   | 密码        | 角色   |
| ----------------- | ------ | ----------- | ------ |
| admin@example.com | 管理员 | admin123    | 管理员 |
| user1@example.com | 张三   | password123 | 学生   |
| user2@example.com | 李四   | password456 | 助教   |
| user3@example.com | 王五   | password789 | 教师   |

## 使用示例

### 1. 创建管理员用户

```typescript
// 通过 API 创建
POST /users
{
  "email": "admin@example.com",
  "name": "系统管理员",
  "password": "admin123",
  "role": "ADMIN"
}

// 通过 Excel 批量导入
POST /users/batch
// 上传包含管理员数据的 Excel 文件
```

### 2. 权限验证

```typescript
// 只有管理员可以访问的接口
@RequireAdmin()
@Get('system/settings')
getSystemSettings() {
  // 系统设置管理
}

// 管理员或教师可以访问的接口
@RequireAdminOrTeacher()
@Delete('users/:id')
deleteUser(@Param('id') id: string) {
  // 删除用户
}
```

### 3. 权限检查

```typescript
// 在服务中检查权限
if (user.role === UserRole.ADMIN) {
  // 管理员特殊逻辑
}

// 使用权限检查函数
if (hasPermission(user.role, Permission.SYSTEM_ADMIN)) {
  // 系统管理权限
}
```

## 安全考虑

1. **权限最小化原则**：虽然管理员拥有所有权限，但在实际使用中应该根据具体需求进行权限控制。

2. **管理员账户保护**：
   - 建议为管理员账户设置强密码
   - 定期更换管理员密码
   - 限制管理员账户的创建权限

3. **审计日志**：建议为管理员操作添加审计日志，记录关键操作。

4. **角色继承**：管理员角色具有最高权限，可以执行所有操作，包括用户管理、系统配置等。

## 扩展性

该角色系统设计具有良好的扩展性：

1. **新增权限**：可以在 `Permission` 枚举中添加新权限，并自动分配给管理员角色。

2. **新增角色**：可以轻松添加新的角色类型，并配置相应的权限。

3. **权限组合**：支持复杂的权限组合和条件判断。

## 总结

管理员角色的添加完善了系统的权限管理体系，提供了最高级别的系统控制能力。通过统一的权限管理机制，确保了系统的安全性和可维护性。
