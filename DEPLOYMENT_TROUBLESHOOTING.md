# 部署故障排查指南

## 🔍 快速诊断脚本

在服务器上运行以下命令进行全面检查：

```bash
#!/bin/bash
echo "=========================================="
echo "教学案例服务 - 故障诊断"
echo "=========================================="
echo ""

# 1. 检查后端服务状态
echo "1️⃣ 检查后端服务 (PM2)"
echo "----------------------------------------"
pm2 status
pm2 info teaching-case-service 2>/dev/null || echo "❌ PM2 应用未找到"
echo ""

# 2. 检查端口占用
echo "2️⃣ 检查端口占用"
echo "----------------------------------------"
echo "后端服务 (3000):"
sudo netstat -tlnp | grep :3000 || echo "❌ 端口 3000 未被监听"
echo "Nginx 服务 (8787):"
sudo netstat -tlnp | grep :8787 || echo "❌ 端口 8787 未被监听"
echo ""

# 3. 检查 Nginx 状态
echo "3️⃣ 检查 Nginx 状态"
echo "----------------------------------------"
sudo systemctl status nginx | head -n 10
echo ""

# 4. 检查防火墙
echo "4️⃣ 检查防火墙端口"
echo "----------------------------------------"
sudo firewall-cmd --list-ports
echo ""

# 5. 检查 SELinux
echo "5️⃣ 检查 SELinux 状态"
echo "----------------------------------------"
getenforce
sudo getsebool httpd_can_network_connect 2>/dev/null || echo "未设置"
echo ""

# 6. 测试本地连接
echo "6️⃣ 测试本地连接"
echo "----------------------------------------"
echo "测试后端 API:"
curl -s http://localhost:3000/api || echo "❌ 后端 API 无法访问"
echo ""
echo "测试 Nginx 代理:"
curl -s http://localhost:8787/api || echo "❌ Nginx 代理无法访问"
echo ""

# 7. 检查最近的错误日志
echo "7️⃣ 最近的错误日志"
echo "----------------------------------------"
echo "PM2 错误日志:"
pm2 logs teaching-case-service --lines 5 --nostream --err 2>/dev/null
echo ""
echo "Nginx 错误日志:"
sudo tail -n 5 /var/log/nginx/teaching-case-error.log 2>/dev/null || echo "日志文件不存在"
echo ""

echo "=========================================="
echo "诊断完成！"
echo "=========================================="
```

将上述脚本保存为 `diagnose.sh`，然后运行：

```bash
chmod +x diagnose.sh
./diagnose.sh
```

---

## 🛠️ 分步骤排查

### 步骤 1：检查后端服务是否运行

```bash
# 查看 PM2 状态
pm2 status

# 如果服务未运行或状态异常，查看日志
pm2 logs teaching-case-service --lines 50

# 重启服务
pm2 restart teaching-case-service

# 如果 PM2 中没有应用，启动它
cd ~/apps/teaching-case-service
pm2 start ecosystem.config.js
```

**预期结果：** `teaching-case-service` 状态应该是 `online`

---

### 步骤 2：检查端口是否被监听

```bash
# 检查后端服务端口 3000
sudo netstat -tlnp | grep :3000

# 检查 Nginx 端口 8787
sudo netstat -tlnp | grep :8787
```

**预期结果：**
```
tcp6  0  0 :::3000   :::*   LISTEN   12345/node
tcp   0  0 0.0.0.0:8787   0.0.0.0:*   LISTEN   67890/nginx
```

**如果端口 3000 未监听：**
```bash
# 查看后端日志找出原因
pm2 logs teaching-case-service

# 常见问题：
# - 数据库连接失败
# - 端口被占用
# - 环境变量配置错误
```

**如果端口 8787 未监听：**
```bash
# 检查 Nginx 配置
sudo nginx -t

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 重启 Nginx
sudo systemctl restart nginx
```

---

### 步骤 3：检查 Nginx 配置

```bash
# 测试 Nginx 配置是否正确
sudo nginx -t

# 查看配置文件
sudo cat /etc/nginx/conf.d/teaching-case.conf

# 确保配置文件存在且正确
ls -la /etc/nginx/conf.d/
```

**检查要点：**
- [ ] 配置文件是否存在于 `/etc/nginx/conf.d/`
- [ ] `listen 8787;` 端口配置正确
- [ ] `proxy_pass http://localhost:3000;` 代理地址正确
- [ ] 没有语法错误

