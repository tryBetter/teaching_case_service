# 浏览历史功能API说明

## 概述
已成功实现文章浏览历史记录功能，支持用户查看浏览过的文章、搜索历史记录、删除历史记录等。浏览历史会在用户查看文章详情时自动添加。

## API接口

### 1. 获取浏览历史列表
**接口**: `GET /view-history`
**认证**: 需要JWT令牌
**描述**: 获取当前用户的浏览历史列表，支持分页、搜索、过滤和排序

**查询参数**:
- `page`: 页码（可选，用于分页）
- `limit`: 每页数量（可选，用于分页）
- `keyword`: 搜索关键词（文章标题模糊匹配）
- `categoryId`: 分类ID过滤
- `sort`: 排序方式（asc/desc，默认desc）

**响应示例**:
```json
{
  "data": [
    {
      "id": 1,
      "userId": 1,
      "articleId": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "article": {
        "id": 1,
        "title": "文章标题",
        "cover": "https://example.com/cover.jpg",
        "summary": "文章简介",
        "published": true,
        "keywords": ["NestJS", "Node.js"],
        "featured": false,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "category": {
          "id": 1,
          "name": "技术"
        },
        "author": {
          "id": 2,
          "name": "作者",
          "avatar": "https://example.com/avatar.jpg"
        }
      }
    }
  ],
  "total": 50,
  "totalPages": 5
}
```

### 2. 获取单条浏览历史
**接口**: `GET /view-history/:articleId`
**认证**: 需要JWT令牌
**描述**: 获取指定文章的浏览历史记录

**路径参数**:
- `articleId`: 文章ID

**响应示例**:
```json
{
  "id": 1,
  "userId": 1,
  "articleId": 1,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "article": {
    "id": 1,
    "title": "文章标题",
    "cover": "https://example.com/cover.jpg",
    "summary": "文章简介",
    "published": true,
    "keywords": ["NestJS", "Node.js"],
    "featured": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "category": {
      "id": 1,
      "name": "技术"
    },
    "author": {
      "id": 2,
      "name": "作者",
      "avatar": "https://example.com/avatar.jpg"
    }
  }
}
```

### 3. 删除单条浏览历史
**接口**: `DELETE /view-history/:articleId`
**认证**: 需要JWT令牌
**描述**: 删除指定文章的浏览历史记录

**路径参数**:
- `articleId`: 文章ID

**响应示例**:
```json
{
  "userId": 1,
  "articleId": 1,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 4. 清空所有浏览历史
**接口**: `DELETE /view-history/clear/all`
**认证**: 需要JWT令牌
**描述**: 清空当前用户的所有浏览历史记录

**响应示例**:
```json
{
  "deletedCount": 25
}
```

### 5. 获取用户数据统计
**接口**: `GET /view-history/stats/user`
**认证**: 需要JWT令牌
**描述**: 获取当前用户的浏览历史、收藏、笔记、评论等数据统计

**响应示例**:
```json
{
  "viewHistoryCount": 25,
  "favoriteCount": 12,
  "noteCount": 8,
  "commentCount": 15
}
```

### 6. 手动添加浏览历史（可选）
**接口**: `POST /view-history`
**认证**: 需要JWT令牌
**描述**: 手动添加文章浏览历史记录。注意：浏览历史会在用户查看文章详情时自动添加，通常不需要手动调用此接口。

**请求体**:
```json
{
  "articleId": 1
}
```

**响应示例**:
```json
{
  "id": 1,
  "userId": 1,
  "articleId": 1,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "article": {
    "id": 1,
    "title": "文章标题",
    "cover": "https://example.com/cover.jpg",
    "summary": "文章简介",
    "published": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "category": {
      "id": 1,
      "name": "技术"
    },
    "author": {
      "id": 2,
      "name": "作者"
    }
  }
}
```

## 使用流程

### 1. 用户登录获取令牌
```bash
POST /auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

### 2. 查看文章详情（自动添加浏览历史）
```bash
GET /articles/1
Authorization: Bearer <your-jwt-token>
```

### 3. 查看浏览历史列表
```bash
GET /view-history?page=1&limit=10&keyword=NestJS&categoryId=1&sort=desc
Authorization: Bearer <your-jwt-token>
```

### 4. 获取用户数据统计
```bash
GET /view-history/stats/user
Authorization: Bearer <your-jwt-token>
```

### 5. 删除单条浏览历史
```bash
DELETE /view-history/1
Authorization: Bearer <your-jwt-token>
```

### 6. 清空所有浏览历史
```bash
DELETE /view-history/clear/all
Authorization: Bearer <your-jwt-token>
```

## 数据库设计

浏览历史功能使用 `ViewHistory` 表，包含以下字段：
- `id`: 主键
- `userId`: 用户ID（外键）
- `articleId`: 文章ID（外键）
- `createdAt`: 首次浏览时间
- `updatedAt`: 最后浏览时间
- 联合唯一约束：`(userId, articleId)` 确保每个用户对每篇文章只有一条记录
- 索引：`(userId, createdAt)` 用于按用户和时间查询

## 特性

1. **自动记录**: 用户查看文章详情时自动添加浏览历史
2. **去重更新**: 重复浏览同一文章时更新浏览时间
3. **高级搜索**: 支持标题模糊搜索、分类过滤、时间排序
4. **分页支持**: 支持分页查询，返回总数和总页数
5. **数据统计**: 提供用户各种数据统计
6. **权限控制**: 只能查看和操作自己的浏览历史
7. **软删除过滤**: 自动过滤已删除的文章
8. **不返回内容**: 浏览历史不包含文章内容，内容通过文章详情接口获取
