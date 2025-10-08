# 软删除功能问题排查指南

## 问题：后台管理界面看不到已删除的文章

### 快速解决方案

有 **3 种方式** 可以查看已删除的文章：

#### 方式 1：使用专用回收站 API（推荐）

这是最简单直接的方式：

```bash
GET /api/admin/articles/deleted/list?page=1&limit=10
```

此端点**只返回已删除的文章**，不需要任何额外参数。

#### 方式 2：在主列表中包含已删除文章

在主列表 API 中添加 `includeDeleted=true` 参数：

```bash
# 注意：includeDeleted=true 是必须的！
GET /api/admin/articles?page=1&limit=10&includeDeleted=true
```

**重要**：必须传递 `includeDeleted=true`，否则默认不返回已删除文章。

#### 方式 3：前端实现状态筛选

前端添加一个状态筛选器，根据选择动态调整 API 参数：

```javascript
// 状态选项：all（全部）、normal（正常）、deleted（已删除）
const statusFilter = 'all'; // 或 'normal' 或 'deleted'

const params = {
  page: 1,
  limit: 10,
  includeDeleted: statusFilter !== 'normal' // 当不是"仅正常"时，包含已删除
};

// 调用 API
const response = await axios.get('/api/admin/articles', { params });

// 如果只想看已删除的，需要前端过滤
let articles = response.data.data;
if (statusFilter === 'deleted') {
  articles = articles.filter(a => a.deletedAt !== null);
}
```

## 常见问题排查

### 问题 1：调用 API 但看不到已删除文章

**原因**：没有传递 `includeDeleted=true` 参数

**解决**：
```bash
# ❌ 错误 - 不会返回已删除文章
GET /api/admin/articles?page=1&limit=10

# ✅ 正确 - 会返回包括已删除在内的所有文章
GET /api/admin/articles?page=1&limit=10&includeDeleted=true
```

### 问题 2：返回数据中没有 deletedAt 字段

**检查方法**：

1. 确认数据库中 Article 表是否有 `deletedAt` 字段：

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Article' AND column_name = 'deletedAt';
```

2. 如果没有，运行迁移：

```bash
npx prisma migrate deploy
```

### 问题 3：前端显示问题

即使 API 返回了 `deletedAt` 字段，前端也需要正确处理：

```javascript
// 检查文章是否已删除
function isDeleted(article) {
  return article.deletedAt !== null && article.deletedAt !== undefined;
}

// 渲染状态标签
function renderStatus(article) {
  if (isDeleted(article)) {
    return <Tag color="red">已删除</Tag>;
  }
  // ... 其他状态
}
```

## 完整测试流程

### 步骤 1：软删除一篇文章

```bash
DELETE /api/admin/articles/1
Authorization: Bearer YOUR_TOKEN
```

预期响应：
```json
{
  "id": 1,
  "title": "文章标题",
  "message": "文章已软删除成功"
}
```

### 步骤 2：验证文章已被标记为删除

```bash
# 查询该文章详情
GET /api/admin/articles/1
```

响应中应包含：
```json
{
  "id": 1,
  "deletedAt": "2025-10-08T15:30:00.000Z",  // ← 不为 null，说明已删除
  // ... 其他字段
}
```

### 步骤 3：在主列表中不应该看到（默认行为）

```bash
GET /api/admin/articles?page=1&limit=10
```

此时返回的列表中不应包含 ID 为 1 的文章。

### 步骤 4：在包含已删除的列表中应该看到

```bash
GET /api/admin/articles?page=1&limit=10&includeDeleted=true
```

此时返回的列表中应该包含 ID 为 1 的文章，且 `deletedAt` 不为 null。

### 步骤 5：在回收站中应该看到

```bash
GET /api/admin/articles/deleted/list?page=1&limit=10
```

此时返回的列表中应该只包含已删除的文章（包括 ID 为 1）。

### 步骤 6：恢复文章

```bash
POST /api/admin/articles/1/restore
```

预期响应：
```json
{
  "id": 1,
  "title": "文章标题",
  "message": "文章恢复成功"
}
```

### 步骤 7：验证恢复成功

```bash
GET /api/admin/articles?page=1&limit=10
```

此时 ID 为 1 的文章应该重新出现在列表中，且 `deletedAt` 为 null。

## 使用 curl 命令测试

### 测试 1：查看所有文章（包括已删除）

```bash
curl -X GET "http://localhost:3000/api/admin/articles?page=1&limit=10&includeDeleted=true" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### 测试 2：查看回收站

