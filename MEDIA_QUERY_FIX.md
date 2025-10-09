# 媒体查询逻辑修复

## 🔴 问题描述

通过 `POST /media` 接口创建媒体记录成功，但使用 `GET /media?userId=19` 查询时没有数据返回。

## 🔍 问题分析

### 原查询逻辑

```typescript
// 只查询与用户文章关联的媒体
const where = userId
  ? {
      articles: {
        some: {
          article: {
            authorId: userId,
          },
        },
      },
    }
  : {};
```

**问题：**
1. 只返回通过 `ArticleMedia` 关联到用户文章的媒体
2. 如果媒体没有关联到任何文章，即使是用户上传的也查不到
3. 无法查询用户上传的所有媒体

### 问题场景

```
用户通过 POST /media 创建媒体
  ↓
{
  type: "IMAGE",
  url: "http://...",
  uploaderId: 19,
  articleIds: []  // ← 没有关联文章
}
  ↓
查询 GET /media?userId=19
  ↓
WHERE EXISTS (articles.article.authorId = 19)  // ← 没有关联文章，查不到
  ↓
返回空数组 []  ❌
```

## ✅ 修复方案

### 1. 修改查询逻辑 - 支持两种查询

**文件：** `src/media/media.service.ts`

```typescript
async findAll(userId?: number) {
  // 如果指定了userId，查询该用户上传的媒体
  // 或者与该用户文章关联的媒体
  const where = userId
    ? {
        OR: [
          // 用户上传的媒体
          { uploaderId: userId },
          // 或者与用户文章关联的媒体
          {
            articles: {
              some: {
                article: {
                  authorId: userId,
                },
              },
            },
          },
        ],
      }
    : {};

  return this.prisma.media.findMany({
    where,
    include: {
      uploader: {  // ← 包含上传者信息
        select: {
          id: true,
          name: true,
          email: true,
          role: { select: { name: true } },
        },
      },
      articles: { ... },
    },
    orderBy: { createdAt: 'desc' },
  });
}
```

### 2. 增强 CreateMediaDto

**文件：** `src/media/dto/create-media.dto.ts`

添加支持字段：
```typescript
uploaderId?: number;     // 上传者ID
originalName?: string;   // 原始文件名
size?: number;          // 文件大小
```

### 3. POST /media 接口记录上传者

**文件：** `src/media/media.controller.ts`

```typescript
@Post()
create(
  @Body() createMediaDto: CreateMediaDto,
  @CurrentUser() user: AuthenticatedUser,  // ← 获取当前用户
) {
  // 如果没有指定 uploaderId，使用当前用户ID
  if (!createMediaDto.uploaderId) {
    createMediaDto.uploaderId = user.id;
  }
  return this.mediaService.create(createMediaDto);
}
```

## 📊 修复效果

### 修复前

**查询逻辑：** 只查询与用户文章关联的媒体

| 媒体ID | uploaderId | 关联文章 | GET /media?userId=19 能查到? |
| ------ | ---------- | -------- | ---------------------------- |
| 1      | 19         | 无       | ❌ 否                         |
| 2      | 19         | [文章1]  | ✅ 是                         |
| 3      | 20         | [文章2]  | ❌ 否                         |

**问题：** 用户上传但未关联文章的媒体查不到

### 修复后

**查询逻辑：** 查询用户上传的媒体 **或** 与用户文章关联的媒体

| 媒体ID | uploaderId | 关联文章 | GET /media?userId=19 能查到?   |
| ------ | ---------- | -------- | ------------------------------ |
| 1      | 19         | 无       | ✅ 是（匹配 uploaderId）        |
| 2      | 19         | [文章1]  | ✅ 是（匹配 uploaderId 或文章） |
| 3      | 20         | [文章2]  | ❌ 否                           |

**结果：** 用户的所有相关媒体都能查到

## 🔧 查询 SQL 对比

### 修复前

```sql
SELECT * FROM Media
WHERE EXISTS (
  SELECT 1 FROM ArticleMedia am
  JOIN Article a ON a.id = am.articleId
  WHERE am.mediaId = Media.id
  AND a.authorId = 19
)
```

### 修复后

