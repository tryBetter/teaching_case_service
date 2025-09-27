# 教师组长角色功能说明

## 概述

新增教师组长角色，除了拥有教师的所有权限，还可以查看、修改、删除所有教师的案例和图片、视频资源等。普通教师用户则只允许操作自己的案例和资源。

## 角色层次结构

```
管理员 (ADMIN) - 级别 5 (最高权限)
    ↓
教师组长 (TEACHER_LEADER) - 级别 4
    ↓
教师 (TEACHER) - 级别 3
    ↓
助教 (ASSISTANT) - 级别 2
    ↓
学生 (STUDENT) - 级别 1 (基础权限)
```

## 教师组长权限

### 核心功能
- **跨用户资源管理**: 可以查看、修改、删除所有教师的案例和资源
- **完整教师权限**: 拥有教师角色的所有权限
- **系统角色保护**: 作为系统角色，不可删除

### 具体权限列表

#### 用户管理权限
- `user:read` - 查看用户信息
- `user:list` - 查看用户列表
- `user:update` - 更新用户信息

#### 文章管理权限
- `article:create` - 创建文章
- `article:read` - 查看文章
- `article:update` - 更新文章
- `article:delete` - 删除文章
- `article:list` - 查看文章列表
- `article:publish` - 发布文章

#### 媒体管理权限
- `media:upload` - 上传媒体文件
- `media:read` - 查看媒体文件
- `media:delete` - 删除媒体文件
- `media:list` - 查看媒体列表

#### 评论管理权限
- `comment:create` - 创建评论
- `comment:read` - 查看评论
- `comment:update` - 更新评论
- `comment:delete` - 删除评论
- `comment:list` - 查看评论列表

#### 收藏管理权限
- `favorite:create` - 创建收藏
- `favorite:read` - 查看收藏
- `favorite:delete` - 删除收藏
- `favorite:list` - 查看收藏列表

#### 笔记管理权限
- `note:create` - 创建笔记
- `note:read` - 查看笔记
- `note:update` - 更新笔记
- `note:delete` - 删除笔记
- `note:list` - 查看笔记列表

## 与普通教师的区别

### 教师组长
- ✅ 可以查看所有教师的案例
- ✅ 可以修改所有教师的案例
- ✅ 可以删除所有教师的案例
- ✅ 可以查看所有教师的图片、视频资源
- ✅ 可以修改所有教师的图片、视频资源
- ✅ 可以删除所有教师的图片、视频资源

### 普通教师
- ✅ 只能查看自己的案例
- ✅ 只能修改自己的案例
- ✅ 只能删除自己的案例
- ✅ 只能查看自己的图片、视频资源
- ✅ 只能修改自己的图片、视频资源
- ✅ 只能删除自己的图片、视频资源

## 技术实现

### 1. 角色枚举更新

```typescript
export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER_LEADER = 'TEACHER_LEADER',  // 新增
  TEACHER = 'TEACHER',
  ASSISTANT = 'ASSISTANT',
  STUDENT = 'STUDENT',
}
```

### 2. 角色层次结构

```typescript
export const ROLE_HIERARCHY = {
  [UserRole.ADMIN]: 5,
  [UserRole.TEACHER_LEADER]: 4,  // 新增
  [UserRole.TEACHER]: 3,
  [UserRole.ASSISTANT]: 2,
  [UserRole.STUDENT]: 1,
};
```

### 3. 权限装饰器

```typescript
// 教师组长、教师或助教角色装饰器
export const RequireTeacherLeaderOrTeacherOrAssistant = () =>
  Roles(UserRole.TEACHER_LEADER, UserRole.TEACHER, UserRole.ASSISTANT);

// 教师组长或教师角色装饰器
export const RequireTeacherLeaderOrTeacher = () =>
  Roles(UserRole.TEACHER_LEADER, UserRole.TEACHER);
```

### 4. 控制器权限控制

