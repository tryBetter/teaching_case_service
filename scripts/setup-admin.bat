@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo 🚀 正在设置教学案例服务后台管理系统...

:: 检查Node.js版本
echo 📋 检查Node.js版本...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do set node_version=%%i
    echo ✅ Node.js版本: !node_version!
) else (
    echo ❌ 未找到Node.js，请先安装Node.js 16+
    pause
    exit /b 1
)

:: 检查npm版本
echo 📋 检查npm版本...
npm --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('npm --version') do set npm_version=%%i
    echo ✅ npm版本: !npm_version!
) else (
    echo ❌ 未找到npm
    pause
    exit /b 1
)

:: 安装依赖
echo 📦 安装项目依赖...
call npm install
if %errorlevel% neq 0 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)

:: 检查环境变量文件
echo 🔧 检查环境配置...
if not exist ".env" (
    echo 📝 创建环境变量文件...
    copy env.example .env >nul
    echo ⚠️  请编辑 .env 文件，配置数据库连接和其他环境变量
)

:: 生成Prisma客户端
echo 🗄️  生成Prisma客户端...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ❌ Prisma客户端生成失败
    pause
    exit /b 1
)

:: 运行数据库迁移
echo 🗄️  运行数据库迁移...
call npx prisma migrate deploy
if %errorlevel% neq 0 (
    echo ❌ 数据库迁移失败，请检查数据库连接配置
    pause
    exit /b 1
)

:: 初始化种子数据
echo 🌱 初始化种子数据...
call npm run seed
if %errorlevel% neq 0 (
    echo ⚠️  种子数据初始化失败，请手动运行: npm run seed
)

:: 构建项目
echo 🔨 构建项目...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ 项目构建失败
    pause
    exit /b 1
)

echo.
echo 🎉 后台管理系统设置完成！
echo.
echo 📋 下一步操作：
echo 1. 确保数据库中有超级管理员用户
echo 2. 启动服务: npm run start:dev
echo 3. 访问管理界面: http://localhost:3000/admin/frontend/index.html
echo 4. 使用超级管理员账号登录
echo.
echo 📚 详细文档请查看: ADMIN_SYSTEM_README.md
echo.
echo ⚠️  安全提醒：
echo - 请妥善保管超级管理员账号信息
echo - 定期更改密码
echo - 不要在公共环境中暴露管理界面
echo.
pause