```bash
curl -X GET "http://localhost:3000/api/admin/articles/deleted/list?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### 测试 3：软删除文章

```bash
curl -X DELETE "http://localhost:3000/api/admin/articles/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### 测试 4：恢复文章

```bash
curl -X POST "http://localhost:3000/api/admin/articles/1/restore" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

## 前端实现检查清单

- [ ] API 调用时是否传递了 `includeDeleted=true` 参数？
- [ ] 返回的数据中是否包含 `deletedAt` 字段？
- [ ] 前端是否正确判断 `deletedAt !== null` 来识别已删除文章？
- [ ] 是否根据 `deletedAt` 状态显示不同的操作按钮（恢复 vs 编辑）？
- [ ] 状态筛选器是否正确工作？

## 最简单的实现方式（推荐）

### 后端已完成 ✅

后端功能已经完整实现，所有 API 都可用。

### 前端实现（3 步搞定）

#### 第 1 步：添加状态筛选器

```jsx
const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'normal' | 'deleted'

<Radio.Group value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
  <Radio.Button value="all">全部</Radio.Button>
  <Radio.Button value="normal">正常</Radio.Button>
  <Radio.Button value="deleted">已删除</Radio.Button>
</Radio.Group>
```

#### 第 2 步：根据状态调用不同 API

```javascript
async function loadArticles() {
  let response;
  
  if (statusFilter === 'deleted') {
    // 只看已删除 - 使用专用回收站 API
    response = await axios.get('/api/admin/articles/deleted/list', {
      params: { page, limit }
    });
  } else {
    // 全部或正常 - 使用主列表 API
    response = await axios.get('/api/admin/articles', {
      params: {
        page,
        limit,
        includeDeleted: statusFilter === 'all' // 关键：传递此参数
      }
    });
  }
  
  setArticles(response.data.data);
}
```

#### 第 3 步：根据 deletedAt 显示不同操作

```javascript
{article.deletedAt ? (
  // 已删除 - 显示恢复和永久删除按钮
  <>
    <Button onClick={() => restore(article.id)}>恢复</Button>
    <Button danger onClick={() => permanentDelete(article.id)}>永久删除</Button>
  </>
) : (
  // 正常 - 显示编辑和删除按钮
  <>
    <Button onClick={() => edit(article.id)}>编辑</Button>
    <Button danger onClick={() => softDelete(article.id)}>删除</Button>
  </>
)}
```

## API 端点总结

| 端点                                | 方法   | 用途         | 是否显示已删除                        |
| ----------------------------------- | ------ | ------------ | ------------------------------------- |
| `/api/admin/articles`               | GET    | 获取文章列表 | 默认否，传 `includeDeleted=true` 可以 |
| `/api/admin/articles/deleted/list`  | GET    | 专用回收站   | 仅显示已删除 ✅                        |
| `/api/admin/articles/:id`           | DELETE | 软删除文章   | -                                     |
| `/api/admin/articles/:id/restore`   | POST   | 恢复文章     | -                                     |
| `/api/admin/articles/:id/permanent` | DELETE | 永久删除     | -                                     |

## 还是看不到？终极检查

如果以上方法都试过了还是看不到，请检查：

1. **数据库中是否真的有已删除的文章**

```sql
SELECT id, title, "deletedAt" 
FROM "Article" 
WHERE "deletedAt" IS NOT NULL 
LIMIT 10;
```

如果查询结果为空，说明数据库中确实没有已删除的文章。

2. **先手动删除一篇文章进行测试**

```bash
# 软删除文章 ID 1
curl -X DELETE "http://localhost:3000/api/admin/articles/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

3. **然后查询回收站**

```bash
curl -X GET "http://localhost:3000/api/admin/articles/deleted/list" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

4. **检查返回数据格式**

返回数据应该是这样的：

```json
{
  "data": [
    {
      "id": 1,
      "title": "已删除的文章",
      "deletedAt": "2025-10-08T15:30:00.000Z",  // ← 关键：不为 null
      "author": { ... },
      "category": { ... }
    }
  ],
  "pagination": { ... }
}
```

## 联系支持

如果按照以上步骤操作后仍然无法解决，请提供：

1. 使用的 API 端点完整 URL
2. 请求参数（特别是是否包含 `includeDeleted`）
3. API 返回的完整响应数据
4. 数据库中的 SQL 查询结果

---

**创建日期**：2025年10月8日  
**相关文档**：
- [软删除技术文档](./ARTICLE_SOFT_DELETE_README.md)
- [前端集成指南](./ARTICLE_MANAGEMENT_UI_GUIDE.md)
