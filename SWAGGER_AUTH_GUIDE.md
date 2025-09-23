# Swagger API 认证使用指南

## 🚀 快速开始

### 1. 访问Swagger文档
启动服务后，访问：`http://localhost:3000/api`

### 2. 获取JWT Token
1. 在Swagger UI中找到 **"认证管理"** 标签
2. 展开 `POST /auth/login` 接口
3. 点击 **"Try it out"** 按钮
4. 在请求体中输入登录信息：
   ```json
   {
     "email": "admin@example.com",
     "password": "admin123"
   }
   ```
5. 点击 **"Execute"** 执行请求
6. 在响应中复制 `access_token` 的值

### 3. 配置认证
1. 在Swagger UI右上角点击 **"Authorize"** 按钮 🔒
2. 在弹出的认证对话框中：
   - 在 **"JWT-auth"** 输入框中输入：`Bearer <your-jwt-token>`
   - 例如：`Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. 点击 **"Authorize"** 按钮确认
4. 关闭对话框

### 4. 使用认证接口
现在你可以访问所有需要认证的接口了！接口会自动在请求头中包含认证信息。

## 🔑 认证方案说明

### JWT Bearer Token
- **类型**: HTTP Bearer Token
- **格式**: `Bearer <jwt-token>`
- **位置**: Authorization 请求头
- **示例**: `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 认证流程
```mermaid
sequenceDiagram
    participant Client as 客户端
    participant API as API服务
    participant Auth as 认证服务
    
    Client->>Auth: POST /auth/login
    Auth-->>Client: JWT Token
    Client->>API: 请求 + Bearer Token
    API->>Auth: 验证Token
    Auth-->>API: 用户信息
    API-->>Client: 响应数据
```

## 🛡️ 权限系统说明

### 角色类型
- **超级管理员**: 拥有所有权限
- **管理员**: 拥有大部分管理权限
- **教师**: 教学相关权限
- **助教**: 辅助教学权限
- **学生**: 基础学习权限

### 权限格式
权限代码格式：`模块:操作`
- `user:create` - 创建用户
- `article:read` - 查看文章
- `media:upload` - 上传媒体
- `role:manage` - 管理角色

### 权限检查
系统会自动检查用户角色对应的权限，确保用户只能访问有权限的接口。

## 📝 使用示例

### 1. 创建角色
```bash
# 1. 先登录获取token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# 2. 使用token创建角色
curl -X POST http://localhost:3000/roles \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"高级教师","description":"拥有高级权限的教师角色"}'
```

### 2. 分配权限
```bash
curl -X POST http://localhost:3000/roles/1/permissions \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"permissionIds":[1,2,3,4,5]}'
```

## ⚠️ 注意事项

1. **Token有效期**: JWT token有过期时间，过期后需要重新登录
2. **权限检查**: 不同角色有不同的权限，确保你的角色有相应权限
3. **系统角色**: 系统预设角色不能删除，只能修改权限
4. **权限分配**: 为角色分配权限会替换现有权限，请确保传递完整列表

## 🔧 故障排除

### 常见错误

#### 401 Unauthorized
- **原因**: Token无效或过期
- **解决**: 重新登录获取新token

#### 403 Forbidden  
- **原因**: 权限不足
- **解决**: 检查用户角色是否有相应权限

#### 400 Bad Request
- **原因**: 请求参数错误
- **解决**: 检查请求体格式和必填字段

### 调试技巧
1. 检查请求头中是否包含正确的Authorization
2. 确认token格式为 `Bearer <token>`
3. 验证用户角色和权限配置
4. 查看服务端日志获取详细错误信息

## 📚 相关接口

### 认证相关
- `POST /auth/login` - 用户登录
- `GET /auth/profile` - 获取用户信息

### 角色权限相关  
- `GET /roles` - 获取所有角色
- `POST /roles` - 创建角色
- `POST /roles/:id/permissions` - 分配权限
- `GET /roles/permissions` - 获取所有权限

### 用户管理
- `GET /users` - 获取用户列表
- `POST /users` - 创建用户
- `PATCH /users/:id` - 更新用户信息
