# API 接口合并计划

## 🎯 目标

将后台管理接口（`/admin/*`）与普通接口合并，实现一套接口适配所有角色，通过权限控制区分功能。

## 📊 模块分析

### 现有模块对比

| 普通接口             | 后台管理接口               | 是否需要合并 |
| -------------------- | -------------------------- | ------------ |
| `/users`             | `/admin/users`             | ✅ 是         |
| `/articles`          | `/admin/articles`          | ✅ 是         |
| `/media`             | `/admin/media`             | ✅ 是         |
| `/categories`        | `/admin/categories`        | ✅ 是         |
| `/comment`           | `/admin/comments`          | ✅ 是         |
| `/favorite`          | `/admin/favorites`         | ✅ 是         |
| `/note`              | `/admin/notes`             | ✅ 是         |
| `/hot-search`        | `/admin/hot-search`        | ✅ 是         |
| `/filter-conditions` | `/admin/filter-conditions` | ✅ 是         |
| -                    | `/admin/roles`             | ❌ 管理员专属 |
| -                    | `/admin/stats`             | ❌ 管理员专属 |
| -                    | `/admin/auth`              | ❌ 管理员专属 |

## 🔄 合并策略

### 基本原则

1. **保留普通接口路径**：`/users`、`/articles` 等
2. **移除 `/admin` 前缀**：避免路径重复
3. **使用权限装饰器**：通过 `@RequirePermissions` 或 `@RequireSuperAdmin` 控制访问
4. **向后兼容**：确保现有客户端不受影响

### 权限分级

```typescript
// 普通用户：查看自己的数据
@Public() 或 @RequirePermissions([Permission.XXX_READ])

// 教师/组长：管理自己的资源
@RequireTeacher() 或 @RequirePermissions([Permission.XXX_MANAGE])

// 超级管理员：管理所有资源
@RequireSuperAdmin()
```

## 📋 详细合并计划

### 1. 用户管理 `/users`

#### 现有接口

**普通接口 (`/users`)**：
- ✅ `GET /users` - 获取用户列表（支持分页、搜索）
- ✅ `GET /users/:id` - 获取用户详情
- ✅ `POST /users` - 创建用户
- ✅ `PATCH /users/:id` - 更新用户
- ✅ `DELETE /users/:id` - 删除用户
- ✅ `PATCH /users/:id/disable` - 禁用用户
- ✅ `PATCH /users/:id/enable` - 启用用户
- ✅ `POST /users/batch` - 批量创建
- ✅ `GET /users/template/download` - 下载模板

**后台接口 (`/admin/users`)**：
- ✅ `GET /admin/users` - 获取用户列表（支持分页、搜索）
- ✅ `GET /admin/users/roles` - 获取角色选项 ⭐ 新增
- ✅ `GET /admin/users/:id` - 获取用户详情
- ✅ `POST /admin/users` - 创建用户
- ✅ `PATCH /admin/users/:id` - 更新用户
- ✅ `DELETE /admin/users/:id` - 删除用户
- ✅ `PATCH /admin/users/:id/disable` - 禁用用户
- ✅ `PATCH /admin/users/:id/enable` - 启用用户
- ✅ `POST /admin/users/batch` - 批量创建
- ✅ `GET /admin/users/template/download` - 下载模板
- ✅ `GET /admin/users/stats/overview` - 统计概览 ⭐ 新增

#### 合并方案

**结论**：两个接口**已基本统一**！

**需要做的**：
1. 将 `/admin/users/roles` 迁移到 `/users/roles`
2. 将 `/admin/users/stats/overview` 迁移到 `/users/stats`
3. 保留 `/admin/users` 作为别名（可选）

### 2. 文章管理 `/articles`

#### 现有接口

**普通接口 (`/articles`)**：
- ✅ `GET /articles` - 获取文章列表（已发布）
- ✅ `GET /articles/:id` - 获取文章详情
- ✅ `POST /articles` - 创建文章
- ✅ `PATCH /articles/:id` - 更新文章
- ✅ `DELETE /articles/:id` - 删除文章（软删除）
- ⚠️ 缺少恢复、永久删除功能
- ⚠️ 缺少管理员查看所有文章功能

**后台接口 (`/admin/articles`)**：
- ✅ `GET /admin/articles` - 获取所有文章（含删除）
- ✅ `GET /admin/articles/deleted/list` - 获取已删除文章
- ✅ `GET /admin/articles/:id` - 获取文章详情
- ✅ `POST /admin/articles` - 创建文章
- ✅ `PATCH /admin/articles/:id` - 更新文章
- ✅ `DELETE /admin/articles/:id` - 软删除
- ✅ `POST /admin/articles/:id/restore` - 恢复文章
- ✅ `DELETE /admin/articles/:id/permanent` - 永久删除
- ✅ `POST /admin/articles/:id/publish` - 发布
- ✅ `POST /admin/articles/:id/unpublish` - 取消发布
- ✅ `POST /admin/articles/:id/feature` - 设为精选
- ✅ `POST /admin/articles/:id/unfeature` - 取消精选
- ✅ `GET /admin/articles/stats/overview` - 统计概览

#### 合并方案

**需要做的**：
1. 在 `/articles` 中添加 `includeDeleted` 查询参数（管理员可见）
2. 添加恢复、永久删除、发布控制接口
3. 添加统计接口

### 3. 媒体管理 `/media`