**修复配置：**
```bash
# 如果配置不存在或有误，重新复制
cd ~/apps/teaching-case-service
sudo cp nginx.conf.example /etc/nginx/conf.d/teaching-case.conf

# 编辑配置
sudo vim /etc/nginx/conf.d/teaching-case.conf
# 修改域名、路径等配置

# 测试并重启
sudo nginx -t
sudo systemctl restart nginx
```

---

### 步骤 4：检查防火墙

```bash
# 查看防火墙状态
sudo systemctl status firewalld

# 查看已开放的端口
sudo firewall-cmd --list-ports

# 查看所有规则
sudo firewall-cmd --list-all
```

**如果端口未开放：**
```bash
# 开放 8787 端口
sudo firewall-cmd --permanent --add-port=8787/tcp
sudo firewall-cmd --reload

# 验证
sudo firewall-cmd --list-ports
```

**临时关闭防火墙测试（不推荐生产环境）：**
```bash
# 临时停止防火墙（仅用于测试）
sudo systemctl stop firewalld

# 测试访问
curl http://localhost:8787/api

# 如果可以访问，说明是防火墙问题，记得重新启动并正确配置
sudo systemctl start firewalld
```

---

### 步骤 5：检查 SELinux

```bash
# 查看 SELinux 状态
getenforce

# 查看 Nginx 是否允许网络连接
getsebool httpd_can_network_connect
```

**如果 SELinux 阻止连接：**
```bash
# 允许 Nginx 网络连接
sudo setsebool -P httpd_can_network_connect 1

# 如果还有问题，查看 SELinux 日志
sudo tail -f /var/log/audit/audit.log | grep denied

# 临时禁用 SELinux 测试（不推荐生产环境）
sudo setenforce 0

# 测试访问后，如果解决问题，重新启用并正确配置
sudo setenforce 1
```

---

### 步骤 6：测试本地连接

```bash
# 测试后端服务直接访问
curl http://localhost:3000/api

# 测试通过 Nginx 访问
curl http://localhost:8787/api

# 测试通过服务器 IP 访问
curl http://127.0.0.1:8787/api
```

**预期结果：**
```json
{"message":"Welcome to Teaching Case API"}
```

**如果本地可以访问，但外网不能访问：**
- 检查云服务器安全组规则
- 检查云服务商的防火墙设置
- 检查是否有其他网络设备阻拦

---

### 步骤 7：检查云服务器安全组（重要！）

如果使用阿里云、腾讯云、AWS 等云服务器：

**阿里云 ECS：**
1. 登录阿里云控制台
2. 进入 ECS 实例
3. 点击"安全组配置"
4. 添加入方向规则：
   - 端口：`8787/8787`
   - 授权对象：`0.0.0.0/0`
   - 协议：`TCP`

**腾讯云 CVM：**
1. 登录腾讯云控制台
2. 进入云服务器实例
3. 点击"安全组"
4. 编辑入站规则，添加：
   - 类型：自定义 TCP
   - 端口：`8787`
   - 来源：`0.0.0.0/0`

**AWS EC2：**
1. 登录 AWS 控制台
2. 进入 EC2 实例
3. 点击"安全组"
4. 编辑入站规则，添加：
   - 类型：自定义 TCP
   - 端口：`8787`
   - 源：`0.0.0.0/0`

---

### 步骤 8：检查数据库连接

```bash
# 查看 PM2 日志，检查数据库连接错误
pm2 logs teaching-case-service --lines 100 | grep -i "error\|database\|connection"

# 测试数据库连接
cd ~/apps/teaching-case-service
psql -h localhost -U teaching_user -d class_case -c "SELECT 1;"

# 检查 .env 配置
cat .env | grep DATABASE_URL
```

---

### 步骤 9：查看详细日志

```bash
# PM2 日志
pm2 logs teaching-case-service --lines 100

# 只看错误日志
pm2 logs teaching-case-service --err --lines 50

# Nginx 访问日志
sudo tail -f /var/log/nginx/teaching-case-access.log

# Nginx 错误日志
sudo tail -f /var/log/nginx/teaching-case-error.log

# 系统日志
sudo journalctl -u nginx -n 50
```

---

## 📋 常见问题及解决方案

### 问题 1：502 Bad Gateway

**原因：** Nginx 无法连接到后端服务

**解决方案：**
```bash
# 1. 确保后端服务运行
pm2 status

# 2. 检查后端是否监听 3000 端口
sudo netstat -tlnp | grep :3000

# 3. 检查 SELinux
sudo setsebool -P httpd_can_network_connect 1

# 4. 重启服务
pm2 restart teaching-case-service
sudo systemctl restart nginx
```

