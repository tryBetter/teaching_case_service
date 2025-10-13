# Nginx 配置文件详解

本文档详细解释 `nginx.conf.example` 中每个配置项的作用和意义。

---

## 📋 配置文件结构概览

```
nginx.conf.example
├── HTTP 服务器配置（8787 端口）
│   ├── 基本设置
│   ├── 日志配置
│   ├── 上传和超时设置
│   ├── 路由规则（location）
│   └── 静态文件服务
└── HTTPS 服务器配置（注释）
    └── SSL 证书和安全配置
```

---

## 🔧 第一部分：HTTP 服务器配置

### 1. 服务器监听端口

```nginx
server {
    listen 8787;
    server_name your-domain.com www.your-domain.com;
```

**作用：**
- `listen 8787` - Nginx 监听 **8787 端口**，接收 HTTP 请求
- `server_name` - 配置域名，支持多个域名（用空格分隔）

**为什么用 8787？**
- 避免占用标准的 80 端口（可能被其他服务使用）
- 云服务器上可能需要在安全组开放此端口

**实际使用时需要修改：**
```nginx
server_name example.com www.example.com;  # 替换为你的实际域名
# 或者只用 IP
server_name _;  # 接受任何域名/IP 的请求
```

---

### 2. 日志配置

```nginx
access_log /var/log/nginx/teaching-case-access.log;
error_log /var/log/nginx/teaching-case-error.log;
```

**作用：**
- `access_log` - 记录所有访问请求（谁访问了、什么时间、访问了什么）
- `error_log` - 记录错误信息（500 错误、代理失败等）

**日志示例：**

```bash
# 访问日志
192.168.1.100 - [13/Oct/2025:10:30:45 +0800] "GET /api/articles HTTP/1.1" 200 1234

# 错误日志
2025/10/13 10:30:45 [error] 12345#0: *1 connect() failed (111: Connection refused)
```

**查看日志命令：**
```bash
# 查看访问日志
sudo tail -f /var/log/nginx/teaching-case-access.log

# 查看错误日志
sudo tail -f /var/log/nginx/teaching-case-error.log
```

---

### 3. 文件上传大小限制

```nginx
client_max_body_size 1024M;
```

**作用：**
- 限制客户端上传文件的**最大大小**
- `1024M` = 1GB

**为什么需要这个？**
- 本项目支持**视频上传**，视频文件通常较大
- 默认 Nginx 限制是 **1MB**，如果不设置，上传大文件会失败

**常见错误（如果不设置）：**
```
413 Request Entity Too Large
```

**根据需求调整：**
```nginx
client_max_body_size 100M;   # 最大 100MB
client_max_body_size 2048M;  # 最大 2GB
```

---

### 4. 代理超时设置

```nginx
proxy_connect_timeout 600;
proxy_send_timeout 600;
proxy_read_timeout 600;
send_timeout 600;
```

**作用：**
- 设置与后端服务器通信的**超时时间**
- 单位：秒（600秒 = 10分钟）

**各个超时的含义：**

| 配置项                  | 含义                   | 场景                       |
| ----------------------- | ---------------------- | -------------------------- |
| `proxy_connect_timeout` | 与后端建立连接的超时   | 后端启动慢或网络慢         |
| `proxy_send_timeout`    | 向后端发送数据的超时   | 上传大文件                 |
| `proxy_read_timeout`    | 从后端读取响应的超时   | 后端处理慢（如生成大报表） |
| `send_timeout`          | 向客户端发送响应的超时 | 客户端网络慢               |

**为什么设置 600 秒？**
- 上传大视频文件需要时间
- 某些 API 处理复杂业务需要时间
- 防止上传中途超时中断

**如果超时太短会发生什么？**
```
504 Gateway Timeout  # 后端处理超时
502 Bad Gateway      # 连接后端失败
```

---

### 5. API 接口代理规则

