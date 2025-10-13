# CORS 跨域配置指南

## 📖 什么是 CORS？

CORS（Cross-Origin Resource Sharing，跨域资源共享）是一种浏览器安全机制。

### 什么时候需要 CORS？

当**前端**和**后端**不在同一个域名/端口时，就需要配置 CORS：

| 场景          | 前端地址                        | 后端地址                  | 是否跨域         |
| ------------- | ------------------------------- | ------------------------- | ---------------- |
| 本地开发      | `http://localhost:8000`         | `http://localhost:3000`   | ✅ 是（端口不同） |
| 同域名        | `http://example.com/index.html` | `http://example.com/api`  | ❌ 否             |
| 不同端口      | `http://example.com:8787`       | `http://example.com:3000` | ✅ 是（端口不同） |
| 不同域名      | `http://frontend.com`           | `http://backend.com`      | ✅ 是（域名不同） |
| HTTP vs HTTPS | `http://example.com`            | `https://example.com`     | ✅ 是（协议不同） |

---

## 🔧 本项目的 CORS 配置

### 配置位置

CORS 配置在 `src/main.ts` 文件中：

```typescript
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
  : [
      'http://localhost:8000',   // 默认：本地开发
      'http://127.0.0.1:8000',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ];

app.enableCors({
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
});
```

### 配置说明

- **优先级**：环境变量 `CORS_ORIGINS` > 默认值
- **默认值**：仅允许本地开发地址（`localhost:8000`, `localhost:3000`）
- **生产环境**：必须通过环境变量明确配置

---

## 🚀 生产环境配置

### 步骤 1：编辑 .env 文件

```bash
cd ~/apps/teaching-case-service
vim .env
```

### 步骤 2：添加 CORS_ORIGINS 配置

```bash
# CORS 跨域配置
# 多个域名用逗号分隔，不要有空格
CORS_ORIGINS=http://your-server-ip:8787,http://your-domain.com:8787,https://your-domain.com
```

### 步骤 3：重启应用

```bash
pm2 restart teaching-case-service
```

---

## 📋 常见配置场景

### 场景 1：只通过服务器 IP 访问

```bash
# 服务器 IP: 8.8.8.8
# Nginx 端口: 8787
CORS_ORIGINS=http://8.8.8.8:8787
```

### 场景 2：使用域名（HTTP）

```bash
# 域名: example.com
# Nginx 端口: 8787
CORS_ORIGINS=http://example.com:8787
```

### 场景 3：使用域名（HTTPS + HTTP）

```bash
# 同时支持 HTTP 和 HTTPS
CORS_ORIGINS=http://example.com:8787,https://example.com
```

### 场景 4：多个域名

```bash
# 支持多个前端域名
CORS_ORIGINS=http://example.com:8787,https://example.com,http://admin.example.com,https://admin.example.com
```

### 场景 5：开发和生产环境

```bash
# 同时支持开发环境和生产环境
CORS_ORIGINS=http://localhost:8000,http://localhost:3000,http://production.com:8787,https://production.com
```

---

## ⚠️ 常见错误

### 错误 1：浏览器控制台报 CORS 错误

**错误信息：**
```
Access to XMLHttpRequest at 'http://server:3000/api/...' from origin 'http://localhost:8000' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present.
```

**原因：** 前端地址不在 CORS 允许列表中

**解决：**
```bash
# 在 .env 中添加前端地址
CORS_ORIGINS=http://localhost:8000

# 重启应用
pm2 restart teaching-case-service
```

---

### 错误 2：配置后仍然报错

**可能原因：**

1. **域名格式错误**
   ```bash
   # ❌ 错误：缺少协议
   CORS_ORIGINS=example.com:8787
   
   # ✅ 正确：包含完整协议
   CORS_ORIGINS=http://example.com:8787
   ```

2. **端口号错误**
   ```bash
   # ❌ 错误：前端在 8787，但配置了 3000
   CORS_ORIGINS=http://example.com:3000
   
   # ✅ 正确：端口要与前端实际端口匹配
   CORS_ORIGINS=http://example.com:8787
   ```

3. **包含多余空格**
   ```bash
   # ❌ 错误：逗号后有空格
   CORS_ORIGINS=http://example.com:8787, https://example.com
   
   # ✅ 正确：逗号后不要有空格
   CORS_ORIGINS=http://example.com:8787,https://example.com
   ```

