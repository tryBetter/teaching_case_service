# 文章查询接口增强 - 功能总结

## 📝 修改概述

为 `/articles/all` 接口添加了**分页、搜索、筛选和排序**功能，使其成为一个功能完整的高级查询接口。

---

## ✅ 已实现的功能

### 1. 分页功能
- **参数：** `page`（页码）、`limit`（每页数量）
- **默认值：** page=1, limit=10
- **限制：** 每页最大100条
- **响应：** 包含总数、当前页、总页数等分页信息

### 2. 模糊关键词搜索
- **参数：** `search`
- **搜索范围：** 文章标题、内容、摘要
- **匹配方式：** 模糊匹配（包含关键词即匹配）

### 3. 用户筛选
- **参数：** `authorId`
- **功能：** 筛选指定作者的所有文章

### 4. 分类筛选
- **参数：** `categoryId`
- **功能：** 筛选指定分类的文章

### 5. 发布状态筛选
- **参数：** `published`
- **值：** `true`（已发布）、`false`（草稿）、不传（所有）

### 6. 推荐状态筛选
- **参数：** `featured`
- **值：** `true`（推荐文章）、`false`（普通文章）、不传（所有）

### 7. 时间排序
- **参数：** `orderBy`
- **可选值：**
  - `createdAt_desc` - 按创建时间倒序（默认）
  - `createdAt_asc` - 按创建时间正序
  - `updatedAt_desc` - 按更新时间倒序
  - `updatedAt_asc` - 按更新时间正序

---

## 📂 修改的文件

### 1. `src/articles/articles.controller.ts`
- 更新了 `GET /articles/all` 接口
- 添加了所有查询参数的 API 文档
- 添加了详细的参数说明和示例
- 添加了返回格式的 Schema 定义

### 2. `src/articles/articles.service.ts`
- 新增 `findAllWithPagination()` 方法
- 实现了分页逻辑
- 实现了关键词搜索（OR 查询）
- 实现了多条件筛选
- 实现了动态排序

### 3. 新增文档
- `ARTICLE_QUERY_API_GUIDE.md` - 完整的使用指南

---

## 🔌 接口详情

### 请求示例

```http
GET /articles/all?search=发动机&categoryId=1&published=true&orderBy=createdAt_desc&page=1&limit=20
```

### 响应格式

```json
{
  "data": [
    {
      "id": 1,
      "title": "文章标题",
      "content": "...",
      "summary": "...",
      "cover": "...",
      "keywords": ["关键词1", "关键词2"],
      "featured": true,
      "published": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-02T00:00:00.000Z",
      "category": {
        "id": 1,
        "name": "科研案例"
      },
      "author": {
        "id": 1,
        "name": "张教授",
        "email": "zhang@example.com"
      },
      "filterConditions": [...]
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

---

## 🚀 使用场景

### 1. 首页文章列表
```javascript
// 获取最新发布的文章，按创建时间倒序
fetch('/articles/all?published=true&orderBy=createdAt_desc&page=1&limit=10')
```

### 2. 文章搜索
```javascript
// 搜索包含"发动机"关键词的文章
fetch('/articles/all?search=发动机&published=true')
```

### 3. 分类浏览
```javascript
// 浏览"科研案例"分类的文章
fetch('/articles/all?categoryId=1&published=true&page=1&limit=20')
```

### 4. 作者文章列表
```javascript
// 获取特定作者的所有文章
fetch('/articles/all?authorId=1&published=true&orderBy=updatedAt_desc')
```

### 5. 推荐文章
```javascript
// 获取首页推荐文章
fetch('/articles/all?featured=true&published=true&limit=5')
```

### 6. 高级组合查询
```javascript
// 搜索 + 分类 + 推荐 + 排序
fetch('/articles/all?search=燃烧&categoryId=1&featured=true&published=true&orderBy=updatedAt_desc&page=1&limit=15')
```

---

## 🔍 查询逻辑说明

### 搜索机制
```typescript
// 关键词搜索（OR 逻辑）
where.OR = [
  { title: { contains: search } },      // 标题包含关键词
  { content: { contains: search } },    // 内容包含关键词
  { summary: { contains: search } },    // 摘要包含关键词
]
```

### 分页计算
```typescript
skip = (page - 1) * limit  // 跳过的记录数
totalPages = Math.ceil(total / limit)  // 总页数
```

### 排序规则
```typescript
// 解析 orderBy 参数
const [field, direction] = orderBy.split('_')  // 例如: 'createdAt_desc'
orderByClause = { [field]: direction }  // { createdAt: 'desc' }
```

---

## 📊 性能优化建议

### 1. 数据库索引
建议为以下字段添加索引以提高查询性能：

```sql
-- 创建索引
CREATE INDEX idx_article_author ON "Article"("authorId");
CREATE INDEX idx_article_category ON "Article"("categoryId");
CREATE INDEX idx_article_published ON "Article"("published");
CREATE INDEX idx_article_featured ON "Article"("featured");
CREATE INDEX idx_article_deleted ON "Article"("deletedAt");
CREATE INDEX idx_article_created ON "Article"("createdAt" DESC);
CREATE INDEX idx_article_updated ON "Article"("updatedAt" DESC);

