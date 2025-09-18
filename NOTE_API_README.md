# 笔记功能 API 文档

## 概述

笔记功能允许用户为文章添加个人笔记，包括创建、编辑、查看和删除笔记。用户只能管理自己的笔记，但可以查看公开文章的笔记。

## 功能特性

- ✅ 创建笔记：为指定文章创建新的笔记
- ✅ 编辑笔记：更新已有笔记的内容
- ✅ 查看笔记详情：获取单个笔记的详细信息
- ✅ 删除笔记：删除指定的笔记
- ✅ 个人笔记列表：获取当前用户的所有笔记
- ✅ 文章笔记列表：获取指定文章的所有笔记
- ✅ 笔记统计：获取用户的笔记统计信息
- ✅ 权限控制：用户只能管理自己的笔记
- ✅ 认证保护：除公开接口外，其他接口需要JWT认证

## API 接口

### 1. 创建笔记

**POST** `/note`

为指定文章创建新的笔记。

#### 请求头
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

#### 请求体
```json
{
  "content": "这篇文章很有用，特别是关于NestJS的依赖注入部分。",
  "articleId": 1
}
```

#### 参数说明
- `content` (string, 必填): 笔记内容，长度1-2000字符
- `articleId` (number, 必填): 关联的文章ID

#### 响应示例
```json
{
  "id": 1,
  "content": "这篇文章很有用，特别是关于NestJS的依赖注入部分。",
  "userId": 1,
  "articleId": 1,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "user": {
    "id": 1,
    "name": "张三",
    "email": "zhangsan@example.com"
  },
  "article": {
    "id": 1,
    "title": "如何学习NestJS",
    "published": true
  }
}
```

#### 错误响应
- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 未授权访问
- `404 Not Found`: 指定的文章不存在

---

### 2. 获取我的笔记列表

**GET** `/note`

获取当前用户的所有笔记，按更新时间倒序排列。

#### 请求头
```
Authorization: Bearer <JWT_TOKEN>
```

#### 响应示例
```json
[
  {
    "id": 1,
    "content": "这篇文章很有用，特别是关于NestJS的依赖注入部分。",
    "userId": 1,
    "articleId": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "user": {
      "id": 1,
      "name": "张三",
      "email": "zhangsan@example.com"
    },
    "article": {
      "id": 1,
      "title": "如何学习NestJS",
      "content": "文章内容...",
      "published": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "author": {
        "id": 2,
        "name": "李四"
      }
    }
  }
]
```

#### 错误响应
- `401 Unauthorized`: 未授权访问

---

### 3. 获取文章笔记列表

**GET** `/note/article/:articleId`

获取指定文章的所有笔记。支持可选的用户ID过滤。

#### 路径参数
- `articleId` (number): 文章ID

#### 查询参数
- `userId` (number, 可选): 用户ID，如果提供则只返回该用户的笔记

#### 请求示例
```
GET /note/article/1
GET /note/article/1?userId=1
```

#### 响应示例
```json
[
  {
    "id": 1,
    "content": "这篇文章很有用，特别是关于NestJS的依赖注入部分。",
    "userId": 1,
    "articleId": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "user": {
      "id": 1,
      "name": "张三",
      "email": "zhangsan@example.com"
    },
    "article": {
      "id": 1,
      "title": "如何学习NestJS",
      "published": true
    }
  }
]
```

---

### 4. 获取笔记详情

**GET** `/note/:id`

根据笔记ID获取笔记详情。用户只能查看自己的笔记，除非是公开访问。

#### 路径参数
- `id` (number): 笔记ID

#### 请求头（可选）
```
Authorization: Bearer <JWT_TOKEN>
```

#### 响应示例
```json
{
  "id": 1,
  "content": "这篇文章很有用，特别是关于NestJS的依赖注入部分。",
  "userId": 1,
  "articleId": 1,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "user": {
    "id": 1,
    "name": "张三",
    "email": "zhangsan@example.com"
  },
  "article": {
    "id": 1,
    "title": "如何学习NestJS",
    "content": "文章内容...",
    "published": true,
    "author": {
      "id": 2,
      "name": "李四"
    }
  }
}
```

#### 错误响应
- `403 Forbidden`: 无权查看此笔记
- `404 Not Found`: 笔记不存在

---

### 5. 更新笔记

**PATCH** `/note/:id`

更新指定笔记的内容。用户只能更新自己的笔记。

#### 请求头
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

#### 路径参数
- `id` (number): 笔记ID

#### 请求体
```json
{
  "content": "更新后的笔记内容，这篇文章很有用，特别是关于NestJS的依赖注入部分。"
}
```

#### 参数说明
- `content` (string, 可选): 更新后的笔记内容，长度1-2000字符

