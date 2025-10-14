# 媒体文件URL配置指南

## 🐛 问题描述

**问题：** 上传媒体文件后，返回的URL是 `http://localhost:3000/uploads/...`，这是本地测试地址，在生产环境无法访问。

**期望：** 返回 Nginx 代理地址，如 `http://服务器IP:8787/uploads/...`

---

## 🔍 问题原因

媒体文件URL是通过环境变量 `BASE_URL` 生成的：

```typescript
// src/media/media.service.ts 第232行
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
const fileUrl = `${baseUrl}/uploads/${subDir}/${fileName}`;
```

**默认值：** `http://localhost:3000`（用于本地开发）

**生产环境：** 需要配置为实际的访问地址

---

## ✅ 解决方案

### 方法 1：修改环境变量（推荐）

在服务器的 `.env` 文件中配置正确的 `BASE_URL`：

```bash
# 编辑 .env 文件
cd ~/apps/teaching-case-service
vim .env
```

根据你的部署情况选择：

#### 场景 1：使用服务器IP + Nginx端口
```bash
BASE_URL="http://8.8.8.8:8787"
```

#### 场景 2：使用域名 + Nginx端口
```bash
BASE_URL="http://example.com:8787"
```

#### 场景 3：使用域名 + HTTPS（推荐）
```bash
BASE_URL="https://example.com"
```

#### 场景 4：使用域名 + HTTP（标准80端口）
```bash
BASE_URL="http://example.com"
```

### 修改后重启应用

```bash
# 重启应用使配置生效
pm2 restart teaching-case-service

# 验证环境变量
pm2 logs teaching-case-service --lines 20 | grep BASE_URL
```

---

## 📋 完整的 .env 配置示例

### 开发环境
```bash
DATABASE_URL="postgresql://postgres:6666667@localhost:5432/class_case"
PORT=3000
BASE_URL="http://localhost:3000"
CORS_ORIGINS=http://localhost:8000,http://localhost:3000
```

### 生产环境（使用IP）
```bash
DATABASE_URL="postgresql://teaching_user:6666667@localhost:5432/class_case"
PORT=3000
BASE_URL="http://8.8.8.8:8787"
CORS_ORIGINS=http://8.8.8.8:8787
```

### 生产环境（使用域名）
```bash
DATABASE_URL="postgresql://teaching_user:6666667@localhost:5432/class_case"
PORT=3000
BASE_URL="http://example.com:8787"
CORS_ORIGINS=http://example.com:8787,https://example.com
```

### 生产环境（使用HTTPS）
```bash
DATABASE_URL="postgresql://teaching_user:6666667@localhost:5432/class_case"
PORT=3000
BASE_URL="https://example.com"
CORS_ORIGINS=https://example.com,http://example.com
```

---

## 🧪 验证配置

### 1. 上传测试文件

```bash
# 使用 curl 上传图片
curl -X POST http://localhost:3000/media/upload \
  -H "Authorization: Bearer <your-token>" \
  -F "file=@test.jpg"
```

### 2. 检查返回的URL

**修改前：**
```json
{
  "id": 1,
  "type": "IMAGE",
  "url": "http://localhost:3000/uploads/images/1234567890_abc123.jpg"
}
```

**修改后：**
```json
{
  "id": 1,
  "type": "IMAGE",
  "url": "http://8.8.8.8:8787/uploads/images/1234567890_abc123.jpg"
}
```

### 3. 验证文件可访问

```bash
# 测试文件是否可以访问
curl -I http://8.8.8.8:8787/uploads/images/1234567890_abc123.jpg

# 应该返回 200 OK
HTTP/1.1 200 OK
Content-Type: image/jpeg
...
```

在浏览器中打开URL，应该能看到图片。

---

## ⚠️ 常见错误

### 错误 1：URL中包含端口但实际不需要

```bash
# ❌ 错误：使用了标准80端口但仍然包含端口号
BASE_URL="http://example.com:80"

# ✅ 正确：标准端口不需要写
BASE_URL="http://example.com"
```

### 错误 2：协议不匹配

```bash
# ❌ 错误：配置了HTTPS但实际使用HTTP
BASE_URL="https://example.com"
# 而Nginx只配置了HTTP

# ✅ 正确：与Nginx配置保持一致
BASE_URL="http://example.com:8787"
```

### 错误 3：端口号错误

