# CentOS 快速部署指南

本文档提供快速部署步骤，详细内容请参考 [DEPLOYMENT_GUIDE_CENTOS.md](./DEPLOYMENT_GUIDE_CENTOS.md)

## 🚀 快速开始

### 前提条件
- CentOS 7/8 或 Rocky Linux 8 服务器
- 拥有 sudo 权限的用户账号
- 服务器可以访问互联网

---

## 📝 部署步骤

### 1. 安装基础环境

```bash
# 更新系统
sudo yum update -y

# 安装 Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 验证安装
node --version  # v18.x.x
npm --version   # 9.x.x
```

### 2. 安装 PostgreSQL 14

```bash
# 添加官方仓库
sudo yum install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-8-x86_64/pgdg-redhat-repo-latest.noarch.rpm

# 禁用内置模块（CentOS 8）
sudo dnf -qy module disable postgresql

# 安装 PostgreSQL
sudo yum install -y postgresql14 postgresql14-server

# 初始化并启动
sudo /usr/pgsql-14/bin/postgresql-14-setup initdb
sudo systemctl enable postgresql-14
sudo systemctl start postgresql-14
```

### 3. 配置数据库

```bash
# 切换到 postgres 用户
sudo su - postgres
psql

# 在 psql 中执行：
CREATE DATABASE class_case;
CREATE USER service_admin WITH PASSWORD '6666667';
GRANT ALL PRIVILEGES ON DATABASE class_case TO service_admin;

# PostgreSQL 15+ 还需要额外授权 schema 权限
\c class_case
GRANT ALL ON SCHEMA public TO teaching_user;
GRANT CREATE ON SCHEMA public TO teaching_user;

\q

# 退出
exit
```

### 4. 安装 Nginx 和 PM2

```bash
# 安装 Nginx
sudo yum install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# 安装 PM2
sudo npm install -g pm2
```

### 5. 配置防火墙

```bash
# 开放端口（使用 8787 端口代替标准的 80 端口）
sudo firewall-cmd --permanent --add-port=8787/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload

# 如果需要使用标准 80 端口，也可以开放
# sudo firewall-cmd --permanent --add-port=80/tcp
# sudo firewall-cmd --reload
```

### 6. 部署应用

```bash
# 创建项目目录
mkdir -p ~/apps
cd ~/apps

# 克隆项目（或使用 scp 上传）
git clone <your-repo-url> teaching-case-service
cd teaching-case-service

# 安装依赖（包括 devDependencies，构建需要）
npm install

# 配置环境变量
cp .env.example .env
vim .env  # 修改数据库连接等配置

# 重要：配置 CORS（允许前端访问）
# 在 .env 文件中添加或修改：
# CORS_ORIGINS=http://你的服务器IP:8787,http://你的域名:8787
# 例如：CORS_ORIGINS=http://8.8.8.8:8787,http://example.com:8787

# 生成 Prisma Client
npx prisma generate

# 运行数据库迁移
npx prisma migrate deploy

# 初始化数据（创建角色、权限、超级管理员等）
npm run seed

# 编译项目
npm run build

# 创建日志目录
mkdir -p logs

# 使用 PM2 启动
pm2 start ecosystem.config.js

# 保存 PM2 配置并设置开机自启
pm2 save
pm2 startup
# 按提示执行命令
```

### 7. 配置 Nginx

```bash
# 复制 Nginx 配置
sudo cp nginx.conf.example /etc/nginx/conf.d/teaching-case.conf

# 编辑配置文件，修改域名和路径
sudo vim /etc/nginx/conf.d/teaching-case.conf

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 8. 验证部署

```bash
# 检查服务状态
pm2 status

# 查看日志
pm2 logs teaching-case-service

# 测试后端 API（直接访问）
curl http://localhost:3000/api

# 测试 Nginx 代理
curl http://localhost:8787/api

# 访问后台管理
# 浏览器打开: http://your-domain.com:8787/admin
# 或使用 IP: http://your-ip-address:8787/admin
```

---

## 🔒 配置 SSL（推荐）

```bash
# 安装 Certbot
sudo yum install -y certbot python3-certbot-nginx

# 自动配置 SSL
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 设置自动续期
sudo crontab -e
# 添加：0 2 * * * /usr/bin/certbot renew --quiet
```

---

## 🔄 更新部署

```bash
cd ~/apps/teaching-case-service

