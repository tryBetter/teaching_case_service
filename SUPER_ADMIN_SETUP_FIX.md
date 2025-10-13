# 超级管理员未创建 - 完整解决方案

## 🔍 问题原因

部署后没有自动创建超级管理员，是因为**数据初始化脚本未执行**。

系统的超级管理员是通过 `seed` 脚本创建的，而不是应用启动时自动创建。

---

## ✅ 解决方案

### 方案 1：运行数据初始化脚本（推荐）

在服务器上执行以下命令：

```bash
# 1. 进入项目目录
cd ~/apps/teaching-case-service

# 2. 确保 .env 配置正确
cat .env | grep -E 'SUPER_ADMIN|AUTO_CREATE'

# 应该看到类似：
# SUPER_ADMIN_EMAIL=admin@mail.com
# SUPER_ADMIN_PASSWORD=SuperAdmin123!
# SUPER_ADMIN_NAME=超级管理员
# AUTO_CREATE_SUPER_ADMIN=true

# 3. 运行初始化脚本
npm run seed

# 你会看到类似输出：
# 开始创建默认权限...
# 创建权限: 创建用户
# ...
# 开始创建默认角色...
# 创建角色: 超级管理员
# ...
# 超级管理员账号创建成功: admin@mail.com
# 角色: 超级管理员
```

### 方案 2：使用专用创建脚本

```bash
# 1. 进入项目目录
cd ~/apps/teaching-case-service

# 2. 运行创建管理员脚本
node create-admin.js

# 或使用设置脚本
chmod +x scripts/setup-admin.sh
./scripts/setup-admin.sh
```

### 方案 3：手动创建（如果脚本失败）

#### 步骤 1：连接数据库

```bash
# 使用 psql 连接
psql -h localhost -U teaching_user -d class_case
```

#### 步骤 2：查看角色 ID

```sql
-- 查看超级管理员角色
SELECT id, name FROM "Role" WHERE name = '超级管理员';
```

记下超级管理员角色的 `id`（假设是 1）

#### 步骤 3：生成密码哈希

在服务器上运行以下 Node.js 代码：

```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('SuperAdmin123!', 12).then(hash => console.log(hash));"
```

复制输出的哈希值（例如：`$2b$12$...`）

#### 步骤 4：创建超级管理员用户

```sql
-- 替换 <password_hash> 为上一步的哈希值
INSERT INTO "User" (email, name, password, "roleId", status, "createdAt", "updatedAt")
VALUES (
    'admin@mail.com',
    '超级管理员',
    '<password_hash>',
    1,  -- 超级管理员角色 ID
    'ACTIVE',
    NOW(),
    NOW()
);
```

#### 步骤 5：验证创建

```sql
-- 查看创建的用户
SELECT u.id, u.email, u.name, r.name as role 
FROM "User" u 
JOIN "Role" r ON u."roleId" = r.id 
WHERE u.email = 'admin@mail.com';
```

---

## 🔧 环境变量配置

确保 `.env` 文件包含以下配置：

```bash
# 超级管理员邮箱
SUPER_ADMIN_EMAIL=admin@mail.com

# 超级管理员密码（请修改为强密码）
SUPER_ADMIN_PASSWORD=SuperAdmin123!

# 超级管理员名称
SUPER_ADMIN_NAME=超级管理员

# 是否自动创建超级管理员（true/false）
AUTO_CREATE_SUPER_ADMIN=true
```

**注意：** 生产环境请修改默认密码！

---

## 🚀 快速一键修复脚本

将以下脚本保存为 `fix-admin.sh`：

```bash
#!/bin/bash

echo "==================================="
echo "修复超级管理员未创建问题"
echo "==================================="
echo ""

# 进入项目目录
cd ~/apps/teaching-case-service || exit

# 检查环境变量
echo "1. 检查环境变量配置..."
if grep -q "AUTO_CREATE_SUPER_ADMIN=true" .env; then
    echo "✓ AUTO_CREATE_SUPER_ADMIN 已启用"
else
    echo "⚠️  AUTO_CREATE_SUPER_ADMIN 未启用，正在启用..."
    if grep -q "AUTO_CREATE_SUPER_ADMIN" .env; then
        sed -i 's/AUTO_CREATE_SUPER_ADMIN=.*/AUTO_CREATE_SUPER_ADMIN=true/' .env
    else
        echo "AUTO_CREATE_SUPER_ADMIN=true" >> .env
    fi
fi

echo ""
echo "2. 当前超级管理员配置："
grep -E 'SUPER_ADMIN' .env

echo ""
echo "3. 运行数据初始化脚本..."
npm run seed

echo ""
echo "4. 验证超级管理员账号..."
psql -h localhost -U teaching_user -d class_case -c "
SELECT u.id, u.email, u.name, r.name as role 
FROM \"User\" u 
JOIN \"Role\" r ON u.\"roleId\" = r.id 
WHERE u.email = (SELECT COALESCE(
    (SELECT value FROM pg_settings WHERE name = 'search_path'), 
    'admin@mail.com'
))
LIMIT 1;
" 2>/dev/null || echo "⚠️  无法验证（可能需要提供数据库密码）"

echo ""
echo "==================================="
echo "修复完成！"
echo "==================================="
echo ""
echo "登录信息："
echo "邮箱: $(grep SUPER_ADMIN_EMAIL .env | cut -d'=' -f2)"
echo "密码: $(grep SUPER_ADMIN_PASSWORD .env | cut -d'=' -f2)"
echo ""
echo "访问地址: http://服务器IP:8787/admin"
echo ""
```

