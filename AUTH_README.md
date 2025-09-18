# 认证系统说明

## 概述
项目已实现基于JWT的认证系统，除了一些公共接口外，其他接口都需要认证才能访问。

## 环境变量配置
请在项目根目录创建 `.env` 文件，包含以下配置：

```env
# 数据库连接
DATABASE_URL="postgresql://username:password@localhost:5432/teaching_case_db?schema=public"

# JWT密钥（生产环境请使用强密钥）
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# 应用端口
PORT=3000

# 基础URL
BASE_URL="http://localhost:3000"
```

## 公共接口（无需认证）
以下接口可以无需认证直接访问：

### 认证相关
- `POST /auth/login` - 用户登录

### 文章相关
- `GET /articles` - 获取所有文章
- `GET /articles/many` - 根据条件筛选文章
- `GET /articles/:id` - 根据ID获取文章

### 评论相关
- `GET /comment` - 获取所有评论
- `GET /comment/:id` - 根据ID获取评论

### 媒体相关
- `GET /media` - 获取媒体文件列表
- `GET /media/:id` - 根据ID获取媒体文件

## 需要认证的接口
除了上述公共接口外，其他所有接口都需要在请求头中携带JWT令牌：

```
Authorization: Bearer <your-jwt-token>
```

## 使用流程

### 1. 用户注册
```bash
POST /users
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "张三",
  "password": "password123"
}
```

### 2. 用户登录
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

响应：
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "张三"
  }
}
```

### 3. 使用令牌访问受保护的接口
```bash
POST /articles
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "title": "我的文章",
  "content": "文章内容...",
  "published": false
}
```

## 注意事项

1. **密码安全**：用户密码在存储前会自动使用bcrypt加密
2. **令牌过期**：JWT令牌默认24小时过期
3. **用户信息**：创建文章、评论等操作会自动使用当前登录用户的ID
4. **权限控制**：只有登录用户才能创建、修改、删除自己的内容

## 开发建议

1. 在生产环境中，请使用强JWT密钥
2. 考虑实现令牌刷新机制
3. 可以添加角色权限控制（如管理员、普通用户等）
4. 建议添加请求频率限制
