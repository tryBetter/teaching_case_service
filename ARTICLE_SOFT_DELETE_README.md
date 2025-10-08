# 文章软删除功能实现文档

## 概述

本文档描述了文章管理模块的软删除（Soft Delete）功能实现。软删除是一种安全的删除策略，删除的数据不会立即从数据库中移除，而是通过标记字段来标识为"已删除"状态，便于后续恢复或审计。

## 问题背景

在原始实现中，删除文章时遇到外键约束错误：

```
Foreign key constraint violated on the (not available)
Error Code: P2003
```

这是因为文章与评论（Comment）、收藏（Favorite）、笔记（Note）等表存在外键关联关系，直接删除会违反数据库完整性约束。

## 解决方案

采用**软删除**方案，具有以下优势：

1. **数据安全**：删除的数据可以恢复
2. **审计追踪**：保留删除历史记录
3. **关联保护**：避免破坏数据关联关系
4. **用户友好**：支持误删恢复

## 技术实现

### 1. 数据库 Schema 修改

#### 为 Article 模型添加 deletedAt 字段

```prisma
model Article {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  cover     String?
  summary   String?
  keywords  String[]
  featured  Boolean  @default(false)
  published Boolean  @default(false)
  deletedAt DateTime? // 软删除时间戳，null表示未删除
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // ... 其他字段和关联
}
```

#### 数据库迁移

迁移文件：`20251008155009_add_soft_delete_to_article`

- 添加 `deletedAt` 列（可为空）
- 保持外键约束为 `ON DELETE RESTRICT`（防止意外的真删除）

### 2. Service 层实现

#### ArticlesService (src/articles/articles.service.ts)

**软删除方法**

```typescript
remove(id: number) {
  return this.prisma.article.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
```

**恢复方法**

```typescript
restore(id: number) {
  return this.prisma.article.update({
    where: { id },
    data: { deletedAt: null },
  });
}
```

**永久删除方法**（仅在必要时使用）

```typescript
permanentlyDelete(id: number) {
  return this.prisma.article.delete({ where: { id } });
}
```

**查询方法修改**

所有查询方法都添加了 `deletedAt: null` 过滤条件，默认只返回未删除的文章：

```typescript
findAll() {
  return this.prisma.article.findMany({
    where: { deletedAt: null },
    // ...
  });
}

findMany(...) {
  const where: Prisma.ArticleWhereInput = {
    deletedAt: null,
    // ... 其他条件
  };
  // ...
}
```

#### AdminArticlesService (src/admin/articles/admin-articles.service.ts)

**软删除**

```typescript
async remove(id: number) {
  const article = await this.prisma.article.findUnique({ where: { id } });
  
  if (!article) {
    throw new Error('文章不存在');
  }
  
  if (article.deletedAt) {
    throw new Error('文章已被删除');
  }
  
  await this.articlesService.remove(id);
  
  return {
    id: article.id,
    title: article.title,
    message: '文章已软删除成功',
  };
}
```

**恢复已删除文章**

```typescript
async restore(id: number) {
  const article = await this.prisma.article.findUnique({ where: { id } });
  
  if (!article) {
    throw new Error('文章不存在');
  }
  
  if (!article.deletedAt) {
    throw new Error('文章未被删除，无需恢复');
  }
  
  await this.articlesService.restore(id);
  
  return {
    id: article.id,
    title: article.title,
    message: '文章恢复成功',
  };
}
```

**永久删除**

```typescript
async permanentlyDelete(id: number) {
  const article = await this.prisma.article.findUnique({
    where: { id },
    include: {
      comments: true,
      favorites: true,
      notes: true,
    },
  });
  
  if (!article) {
    throw new Error('文章不存在');
  }
  
  // 检查是否有关联数据
  const hasRelatedData = 
    article.comments.length > 0 ||
    article.favorites.length > 0 ||
    article.notes.length > 0;
  
  if (hasRelatedData) {
    throw new Error(
      '文章存在关联数据（评论、收藏或笔记），无法永久删除。请先删除相关数据或使用软删除。'
    );
  }
  
  await this.articlesService.permanentlyDelete(id);
  
  return {
    id: article.id,
    title: article.title,
    message: '文章已永久删除',
  };
}
```

**获取已删除文章列表**

