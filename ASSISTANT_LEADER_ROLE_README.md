# 助教组长角色功能说明

## 概述

新增助教组长角色，和普通助教的权限一样，但是默认关联所有教师。新增教师也默认关联助教组长。

## 角色层次结构

```
管理员 (ADMIN) - 级别 6 (最高权限)
    ↓
教师组长 (TEACHER_LEADER) - 级别 5
    ↓
教师 (TEACHER) - 级别 4
    ↓
助教组长 (ASSISTANT_LEADER) - 级别 3
    ↓
助教 (ASSISTANT) - 级别 2
    ↓
学生 (STUDENT) - 级别 1 (基础权限)
```

## 助教组长权限

### 核心功能
- **默认关联所有教师**: 可以访问所有教师的资源
- **完整助教权限**: 拥有助教角色的所有权限
- **系统角色保护**: 作为系统角色，不可删除

### 具体权限列表

#### 用户管理权限
- `user:read` - 查看用户信息
- `user:list` - 查看用户列表

#### 文章管理权限
- ❌ `article:create` - 不能创建文章
- `article:read` - 查看文章
- `article:update` - 更新文章
- `article:list` - 查看文章列表
- ❌ `article:publish` - 不能发布文章
- ❌ `article:delete` - 不能删除文章

#### 媒体管理权限
- `media:read` - 查看媒体文件
- `media:list` - 查看媒体列表
- ❌ `media:upload` - 不能上传媒体文件
- ❌ `media:delete` - 不能删除媒体文件

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

## 与普通助教的区别

### 助教组长
- ✅ 可以查看所有教师的案例
- ✅ 可以修改所有教师的案例
- ✅ 可以查看所有教师的图片、视频资源
- ❌ 不能创建文章
- ❌ 不能上传媒体文件
- ✅ 默认关联所有教师
- ✅ 新增教师时自动关联

### 普通助教
- ✅ 只能查看关联教师的案例
- ✅ 只能修改关联教师的案例
- ✅ 只能查看关联教师的图片、视频资源
- ❌ 不能创建文章
- ❌ 不能上传媒体文件
- ❌ 需要手动关联教师
- ❌ 新增教师时不会自动关联

## 技术实现

### 1. 角色枚举更新

```typescript
export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER_LEADER = 'TEACHER_LEADER',
  TEACHER = 'TEACHER',
  ASSISTANT_LEADER = 'ASSISTANT_LEADER',  // 新增
  ASSISTANT = 'ASSISTANT',
  STUDENT = 'STUDENT',
}
```

### 2. 角色层次结构

```typescript
export const ROLE_HIERARCHY = {
  [UserRole.ADMIN]: 6,
  [UserRole.TEACHER_LEADER]: 5,
  [UserRole.TEACHER]: 4,
  [UserRole.ASSISTANT_LEADER]: 3,  // 新增
  [UserRole.ASSISTANT]: 2,
  [UserRole.STUDENT]: 1,
};
```

### 3. 权限装饰器

```typescript
// 助教组长或助教角色装饰器
export const RequireAssistantLeaderOrAssistant = () =>
  Roles(UserRole.ASSISTANT_LEADER, UserRole.ASSISTANT);

// 教师组长、教师、助教组长或助教角色装饰器
export const RequireTeacherLeaderOrTeacherOrAssistantLeaderOrAssistant = () =>
  Roles(UserRole.TEACHER_LEADER, UserRole.TEACHER, UserRole.ASSISTANT_LEADER, UserRole.ASSISTANT);
```

### 4. 权限检查逻辑

```typescript
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
```

### 5. 自动关联逻辑

```typescript
// 在用户创建服务中
async create(createUserDto: CreateUserDto) {
  // ... 创建用户逻辑

  // 如果创建的是教师，自动关联所有助教组长
  if (user.role.name === '教师') {
    await this.associateTeacherWithAssistantLeaders(user.id);
  }

  return user;
}

private async associateTeacherWithAssistantLeaders(teacherId: number) {
  // 查找所有助教组长
  const assistantLeaders = await this.prisma.user.findMany({
    where: {
      role: {
        name: '助教组长',
      },
    },
  });

  // 为每个助教组长创建与教师的关联关系
  const relations = assistantLeaders.map((assistantLeader) => ({
    teacherId,
    assistantId: assistantLeader.id,
  }));

  if (relations.length > 0) {
    await this.prisma.teacherAssistant.createMany({
      data: relations,
      skipDuplicates: true, // 跳过已存在的关联
    });
  }
}
```