```bash
# ❌ 错误：使用了后端端口
BASE_URL="http://example.com:3000"

# ✅ 正确：使用Nginx端口
BASE_URL="http://example.com:8787"
```

### 错误 4：CORS和BASE_URL不一致

```bash
# ❌ 错误：BASE_URL和CORS_ORIGINS使用不同的域名
BASE_URL="http://8.8.8.8:8787"
CORS_ORIGINS="http://example.com:8787"

# ✅ 正确：保持一致
BASE_URL="http://8.8.8.8:8787"
CORS_ORIGINS="http://8.8.8.8:8787"
```

---

## 🔧 快速修复脚本

在服务器上运行：

```bash
#!/bin/bash
cd ~/apps/teaching-case-service

# 获取服务器IP（自动检测）
SERVER_IP=$(curl -s ifconfig.me)
echo "检测到服务器IP: $SERVER_IP"

# 备份 .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# 更新 BASE_URL
if grep -q "^BASE_URL=" .env; then
    # BASE_URL 已存在，更新它
    sed -i "s|^BASE_URL=.*|BASE_URL=\"http://${SERVER_IP}:8787\"|" .env
    echo "✓ 已更新 BASE_URL"
else
    # BASE_URL 不存在，添加它
    echo "BASE_URL=\"http://${SERVER_IP}:8787\"" >> .env
    echo "✓ 已添加 BASE_URL"
fi

# 显示当前配置
echo ""
echo "当前配置："
grep -E "BASE_URL|CORS_ORIGINS" .env

echo ""
echo "重启应用以使配置生效："
echo "pm2 restart teaching-case-service"
```

保存为 `fix-media-url.sh` 并运行：

```bash
chmod +x fix-media-url.sh
./fix-media-url.sh
```

---

## 🎯 不同部署场景的配置

### 场景 1：单服务器，使用IP访问

```bash
# .env 配置
BASE_URL="http://8.8.8.8:8787"
CORS_ORIGINS="http://8.8.8.8:8787"
```

**访问地址：**
- 后台：`http://8.8.8.8:8787/admin`
- 媒体：`http://8.8.8.8:8787/uploads/images/xxx.jpg`

### 场景 2：使用域名，HTTP + 非标准端口

```bash
# .env 配置
BASE_URL="http://example.com:8787"
CORS_ORIGINS="http://example.com:8787"
```

**访问地址：**
- 后台：`http://example.com:8787/admin`
- 媒体：`http://example.com:8787/uploads/images/xxx.jpg`

### 场景 3：使用域名，HTTPS（推荐）

```bash
# .env 配置
BASE_URL="https://example.com"
CORS_ORIGINS="https://example.com,http://example.com"
```

**访问地址：**
- 后台：`https://example.com/admin`
- 媒体：`https://example.com/uploads/images/xxx.jpg`

### 场景 4：前后端分离

```bash
# 后端 .env 配置
BASE_URL="https://api.example.com"
CORS_ORIGINS="https://www.example.com,https://admin.example.com"
```

**访问地址：**
- API：`https://api.example.com`
- 前端：`https://www.example.com`
- 后台：`https://admin.example.com`
- 媒体：`https://api.example.com/uploads/images/xxx.jpg`

---

## 🔍 调试技巧

### 1. 检查当前配置

```bash
# 查看 .env 中的 BASE_URL
cd ~/apps/teaching-case-service
cat .env | grep BASE_URL

# 查看应用是否读取到正确的环境变量
pm2 logs teaching-case-service | grep -i base
```

### 2. 测试上传并查看URL

```bash
# 上传测试文件
curl -X POST http://localhost:3000/media/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@test.jpg" \
  | jq '.url'

# 应该输出：
# "http://8.8.8.8:8787/uploads/images/xxx.jpg"
```

### 3. 验证文件可访问

```bash
# 从返回的URL复制，测试访问
curl -I http://8.8.8.8:8787/uploads/images/xxx.jpg

# 应该返回 200 OK
```

### 4. 浏览器开发者工具

在后台上传文件后：
1. 按 F12 打开开发者工具
2. 切换到 Network 标签
3. 查看上传请求的响应
4. 检查返回的 `url` 字段

---

## 📝 配置检查清单

部署前检查：

