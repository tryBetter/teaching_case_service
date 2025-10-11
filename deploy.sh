#!/bin/bash

# 教学案例服务部署脚本

set -e  # 遇到错误立即退出

echo "========================================="
echo "开始部署教学案例服务..."
echo "========================================="

# 项目目录
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
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

# 6. 创建日志目录（如果不存在）
echo "6. 创建日志目录..."
mkdir -p logs

# 7. 重启 PM2
echo "7. 重启应用..."
pm2 reload ecosystem.config.js

# 8. 保存 PM2 配置
echo "8. 保存 PM2 配置..."
pm2 save

# 9. 查看状态
echo "9. 应用状态："
pm2 status

echo "========================================="
echo "部署完成！"
echo "========================================="

# 显示最近20行日志
echo "最近日志："
pm2 logs teaching-case-service --lines 20 --nostream