#### 现有接口

**普通接口 (`/media`)**：
- ✅ `POST /media` - 创建媒体记录
- ✅ `POST /media/upload` - 上传文件
- ✅ `GET /media` - 获取媒体列表（按用户过滤）
- ✅ `GET /media/:id` - 获取媒体详情
- ✅ `DELETE /media/:id` - 删除媒体

**后台接口 (`/admin/media`)**：
- ✅ `GET /admin/media` - 获取所有媒体（支持高级搜索）
- ✅ `GET /admin/media/:id` - 获取媒体详情 ⭐ 已添加
- ✅ `DELETE /admin/media/:id` - 删除媒体
- ✅ `DELETE /admin/media/batch` - 批量删除
- ✅ `GET /admin/media/stats/overview` - 统计概览
- ✅ `GET /admin/media/stats/distribution` - 类型分布
- ✅ `GET /admin/media/recent` - 最近上传

#### 合并方案

**需要做的**：
1. 在 `/media` 中添加高级搜索功能（管理员可用）
2. 添加批量删除接口
3. 添加统计接口

## 🚀 实施步骤

### 阶段1：用户管理合并 ✅

**状态**：已基本完成

**待完成**：
- [ ] 迁移 `/admin/users/roles` → `/users/roles`
- [ ] 迁移 `/admin/users/stats/overview` → `/users/stats`

### 阶段2：文章管理合并

**核心任务**：
1. 添加 `GET /articles?includeDeleted=true` （管理员专用）
2. 添加 `POST /articles/:id/restore`
3. 添加 `DELETE /articles/:id/permanent`
4. 添加发布控制接口
5. 添加统计接口

### 阶段3：媒体管理合并

**核心任务**：
1. 增强 `GET /media` 支持高级搜索
2. 添加 `DELETE /media/batch`
3. 添加统计接口

### 阶段4：其他模块合并

- 分类管理
- 评论管理
- 收藏管理
- 笔记管理
- 热搜管理
- 筛选条件管理

### 阶段5：清理与测试

1. 更新前端调用
2. 兼容性测试
3. 文档更新
4. 可选：保留 `/admin/*` 作为别名

## 🔑 技术实现

### 权限装饰器组合

```typescript
// 普通用户可以查看自己的数据
@Get()
findAll(@Query() query, @CurrentUser() user) {
  // 非管理员只能查看自己的数据
  if (!isSuperAdmin(user)) {
    query.userId = user.id;
  }
  return this.service.findAll(query);
}

// 管理员可以查看所有数据
@Get('all')
@RequireSuperAdmin()
findAllForAdmin(@Query() query) {
  return this.service.findAll(query);
}
```

### Service 层复用

```typescript
// Service 层统一处理
async findAll(options: {
  userId?: number;
  includeDeleted?: boolean;
  ...
}) {
  const where = {};
  
  // 如果指定用户，只查该用户的数据
  if (options.userId) {
    where.authorId = options.userId;
  }
  
  // 管理员可以查看已删除的
  if (!options.includeDeleted) {
    where.deletedAt = null;
  }
  
  return this.prisma.xxx.findMany({ where });
}
```

## ⚠️ 风险与考虑

### 1. 向后兼容

**问题**：现有客户端可能使用 `/admin/*` 路径

**解决方案**：
- 方案A：保留 `/admin/*` 作为别名（重定向或双路由）
- 方案B：使用 API 版本控制
- **推荐**：方案A，保持兼容

### 2. 权限粒度

**问题**：不同角色需要不同的数据访问范围

**解决方案**：
- Service 层根据用户角色动态调整查询条件
- Controller 层使用权限装饰器控制端点访问

### 3. 前端调整

**问题**：后台管理界面使用 `/admin/*` 路径

**解决方案**：
- 保留 `/admin/*` 路径，或
- 更新前端 JavaScript 中的 API 路径

### 4. 测试覆盖

**必须测试**：
- 各角色的权限正确性
- 数据隔离正确性
- 向后兼容性

## 📊 预期收益

### 代码维护

- ✅ 减少重复代码
- ✅ 统一业务逻辑
- ✅ 更容易维护

### API 设计

- ✅ RESTful 规范
- ✅ 路径更清晰
- ✅ 更易理解

### 开发体验

- ✅ 只需维护一套接口
- ✅ 权限逻辑集中
- ✅ 更容易扩展

## 🎬 执行建议

### 优先级

1. **P0 - 用户管理**：已基本完成，只需小调整
2. **P1 - 文章管理**：核心功能，使用频繁
3. **P1 - 媒体管理**：核心功能，使用频繁
4. **P2 - 其他模块**：按需合并

### 实施方式

**建议**：逐个模块渐进式合并

1. 保留原接口
2. 增强普通接口功能
3. 测试验证
4. （可选）废弃 admin 接口

**不建议**：一次性全部重构

## 📝 待办清单

- [x] 分析模块差异
- [ ] 用户管理：迁移角色和统计接口
- [ ] 文章管理：添加管理员功能
- [ ] 媒体管理：添加高级搜索和统计
- [ ] 分类管理：合并接口
- [ ] 评论管理：合并接口
- [ ] 其他模块：按需合并
- [ ] 前端适配
- [ ] 测试验证
- [ ] 文档更新

---

**创建日期**：2025年10月10日  
**状态**：规划中  
**执行方式**：渐进式逐模块合并

