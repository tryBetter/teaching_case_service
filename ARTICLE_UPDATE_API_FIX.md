# 文章更新接口 Swagger 文档修复

## 🐛 问题描述

**问题：** `PATCH /articles/:id` 接口在 Swagger 文档中显示为"发布文章"，而不是"更新文章"

**原因：** 代码中有重复的 `@ApiOperation` 装饰器，第一个错误的装饰器覆盖了第二个正确的装饰器

---

## ✅ 修复内容

### 修复前的代码

```typescript
@ApiOperation({ summary: '发布文章' })  // ❌ 错误的装饰器
@ApiBody({ ... })
@ApiResponse({ ... })
@ApiOperation({ summary: '更新文章' })  // ✅ 正确的但被覆盖了
@ApiParam({ ... })
@Patch(':id')
update(...) { ... }
```

### 修复后的代码

```typescript
@ApiOperation({
  summary: '更新文章',
  description: '【教师组长、教师、助教组长、助教专用】更新文章的标题、内容、摘要、封面、关键词、分类、筛选条件等信息。支持部分更新，只需传递要修改的字段...'
})
@ApiParam({ name: 'id', description: '要更新的文章ID', example: 1 })
@ApiBody({
  type: UpdateArticleDto,
  description: '更新数据，所有字段都是可选的，只需传递要更新的字段。例如只更新标题：{"title":"新标题"}'
})
@ApiResponse({
  status: 200,
  description: '文章更新成功，返回更新后的完整文章信息'
})
@ApiResponse({ status: 404, description: '文章不存在或已被删除' })
@ApiResponse({
  status: 403,
  description: '权限不足。教师只能更新自己的文章，助教只能更新关联教师的文章。如果没有更新权限，请联系教师组长或超级管理员'
})
@ApiResponse({
  status: 400,
  description: '请求参数错误：分类ID无效、筛选条件ID不存在等'
})
@RequireTeacherLeaderOrTeacherOrAssistantLeaderOrAssistant()
@Patch(':id')
update(@Param('id') id: string, @Body() updateArticleDto: UpdateArticleDto) {
  return this.articlesService.update(+id, updateArticleDto);
}
```

---

## 📝 修复后的 Swagger 文档

### 接口信息

**方法：** `PATCH`

**路径：** `/articles/{id}`

**摘要：** 更新文章 ✅

**描述：**
> 【教师组长、教师、助教组长、助教专用】更新文章的标题、内容、摘要、封面、关键词、分类、筛选条件等信息。支持部分更新，只需传递要修改的字段。教师只能更新自己创建的文章，教师组长可以更新所有教师的文章，助教（组长）可以更新关联教师的文章。适用场景：修改文章内容、完善文章信息、修正错误、更新分类标签等。

### 请求参数

**路径参数：**
- `id` (number) - 要更新的文章ID

**请求体：** UpdateArticleDto
- 所有字段都是可选的
- 只需传递要更新的字段
- 例如只更新标题：`{"title":"新标题"}`

### 可更新的字段

| 字段                 | 类型     | 说明           |
| -------------------- | -------- | -------------- |
| `title`              | string   | 文章标题       |
| `content`            | string   | 文章内容       |
| `summary`            | string   | 文章摘要       |
| `cover`              | string   | 封面图片URL    |
| `keywords`           | string[] | 关键词数组     |
| `published`          | boolean  | 是否发布       |
| `featured`           | boolean  | 是否推荐       |
| `categoryId`         | number   | 分类ID         |
| `filterConditionIds` | number[] | 筛选条件ID数组 |

### 响应说明

**200 OK：** 文章更新成功，返回更新后的完整文章信息

**400 Bad Request：** 请求参数错误（分类ID无效、筛选条件ID不存在等）

**403 Forbidden：** 权限不足（教师只能更新自己的文章，助教只能更新关联教师的文章）

**404 Not Found：** 文章不存在或已被删除

---

## 🚀 部署更新

### 本地开发

```bash
# 重新构建（已完成）
npm run build

# 启动服务
npm run start:dev

# 访问 Swagger 文档验证
# http://localhost:3000/api
```

### 生产服务器