-- 全文搜索索引（PostgreSQL）
CREATE INDEX idx_article_title_search ON "Article" USING gin(to_tsvector('simple', title));
CREATE INDEX idx_article_content_search ON "Article" USING gin(to_tsvector('simple', content));
```

### 2. 缓存策略
对于热门查询，建议使用 Redis 缓存：

```typescript
// 首页文章列表 - 缓存5分钟
const cacheKey = `articles:page:${page}:limit:${limit}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const result = await prisma.article.findMany(...);
await redis.setex(cacheKey, 300, JSON.stringify(result));
```

### 3. 查询优化
- 限制每页最大数量为100
- 搜索时建议结合其他筛选条件
- 避免深度分页（page > 100）

---

## 🔐 安全性考虑

1. **SQL 注入防护**
   - 使用 Prisma ORM，自动防止 SQL 注入
   - 所有参数都经过类型转换和验证

2. **参数验证**
   - page 和 limit 必须是正整数
   - limit 最大值限制为 100
   - 布尔参数只接受 'true' 或 'false'

3. **权限控制**
   - 接口为公开接口（@Public() 装饰器）
   - 只返回未删除的文章（deletedAt: null）
   - 可根据需要添加更严格的权限控制

---

## 🧪 测试建议

### 单元测试
```typescript
describe('ArticlesService.findAllWithPagination', () => {
  it('应该返回分页数据', async () => {
    const result = await service.findAllWithPagination({
      page: 1,
      limit: 10
    });
    
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('page', 1);
    expect(result).toHaveProperty('limit', 10);
    expect(result).toHaveProperty('totalPages');
  });

  it('应该按关键词搜索', async () => {
    const result = await service.findAllWithPagination({
      page: 1,
      limit: 10,
      search: '发动机'
    });
    
    result.data.forEach(article => {
      expect(
        article.title.includes('发动机') ||
        article.content.includes('发动机') ||
        article.summary.includes('发动机')
      ).toBe(true);
    });
  });
});
```

### 集成测试
```bash
# 测试基础分页
curl "http://localhost:3000/articles/all?page=1&limit=10"

# 测试搜索
curl "http://localhost:3000/articles/all?search=发动机"

# 测试筛选
curl "http://localhost:3000/articles/all?authorId=1&categoryId=1&published=true"

# 测试排序
curl "http://localhost:3000/articles/all?orderBy=updatedAt_desc"

# 测试组合查询
curl "http://localhost:3000/articles/all?search=燃烧&categoryId=1&published=true&orderBy=createdAt_desc&page=2&limit=20"
```

---

## 📈 后续扩展建议

### 1. 高级搜索
- 支持多字段精确匹配
- 支持日期范围筛选
- 支持按关键词数组筛选

### 2. 聚合查询
- 按分类统计文章数量
- 按作者统计文章数量
- 热门标签统计

### 3. 性能优化
- 游标分页（替代 offset 分页）
- 搜索结果缓存
- 全文搜索引擎（Elasticsearch）

### 4. 功能增强
- 相关文章推荐
- 阅读历史记录
- 个性化推荐

---

## 📝 更新日志

### v1.0 - 2025-10-13
- ✅ 新增分页功能
- ✅ 新增关键词搜索
- ✅ 新增作者筛选
- ✅ 新增分类筛选
- ✅ 新增发布状态筛选
- ✅ 新增推荐状态筛选
- ✅ 新增时间排序
- ✅ 完善 API 文档
- ✅ 添加使用指南

---

## 🔗 相关文档

- [完整使用指南](./ARTICLE_QUERY_API_GUIDE.md)
- [Swagger API 文档](http://localhost:3000/api)

---

*文章查询接口增强总结 - v1.0*

