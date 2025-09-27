# 生产环境CORS配置指南

## 概述

本文档说明如何在生产环境中正确配置CORS（跨域资源共享），确保前端应用能够正常访问API服务。

## 环境变量配置

### 开发环境
```env
# 开发环境CORS配置
CORS_ORIGINS="http://localhost:8000,http://127.0.0.1:8000,http://localhost:3000,http://127.0.0.1:3000"
```

### 生产环境配置示例

#### 1. 单域名部署
```env
# 前端和后端部署在同一域名下
CORS_ORIGINS="https://yourdomain.com"
```

#### 2. 多域名部署
```env
# 前端和后端部署在不同域名
CORS_ORIGINS="https://frontend.yourdomain.com,https://admin.yourdomain.com,https://api.yourdomain.com"
```

#### 3. 多环境部署
```env
# 包含测试环境和生产环境
CORS_ORIGINS="https://prod-frontend.yourdomain.com,https://test-frontend.yourdomain.com,https://staging-frontend.yourdomain.com"
```

## 部署场景配置

### 场景1：传统服务器部署

#### Nginx反向代理配置
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name frontend.yourdomain.com;
    
    location / {
        root /var/www/frontend;
        try_files $uri $uri/ /index.html;
    }
}
```

#### 环境变量配置
```env
BASE_URL="https://api.yourdomain.com"
CORS_ORIGINS="https://frontend.yourdomain.com,https://admin.yourdomain.com"
```

### 场景2：Docker部署

#### docker-compose.yml
```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/teaching_case_db
      - JWT_SECRET=your-production-jwt-secret
      - BASE_URL=https://api.yourdomain.com
      - CORS_ORIGINS=https://frontend.yourdomain.com,https://admin.yourdomain.com
      - PORT=3000
    depends_on:
      - db
  
  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=teaching_case_db
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 场景3：云平台部署

#### Heroku配置
```bash
# 设置环境变量
heroku config:set CORS_ORIGINS="https://your-frontend-app.herokuapp.com"
heroku config:set BASE_URL="https://your-api-app.herokuapp.com"
```

#### Vercel配置
```env
# vercel.json
{
  "env": {
    "CORS_ORIGINS": "https://your-frontend.vercel.app,https://your-admin.vercel.app",
    "BASE_URL": "https://your-api.vercel.app"
  }
}
```

#### AWS/阿里云等云服务
```env
# 通过云服务商的环境变量配置
CORS_ORIGINS="https://cdn.yourdomain.com,https://admin.yourdomain.com"
BASE_URL="https://api.yourdomain.com"
```

## 安全最佳实践

### 1. 严格限制允许的源地址
```env
# ✅ 正确：明确指定允许的域名
CORS_ORIGINS="https://frontend.yourdomain.com,https://admin.yourdomain.com"

# ❌ 错误：使用通配符（生产环境不推荐）
CORS_ORIGINS="*"
```

### 2. 使用HTTPS
```env
# ✅ 正确：生产环境使用HTTPS
CORS_ORIGINS="https://frontend.yourdomain.com"

# ❌ 错误：生产环境使用HTTP
CORS_ORIGINS="http://frontend.yourdomain.com"
```

### 3. 定期审查允许的源地址
- 定期检查 `CORS_ORIGINS` 配置
- 移除不再使用的域名
- 确保所有域名都是可信的

## 常见问题排查

### 问题1：CORS错误仍然存在
```bash
# 检查环境变量是否正确设置
echo $CORS_ORIGINS

# 检查应用是否重启
# 修改环境变量后需要重启应用
```

### 问题2：预检请求失败
```bash
# 检查OPTIONS请求是否被正确处理
curl -X OPTIONS -H "Origin: https://your-frontend.com" -v https://your-api.com/auth/login
```

### 问题3：认证请求失败
```bash
# 检查credentials配置
# 确保前端请求包含credentials: 'include'
```

## 测试CORS配置

### 使用curl测试
```bash
# 测试预检请求
curl -X OPTIONS \
  -H "Origin: https://your-frontend.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v https://your-api.com/auth/login

# 测试实际请求
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: https://your-frontend.com" \
  -d '{"email":"test@example.com","password":"password"}' \
  -v https://your-api.com/auth/login
```

### 使用浏览器开发者工具
1. 打开浏览器开发者工具
2. 切换到Network标签
3. 发起跨域请求
4. 检查响应头中的CORS相关字段

## 监控和日志

### 添加CORS日志
```typescript
// 在main.ts中添加日志
console.log('CORS Origins:', corsOrigins);
console.log('Environment:', process.env.NODE_ENV);
```

### 监控CORS错误
- 设置错误监控（如Sentry）
- 监控CORS相关的HTTP状态码
- 记录被拒绝的跨域请求

## 总结

1. **开发环境**：使用localhost地址
2. **生产环境**：使用实际的域名和HTTPS
3. **安全第一**：严格限制允许的源地址
4. **测试验证**：部署后及时测试CORS配置
5. **定期维护**：定期审查和更新CORS配置

通过以上配置，您的应用将能够在各种部署环境中正确处理跨域请求。
