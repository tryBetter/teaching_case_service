# CentOS 服务器部署指南

本文档详细说明如何将教学案例服务后端系统部署到 CentOS 服务器。

## 📋 目录

- [环境要求](#环境要求)
- [服务器准备](#服务器准备)
- [安装依赖软件](#安装依赖软件)
- [部署步骤](#部署步骤)
- [数据库配置](#数据库配置)
- [Nginx配置](#nginx配置)
- [进程管理](#进程管理)
- [SSL证书配置](#ssl证书配置)
- [常见问题](#常见问题)

---

## 🎯 环境要求

### 最低配置
- **系统**: CentOS 7/8 或 Rocky Linux 8
- **CPU**: 2核心
- **内存**: 2GB
- **硬盘**: 20GB
- **网络**: 公网IP或域名

### 推荐配置
- **系统**: CentOS 8 / Rocky Linux 8
- **CPU**: 4核心
- **内存**: 4GB+
- **硬盘**: 50GB+
- **网络**: 公网IP + 域名

---

## 🔧 服务器准备

### 1. 更新系统

```bash
# CentOS 7
sudo yum update -y

# CentOS 8 / Rocky Linux 8
sudo dnf update -y
```

### 2. 安装基础工具

```bash
sudo yum install -y wget curl git vim
```

### 3. 配置防火墙

```bash
# 开放必要端口
sudo firewall-cmd --permanent --add-port=80/tcp      # HTTP
sudo firewall-cmd --permanent --add-port=443/tcp     # HTTPS
sudo firewall-cmd --permanent --add-port=3000/tcp    # NestJS (可选，用于调试)

# 重载防火墙
sudo firewall-cmd --reload

# 查看开放的端口
sudo firewall-cmd --list-ports
```

### 4. 配置 SELinux（可选）

```bash
# 查看 SELinux 状态
getenforce

# 临时关闭（推荐先测试）
sudo setenforce 0

# 永久关闭（修改配置文件）
sudo vim /etc/selinux/config
# 将 SELINUX=enforcing 改为 SELINUX=disabled

# 或者配置 SELinux 策略（更安全）
sudo setsebool -P httpd_can_network_connect 1
```

---

## 📦 安装依赖软件

### 1. 安装 Node.js 18.x

```bash
# 添加 NodeSource 仓库
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -

# 安装 Node.js
sudo yum install -y nodejs

# 验证安装
node --version  # 应显示 v18.x.x
npm --version   # 应显示 9.x.x
```

### 2. 安装 PostgreSQL 14

```bash
# 添加 PostgreSQL 官方仓库
sudo yum install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-8-x86_64/pgdg-redhat-repo-latest.noarch.rpm

# 禁用内置 PostgreSQL 模块（CentOS 8）
sudo dnf -qy module disable postgresql

# 安装 PostgreSQL 14
sudo yum install -y postgresql14 postgresql14-server

# 初始化数据库
sudo /usr/pgsql-14/bin/postgresql-14-setup initdb

# 启动并设置开机自启
sudo systemctl enable postgresql-14
sudo systemctl start postgresql-14

# 检查状态
sudo systemctl status postgresql-14
```

### 3. 安装 Nginx

```bash
# 安装 Nginx
sudo yum install -y nginx

# 启动并设置开机自启
sudo systemctl enable nginx
sudo systemctl start nginx

# 检查状态
sudo systemctl status nginx
```

### 4. 安装 PM2（进程管理器）

```bash
# 全局安装 PM2
sudo npm install -g pm2

# 验证安装
pm2 --version
```

---

## 🚀 部署步骤

### 1. 创建部署用户（推荐）

```bash
# 创建专用用户
sudo useradd -m -s /bin/bash deploy

# 设置密码
sudo passwd deploy

# 添加到 sudo 组（可选）
sudo usermod -aG wheel deploy

# 切换到 deploy 用户
su - deploy
```

### 2. 克隆项目代码

```bash
# 创建项目目录
mkdir -p ~/apps
cd ~/apps

# 从 Git 克隆项目（替换为你的仓库地址）
git clone https://github.com/your-repo/teaching-case-service.git

# 或者通过 SCP 上传（从本地）
# scp -r /path/to/teaching-case-service user@server:/home/deploy/apps/

cd teaching-case-service
```

### 3. 安装项目依赖

```bash
# 安装 npm 依赖
npm install

# 或使用生产模式安装
npm ci --production
```

### 4. 配置环境变量

```bash
# 复制环境变量示例文件
cp .env.example .env

# 编辑环境变量
vim .env
```

**`.env` 配置示例：**

```env
# 数据库配置
DATABASE_URL="postgresql://teaching_user:your_password@localhost:5432/teaching_case_db?schema=public"

# JWT 密钥
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# 服务端口
PORT=3000

# 基础URL（改为你的域名或IP）
BASE_URL="https://your-domain.com"

# Node 环境
NODE_ENV="production"

# CORS 配置
CORS_ORIGIN="https://your-frontend-domain.com,https://admin.your-domain.com"
```

### 5. 构建项目

```bash
# 编译 TypeScript
npm run build

# 检查 dist 目录是否生成
ls -la dist/
```

---

## 💾 数据库配置

### 1. 创建数据库和用户

```bash
# 切换到 postgres 用户
sudo su - postgres

# 进入 PostgreSQL
psql

# 在 psql 中执行以下命令：
```

```sql
-- 创建数据库
CREATE DATABASE teaching_case_db;

-- 创建用户
CREATE USER teaching_user WITH PASSWORD 'your_secure_password';

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE teaching_case_db TO teaching_user;

-- 退出
\q
```

```bash
# 返回普通用户
exit
```

### 2. 配置 PostgreSQL 远程访问（可选）

```bash
# 编辑 postgresql.conf
sudo vim /var/lib/pgsql/14/data/postgresql.conf

# 找到并修改以下行：
# listen_addresses = 'localhost'  改为  listen_addresses = '*'

# 编辑 pg_hba.conf
sudo vim /var/lib/pgsql/14/data/pg_hba.conf

# 添加以下行（允许本地网络访问）
host    all             all             127.0.0.1/32            md5
host    all             all             0.0.0.0/0               md5

# 重启 PostgreSQL
sudo systemctl restart postgresql-14
```

### 3. 运行数据库迁移

```bash
# 回到项目目录
cd ~/apps/teaching-case-service

# 生成 Prisma Client
npx prisma generate

# 运行迁移
npx prisma migrate deploy

# 查看迁移状态
npx prisma migrate status

# （可选）填充种子数据
npm run seed
```

---

## 🔄 进程管理（PM2）

### 1. 创建 PM2 配置文件

```bash
# 在项目根目录创建 ecosystem.config.js
vim ecosystem.config.js
```

**`ecosystem.config.js` 内容：**

```javascript
module.exports = {
  apps: [
    {
      name: 'teaching-case-service',
      script: './dist/main.js',
      instances: 2,  // 使用多进程，根据 CPU 核心数调整
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      max_memory_restart: '500M',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
```

### 2. 创建日志目录

```bash
mkdir -p logs
```

### 3. 使用 PM2 启动应用

```bash
# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs teaching-case-service

# 查看实时日志
pm2 logs --lines 100

# 监控
pm2 monit
```

### 4. PM2 常用命令

```bash
# 重启应用
pm2 restart teaching-case-service

# 重载应用（0秒停机）
pm2 reload teaching-case-service

# 停止应用
pm2 stop teaching-case-service

# 删除应用
pm2 delete teaching-case-service

# 查看详细信息
pm2 show teaching-case-service

# 保存当前进程列表
pm2 save

# 设置开机自启
pm2 startup
# 按照提示执行命令，例如：
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u deploy --hp /home/deploy
```

---

## 🌐 Nginx 配置

### 1. 创建 Nginx 配置文件

```bash
# 创建站点配置
sudo vim /etc/nginx/conf.d/teaching-case.conf
```

**基础配置（HTTP）：**

```nginx
# HTTP 配置
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # 日志
    access_log /var/log/nginx/teaching-case-access.log;
    error_log /var/log/nginx/teaching-case-error.log;

    # 客户端最大上传大小（支持视频上传）
    client_max_body_size 1024M;

    # 代理超时设置
    proxy_connect_timeout 600;
    proxy_send_timeout 600;
    proxy_read_timeout 600;
    send_timeout 600;

    # API 接口代理
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

    # 后台管理界面
    location /admin {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 其他 API 路由
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态文件（上传的媒体文件）
    location /uploads {
        alias /home/deploy/apps/teaching-case-service/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 2. 测试并重启 Nginx

```bash
# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx

# 检查状态
sudo systemctl status nginx
```

### 3. 处理权限问题

```bash
# 给 Nginx 用户访问项目目录的权限
sudo usermod -aG deploy nginx

# 或者修改 uploads 目录权限
sudo chmod -R 755 ~/apps/teaching-case-service/uploads

# 设置 SELinux 策略（如果启用了 SELinux）
sudo chcon -R -t httpd_sys_content_t ~/apps/teaching-case-service/uploads
```

---

## 🔒 SSL 证书配置（HTTPS）

### 方法1：使用 Let's Encrypt（免费）

```bash
# 安装 Certbot
sudo yum install -y certbot python3-certbot-nginx

# 自动配置 SSL
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 按提示输入邮箱并同意条款

# 测试自动续期
sudo certbot renew --dry-run

# 设置自动续期定时任务
sudo crontab -e
# 添加以下行（每天凌晨2点检查并续期）
0 2 * * * /usr/bin/certbot renew --quiet
```

### 方法2：手动配置 SSL（已有证书）

```nginx
# 编辑 Nginx 配置
sudo vim /etc/nginx/conf.d/teaching-case.conf

# HTTPS 配置
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL 证书
    ssl_certificate /path/to/your/fullchain.pem;
    ssl_certificate_key /path/to/your/privkey.pem;

    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # ... 其他配置同上 ...
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

```bash
# 重启 Nginx
sudo systemctl restart nginx
```

---

## 🔄 更新部署流程

### 创建部署脚本

```bash
# 创建部署脚本
vim ~/apps/teaching-case-service/deploy.sh
```

**`deploy.sh` 内容：**

```bash
#!/bin/bash

# 教学案例服务部署脚本

set -e  # 遇到错误立即退出

echo "========================================="
echo "开始部署教学案例服务..."
echo "========================================="

# 项目目录
PROJECT_DIR="/home/deploy/apps/teaching-case-service"
cd $PROJECT_DIR

# 1. 拉取最新代码
echo "1. 拉取最新代码..."
git pull origin main

# 2. 安装依赖
echo "2. 安装依赖..."
npm ci --production

# 3. 生成 Prisma Client
echo "3. 生成 Prisma Client..."
npx prisma generate

# 4. 运行数据库迁移
echo "4. 运行数据库迁移..."
npx prisma migrate deploy

# 5. 编译项目
echo "5. 编译 TypeScript..."
npm run build

# 6. 重启 PM2
echo "6. 重启应用..."
pm2 reload ecosystem.config.js

# 7. 查看状态
echo "7. 应用状态："
pm2 status

echo "========================================="
echo "部署完成！"
echo "========================================="

# 显示日志
pm2 logs teaching-case-service --lines 20
```

```bash
# 添加执行权限
chmod +x deploy.sh

# 执行部署
./deploy.sh
```

---

## 📊 监控和日志

### 1. PM2 监控

```bash
# 实时监控
pm2 monit

# 查看详细信息
pm2 show teaching-case-service

# Web 监控界面（可选）
pm2 install pm2-server-monit
```

### 2. Nginx 日志

```bash
# 访问日志
sudo tail -f /var/log/nginx/teaching-case-access.log

# 错误日志
sudo tail -f /var/log/nginx/teaching-case-error.log
```

### 3. 应用日志

```bash
# PM2 日志
pm2 logs teaching-case-service

# 查看错误日志
pm2 logs teaching-case-service --err

# 查看输出日志
pm2 logs teaching-case-service --out

# 清空日志
pm2 flush
```

---

## 🐛 常见问题

### 1. 端口被占用

```bash
# 查看占用端口的进程
sudo lsof -i :3000

# 或使用 netstat
sudo netstat -tlnp | grep 3000

# 结束进程
sudo kill -9 <PID>
```

### 2. 数据库连接失败

```bash
# 检查 PostgreSQL 状态
sudo systemctl status postgresql-14

# 查看 PostgreSQL 日志
sudo tail -f /var/lib/pgsql/14/data/log/postgresql-*.log

# 测试数据库连接
psql -h localhost -U teaching_user -d teaching_case_db
```

### 3. PM2 进程频繁重启

```bash
# 查看错误日志
pm2 logs teaching-case-service --err

# 增加内存限制
pm2 restart teaching-case-service --max-memory-restart 1G

# 检查环境变量
pm2 env 0
```

### 4. 文件上传失败

```bash
# 检查 uploads 目录权限
ls -la uploads/

# 修改权限
chmod -R 755 uploads/
chown -R deploy:deploy uploads/

# 检查磁盘空间
df -h
```

### 5. Nginx 502 Bad Gateway

```bash
# 检查 NestJS 服务是否运行
pm2 status

# 检查端口是否正确
curl http://localhost:3000

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 检查 SELinux 策略
sudo getsebool httpd_can_network_connect
sudo setsebool -P httpd_can_network_connect 1
```

### 6. 内存不足

```bash
# 查看内存使用
free -h

# 创建 Swap（如果没有）
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 🔐 安全建议

### 1. 防火墙配置

```bash
# 只开放必要端口
sudo firewall-cmd --permanent --remove-port=3000/tcp  # 关闭直接访问
sudo firewall-cmd --reload
```

### 2. 修改 SSH 端口（可选）

```bash
sudo vim /etc/ssh/sshd_config
# 修改 Port 22 为其他端口，如 2222
sudo systemctl restart sshd
```

### 3. 禁用 root 远程登录

```bash
sudo vim /etc/ssh/sshd_config
# 设置 PermitRootLogin no
sudo systemctl restart sshd
```

### 4. 配置 fail2ban（防暴力破解）

```bash
sudo yum install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 5. 定期更新系统

```bash
# 设置自动更新
sudo yum install -y yum-cron
sudo systemctl enable yum-cron
sudo systemctl start yum-cron
```

---

## 📝 部署检查清单

部署完成后，请逐项检查：

- [ ] Node.js 安装并验证版本
- [ ] PostgreSQL 安装并运行
- [ ] 数据库创建并配置权限
- [ ] 项目代码已克隆/上传
- [ ] 环境变量正确配置
- [ ] npm 依赖安装成功
- [ ] 项目编译成功（dist 目录存在）
- [ ] 数据库迁移成功
- [ ] PM2 启动应用成功
- [ ] Nginx 配置正确并重启
- [ ] 防火墙开放必要端口
- [ ] 可以通过域名访问后台管理界面
- [ ] API 接口正常响应
- [ ] 文件上传功能正常
- [ ] SSL 证书配置（如果需要）
- [ ] PM2 设置开机自启
- [ ] 日志输出正常

---

## 🚀 快速部署脚本（一键部署）

创建完整的一键部署脚本：

```bash
vim ~/setup.sh
```

```bash
#!/bin/bash

# 教学案例服务一键部署脚本（CentOS 8）

set -e

echo "========================================="
echo "教学案例服务一键部署脚本"
echo "========================================="

# 更新系统
echo "1. 更新系统..."
sudo dnf update -y

# 安装 Node.js
echo "2. 安装 Node.js 18..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs

# 安装 PostgreSQL
echo "3. 安装 PostgreSQL 14..."
sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-8-x86_64/pgdg-redhat-repo-latest.noarch.rpm
sudo dnf -qy module disable postgresql
sudo dnf install -y postgresql14 postgresql14-server
sudo /usr/pgsql-14/bin/postgresql-14-setup initdb
sudo systemctl enable postgresql-14
sudo systemctl start postgresql-14

# 安装 Nginx
echo "4. 安装 Nginx..."
sudo dnf install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# 安装 PM2
echo "5. 安装 PM2..."
sudo npm install -g pm2

# 配置防火墙
echo "6. 配置防火墙..."
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload

echo "========================================="
echo "基础环境安装完成！"
echo "请继续手动配置数据库和部署应用"
echo "========================================="
```

```bash
chmod +x setup.sh
./setup.sh
```

---

## 📚 相关文档

- [NestJS 部署文档](https://docs.nestjs.com/techniques/deployment)
- [PM2 文档](https://pm2.keymetrics.io/)
- [Nginx 文档](https://nginx.org/en/docs/)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)

---

*文档更新时间：2025-10-11*
*版本：v1.0*

