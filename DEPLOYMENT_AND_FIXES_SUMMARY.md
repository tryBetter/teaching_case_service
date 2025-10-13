# CentOS 部署问题和修复总结

本文档总结了在 CentOS 服务器部署过程中遇到的所有问题及其解决方案。

---

## 🐛 遇到的问题及解决方案

### 问题 1：数据库权限错误

**错误信息：**
```
ERROR: permission denied to create database
```

**原因：** 数据库用户没有创建数据库的权限

**解决方案：**
```bash
# 手动创建数据库和授权
sudo -u postgres psql << EOF
CREATE DATABASE class_case;
CREATE USER teaching_user WITH PASSWORD '6666667';
GRANT ALL PRIVILEGES ON DATABASE class_case TO teaching_user;
\c class_case
GRANT ALL ON SCHEMA public TO teaching_user;
ALTER SCHEMA public OWNER TO teaching_user;
EOF

# 然后运行迁移
npx prisma migrate deploy
```

**文档：** `DEPLOYMENT_QUICKSTART.md` 第57-70行

---

### 问题 2：构建错误 - xcopy 命令不存在

**错误信息：**
```
sh: xcopy: command not found
```

**原因：** `xcopy` 是 Windows 命令，在 Linux 系统不可用

**解决方案：**
```json
// package.json
{
  "scripts": {
    "copy:admin": "cpx \"src/admin/frontend/**/*\" dist/admin/frontend"
  },
  "devDependencies": {
    "cpx": "^1.5.0"
  }
}
```

**文档：** `DEPLOYMENT_QUICKSTART.md` 第315-331行

---

### 问题 3：Nginx 80 端口被占用

**错误信息：**
```
nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)
```

**原因：** 80 端口被其他服务占用（如 Apache、旧的 Nginx 配置）

**解决方案：**
```bash
# 方案1：停止占用80端口的服务
sudo systemctl stop httpd
sudo mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.bak

# 方案2：修改配置使用其他端口（8787）
# nginx.conf.example 已改为 listen 8787;

# 方案3：配置 SELinux 允许非标准端口
sudo yum install -y policycoreutils-python-utils
sudo semanage port -a -t http_port_t -p tcp 8787
sudo systemctl restart nginx
```

**文档：** `DEPLOYMENT_TROUBLESHOOTING.md` 第285-313行

---

### 问题 4：超级管理员未创建

**错误：** 部署后无法登录后台管理系统

**原因：** 数据初始化脚本未执行

**解决方案：**
```bash
# 1. 确保 .env 配置正确
cat .env | grep -E 'SUPER_ADMIN|AUTO_CREATE'

# 2. 运行数据初始化脚本
npm run seed

# 输出示例：
# 开始创建默认权限...
# 开始创建默认角色...
# 超级管理员账号创建成功: admin@mail.com

# 3. 验证登录
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mail.com","password":"SuperAdmin123!"}'
```

**登录信息：**
- 邮箱：`admin@mail.com`
- 密码：`SuperAdmin123!`

**文档：** `SUPER_ADMIN_SETUP_FIX.md`

---

### 问题 5：后台角色筛选不完整

**问题：** 用户管理模块的角色筛选下拉菜单只显示部分角色

**原因：** 角色选项是硬编码的

**解决方案：**
- 修改为从后端 API 动态加载
- 新增 `loadRoleFilterOptions()` 函数
- 自动获取所有角色（包括自定义角色）

**修改文件：**
- `src/admin/frontend/index.html`
- `src/admin/frontend/admin.js`

**文档：** `ADMIN_ROLE_FILTER_FIX.md`

---

### 问题 6：用户导入模板角色示例不全

**问题：** 下载的导入模板只包含4个角色示例，且包含超级管理员

**解决方案：**
- 修改模板生成为异步动态加载
- 从数据库获取所有角色（排除超级管理员）
- 为每个角色生成示例行

**修改文件：**
- `src/users/services/excel.service.ts`
- `src/users/users.controller.ts`