---

### 问题 2：Connection Refused

**原因：** 端口未开放或服务未启动

**解决方案：**
```bash
# 1. 检查防火墙
sudo firewall-cmd --permanent --add-port=8787/tcp
sudo firewall-cmd --reload

# 2. 检查服务状态
pm2 status
sudo systemctl status nginx

# 3. 检查云服务器安全组（见步骤 7）
```

---

### 问题 3：404 Not Found

**原因：** Nginx 配置路径不正确

**解决方案：**
```bash
# 检查 Nginx 配置
sudo nginx -t
sudo cat /etc/nginx/conf.d/teaching-case.conf

# 确保 location 配置正确
# location /api { proxy_pass http://localhost:3000; }
# location /admin { proxy_pass http://localhost:3000; }

# 重新加载配置
sudo systemctl reload nginx
```

---

### 问题 4：Database Connection Error

**原因：** 数据库未启动或连接配置错误

**解决方案：**
```bash
# 1. 检查 PostgreSQL 状态
sudo systemctl status postgresql-14

# 2. 启动数据库
sudo systemctl start postgresql-14

# 3. 检查 .env 配置
cd ~/apps/teaching-case-service
cat .env | grep DATABASE_URL

# 4. 测试连接
psql -h localhost -U teaching_user -d class_case

# 5. 重启应用
pm2 restart teaching-case-service
```

---

### 问题 5：Permission Denied

**原因：** 文件权限或 SELinux 问题

**解决方案：**
```bash
# 1. 检查项目目录权限
ls -la ~/apps/teaching-case-service

# 2. 检查上传目录权限
chmod -R 755 ~/apps/teaching-case-service/uploads

# 3. SELinux 配置
sudo setsebool -P httpd_can_network_connect 1
sudo chcon -R -t httpd_sys_content_t ~/apps/teaching-case-service/uploads
```

---

### 问题 6：CORS 跨域错误

**错误信息（浏览器控制台）：**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**原因：** 前端域名未在 CORS 允许列表中

**解决方案：**
```bash
# 1. 编辑 .env 文件
cd ~/apps/teaching-case-service
vim .env

# 2. 添加或修改 CORS_ORIGINS 配置
# 格式：多个域名用逗号分隔（不要有空格）
CORS_ORIGINS=http://你的服务器IP:8787,http://你的域名:8787,https://你的域名

# 例如：
# CORS_ORIGINS=http://8.8.8.8:8787,http://example.com:8787,https://example.com

# 3. 重启应用
pm2 restart teaching-case-service

# 4. 验证配置
pm2 logs teaching-case-service --lines 20
```

**注意事项：**
- 必须包含协议（http:// 或 https://）
- 端口号要正确（如 :8787）
- 不要在域名之间添加空格
- 如果使用 HTTPS，需要同时添加 HTTP 和 HTTPS 版本

---

### 问题 7：媒体文件URL是 localhost:3000

**错误信息：** 上传文件后返回的URL是 `http://localhost:3000/uploads/...`，无法在生产环境访问

**原因：** 环境变量 `BASE_URL` 未配置或配置错误

**解决方案：**
```bash
# 1. 编辑 .env 文件
cd ~/apps/teaching-case-service
vim .env

# 2. 修改 BASE_URL 为实际访问地址
# 使用IP: BASE_URL="http://8.8.8.8:8787"
# 使用域名: BASE_URL="http://example.com:8787"
# 使用HTTPS: BASE_URL="https://example.com"

# 3. 重启应用
pm2 restart teaching-case-service

# 4. 测试上传
curl -X POST http://localhost:3000/media/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@test.jpg" | grep url

# 应该返回正确的URL，如：
# "url": "http://8.8.8.8:8787/uploads/images/xxx.jpg"
```

**如果已有数据需要更新：**
```bash
# 批量更新数据库中的URL
psql -h localhost -U teaching_user -d class_case << EOF
-- 备份
CREATE TABLE "Media_backup" AS SELECT * FROM "Media";

-- 更新URL
UPDATE "Media"
SET url = REPLACE(url, 'http://localhost:3000', 'http://8.8.8.8:8787')
WHERE url LIKE 'http://localhost:3000%';
EOF
```

**详细文档：** 参考 [MEDIA_URL_CONFIG_GUIDE.md](./MEDIA_URL_CONFIG_GUIDE.md)

---

### 问题 8：超级管理员未创建