- [ ] `.env` 文件中已配置 `BASE_URL`
- [ ] `BASE_URL` 使用 Nginx 地址（不是 localhost:3000）
- [ ] `BASE_URL` 包含正确的协议（http/https）
- [ ] `BASE_URL` 包含正确的端口（如果需要）
- [ ] `CORS_ORIGINS` 与 `BASE_URL` 使用相同的域名
- [ ] 应用已重启（`pm2 restart`）
- [ ] 上传测试文件验证URL正确
- [ ] 浏览器可以访问上传的媒体文件

---

## 🚨 紧急修复

如果生产环境已经有错误的URL数据：

### 批量更新数据库中的URL

```sql
-- 连接数据库
psql -h localhost -U teaching_user -d class_case

-- 查看当前URL
SELECT id, url FROM "Media" LIMIT 5;

-- 批量更新URL（将 localhost:3000 替换为实际地址）
UPDATE "Media"
SET url = REPLACE(url, 'http://localhost:3000', 'http://8.8.8.8:8787')
WHERE url LIKE 'http://localhost:3000%';

-- 验证更新
SELECT id, url FROM "Media" LIMIT 5;
```

**注意：** 执行前请先备份数据库！

```bash
# 备份数据库
pg_dump -h localhost -U teaching_user class_case > backup_$(date +%Y%m%d).sql
```

---

## 💡 最佳实践

### 1. 使用环境变量

```bash
# .env.production
BASE_URL="https://example.com"

# .env.development
BASE_URL="http://localhost:3000"
```

### 2. 使用CDN（可选）

如果使用CDN加速媒体文件：

```bash
# .env
BASE_URL="https://cdn.example.com"
```

然后在CDN配置源站：
```
源站地址：https://example.com
回源路径：/uploads/*
```

### 3. 动态域名支持

如果需要支持多个域名：

```typescript
// 修改 media.service.ts
const host = req.get('host'); // 从请求中获取域名
const protocol = req.protocol; // 从请求中获取协议
const baseUrl = `${protocol}://${host}`;
const fileUrl = `${baseUrl}/uploads/${subDir}/${fileName}`;
```

---

## 🔗 URL结构说明

### 完整URL结构

```
https://example.com:8787/uploads/images/1234567890_abc123.jpg
│      │          │    │              │                     │
│      │          │    │              │                     └─ 文件名
│      │          │    │              └─────────────────────── 子目录(images/videos)
│      │          │    └────────────────────────────────────── URL路径前缀
│      │          └─────────────────────────────────────────── 端口
│      └────────────────────────────────────────────────────── 域名
└───────────────────────────────────────────────────────────── 协议
```

### 各部分来源

| 部分                   | 来源          | 配置位置     |
| ---------------------- | ------------- | ------------ |
| 协议                   | `BASE_URL`    | `.env` 文件  |
| 域名/IP                | `BASE_URL`    | `.env` 文件  |
| 端口                   | `BASE_URL`    | `.env` 文件  |
| `/uploads`             | 固定          | 代码中       |
| `/images` 或 `/videos` | 文件类型      | 代码自动判断 |
| 文件名                 | 时间戳+随机数 | 代码自动生成 |

---

## 📊 配置示例对比

### 开发环境
```bash
# .env
BASE_URL="http://localhost:3000"
PORT=3000
CORS_ORIGINS="http://localhost:8000,http://localhost:3000"
```

**上传后的URL：**
```
http://localhost:3000/uploads/images/1234567890_abc123.jpg
```

**访问方式：**
- 直接访问：`http://localhost:3000/uploads/...`

---

### 生产环境 - IP访问
```bash
# .env
BASE_URL="http://8.8.8.8:8787"
PORT=3000
CORS_ORIGINS="http://8.8.8.8:8787"
```

**上传后的URL：**
```
http://8.8.8.8:8787/uploads/images/1234567890_abc123.jpg
```

**访问方式：**
- 通过Nginx：`http://8.8.8.8:8787/uploads/...`
- Nginx转发到本地文件系统

---

### 生产环境 - 域名访问
```bash
# .env
BASE_URL="http://example.com:8787"
PORT=3000
CORS_ORIGINS="http://example.com:8787"
```

**上传后的URL：**
```
http://example.com:8787/uploads/images/1234567890_abc123.jpg
```

**访问方式：**
- 通过域名：`http://example.com:8787/uploads/...`

---