**文档：** `USER_TEMPLATE_DYNAMIC_ROLES.md`

---

## 🎯 功能增强

### 1. 文章查询接口增强

为 `GET /articles/all` 添加了分页和高级查询功能：

**新增参数：**
- `page`, `limit` - 分页
- `search` - 关键词搜索
- `authorId` - 按作者筛选
- `categoryId` - 按分类筛选
- `published` - 按发布状态筛选
- `featured` - 按推荐状态筛选
- `orderBy` - 时间排序

**文档：** `ARTICLE_QUERY_API_GUIDE.md`, `ARTICLE_API_ENHANCEMENT_SUMMARY.md`

---

## 📚 配置说明文档

### 1. Nginx 配置详解
**文档：** `NGINX_CONFIG_EXPLAINED.md`
- 端口配置（8787）
- 代理设置
- 静态文件服务
- SSL 配置
- 超时和上传限制

### 2. CORS 跨域配置
**文档：** `CORS_CONFIG_GUIDE.md`
- CORS 原理说明
- 环境变量配置
- 常见场景示例
- 错误排查

### 3. 部署故障排查
**文档：** `DEPLOYMENT_TROUBLESHOOTING.md`
- 完整的诊断脚本
- 分步骤排查指南
- 常见问题解决方案
- 一键修复脚本

---

## 🔧 配置文件修改总结

### 1. `package.json`
```json
{
  "scripts": {
    "copy:admin": "cpx \"src/admin/frontend/**/*\" dist/admin/frontend"
  },
  "devDependencies": {
    "cpx": "^1.5.0"
  }
}
```

### 2. `nginx.conf.example`
```nginx
# 使用 8787 端口
server {
    listen 8787;
    server_name your-domain.com;
    client_max_body_size 1024M;
    # ... 其他配置
}
```

### 3. `env.example`
```bash
# 新增 CORS 配置
CORS_ORIGINS=http://your-domain.com:8787,https://your-domain.com
```

### 4. `.env`（生产环境）
```bash
DATABASE_URL="postgresql://teaching_user:6666667@localhost:5432/class_case"
PORT=3000
CORS_ORIGINS=http://服务器IP:8787
SUPER_ADMIN_EMAIL=admin@mail.com
SUPER_ADMIN_PASSWORD=SuperAdmin123!
AUTO_CREATE_SUPER_ADMIN=true
```

---

## 🚀 完整部署流程

### 1. 环境准备

```bash
# 安装 Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 安装 PostgreSQL 14
sudo yum install -y postgresql14 postgresql14-server
sudo /usr/pgsql-14/bin/postgresql-14-setup initdb
sudo systemctl enable postgresql-14
sudo systemctl start postgresql-14

# 安装 Nginx 和 PM2
sudo yum install -y nginx
sudo npm install -g pm2
```

### 2. 数据库配置

```bash
sudo -u postgres psql << EOF
CREATE DATABASE class_case;
CREATE USER teaching_user WITH PASSWORD '6666667';
GRANT ALL PRIVILEGES ON DATABASE class_case TO teaching_user;
\c class_case
GRANT ALL ON SCHEMA public TO teaching_user;
ALTER SCHEMA public OWNER TO teaching_user;
EOF
```

### 3. 项目部署

```bash
# 克隆项目
mkdir -p ~/apps
cd ~/apps
git clone <your-repo-url> teaching-case-service
cd teaching-case-service

# 安装依赖
npm install

# 配置环境变量
cp env.example .env
vim .env  # 修改数据库连接、CORS等配置

# 数据库迁移和初始化
npx prisma generate
npx prisma migrate deploy
npm run seed  # 重要！创建角色、权限、超级管理员

# 构建
npm run build

# 启动
pm2 start ecosystem.config.js
pm2 save
```

### 4. Nginx 配置