**错误信息：** 无法登录后台，提示用户不存在或密码错误

**原因：** 数据初始化脚本未执行

**解决方案：**
```bash
# 1. 进入项目目录
cd ~/apps/teaching-case-service

# 2. 检查环境变量
cat .env | grep -E 'SUPER_ADMIN|AUTO_CREATE'

# 3. 确保配置正确
# AUTO_CREATE_SUPER_ADMIN=true
# SUPER_ADMIN_EMAIL=admin@mail.com
# SUPER_ADMIN_PASSWORD=SuperAdmin123!

# 4. 运行数据初始化脚本
npm run seed

# 5. 验证超级管理员是否创建
psql -h localhost -U teaching_user -d class_case -c "
SELECT u.id, u.email, u.name, r.name as role 
FROM \"User\" u 
JOIN \"Role\" r ON u.\"roleId\" = r.id 
WHERE r.name = '超级管理员';
"

# 6. 测试登录
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mail.com",
    "password": "SuperAdmin123!"
  }'
```

**如果 seed 失败，手动创建：**
```bash
# 1. 生成密码哈希
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('SuperAdmin123!', 12).then(hash => console.log(hash));"

# 2. 复制哈希值，然后执行 SQL
psql -h localhost -U teaching_user -d class_case

# 在 psql 中执行：
INSERT INTO "User" (email, name, password, "roleId", status, "createdAt", "updatedAt")
VALUES (
    'admin@mail.com',
    '超级管理员',
    '<上面生成的密码哈希>',
    (SELECT id FROM "Role" WHERE name = '超级管理员'),
    'ACTIVE',
    NOW(),
    NOW()
);
```

**详细文档：** 参考 [SUPER_ADMIN_SETUP_FIX.md](./SUPER_ADMIN_SETUP_FIX.md)

---

## 🔧 完整重置和重新部署

如果以上方法都无效，尝试完全重置：

```bash
# 1. 停止所有服务
pm2 delete teaching-case-service
sudo systemctl stop nginx

# 2. 清理配置
sudo rm -f /etc/nginx/conf.d/teaching-case.conf

# 3. 进入项目目录
cd ~/apps/teaching-case-service

# 4. 拉取最新代码
git pull origin main

# 5. 重新安装依赖
npm install

# 6. 重新构建
npm run build

# 7. 运行数据库迁移
npx prisma generate
npx prisma migrate deploy

# 8. 初始化数据（重要！创建角色、权限、超级管理员）
npm run seed

# 9. 配置 Nginx
sudo cp nginx.conf.example /etc/nginx/conf.d/teaching-case.conf
sudo vim /etc/nginx/conf.d/teaching-case.conf  # 修改配置

# 10. 测试 Nginx 配置
sudo nginx -t

# 11. 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 12. 配置防火墙
sudo firewall-cmd --permanent --add-port=8787/tcp
sudo firewall-cmd --reload

# 13. 配置 SELinux
sudo setsebool -P httpd_can_network_connect 1

# 14. 启动应用
pm2 start ecosystem.config.js
pm2 save

# 15. 验证超级管理员
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mail.com","password":"SuperAdmin123!"}'

# 16. 测试访问
curl http://localhost:3000/api
curl http://localhost:8787/api
```

---

## 📞 获取帮助

如果问题仍未解决，请提供以下信息：

```bash
# 运行诊断脚本并保存结果
./diagnose.sh > diagnosis.txt 2>&1

# 或手动收集信息：
echo "=== PM2 状态 ===" > debug.txt
pm2 status >> debug.txt
echo "" >> debug.txt

echo "=== Nginx 状态 ===" >> debug.txt
sudo systemctl status nginx >> debug.txt
echo "" >> debug.txt

echo "=== 端口监听 ===" >> debug.txt
sudo netstat -tlnp | grep -E ':(3000|8787)' >> debug.txt
echo "" >> debug.txt

echo "=== 防火墙规则 ===" >> debug.txt
sudo firewall-cmd --list-all >> debug.txt
echo "" >> debug.txt

echo "=== PM2 日志 ===" >> debug.txt
pm2 logs teaching-case-service --lines 50 --nostream >> debug.txt
echo "" >> debug.txt

echo "=== Nginx 错误日志 ===" >> debug.txt
sudo tail -n 50 /var/log/nginx/teaching-case-error.log >> debug.txt

# 查看结果
cat debug.txt
```

将 `debug.txt` 内容发送给技术支持团队进行分析。

---

*故障排查指南 - v1.0*

