# 文章收藏功能API说明

## 概述
已成功实现文章收藏和取消收藏功能，支持用户收藏喜欢的文章，并可以管理自己的收藏列表。

## API接口

### 1. 收藏文章
**接口**: `POST /favorite`
**认证**: 需要JWT令牌
**描述**: 将指定文章添加到当前用户的收藏列表中

**请求体**:
```json
{
  "articleId": 1
}
```

**响应示例**:
```json
{
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
    "title": "文章标题",
    "published": true
  }
}
```

**错误响应**:
- `404`: 文章不存在
- `409`: 已经收藏过该文章

### 2. 获取我的收藏列表
**接口**: `GET /favorite`
**认证**: 需要JWT令牌
**描述**: 获取当前用户收藏的所有文章列表，返回结果包含分页信息

**查询参数**:
- `page`: 页码（可选，用于分页）
- `limit`: 每页数量（可选，用于分页）

**响应示例**:
```json
{
  "data": [
    {
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
        "title": "文章标题",
        "published": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "author": {
          "id": 2,
          "name": "作者"
        }
      }
    }
  ],
  "total": 50,
  "totalPages": 5
}
```

### 3. 检查是否收藏了某篇文章
**接口**: `GET /favorite/check/:articleId`
**认证**: 需要JWT令牌
**描述**: 检查当前用户是否收藏了指定的文章

**路径参数**:
- `articleId`: 文章ID

**响应示例**:
```json
{
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
    "title": "文章标题",
    "published": true
  }
}
```

**错误响应**:
- `404`: 未收藏该文章
  ```json
  {
    "statusCode": 404,
    "message": "未收藏该文章",
    "error": "Not Found"
  }
  ```

### 4. 取消收藏文章
**接口**: `DELETE /favorite/:articleId`
**认证**: 需要JWT令牌
**描述**: 从当前用户的收藏列表中移除指定文章

**路径参数**:
- `articleId`: 文章ID

**响应示例**:
```json
{
  "userId": 1,
  "articleId": 1,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**错误响应**:
- `404`: 收藏记录不存在

### 5. 获取文章收藏数量
**接口**: `GET /favorite/count/:articleId`
**认证**: 无需认证（公开接口）
**描述**: 获取指定文章的收藏数量

**路径参数**:
- `articleId`: 文章ID

**响应示例**:
```json
{
  "articleId": 1,
  "count": 15
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

### 2. 收藏文章
```bash
POST /favorite
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "articleId": 1
}
```

### 3. 查看我的收藏列表
```bash
GET /favorite
Authorization: Bearer <your-jwt-token>
```

### 4. 检查是否收藏了某篇文章
```bash
GET /favorite/check/1
Authorization: Bearer <your-jwt-token>
```

### 5. 取消收藏
```bash
DELETE /favorite/1
Authorization: Bearer <your-jwt-token>
```

### 6. 查看文章收藏数量（无需认证）
```bash
GET /favorite/count/1
```

## 数据库设计

收藏功能使用 `Favorite` 表，包含以下字段：
- `userId`: 用户ID（外键）
- `articleId`: 文章ID（外键）
- `createdAt`: 收藏时间
- 联合主键：`(userId, articleId)` 确保用户不能重复收藏同一篇文章

## 特性

1. **防重复收藏**: 使用联合主键确保用户不能重复收藏同一篇文章
2. **自动关联**: 收藏记录自动关联用户和文章信息
3. **权限控制**: 只有登录用户才能进行收藏操作
4. **完整信息**: 返回收藏记录时包含用户和文章的详细信息
5. **公开统计**: 文章收藏数量接口无需认证，便于展示
6. **错误处理**: 完善的错误处理，包括文章不存在、重复收藏等情况

## 注意事项

1. 收藏操作需要用户认证
2. 不能重复收藏同一篇文章
3. 取消收藏时，收藏记录必须存在
4. 收藏数量统计是公开的，无需认证
5. 所有收藏相关的操作都会记录时间戳