```nginx
location /api {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

**作用：** 将所有 `/api` 开头的请求转发到后端 Node.js 服务

**工作流程：**
```
客户端请求: http://example.com:8787/api/articles
          ↓
Nginx 接收: /api/articles
          ↓
转发到: http://localhost:3000/api/articles
          ↓
NestJS 后端处理
```

**各个配置项详解：**

#### `proxy_pass http://localhost:3000;`
- 将请求转发到后端服务（运行在本机 3000 端口）
- **必须与后端实际端口一致**

#### `proxy_http_version 1.1;`
- 使用 HTTP/1.1 协议
- 支持长连接（keep-alive）和 WebSocket

#### `proxy_set_header Upgrade $http_upgrade;`
- 支持 WebSocket 协议升级
- 允许建立双向通信连接

#### `proxy_set_header Connection 'upgrade';`
- 配合 Upgrade 使用
- 告诉后端这是一个升级连接

#### `proxy_set_header Host $host;`
- 传递原始请求的 Host 头
- 后端可以知道客户端请求的域名

示例：
```
客户端请求: example.com:8787
后端收到: Host: example.com:8787
```

#### `proxy_set_header X-Real-IP $remote_addr;`
- 传递客户端的**真实 IP 地址**
- 后端日志可以记录真实访问者 IP

示例：
```
客户端 IP: 192.168.1.100
后端收到: X-Real-IP: 192.168.1.100
```

#### `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`
- 记录请求经过的所有代理服务器 IP
- 完整的客户端到服务器的路径

示例：
```
X-Forwarded-For: 192.168.1.100, 10.0.0.1, 172.16.0.1
                 ↑客户端IP    ↑代理1    ↑代理2
```

#### `proxy_set_header X-Forwarded-Proto $scheme;`
- 传递原始请求的协议（http 或 https）
- 后端可以判断是否是安全连接

示例：
```
客户端使用 HTTPS 访问
后端收到: X-Forwarded-Proto: https
```

#### `proxy_cache_bypass $http_upgrade;`
- WebSocket 连接不使用缓存
- 保证实时通信

---

### 6. 后台管理界面代理

```nginx
location /admin {
    proxy_pass http://localhost:3000;
    # ... 其他配置同 /api
}
```

**作用：** 将 `/admin` 路径的请求转发到后端

**访问流程：**
```
浏览器访问: http://example.com:8787/admin
          ↓
Nginx 转发: http://localhost:3000/admin
          ↓
NestJS 返回管理后台 HTML 页面
```

**为什么单独配置？**
- 可以为管理后台设置特殊规则（如 IP 白名单）
- 便于后续添加访问控制

---

### 7. 根路径代理

```nginx
location / {
    proxy_pass http://localhost:3000;
    # ... 其他配置同 /api
}
```

**作用：** 处理所有其他路径的请求

**优先级：**
```
1. /api/xxx     → 匹配 location /api
2. /admin/xxx   → 匹配 location /admin
3. /uploads/xxx → 匹配 location /uploads（静态文件）
4. /其他         → 匹配 location /（兜底规则）
```

**示例：**
```
http://example.com:8787/         → location /
http://example.com:8787/health   → location /
http://example.com:8787/api      → location /api
```

---

### 8. 静态文件服务

```nginx
location /uploads {
    alias /home/deploy/apps/teaching-case-service/uploads;
    expires 30d;
    add_header Cache-Control "public, immutable";
    add_header Access-Control-Allow-Origin *;
}
```

**作用：** 直接提供上传的图片、视频等静态文件

#### `alias /home/deploy/apps/teaching-case-service/uploads;`
- 指定静态文件的**实际存储路径**
- **必须修改为你的实际项目路径**

**工作原理：**
```
客户端请求: http://example.com:8787/uploads/images/photo.jpg
          ↓
Nginx 映射: /home/deploy/apps/teaching-case-service/uploads/images/photo.jpg
          ↓
直接返回文件（不经过 Node.js）
```

