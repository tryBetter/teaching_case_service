#!/bin/bash

# 媒体文件URL配置修复脚本
# 用于修复上传文件后返回 localhost:3000 的问题

echo "=========================================="
echo "媒体文件URL配置修复脚本"
echo "=========================================="
echo ""

# 进入项目目录
cd ~/apps/teaching-case-service || {
    echo "❌ 错误：项目目录不存在"
    echo "请修改脚本中的项目路径"
    exit 1
}

echo "当前目录: $(pwd)"
echo ""

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "❌ 错误：.env 文件不存在"
    echo "请先创建 .env 文件"
    exit 1
fi

# 备份 .env
BACKUP_FILE=".env.backup.$(date +%Y%m%d_%H%M%S)"
cp .env "$BACKUP_FILE"
echo "✓ 已备份 .env 到 $BACKUP_FILE"
echo ""

# 自动检测服务器IP
echo "正在检测服务器IP..."
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "")

if [ -z "$SERVER_IP" ]; then
    echo "⚠️  无法自动检测服务器IP"
    echo "请手动输入服务器IP地址："
    read -r SERVER_IP
fi

echo "服务器IP: $SERVER_IP"
echo ""

# 询问使用场景
echo "请选择部署场景:"
echo "1) 使用IP访问 (http://$SERVER_IP:8787)"
echo "2) 使用域名访问 (需要输入域名)"
echo "3) 使用HTTPS (需要输入域名)"
echo "4) 自定义"
echo ""
read -p "请输入选项 (1-4): " choice

case $choice in
    1)
        NEW_BASE_URL="http://$SERVER_IP:8787"
        NEW_CORS="http://$SERVER_IP:8787"
        ;;
    2)
        read -p "请输入域名 (如 example.com): " DOMAIN
        NEW_BASE_URL="http://$DOMAIN:8787"
        NEW_CORS="http://$DOMAIN:8787"
        ;;
    3)
        read -p "请输入域名 (如 example.com): " DOMAIN
        NEW_BASE_URL="https://$DOMAIN"
        NEW_CORS="https://$DOMAIN,http://$DOMAIN"
        ;;
    4)
        read -p "请输入 BASE_URL (如 http://example.com:8787): " NEW_BASE_URL
        read -p "请输入 CORS_ORIGINS (如 http://example.com:8787): " NEW_CORS
        ;;
    *)
        echo "无效选项"
        exit 1
        ;;
esac

echo ""
echo "配置预览："
echo "  BASE_URL=$NEW_BASE_URL"
echo "  CORS_ORIGINS=$NEW_CORS"
echo ""
read -p "确认配置？(y/n): " confirm

if [ "$confirm" != "y" ]; then
    echo "已取消"
    exit 0
fi

# 更新 BASE_URL
if grep -q "^BASE_URL=" .env; then
    sed -i "s|^BASE_URL=.*|BASE_URL=\"$NEW_BASE_URL\"|" .env
    echo "✓ 已更新 BASE_URL"
else
    echo "BASE_URL=\"$NEW_BASE_URL\"" >> .env
    echo "✓ 已添加 BASE_URL"
fi

# 更新 CORS_ORIGINS
if grep -q "^CORS_ORIGINS=" .env; then
    sed -i "s|^CORS_ORIGINS=.*|CORS_ORIGINS=\"$NEW_CORS\"|" .env
    echo "✓ 已更新 CORS_ORIGINS"
else
    echo "CORS_ORIGINS=\"$NEW_CORS\"" >> .env
    echo "✓ 已添加 CORS_ORIGINS"
fi

echo ""
echo "=========================================="
echo "当前配置："
echo "=========================================="
grep -E "^BASE_URL=|^CORS_ORIGINS=" .env
echo ""

# 询问是否重启应用
read -p "是否立即重启应用使配置生效？(y/n): " restart_confirm

if [ "$restart_confirm" = "y" ]; then
    echo ""
    echo "正在重启应用..."
    pm2 restart teaching-case-service
    
    echo ""
    echo "✓ 应用已重启"
    echo ""
    echo "请验证："
    echo "1. 上传一个测试图片"
    echo "2. 检查返回的URL是否正确"
    echo "3. 在浏览器中访问该URL验证可访问性"
else
    echo ""
    echo "⚠️  配置已更新，但应用未重启"
    echo "请手动运行: pm2 restart teaching-case-service"
fi

echo ""
echo "=========================================="
echo "修复完成！"
echo "=========================================="
echo ""
echo "如果已有媒体文件的URL不正确，请运行："
echo "psql -h localhost -U teaching_user -d class_case -c \""
echo "UPDATE \\\"Media\\\" SET url = REPLACE(url, 'http://localhost:3000', '$NEW_BASE_URL') WHERE url LIKE 'http://localhost:3000%';\""
echo ""