```sql
SELECT * FROM Media
WHERE (
  uploaderId = 19  -- 用户上传的
  OR EXISTS (
    SELECT 1 FROM ArticleMedia am
    JOIN Article a ON a.id = am.articleId
    WHERE am.mediaId = Media.id
    AND a.authorId = 19  -- 或关联用户文章的
  )
)
```

## 🎯 API 行为

### GET /media?userId=19

**返回结果包括：**
1. ✅ 用户ID=19上传的所有媒体（无论是否关联文章）
2. ✅ 关联到用户ID=19文章的所有媒体（无论谁上传的）

### GET /media（不带参数）

**返回结果：**
- ✅ 所有媒体文件（不过滤）

## 📁 修改的文件

| 文件                                | 修改内容                                                  |
| ----------------------------------- | --------------------------------------------------------- |
| `src/media/media.service.ts`        | 修改 `findAll` 查询逻辑，支持 OR 条件，添加 uploader 信息 |
| `src/media/dto/create-media.dto.ts` | 添加 `uploaderId`、`originalName`、`size` 字段            |
| `src/media/media.controller.ts`     | POST 接口自动设置 uploaderId                              |

## 🧪 测试用例

### 测试1：创建媒体（不关联文章）

```bash
curl -X POST "http://localhost:3000/media" \
  -H "Authorization: Bearer USER_19_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "IMAGE",
    "url": "http://localhost:3000/uploads/test.jpg"
  }'

# 响应：媒体创建成功，uploaderId = 19
```

### 测试2：查询用户媒体

```bash
curl -X GET "http://localhost:3000/media?userId=19" \
  -H "Authorization: Bearer TOKEN"

# 应该返回用户19上传的所有媒体（包括未关联文章的）✅
```

### 测试3：创建媒体（关联文章）

```bash
curl -X POST "http://localhost:3000/media" \
  -H "Authorization: Bearer USER_19_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "IMAGE",
    "url": "http://localhost:3000/uploads/test2.jpg",
    "articleIds": [1, 2]
  }'

# 响应：媒体创建成功，uploaderId = 19，关联文章 [1, 2]
```

### 测试4：再次查询

```bash
curl -X GET "http://localhost:3000/media?userId=19"

# 应该返回：
# - 测试1创建的媒体（uploaderId匹配）
# - 测试3创建的媒体（uploaderId匹配）
# - 其他关联到用户19文章的媒体（文章作者匹配）
```

## 💡 查询语义说明

### userId 参数的含义

**修复前：** "查询与这个用户的文章关联的媒体"
- 仅适用于文章场景
- 忽略了用户直接上传的媒体

**修复后：** "查询这个用户相关的所有媒体"
- 包括用户上传的媒体
- 包括用户文章关联的媒体
- 更符合直觉

## 🔑 关键改进

### 1. OR 条件查询

```typescript
OR: [
  { uploaderId: userId },              // 条件1：用户上传
  { articles: { some: { ... } } },    // 条件2：文章关联
]
```

### 2. 包含上传者信息

所有媒体查询都包含 `uploader` 信息，便于前端展示。

### 3. 自动设置上传者

POST /media 接口自动使用当前登录用户作为上传者。

## ⚠️ 注意事项

### 1. 权限要求

`POST /media` 需要教师或教师组长权限：
```typescript
@RequireTeacherLeaderOrTeacher()
```

### 2. 历史数据

现有媒体的 `uploaderId` 可能为 `null`，查询时会匹配文章关联条件。

### 3. 查询性能

使用了 `OR` 条件和 `EXISTS` 子查询，对于大数据量可能需要索引优化：
```sql
CREATE INDEX idx_media_uploader ON "Media"("uploaderId");
CREATE INDEX idx_article_author ON "Article"("authorId");
```

## 🎉 总结

### 问题
媒体查询只支持通过文章关联查询，忽略了直接上传的媒体。

### 解决
改用 OR 条件，同时支持 `uploaderId` 和文章关联查询。

### 结果
- ✅ 用户上传的媒体可以查到（无论是否关联文章）
- ✅ 与用户文章关联的媒体可以查到
- ✅ 查询语义更清晰合理
- ✅ 包含完整的上传者信息

---

**修复日期**：2025年10月10日  
**影响接口**：`GET /media?userId=X`  
**状态**：✅ 已修复并测试