**alias vs root 的区别：**
```nginx
# 使用 alias（本配置使用）
location /uploads {
    alias /var/www/uploads;
}
# 请求 /uploads/a.jpg → 实际文件 /var/www/uploads/a.jpg

# 使用 root（不同）
location /uploads {
    root /var/www;
}
# 请求 /uploads/a.jpg → 实际文件 /var/www/uploads/a.jpg
```

#### `expires 30d;`
- 设置浏览器缓存时间为 **30 天**
- 减少服务器负载，加快访问速度

**浏览器行为：**
```
第一次访问: 下载文件并缓存 30 天
30天内再访问: 直接使用缓存，不请求服务器
```

#### `add_header Cache-Control "public, immutable";`
- `public` - 允许任何缓存（CDN、代理）缓存
- `immutable` - 告诉浏览器文件永不改变，可以一直使用缓存

**适用场景：**
- 文件名包含哈希值（如 `photo-abc123.jpg`）
- 文件上传后不会修改

#### `add_header Access-Control-Allow-Origin *;`
- 允许所有域名跨域访问这些静态文件
- 支持在其他网站上引用图片/视频

**示例场景：**
```html
<!-- 其他网站可以引用你的图片 -->
<img src="http://your-domain.com:8787/uploads/images/photo.jpg">
```

---

## 🔒 第二部分：HTTPS 配置（注释部分）

这部分配置默认是注释的，配置 SSL 证书后可以启用。

### 1. HTTPS 服务器

```nginx
# server {
#     listen 443 ssl http2;
#     server_name your-domain.com www.your-domain.com;
```

**作用：**
- `listen 443` - HTTPS 默认端口
- `ssl` - 启用 SSL/TLS 加密
- `http2` - 启用 HTTP/2 协议（更快）

### 2. SSL 证书配置

```nginx
#     ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
```

**作用：**
- 指定 SSL 证书文件位置
- 通常由 Let's Encrypt 免费提供

**获取证书：**
```bash
# 使用 Certbot 自动获取
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 3. SSL 安全配置

```nginx
#     ssl_protocols TLSv1.2 TLSv1.3;
#     ssl_ciphers HIGH:!aNULL:!MD5;
#     ssl_prefer_server_ciphers on;
```

**作用：**
- `ssl_protocols` - 只允许安全的 TLS 协议版本
- `ssl_ciphers` - 使用强加密算法
- `ssl_prefer_server_ciphers` - 优先使用服务器的加密套件

### 4. HTTP 重定向到 HTTPS

```nginx
# server {
#     listen 8787;
#     server_name your-domain.com www.your-domain.com;
#     return 301 https://$server_name$request_uri;
# }
```

**作用：** 自动将 HTTP 请求重定向到 HTTPS

**工作流程：**
```
客户端访问: http://example.com:8787/admin
          ↓
Nginx 返回: 301 重定向到 https://example.com/admin
          ↓
浏览器自动访问 HTTPS 版本
```

---

## 📊 完整请求流程示例

### 示例 1：访问 API

```
1. 用户在浏览器输入: http://example.com:8787/api/articles

2. DNS 解析: example.com → 服务器 IP (8.8.8.8)

3. 请求到达服务器: 8.8.8.8:8787

4. Nginx 接收请求:
   - 匹配到 location /api
   - 转发到 http://localhost:3000/api/articles

5. NestJS 后端:
   - 接收请求
   - 查询数据库
   - 返回 JSON 数据

6. Nginx 返回给客户端:
   - 添加响应头（CORS、缓存等）
   - 发送给浏览器

7. 浏览器显示数据
```

### 示例 2：访问上传的图片

```
1. 用户访问: http://example.com:8787/uploads/images/photo.jpg

2. Nginx 接收请求:
   - 匹配到 location /uploads
   - 直接读取文件: /home/deploy/apps/teaching-case-service/uploads/images/photo.jpg