```typescript
async findDeleted(options: {
  page: number;
  limit: number;
  search?: string;
}) {
  const { page, limit, search } = options;
  const skip = (page - 1) * limit;
  
  const where: any = {
    deletedAt: { not: null }, // 只查询已删除的文章
  };
  
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { content: { contains: search } },
    ];
  }
  
  const [articles, total] = await Promise.all([
    this.prisma.article.findMany({
      where,
      skip,
      take: limit,
      orderBy: { deletedAt: 'desc' },
      include: {
        author: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true } },
      },
    }),
    this.prisma.article.count({ where }),
  ]);
  
  return {
    data: articles,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

**统计数据修改**

所有统计查询都添加了 `deletedAt: null` 条件，并新增 `deletedArticles` 统计：

```typescript
async getArticleStats() {
  const [
    totalArticles,
    publishedArticles,
    draftArticles,
    featuredArticles,
    deletedArticles, // 新增
    // ...
  ] = await Promise.all([
    this.prisma.article.count({ where: { deletedAt: null } }),
    this.prisma.article.count({ where: { published: true, deletedAt: null } }),
    this.prisma.article.count({ where: { published: false, deletedAt: null } }),
    this.prisma.article.count({ where: { featured: true, deletedAt: null } }),
    this.prisma.article.count({ where: { deletedAt: { not: null } } }), // 新增
    // ...
  ]);
  
  return {
    totalArticles,
    publishedArticles,
    draftArticles,
    featuredArticles,
    deletedArticles, // 新增
    // ...
  };
}
```

### 3. Controller 层实现

#### AdminArticlesController (src/admin/articles/admin-articles.controller.ts)

**新增 API 端点**

1. **软删除文章**
   - `DELETE /admin/articles/:id`
   - 将文章标记为已删除

2. **恢复已删除文章**
   - `POST /admin/articles/:id/restore`
   - 恢复已软删除的文章

3. **永久删除文章**
   - `DELETE /admin/articles/:id/permanent`
   - 永久删除文章（不可恢复）

4. **获取已删除文章列表**
   - `GET /admin/articles/deleted/list`
   - 分页查询已删除的文章

## API 使用示例

### 1. 软删除文章

```bash
DELETE /api/admin/articles/1
Authorization: Bearer {token}
```

**响应：**

```json
{
  "id": 1,
  "title": "示例文章",
  "message": "文章已软删除成功"
}
```

### 2. 恢复已删除文章

```bash
POST /api/admin/articles/1/restore
Authorization: Bearer {token}
```

**响应：**

```json
{
  "id": 1,
  "title": "示例文章",
  "message": "文章恢复成功"
}
```

### 3. 获取已删除文章列表

```bash
GET /api/admin/articles/deleted/list?page=1&limit=10
Authorization: Bearer {token}
```

**响应：**

```json
{
  "data": [
    {
      "id": 1,
      "title": "已删除的文章",
      "summary": "文章摘要",
      "deletedAt": "2025-10-08T15:30:00.000Z",
      "author": {
        "id": 1,
        "name": "作者姓名",
        "email": "author@example.com"
      },
      "category": {
        "id": 1,
        "name": "分类名称"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

### 4. 永久删除文章

```bash
DELETE /api/admin/articles/1/permanent
Authorization: Bearer {token}
```

**响应（成功）：**

```json
{
  "id": 1,
  "title": "示例文章",
  "message": "文章已永久删除"
}
```

**响应（失败 - 有关联数据）：**

```json
{
  "statusCode": 500,
  "message": "文章存在关联数据（评论、收藏或笔记），无法永久删除。请先删除相关数据或使用软删除。"
}
```

### 5. 获取文章统计（包含已删除数量）

```bash
GET /api/admin/articles/stats/overview
Authorization: Bearer {token}
```

**响应：**

```json
{
  "totalArticles": 1250,
  "publishedArticles": 980,
  "draftArticles": 270,
  "featuredArticles": 50,
  "deletedArticles": 30,
  "articlesByCategory": [...],
  "newArticlesToday": 5,
  "newArticlesThisWeek": 25,
  "newArticlesThisMonth": 80
}
```

## 数据流程

### 删除流程

```
用户请求删除 → 检查文章是否存在 → 检查是否已删除 → 设置 deletedAt 为当前时间 → 返回成功
```

### 恢复流程

```
用户请求恢复 → 检查文章是否存在 → 检查是否已删除 → 设置 deletedAt 为 null → 返回成功
```

### 永久删除流程

```
用户请求永久删除 → 检查文章是否存在 → 检查关联数据 → 如有关联则拒绝 → 执行真删除 → 返回成功
```

## 注意事项

### ⚠️ 重要提示

1. **软删除是默认行为**
   - 普通的 `DELETE /admin/articles/:id` 现在执行软删除
   - 已删除的文章不会在普通查询中出现

2. **永久删除需谨慎**
   - 只有在确认文章没有关联数据时才能永久删除
   - 永久删除操作不可逆
   - 建议只有超级管理员才能执行永久删除

3. **查询行为变化**
   - 所有前端查询默认过滤掉已删除的文章
   - `findOne` 方法可以查询到已删除的文章（用于恢复功能）
   - 统计数据不包含已删除的文章

4. **关联数据处理**
   - 软删除文章时，关联的评论、收藏、笔记等数据保持不变
   - 这些关联数据不会显示在前端（因为文章已被过滤）
   - 恢复文章后，所有关联数据自动可用

## 数据库索引建议

为提高软删除查询性能，建议添加以下索引：

```sql
-- 在 deletedAt 字段上创建索引
CREATE INDEX idx_article_deleted_at ON "Article"("deletedAt");

-- 组合索引：published + deletedAt
CREATE INDEX idx_article_published_deleted ON "Article"("published", "deletedAt");
```

## 未来改进建议

1. **自动清理机制**
   - 实现定时任务，自动清理超过 X 天的已删除文章
   - 例如：90天后自动永久删除

2. **批量操作**
   - 批量软删除
   - 批量恢复
   - 批量永久删除

3. **权限细分**
   - 普通管理员：只能软删除
   - 超级管理员：可以永久删除

4. **删除原因记录**
   - 添加 `deletedReason` 字段
   - 记录删除操作的原因

5. **审计日志**
   - 记录所有删除和恢复操作
   - 包括操作人、操作时间、操作类型

## 相关文件

- `prisma/schema.prisma` - 数据库模型定义
- `prisma/migrations/20251008155009_add_soft_delete_to_article/` - 软删除迁移
- `src/articles/articles.service.ts` - 文章服务（基础逻辑）
- `src/admin/articles/admin-articles.service.ts` - 后台文章管理服务
- `src/admin/articles/admin-articles.controller.ts` - 后台文章管理控制器

## 版本历史

- **v1.0** (2025-10-08) - 初始实现软删除功能
  - 添加 deletedAt 字段
  - 实现软删除、恢复、永久删除功能
  - 修改所有查询逻辑以过滤已删除文章
  - 添加已删除文章列表查询
  - 更新统计数据包含已删除文章数量