# 使用部署脚本
chmod +x deploy.sh
./deploy.sh

# 或手动执行
git pull
npm ci --production
npm run build
npx prisma migrate deploy
pm2 reload ecosystem.config.js
```

---

## 📊 常用命令

### PM2 管理

```bash
pm2 status                          # 查看状态
pm2 logs teaching-case-service      # 查看日志
pm2 restart teaching-case-service   # 重启
pm2 stop teaching-case-service      # 停止
pm2 monit                           # 监控
```

### 数据库管理

```bash
# 连接数据库
psql -h localhost -U teaching_user -d teaching_case_db

# 运行迁移
npx prisma migrate deploy

# 查看迁移状态
npx prisma migrate status
```

### Nginx 管理

```bash
sudo nginx -t                  # 测试配置
sudo systemctl restart nginx   # 重启
sudo systemctl status nginx    # 查看状态
```

---

## ⚠️ 常见问题

### 1. 端口访问问题

**说明：** 本项目 Nginx 默认使用 **8787 端口**，避免占用标准的 80 端口

```bash
# 确保防火墙已开放 8787 端口
sudo firewall-cmd --list-ports

# 如果未开放，执行：
sudo firewall-cmd --permanent --add-port=8787/tcp
sudo firewall-cmd --reload

# 如果需要使用标准 80 端口，修改 nginx.conf.example
# 将 listen 8787; 改为 listen 80;
```

**访问方式：**
- 通过 IP 访问：`http://服务器IP:8787/admin`
- 通过域名访问：`http://your-domain.com:8787/admin`
- 配置 SSL 后可使用 443 端口：`https://your-domain.com/admin`

### 2. 502 Bad Gateway

```bash
# 检查应用是否运行
pm2 status

# 检查 SELinux
sudo setsebool -P httpd_can_network_connect 1
```

### 3. 数据库连接失败

```bash
# 检查 PostgreSQL 状态
sudo systemctl status postgresql-14

# 查看日志
sudo tail -f /var/lib/pgsql/14/data/log/postgresql-*.log
```

### 4. 数据库权限错误

**错误信息：** `permission denied to create database`

```bash
# 方案1：手动创建数据库（推荐）
sudo su - postgres
psql

# 创建数据库和用户
CREATE DATABASE class_case;
CREATE USER teaching_user WITH PASSWORD '你的密码';
GRANT ALL PRIVILEGES ON DATABASE class_case TO teaching_user;

# PostgreSQL 15+ 需要额外授权
\c class_case
GRANT ALL ON SCHEMA public TO teaching_user;
GRANT CREATE ON SCHEMA public TO teaching_user;

\q
exit

# 方案2：修改 pg_hba.conf 配置
sudo vim /var/lib/pgsql/14/data/pg_hba.conf
# 将 ident 改为 md5，然后重启 PostgreSQL
sudo systemctl restart postgresql-14
```

### 5. 构建错误：xcopy command not found

**错误信息：** `sh: xcopy: command not found`

**原因：** 旧版本使用了 Windows 特定的 xcopy 命令

**解决方案：**
```bash
# 确保项目使用最新版本的 package.json（已修复为跨平台）
git pull origin main

# 重新安装依赖
npm install

# 再次构建
npm run build
```

### 6. 文件上传失败

```bash
# 检查权限
chmod -R 755 uploads/

# 检查 SELinux
sudo chcon -R -t httpd_sys_content_t uploads/
```

---

## 📚 详细文档

完整的部署说明和故障排除，请参考：
- [DEPLOYMENT_GUIDE_CENTOS.md](./DEPLOYMENT_GUIDE_CENTOS.md)

---

## ✅ 部署检查清单

- [ ] Node.js 18 已安装
- [ ] PostgreSQL 14 已安装并运行
- [ ] 数据库和用户已创建
- [ ] 防火墙端口已开放
- [ ] 项目代码已部署
- [ ] 环境变量已配置
- [ ] 数据库迁移已完成（`npx prisma migrate deploy`）
- [ ] 数据已初始化（`npm run seed`）
- [ ] 超级管理员账号已创建（验证登录）
- [ ] PM2 应用已启动
- [ ] Nginx 已配置并运行
- [ ] 可以通过域名访问
- [ ] SSL 证书已配置（如需要）

---

*快速部署指南 - v1.0*