#### 文章管理
```typescript
@RequireTeacherLeaderOrTeacherOrAssistant()
@Post()
create(@Body() createArticleDto: CreateArticleDto) {
  // 教师组长可以创建文章
}

@RequirePermissions([Permission.ARTICLE_DELETE])
@Delete(':id')
remove(@Param('id') id: string) {
  // 教师组长可以删除任何文章
}
```

#### 媒体管理
```typescript
@RequireTeacherLeaderOrTeacherOrAssistant()
@Post('upload')
async uploadFile(@UploadedFile() file: UploadedFileInterface) {
  // 教师组长可以上传媒体文件
}

@RequirePermissions([Permission.MEDIA_DELETE])
@Delete(':id')
remove(@Param('id') id: string) {
  // 教师组长可以删除任何媒体文件
}
```

## 数据库初始化

### 角色创建
```typescript
{
  name: '教师组长',
  description: '教师组长角色，拥有教师所有权限，可管理所有教师的案例和资源',
  isSystem: true,
  isActive: true,
}
```

### 权限分配
教师组长角色拥有与教师角色相同的27个权限：
- 用户管理权限：3个
- 文章管理权限：6个
- 媒体管理权限：4个
- 评论管理权限：5个
- 收藏管理权限：4个
- 笔记管理权限：5个

## 使用示例

### 1. 创建教师组长用户
```typescript
const createUserDto = {
  email: 'leader@example.com',
  name: '张组长',
  password: 'password123',
  roleId: 3 // 教师组长角色ID
};
```

### 2. 权限检查
```typescript
// 检查用户是否为教师组长
if (user.role === 'TEACHER_LEADER') {
  // 允许访问所有教师的资源
  return this.articlesService.findAll();
} else if (user.role === 'TEACHER') {
  // 只允许访问自己的资源
  return this.articlesService.findByAuthor(user.userId);
}
```

### 3. 跨用户资源访问
```typescript
// 教师组长可以访问所有教师的文章
@Get('all-teachers-articles')
@RequireTeacherLeader()
async getAllTeachersArticles() {
  return this.articlesService.findAll();
}

// 普通教师只能访问自己的文章
@Get('my-articles')
@RequireTeacher()
async getMyArticles(@CurrentUser() user: AuthenticatedUser) {
  return this.articlesService.findByAuthor(user.userId);
}
```

## 安全考虑

### 1. 权限验证
- 所有需要权限的接口都会验证用户角色
- 教师组长权限检查在守卫层面进行
- 支持细粒度的权限控制

### 2. 数据隔离
- 普通教师只能操作自己的数据
- 教师组长可以操作所有教师的数据
- 管理员拥有完全的管理权限

### 3. 审计日志
- 建议记录教师组长的跨用户操作
- 便于追踪和审计敏感操作

## API 接口

### 角色管理
```
GET    /roles                    # 获取所有角色（包含教师组长）
POST   /roles/init               # 创建默认角色（包含教师组长）
```

### 权限检查
```
GET    /roles/:id/permissions    # 获取角色权限列表
POST   /roles/:id/permissions    # 为角色分配权限
```

## 部署说明

### 1. 数据库迁移
运行角色权限初始化接口：
```bash
POST /roles/permissions/init  # 创建默认权限
POST /roles/init              # 创建默认角色（包含教师组长）
```

### 2. 用户角色分配
为现有用户分配教师组长角色：
```bash
PATCH /users/:id
{
  "roleId": 3  // 教师组长角色ID
}
```

### 3. 权限验证
确保所有相关接口都已更新权限装饰器，支持教师组长角色。

## 更新日志

### v1.1.0 (2024-01-15)
- ✅ 新增教师组长角色
- ✅ 实现跨用户资源访问权限
- ✅ 更新权限矩阵和装饰器
- ✅ 完善相关文档说明
- ✅ 更新角色权限种子数据