### 生产环境 - HTTPS
```bash
# .env
BASE_URL="https://example.com"
PORT=3000
CORS_ORIGINS="https://example.com,http://example.com"
```

**上传后的URL：**
```
https://example.com/uploads/images/1234567890_abc123.jpg
```

**访问方式：**
- HTTPS访问：`https://example.com/uploads/...`

---

## 🔄 已有数据的迁移

如果生产环境已经上传了文件，但URL不正确，需要批量更新：

### SQL脚本

```sql
-- 备份原始数据
CREATE TABLE "Media_backup" AS SELECT * FROM "Media";

-- 更新所有媒体文件的URL
-- 场景1：从 localhost:3000 改为 IP:8787
UPDATE "Media"
SET url = REPLACE(url, 'http://localhost:3000', 'http://8.8.8.8:8787')
WHERE url LIKE 'http://localhost:3000%';

-- 场景2：从 localhost:3000 改为域名
UPDATE "Media"
SET url = REPLACE(url, 'http://localhost:3000', 'http://example.com:8787')
WHERE url LIKE 'http://localhost:3000%';

-- 场景3：从 HTTP 改为 HTTPS
UPDATE "Media"
SET url = REPLACE(url, 'http://example.com:8787', 'https://example.com')
WHERE url LIKE 'http://example.com:8787%';

-- 验证更新结果
SELECT id, url FROM "Media" LIMIT 10;

-- 如果有问题，可以从备份恢复
-- DELETE FROM "Media";
-- INSERT INTO "Media" SELECT * FROM "Media_backup";
```

### 执行迁移

```bash
# 1. 备份数据库
pg_dump -h localhost -U teaching_user class_case > media_backup_$(date +%Y%m%d).sql

# 2. 执行SQL更新
psql -h localhost -U teaching_user -d class_case << EOF
UPDATE "Media"
SET url = REPLACE(url, 'http://localhost:3000', 'http://8.8.8.8:8787')
WHERE url LIKE 'http://localhost:3000%';
EOF

# 3. 验证
psql -h localhost -U teaching_user -d class_case -c "SELECT COUNT(*) FROM \"Media\" WHERE url LIKE '%8.8.8.8:8787%';"
```

---

## 📌 重要提示

### 1. 修改 BASE_URL 后必须重启

```bash
pm2 restart teaching-case-service
```

### 2. 修改后只影响新上传的文件

已经上传的文件URL不会自动更新，需要手动迁移（见上文）。

### 3. Nginx 配置必须正确

确保 Nginx 正确配置了静态文件服务：

```nginx
# nginx.conf
location /uploads {
    alias /home/deploy/apps/teaching-case-service/uploads;
    expires 30d;
    add_header Cache-Control "public, immutable";
    add_header Access-Control-Allow-Origin *;
}
```

### 4. 文件路径与URL的对应关系

```
URL:  http://example.com:8787/uploads/images/test.jpg
       ↓
Nginx: location /uploads → alias /home/.../uploads
       ↓
文件: /home/deploy/apps/teaching-case-service/uploads/images/test.jpg
```

---

## 🆘 故障排查

### 问题：上传成功但URL仍是 localhost

**检查：**
```bash
# 1. 确认 .env 配置
cat .env | grep BASE_URL

# 2. 确认应用已重启
pm2 logs teaching-case-service | head -20

# 3. 测试上传
curl -X POST http://localhost:3000/media/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@test.jpg" | jq '.url'
```

### 问题：URL正确但无法访问

**检查：**
```bash
# 1. 文件是否存在
ls -la ~/apps/teaching-case-service/uploads/images/

# 2. 文件权限
chmod -R 755 ~/apps/teaching-case-service/uploads/

# 3. Nginx配置
sudo nginx -t
sudo cat /etc/nginx/conf.d/teaching-case.conf | grep -A 5 "location /uploads"

# 4. SELinux
sudo chcon -R -t httpd_sys_content_t ~/apps/teaching-case-service/uploads/
```

---

## 📚 相关文档

- [部署快速指南](./DEPLOYMENT_QUICKSTART.md) - 第115-127行
- [Nginx 配置详解](./NGINX_CONFIG_EXPLAINED.md) - 静态文件服务部分
- [CORS 配置指南](./CORS_CONFIG_GUIDE.md)

---

*媒体文件URL配置指南 - v1.0*