```bash
# 1. 提交代码
git add src/articles/articles.controller.ts
git commit -m "fix: 修复文章更新接口的Swagger文档说明"
git push origin main

# 2. 在服务器上更新
cd ~/apps/teaching-case-service
git pull origin main
npm run build
pm2 restart teaching-case-service

# 3. 验证 Swagger 文档
# 访问: http://服务器IP:8787/api
# 查看 "文章管理" → "PATCH /articles/{id}"
# 应该显示 "更新文章" 而不是 "发布文章"
```

---

## ✅ 验证步骤

### 1. 访问 Swagger 文档

```
http://localhost:3000/api
或
http://服务器IP:8787/api
```

### 2. 找到文章管理分组

展开 **"文章管理"** 标签

### 3. 查看 PATCH /articles/{id} 接口

**应该显示：**
- ✅ 摘要：**更新文章**
- ✅ 描述：详细说明了更新功能和权限
- ✅ 参数：包含 id 和 UpdateArticleDto
- ✅ 响应：包含 200/400/403/404 的详细说明

**不应该显示：**
- ❌ 摘要：发布文章
- ❌ 只有一个 id 字段的请求体

---

## 🔍 相关接口

### 文章管理的其他接口

| 接口                      | 方法      | 说明               | 权限                               |
| ------------------------- | --------- | ------------------ | ---------------------------------- |
| `/articles`               | POST      | 创建文章           | 教师组长、教师                     |
| `/articles/:id`           | **PATCH** | **更新文章**       | **教师组长、教师、助教组长、助教** |
| `/articles/:id`           | DELETE    | 删除文章（软删除） | 教师组长、教师                     |
| `/articles/:id`           | GET       | 获取文章详情       | 公开                               |
| `/articles/:id/publish`   | POST      | 发布文章           | 超级管理员                         |
| `/articles/:id/unpublish` | POST      | 取消发布           | 超级管理员                         |
| `/articles/:id/feature`   | POST      | 设置推荐           | 超级管理员                         |
| `/articles/:id/unfeature` | POST      | 取消推荐           | 超级管理员                         |

**注意区别：**
- `PATCH /articles/:id` - 更新文章内容（教师等可用）
- `POST /articles/:id/publish` - 发布文章状态（仅管理员）

---

## 💡 使用示例

### 示例 1：教师更新自己的文章

```bash
curl -X PATCH http://localhost:3000/articles/123 \
  -H "Authorization: Bearer <教师token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "更新后的标题",
    "content": "更新后的内容",
    "published": true
  }'
```

### 示例 2：只更新文章摘要

```bash
curl -X PATCH http://localhost:3000/articles/123 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "summary": "这是更新后的摘要"
  }'
```

### 示例 3：更新分类和关键词

```bash
curl -X PATCH http://localhost:3000/articles/123 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": 2,
    "keywords": ["新关键词1", "新关键词2"]
  }'
```

### 示例 4：助教更新关联教师的文章

```bash
curl -X PATCH http://localhost:3000/articles/123 \
  -H "Authorization: Bearer <助教token>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "助教协助完善的内容..."
  }'
```

---

## 📚 Swagger 中的测试步骤

1. 访问 Swagger 文档：`http://服务器IP:8787/api`

2. 点击右上角 **"Authorize"** 按钮

3. 输入 JWT Token：`Bearer <your-token>`

4. 展开 **"文章管理"** → **"PATCH /articles/{id}"**

5. 点击 **"Try it out"**

6. 填写参数：
   - **id**: 文章ID（如 `1`）
   - **Request body**: 
     ```json
     {
       "title": "测试更新标题",
       "content": "测试更新内容"
     }
     ```

7. 点击 **"Execute"** 执行

8. 查看响应结果

---

## 📝 更新日志

### v1.1 - 2025-10-14
- ✅ 修复 Swagger 文档显示错误的问题
- ✅ 移除重复的"发布文章" API 装饰器
- ✅ 保留正确的"更新文章" API 装饰器
- ✅ 添加详细的接口描述和使用说明
- ✅ 完善请求体和响应说明

### v1.0 - 原始版本
- Swagger 文档显示为"发布文章"
- 描述不准确

---

*文章更新接口 Swagger 文档修复 - v1.1*