运行脚本：

```bash
chmod +x fix-admin.sh
./fix-admin.sh
```

---

## 📋 验证步骤

### 1. 检查用户是否创建成功

```bash
# 方法1：使用 psql
psql -h localhost -U teaching_user -d class_case -c "
SELECT u.id, u.email, u.name, r.name as role, u.status 
FROM \"User\" u 
JOIN \"Role\" r ON u.\"roleId\" = r.id 
WHERE r.name = '超级管理员';
"

# 方法2：查看 seed 脚本日志
npm run seed 2>&1 | grep -E '超级管理员|创建成功'
```

预期输出：
```
 id |      email       |    name    |    role    | status 
----+------------------+------------+------------+--------
  1 | admin@mail.com   | 超级管理员 | 超级管理员 | ACTIVE
```

### 2. 测试登录

```bash
# 使用 curl 测试登录
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mail.com",
    "password": "SuperAdmin123!"
  }'
```

成功响应：
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@mail.com",
    "name": "超级管理员",
    "role": {
      "id": 1,
      "name": "超级管理员"
    }
  }
}
```

### 3. 浏览器测试

访问管理后台：
```
http://服务器IP:8787/admin
```

使用以下凭证登录：
- **邮箱：** `admin@mail.com`
- **密码：** `SuperAdmin123!`

---

## ⚠️ 常见问题

### 问题 1：运行 seed 时报错 "Role does not exist"

**原因：** 数据库迁移未完成

**解决：**
```bash
# 重新运行迁移
npx prisma migrate deploy

# 重新生成 Prisma Client
npx prisma generate

# 再次运行 seed
npm run seed
```

### 问题 2：超级管理员已存在但忘记密码

**解决：**
```bash
# 生成新密码的哈希
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('NewPassword123!', 12).then(hash => console.log(hash));"

# 复制哈希值，然后更新数据库
psql -h localhost -U teaching_user -d class_case -c "
UPDATE \"User\" 
SET password = '<新密码哈希>' 
WHERE email = 'admin@mail.com';
"
```

### 问题 3：seed 脚本显示 "超级管理员账号已存在"

**说明：** 超级管理员已创建，检查邮箱和密码

```bash
# 查看配置
cat .env | grep SUPER_ADMIN

# 使用配置的邮箱和密码登录
```

### 问题 4：AUTO_CREATE_SUPER_ADMIN=false

**原因：** 环境变量禁用了自动创建

**解决：**
```bash
# 修改 .env
sed -i 's/AUTO_CREATE_SUPER_ADMIN=false/AUTO_CREATE_SUPER_ADMIN=true/' .env

# 或手动编辑
vim .env
# 将 AUTO_CREATE_SUPER_ADMIN 改为 true

# 重新运行 seed
npm run seed
```

---

## 🔒 安全建议

### 1. 修改默认密码

首次登录后立即修改密码：

```bash
# 通过 API 修改密码
curl -X PATCH http://localhost:3000/users/1 \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "YourStrongPassword123!"
  }'
```

或在管理后台界面修改。

### 2. 修改环境变量

```bash
# 编辑 .env
vim .env

# 修改以下配置
SUPER_ADMIN_EMAIL=your-secure-email@company.com
SUPER_ADMIN_PASSWORD=YourStrongPassword123!
SUPER_ADMIN_NAME=系统管理员
```

### 3. 限制管理后台访问

在 Nginx 配置中添加 IP 白名单：

```nginx
location /admin {
    # 只允许特定 IP 访问
    allow 192.168.1.100;  # 办公室 IP
    allow 10.0.0.0/24;    # 内网
    deny all;
    
    proxy_pass http://localhost:3000;
    # ... 其他配置
}
```

---

## 📝 完整部署检查清单

- [ ] 数据库迁移已完成（`npx prisma migrate deploy`）
- [ ] Prisma Client 已生成（`npx prisma generate`）
- [ ] 环境变量已配置（`.env` 文件存在）
- [ ] AUTO_CREATE_SUPER_ADMIN=true
- [ ] 数据初始化已运行（`npm run seed`）
- [ ] 超级管理员账号已创建（验证数据库）
- [ ] 可以使用超级管理员登录
- [ ] 已修改默认密码（生产环境）

---

## 🆘 仍然无法解决？

提供以下信息以便进一步排查：

```bash
# 收集诊断信息
echo "=== 环境变量 ===" > debug-admin.txt
cat .env | grep -E 'SUPER_ADMIN|AUTO_CREATE' >> debug-admin.txt
echo "" >> debug-admin.txt

echo "=== 数据库角色 ===" >> debug-admin.txt
psql -h localhost -U teaching_user -d class_case -c "SELECT * FROM \"Role\";" >> debug-admin.txt 2>&1
echo "" >> debug-admin.txt

echo "=== 超级管理员用户 ===" >> debug-admin.txt
psql -h localhost -U teaching_user -d class_case -c "
SELECT u.*, r.name as role_name 
FROM \"User\" u 
JOIN \"Role\" r ON u.\"roleId\" = r.id 
WHERE r.name = '超级管理员';
" >> debug-admin.txt 2>&1
echo "" >> debug-admin.txt

echo "=== Seed 日志 ===" >> debug-admin.txt
npm run seed >> debug-admin.txt 2>&1

# 查看诊断结果
cat debug-admin.txt
```

---

*超级管理员创建问题 - 完整解决方案 v1.0*