## 数据库初始化

### 角色创建
```typescript
{
  name: '助教组长',
  description: '助教组长角色，拥有助教所有权限，默认关联所有教师',
  isSystem: true,
  isActive: true,
}
```

### 权限分配
助教组长角色拥有与助教角色相同的23个权限：
- 用户管理权限：2个
- 文章管理权限：3个（无创建、发布、删除权限）
- 媒体管理权限：2个（无上传、删除权限）
- 评论管理权限：5个
- 收藏管理权限：4个
- 笔记管理权限：5个

## 使用示例

### 1. 创建助教组长用户
```typescript
const createUserDto = {
  email: 'assistant-leader@example.com',
  name: '李助教组长',
  password: 'password123',
  roleId: 4 // 助教组长角色ID
};
```

### 2. 权限检查
```typescript
// 检查用户是否为助教组长
if (user.role === 'ASSISTANT_LEADER') {
  // 允许访问所有教师的资源
  return this.articlesService.findAll();
} else if (user.role === 'ASSISTANT') {
  // 只允许访问关联教师的资源
  return this.articlesService.findByAuthor(user.userId);
}
```

### 3. 跨用户资源访问
```typescript
// 助教组长可以访问所有教师的文章
@Get('all-teachers-articles')
@RequireAssistantLeader()
async getAllTeachersArticles() {
  return this.articlesService.findAll();
}

// 普通助教只能访问关联教师的文章
@Get('my-teacher-articles')
@RequireAssistant()
async getMyTeacherArticles(@CurrentUser() user: AuthenticatedUser) {
  return this.articlesService.findByAuthor(user.userId);
}

// 助教和助教组长都可以修改文章
@Patch(':id')
@RequireAssistantLeaderOrAssistant()
async updateArticle(@Param('id') id: string, @Body() updateDto: UpdateArticleDto) {
  return this.articlesService.update(+id, updateDto);
}
```

## 安全考虑

### 1. 权限验证
- 所有需要权限的接口都会验证用户角色
- 助教组长权限检查在守卫层面进行
- 支持细粒度的权限控制

### 2. 数据隔离
- 普通助教只能操作关联教师的数据
- 助教组长可以操作所有教师的数据
- 教师组长可以操作所有教师的案例和资源
- 管理员拥有完全的管理权限

### 3. 审计日志
- 建议记录助教组长的跨用户操作
- 便于追踪和审计敏感操作

## API 接口

### 角色管理
```
GET    /roles                    # 获取所有角色（包含助教组长）
POST   /roles/init               # 创建默认角色（包含助教组长）
```

### 权限检查
```
GET    /roles/:id/permissions    # 获取角色权限列表
POST   /roles/:id/permissions    # 为角色分配权限
```

### 教师-助教关联
```
GET    /roles/teacher-assistant  # 获取所有关联关系
POST   /roles/teacher-assistant  # 创建关联关系
DELETE /roles/teacher-assistant/:id # 删除关联关系
```

## 部署说明

### 1. 数据库迁移
运行角色权限初始化接口：
```bash
POST /roles/permissions/init  # 创建默认权限
POST /roles/init              # 创建默认角色（包含助教组长）
```

### 2. 用户角色分配
为现有用户分配助教组长角色：
```bash
PATCH /users/:id
{
  "roleId": 4  // 助教组长角色ID
}
```

### 3. 权限验证
确保所有相关接口都已更新权限装饰器，支持助教组长角色。

### 4. 自动关联
系统会自动处理：
- 新增教师时自动关联所有助教组长
- 助教组长可以访问所有教师的资源
- 普通助教需要手动关联教师

## 更新日志

### v1.2.0 (2024-01-20)
- ✅ 新增助教组长角色
- ✅ 实现默认关联所有教师功能
- ✅ 实现新增教师时自动关联助教组长
- ✅ 更新权限矩阵和装饰器
- ✅ 完善相关文档说明
- ✅ 更新角色权限种子数据