4. **协议不匹配**
   ```bash
   # ❌ 错误：前端使用 HTTPS，但只配置了 HTTP
   CORS_ORIGINS=http://example.com
   
   # ✅ 正确：同时配置 HTTP 和 HTTPS
   CORS_ORIGINS=http://example.com,https://example.com
   ```

---

### 错误 3：OPTIONS 预检请求失败

**错误信息：**
```
Access to XMLHttpRequest at '...' from origin '...' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check
```

**原因：** 浏览器会先发送 OPTIONS 请求进行预检

**解决：** 确保 `.env` 配置正确，并重启应用

```bash
pm2 restart teaching-case-service
pm2 logs teaching-case-service
```

---

## 🔍 调试 CORS 问题

### 1. 检查前端实际请求的地址

在浏览器控制台 Network 标签中查看：
- 请求的完整 URL
- Origin 请求头的值

### 2. 检查后端 CORS 配置

```bash
# 查看环境变量
cd ~/apps/teaching-case-service
cat .env | grep CORS_ORIGINS

# 查看应用日志
pm2 logs teaching-case-service
```

### 3. 验证配置是否生效

使用 `curl` 测试：

```bash
# 模拟跨域请求
curl -H "Origin: http://example.com:8787" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:3000/api/articles

# 应该看到响应头中包含：
# Access-Control-Allow-Origin: http://example.com:8787
```

---

## 🛡️ 安全建议

### 1. 不要使用通配符（生产环境）

```bash
# ❌ 不推荐：允许所有域名（仅开发环境）
# app.enableCors({ origin: '*' })

# ✅ 推荐：明确指定允许的域名
CORS_ORIGINS=http://your-domain.com:8787,https://your-domain.com
```

### 2. 只允许必要的域名

```bash
# ❌ 不必要：包含过多域名
CORS_ORIGINS=http://domain1.com,http://domain2.com,http://domain3.com,...

# ✅ 最小化：只包含实际使用的域名
CORS_ORIGINS=http://your-domain.com:8787,https://your-domain.com
```

### 3. HTTPS 优先

```bash
# 生产环境应优先使用 HTTPS
CORS_ORIGINS=https://your-domain.com,https://admin.your-domain.com
```

---

## 📝 配置检查清单

部署前请确认：

- [ ] `.env` 文件中已添加 `CORS_ORIGINS` 配置
- [ ] 配置包含前端实际访问的完整地址（协议 + 域名/IP + 端口）
- [ ] 多个域名之间用逗号分隔，没有空格
- [ ] 如果使用 HTTPS，已包含 HTTPS 版本的域名
- [ ] 应用已重启（`pm2 restart teaching-case-service`）
- [ ] 浏览器控制台没有 CORS 错误

---

## 🔧 快速修复命令

如果遇到 CORS 问题，运行以下命令快速修复：

```bash
#!/bin/bash
cd ~/apps/teaching-case-service

# 1. 备份 .env
cp .env .env.backup

# 2. 添加 CORS 配置（修改为你的实际域名）
echo "CORS_ORIGINS=http://你的服务器IP:8787" >> .env

# 3. 重启应用
pm2 restart teaching-case-service

# 4. 查看日志
pm2 logs teaching-case-service --lines 20
```

---

## 💡 本项目的典型配置

### 配置示例（根据你的部署调整）

```bash
# .env 文件配置示例

# 数据库连接
DATABASE_URL="postgresql://teaching_user:6666667@localhost:5432/class_case"

# 后端端口
PORT=3000

# CORS 配置（关键！）
# 格式：http://服务器IP或域名:Nginx端口
CORS_ORIGINS=http://8.8.8.8:8787,http://your-domain.com:8787,https://your-domain.com

# JWT 密钥
JWT_SECRET="your-secret-key"

# 超级管理员配置
SUPER_ADMIN_EMAIL=admin@mail.com
SUPER_ADMIN_PASSWORD=SuperAdmin123!
AUTO_CREATE_SUPER_ADMIN=true
```

---

## 📞 还有问题？

如果按照本指南配置后仍然遇到 CORS 问题，请检查：

1. **浏览器控制台的完整错误信息**
2. **前端实际访问的 URL**（在 Network 标签查看）
3. **后端日志**（`pm2 logs teaching-case-service`）
4. **Nginx 配置是否正确代理**

提供这些信息可以更快定位问题。

---

*CORS 配置指南 - v1.0*