```bash
# 配置 Nginx
sudo cp nginx.conf.example /etc/nginx/conf.d/teaching-case.conf
sudo vim /etc/nginx/conf.d/teaching-case.conf  # 修改域名和路径

# 禁用默认配置（避免80端口冲突）
sudo mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.bak

# SELinux 配置
sudo yum install -y policycoreutils-python-utils
sudo semanage port -a -t http_port_t -p tcp 8787
sudo setsebool -P httpd_can_network_connect 1

# 测试并启动
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 5. 防火墙配置

```bash
# 开放端口
sudo firewall-cmd --permanent --add-port=8787/tcp
sudo firewall-cmd --reload

# 验证
sudo firewall-cmd --list-ports
```

### 6. 验证部署

```bash
# 检查服务状态
pm2 status
sudo systemctl status nginx

# 测试后端
curl http://localhost:3000/api

# 测试 Nginx
curl http://localhost:8787/api

# 测试登录
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mail.com","password":"SuperAdmin123!"}'
```

### 7. 浏览器访问

访问：`http://服务器IP:8787/admin`

**重要：** 云服务器记得在安全组开放 8787 端口！

---

## ✅ 部署检查清单

- [ ] Node.js 18 已安装
- [ ] PostgreSQL 14 已安装并运行
- [ ] 数据库 `class_case` 已创建
- [ ] 数据库用户 `teaching_user` 已创建并授权
- [ ] 项目代码已部署
- [ ] 依赖已安装（`npm install`）
- [ ] 环境变量已配置（`.env` 文件）
- [ ] CORS 已配置（`CORS_ORIGINS` 环境变量）
- [ ] Prisma Client 已生成（`npx prisma generate`）
- [ ] 数据库迁移已完成（`npx prisma migrate deploy`）
- [ ] 数据已初始化（`npm run seed`）✨
- [ ] 超级管理员账号已创建（验证登录）✨
- [ ] 项目已构建（`npm run build`）
- [ ] PM2 应用已启动
- [ ] Nginx 已配置（`teaching-case.conf`）
- [ ] 默认配置已禁用（避免80端口冲突）✨
- [ ] SELinux 已配置（端口和网络连接）✨
- [ ] 防火墙端口已开放（8787）
- [ ] 云服务器安全组已开放 8787 端口✨
- [ ] 可以通过浏览器访问 `http://IP:8787/admin`
- [ ] 超级管理员可以登录后台
- [ ] SSL 证书已配置（可选）

---

## 📁 创建的文档列表

### 部署相关
1. ✅ `DEPLOYMENT_QUICKSTART.md` - 快速部署指南（已更新）
2. ✅ `DEPLOYMENT_TROUBLESHOOTING.md` - 故障排查指南
3. ✅ `SUPER_ADMIN_SETUP_FIX.md` - 超级管理员创建问题

### 配置说明
4. ✅ `NGINX_CONFIG_EXPLAINED.md` - Nginx 配置详解
5. ✅ `CORS_CONFIG_GUIDE.md` - CORS 跨域配置指南

### 功能文档
6. ✅ `ARTICLE_QUERY_API_GUIDE.md` - 文章查询接口使用指南
7. ✅ `ARTICLE_API_ENHANCEMENT_SUMMARY.md` - 文章接口增强总结
8. ✅ `ADMIN_ROLE_FILTER_FIX.md` - 后台角色筛选修复
9. ✅ `ADMIN_FRONTEND_UPDATE_GUIDE.md` - 前端更新部署指南
10. ✅ `USER_TEMPLATE_DYNAMIC_ROLES.md` - 用户模板动态角色功能

---

## 🔑 重要配置信息

### 数据库配置
```bash
数据库名：class_case
用户名：teaching_user
密码：6666667（建议修改）
连接：postgresql://teaching_user:6666667@localhost:5432/class_case
```

### 端口配置
```bash
后端端口：3000
Nginx 端口：8787
PostgreSQL 端口：5432
```

### 超级管理员
```bash
邮箱：admin@mail.com
密码：SuperAdmin123!（首次登录后请修改）
```