3. Nginx 返回文件:
   - 添加缓存头: Cache-Control: public, immutable
   - 设置过期时间: Expires: 30 days
   - 添加 CORS 头: Access-Control-Allow-Origin: *

4. 浏览器缓存图片（30天内不再请求）
```

### 示例 3：上传大文件

```
1. 用户上传 500MB 视频

2. Nginx 接收上传:
   - 检查 client_max_body_size: 1024M ✓ 允许
   - 转发到后端: http://localhost:3000/api/media/upload

3. 等待上传完成:
   - proxy_send_timeout: 600s（10分钟）✓ 足够
   - 文件传输到后端

4. NestJS 后端:
   - 保存到 uploads/ 目录
   - 返回文件 URL

5. 客户端收到响应
```

---

## 🛠️ 实际部署时需要修改的地方

### 1. 域名配置

```nginx
# 修改为你的实际域名
server_name example.com www.example.com;

# 或者使用 IP（接受所有请求）
server_name _;
```

### 2. 项目路径

```nginx
# 修改为你的实际项目路径
alias /home/your-user/apps/teaching-case-service/uploads;
```

### 3. 后端端口（如果修改了）

```nginx
# 如果后端不是 3000 端口，需要修改
proxy_pass http://localhost:3000;  # 改为实际端口
```

### 4. 端口号（如果 8787 被占用）

```nginx
# 改为其他端口
listen 9000;  # 或其他可用端口
```

---

## 🔍 常见问题

### Q1: 为什么有三个 location？

**A:** 不同的路径有不同的处理方式：
- `/api` - API 接口，需要转发到后端
- `/admin` - 管理后台，需要转发到后端
- `/uploads` - 静态文件，Nginx 直接提供（更快）
- `/` - 其他路径，兜底规则

### Q2: proxy_set_header 设置的头后端能收到吗？

**A:** 能！后端可以通过以下方式获取：

```typescript
// NestJS 中获取真实 IP
@Get()
getClientIp(@Headers('x-real-ip') ip: string) {
  console.log('Client IP:', ip);
}

// 获取协议
@Get()
getProtocol(@Headers('x-forwarded-proto') proto: string) {
  console.log('Protocol:', proto); // http 或 https
}
```

### Q3: 为什么静态文件不经过 Node.js？

**A:** 性能优化！
- Nginx 直接提供静态文件速度更快
- 减轻 Node.js 负担
- 可以充分利用 Nginx 的缓存功能

**性能对比：**
```
Nginx 直接提供: ~0.1ms
经过 Node.js:   ~10ms（慢 100 倍）
```

### Q4: 如何限制只有特定 IP 可以访问管理后台？

**A:** 在 `/admin` location 中添加：

```nginx
location /admin {
    # 只允许这些 IP 访问
    allow 192.168.1.100;
    allow 10.0.0.0/24;
    deny all;
    
    proxy_pass http://localhost:3000;
    # ... 其他配置
}
```

---

## 📋 配置检查清单

部署前检查：

- [ ] `server_name` 已修改为实际域名或 `_`
- [ ] `alias` 路径已修改为实际项目路径
- [ ] `proxy_pass` 端口与后端一致（默认 3000）
- [ ] 防火墙已开放 8787 端口
- [ ] 日志目录存在且有写权限
- [ ] 配置文件语法正确（`nginx -t`）
- [ ] 静态文件目录存在（`uploads/`）

---

## 🚀 快速测试命令

```bash
# 1. 测试配置语法
sudo nginx -t

# 2. 重新加载配置
sudo systemctl reload nginx

# 3. 测试 API 代理
curl http://localhost:8787/api

# 4. 测试静态文件
curl http://localhost:8787/uploads/test.txt

# 5. 查看日志
sudo tail -f /var/log/nginx/teaching-case-access.log
```

---

*Nginx 配置详解 - v1.0*

