# 评论点赞功能 API 文档

## 概述

本文档描述了新增的评论点赞功能，包括点赞、取消点赞以及查询评论时包含点赞数据的相关接口。

## 功能特性

- ✅ 对评论进行点赞操作
- ✅ 取消对评论的点赞
- ✅ 查询评论时包含点赞数量和当前用户点赞状态
- ✅ 支持楼中楼评论的点赞功能
- ✅ 防止重复点赞
- ✅ 完整的API文档和错误处理

## 数据库模型

### CommentLike 模型

```prisma
model CommentLike {
  user      User     @relation(fields: [userId], references: [id])
  userId    Int
  comment   Comment  @relation(fields: [commentId], references: [id], onDelete: Cascade)
  commentId Int
  createdAt DateTime @default(now())

  @@id([userId, commentId]) // 联合主键
}
```

### 更新的 Comment 模型

```prisma
model Comment {
  // ... 原有字段
  likes     CommentLike[] // 新增：评论点赞关联
}
```

## API 接口

### 1. 点赞评论

**接口**: `POST /comment/:id/like`

**描述**: 对指定评论进行点赞操作

**请求参数**:
- `id` (路径参数): 评论ID

**响应示例**:
```json
{
  "userId": 1,
  "commentId": 1,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "user": {
    "id": 1,
    "name": "张三",
    "email": "zhangsan@example.com",
    "avatar": "https://example.com/avatar.jpg"
  },
  "comment": {
    "id": 1,
    "content": "这是一条很有用的评论！"
  }
}
```

**错误响应**:
- `400`: 已经点赞过该评论
- `404`: 评论不存在

### 2. 取消点赞评论

**接口**: `DELETE /comment/:id/like`

**描述**: 取消对指定评论的点赞操作

**请求参数**:
- `id` (路径参数): 评论ID

**响应示例**:
```json
{
  "userId": 1,
  "commentId": 1,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "user": {
    "id": 1,
    "name": "张三",
    "email": "zhangsan@example.com",
    "avatar": "https://example.com/avatar.jpg"
  },
  "comment": {
    "id": 1,
    "content": "这是一条很有用的评论！"
  }
}
```

**错误响应**:
- `400`: 未点赞该评论

### 3. 获取评论列表（包含点赞数据）

**接口**: `GET /comment`

**描述**: 获取评论列表，现在包含点赞数量和当前用户点赞状态

**查询参数**:
- `articleId` (可选): 文章ID，筛选指定文章的评论
- `authorId` (可选): 作者ID，筛选指定作者的评论

**响应示例**:
```json
[
  {
    "id": 1,
    "content": "这是一条很有用的评论！",
    "authorId": 1,
    "articleId": 1,
    "parentId": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "author": {
      "id": 1,
      "name": "张三",
      "email": "zhangsan@example.com",
      "avatar": "https://example.com/avatar.jpg"
    },
    "article": {
      "id": 1,
      "title": "文章标题"
    },
    "likeCount": 5,
    "isLiked": true,
    "likes": [
      {
        "userId": 1,
        "commentId": 1,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "user": {
          "id": 1,
          "name": "张三",
          "email": "zhangsan@example.com",
          "avatar": "https://example.com/avatar.jpg"
        }
      }
    ],
    "replies": [
      {
        "id": 2,
        "content": "这是楼中楼回复",
        "likeCount": 2,
        "isLiked": false,
        "likes": [...]
      }
    ]
  }
]
```

### 4. 获取单个评论（包含点赞数据）

**接口**: `GET /comment/:id`

**描述**: 根据ID获取单条评论的详细信息，包括点赞数据

**请求参数**:
- `id` (路径参数): 评论ID

**响应格式**: 与评论列表中的单个评论格式相同

## 新增字段说明

### Comment 实体新增字段

- `likeCount`: 点赞数量
- `isLiked`: 当前用户是否已点赞（需要用户登录）
- `likes`: 点赞列表（包含点赞用户信息）

### 子评论（replies）也包含相同字段

楼中楼评论同样支持点赞功能，每个子评论都会包含：
- `likeCount`: 子评论的点赞数量
- `isLiked`: 当前用户是否已点赞该子评论
- `likes`: 子评论的点赞列表

## 使用示例

### 1. 点赞评论

```bash
curl -X POST "http://localhost:3000/comment/1/like" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. 取消点赞

```bash
curl -X DELETE "http://localhost:3000/comment/1/like" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. 获取文章的所有评论（包含点赞数据）

```bash
curl -X GET "http://localhost:3000/comment?articleId=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 注意事项

1. **认证要求**: 点赞和取消点赞操作需要用户登录
2. **防重复点赞**: 系统会检查用户是否已经点赞过该评论
3. **级联删除**: 当评论被删除时，相关的点赞记录也会被自动删除
4. **性能优化**: 查询评论时会一次性加载所有相关的点赞数据，避免N+1查询问题
5. **楼中楼支持**: 子评论（楼中楼回复）同样支持点赞功能

## 数据库迁移

已自动生成并应用数据库迁移文件：
- 迁移文件: `prisma/migrations/20250924163714_add_comment_likes/migration.sql`
- 新增表: `CommentLike`
- 更新表: `Comment` (添加 likes 关联)

## 测试建议

1. 测试点赞功能：
   - 正常点赞
   - 重复点赞（应返回错误）
   - 对不存在的评论点赞（应返回错误）

2. 测试取消点赞功能：
   - 正常取消点赞
   - 取消未点赞的评论（应返回错误）

3. 测试查询功能：
   - 未登录用户查询（isLiked 应为 false）
   - 已登录用户查询（isLiked 应正确显示）
   - 楼中楼评论的点赞数据

4. 测试数据一致性：
   - 删除评论后点赞记录应被级联删除
   - 删除用户后点赞记录应被级联删除