#### 响应示例
```json
{
  "id": 1,
  "content": "更新后的笔记内容，这篇文章很有用，特别是关于NestJS的依赖注入部分。",
  "userId": 1,
  "articleId": 1,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z",
  "user": {
    "id": 1,
    "name": "张三",
    "email": "zhangsan@example.com"
  },
  "article": {
    "id": 1,
    "title": "如何学习NestJS",
    "published": true
  }
}
```

#### 错误响应
- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 未授权访问
- `403 Forbidden`: 无权修改此笔记
- `404 Not Found`: 笔记不存在

---

### 6. 删除笔记

**DELETE** `/note/:id`

删除指定的笔记。用户只能删除自己的笔记。

#### 请求头
```
Authorization: Bearer <JWT_TOKEN>
```

#### 路径参数
- `id` (number): 笔记ID

#### 响应示例
```json
{
  "id": 1,
  "content": "这篇文章很有用，特别是关于NestJS的依赖注入部分。",
  "userId": 1,
  "articleId": 1,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### 错误响应
- `401 Unauthorized`: 未授权访问
- `403 Forbidden`: 无权删除此笔记
- `404 Not Found`: 笔记不存在

---

### 7. 获取笔记统计信息

**GET** `/note/stats/me`

获取当前用户的笔记统计信息，包括总笔记数和最近7天创建的笔记数。

#### 请求头
```
Authorization: Bearer <JWT_TOKEN>
```

#### 响应示例
```json
{
  "totalNotes": 25,
  "recentNotes": 3
}
```

#### 参数说明
- `totalNotes` (number): 用户总笔记数
- `recentNotes` (number): 最近7天创建的笔记数

#### 错误响应
- `401 Unauthorized`: 未授权访问

---

## 使用示例

### 创建笔记
```bash
curl -X POST http://localhost:3000/note \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "这篇文章很有用，特别是关于NestJS的依赖注入部分。",
    "articleId": 1
  }'
```

### 获取我的笔记列表
```bash
curl -X GET http://localhost:3000/note \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 获取文章笔记列表
```bash
curl -X GET http://localhost:3000/note/article/1
```

### 更新笔记
```bash
curl -X PATCH http://localhost:3000/note/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "更新后的笔记内容"
  }'
```

### 删除笔记
```bash
curl -X DELETE http://localhost:3000/note/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 获取笔记统计
```bash
curl -X GET http://localhost:3000/note/stats/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 数据模型

### Note 实体
```typescript
{
  id: number;           // 笔记ID
  content: string;      // 笔记内容
  userId: number;       // 用户ID
  articleId: number;    // 文章ID
  createdAt: Date;      // 创建时间
  updatedAt: Date;      // 更新时间
  user?: User;          // 用户信息
  article?: Article;    // 文章信息
}
```

### CreateNoteDto
```typescript
{
  content: string;      // 笔记内容 (必填, 1-2000字符)
  articleId: number;    // 文章ID (必填, 正整数)
}
```

### UpdateNoteDto
```typescript
{
  content?: string;     // 笔记内容 (可选, 1-2000字符)
}
```

---

## 权限说明

### 认证要求
- 创建、更新、删除笔记需要JWT认证
- 获取个人笔记列表需要JWT认证
- 获取笔记统计信息需要JWT认证
- 获取笔记详情和文章笔记列表为公开接口

### 权限控制
- 用户只能创建、更新、删除自己的笔记
- 用户只能查看自己的笔记详情（除非是公开访问）
- 文章笔记列表支持按用户ID过滤

---

## 错误处理

### 常见错误码
- `400 Bad Request`: 请求参数错误或验证失败
- `401 Unauthorized`: 未提供有效的JWT令牌
- `403 Forbidden`: 无权执行该操作
- `404 Not Found`: 资源不存在（笔记、文章等）
- `500 Internal Server Error`: 服务器内部错误

### 错误响应格式
```json
{
  "statusCode": 400,
  "message": ["content should not be empty"],
  "error": "Bad Request"
}
```

---

## 注意事项

1. **内容长度限制**: 笔记内容限制在1-2000字符之间
2. **文章验证**: 创建笔记时会验证文章是否存在
3. **权限验证**: 所有修改操作都会验证用户权限
4. **排序规则**: 个人笔记列表按更新时间倒序，文章笔记列表按创建时间倒序
5. **关联数据**: 返回的笔记数据包含完整的用户和文章信息
6. **统计计算**: 最近笔记统计基于创建时间，计算最近7天的笔记数量

---

## 更新日志

### v1.0.0 (2024-01-01)
- ✅ 实现完整的笔记CRUD功能
- ✅ 添加权限控制和认证保护
- ✅ 支持文章笔记列表查询
- ✅ 添加笔记统计功能
- ✅ 完整的Swagger API文档
- ✅ 错误处理和验证