### 防火墙
```bash
需要开放：8787/tcp, 443/tcp
云服务器安全组：8787
```

---

## 🔄 更新部署流程

当有代码更新时：

```bash
cd ~/apps/teaching-case-service

# 1. 拉取最新代码
git pull origin main

# 2. 安装依赖（如有新依赖）
npm install

# 3. 重新构建
npm run build

# 4. 数据库迁移（如有新迁移）
npx prisma migrate deploy

# 5. 重启应用
pm2 reload teaching-case-service

# 6. 查看日志
pm2 logs teaching-case-service --lines 20
```

或使用部署脚本：
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 🛠️ 常用管理命令

### PM2 管理
```bash
pm2 status                          # 查看状态
pm2 logs teaching-case-service      # 查看日志
pm2 restart teaching-case-service   # 重启
pm2 stop teaching-case-service      # 停止
pm2 monit                           # 监控
```

### Nginx 管理
```bash
sudo nginx -t                  # 测试配置
sudo systemctl restart nginx   # 重启
sudo systemctl status nginx    # 查看状态
sudo tail -f /var/log/nginx/teaching-case-error.log  # 查看错误日志
```

### 数据库管理
```bash
# 连接数据库
psql -h localhost -U teaching_user -d class_case

# 运行迁移
npx prisma migrate deploy

# 查看迁移状态
npx prisma migrate status

# 初始化数据
npm run seed
```

---

## 🆘 快速诊断脚本

保存为 `diagnose.sh` 并运行：

```bash
#!/bin/bash
echo "===== 系统诊断 ====="

echo "1. PM2 状态:"
pm2 status

echo -e "\n2. 端口监听:"
sudo netstat -tlnp | grep -E ':(3000|8787)'

echo -e "\n3. Nginx 状态:"
sudo systemctl status nginx | head -5

echo -e "\n4. 防火墙端口:"
sudo firewall-cmd --list-ports

echo -e "\n5. 本地连接测试:"
curl -s http://localhost:3000/api
curl -s http://localhost:8787/api

echo -e "\n6. 超级管理员验证:"
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mail.com","password":"SuperAdmin123!"}'

echo -e "\n===== 诊断完成 ====="
```

---

## 🔗 访问地址

### 生产环境
```
后台管理：http://服务器IP:8787/admin
API 文档：http://服务器IP:8787/api
API 接口：http://服务器IP:8787/api/*
静态文件：http://服务器IP:8787/uploads/*
```

### 开发环境
```
后台管理：http://localhost:3000/admin
API 文档：http://localhost:3000/api
API 接口：http://localhost:3000/api/*
```

---

## 📞 获取帮助

如果遇到问题，请提供以下信息：

1. **错误信息**
   ```bash
   pm2 logs teaching-case-service --lines 50
   sudo tail -50 /var/log/nginx/teaching-case-error.log
   ```

2. **系统状态**
   ```bash
   pm2 status
   sudo systemctl status nginx
   sudo systemctl status postgresql-14
   ```

3. **端口监听**
   ```bash
   sudo netstat -tlnp | grep -E ':(3000|8787)'
   ```

4. **防火墙规则**
   ```bash
   sudo firewall-cmd --list-all
   ```

5. **环境变量**（隐藏敏感信息）
   ```bash
   cat .env | grep -v PASSWORD | grep -v SECRET
   ```

---

## 🎉 部署成功标志

当以下所有条件都满足时，表示部署成功：

1. ✅ PM2 显示应用状态为 `online`
2. ✅ Nginx 状态为 `active (running)`
3. ✅ 端口 3000 和 8787 都在监听
4. ✅ `curl http://localhost:8787/api` 返回正常响应
5. ✅ 浏览器可以访问 `http://IP:8787/admin`
6. ✅ 可以使用超级管理员登录
7. ✅ 用户管理模块显示所有角色
8. ✅ 下载用户模板包含所有角色示例

---

*CentOS 部署问题和修复总结 - v1.0*

