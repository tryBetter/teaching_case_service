# 修复媒体上传权限问题

## 🔴 问题描述

用户 `999@test.com` 调用媒体上传接口时报错：

```json
{
  "message": "需要以下角色之一: TEACHER_LEADER, TEACHER",
  "error": "Forbidden",
  "statusCode": 403
}
```

## 📋 原因分析

媒体上传接口 `POST /media/upload` 需要以下角色之一：
- **教师组长（TEACHER_LEADER）**
- **教师（TEACHER）**

当前用户可能是其他角色（如学生、助教等），没有上传权限。

## ✅ 解决方案

### 方案 1：通过后台管理界面修改（推荐）⭐

#### 步骤 1：登录后台管理系统

```
http://localhost:3000/admin/
```

使用超级管理员账号登录

#### 步骤 2：进入用户管理

点击侧边栏的"用户管理"

#### 步骤 3：找到用户

搜索用户 `999@test.com` 或 `vvv`

#### 步骤 4：编辑用户角色

1. 点击该用户的"✏️ 编辑"按钮
2. 在"角色"下拉框中选择 **"教师"** 或 **"教师组长"**
3. 点击"保存修改"

#### 步骤 5：验证

让用户重新登录获取新的 Token，然后再次上传媒体文件。

### 方案 2：通过 SQL 直接修改

如果无法访问后台管理系统，可以直接修改数据库。

#### 使用提供的 SQL 文件

我已创建 SQL 文件：`update-user-role.sql`

**执行步骤：**

1. 连接到 PostgreSQL 数据库
2. 运行 SQL 文件中的命令

**快速执行（命令行）：**

```bash
# 方式1: 使用 psql
psql -h localhost -U postgres -d class_case -f update-user-role.sql

# 方式2: 直接执行单条命令
psql -h localhost -U postgres -d class_case -c "UPDATE \"User\" SET \"roleId\" = (SELECT id FROM \"Role\" WHERE name = '教师' LIMIT 1) WHERE email = '999@test.com';"
```

### 方案 3：通过 API 修改（需要管理员权限）

使用超级管理员 Token 调用更新用户接口：

```bash
# 步骤1: 获取教师角色ID
curl -X GET "http://localhost:3000/admin/roles" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 假设教师角色ID为4

# 步骤2: 更新用户角色
curl -X PATCH "http://localhost:3000/admin/users/{userId}" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"roleId": 4}'
```

## 🎯 系统角色说明

系统预设的角色及其权限：

| 角色         | 权限级别 | 可否上传媒体 |
| ------------ | -------- | ------------ |
| 超级管理员   | 最高     | ✅ 是         |
| 管理员       | 高       | ✅ 是         |
| **教师组长** | **中高** | **✅ 是**     |
| **教师**     | **中**   | **✅ 是**     |
| 助教组长     | 中低     | ❌ 否         |
| 助教         | 低       | ❌ 否         |
| 学生         | 最低     | ❌ 否         |

## 📝 媒体上传权限要求

### 需要的角色

以下角色可以上传媒体：
- ✅ 超级管理员
- ✅ 管理员
- ✅ **教师组长**
- ✅ **教师**

### 不能上传的角色

以下角色不能上传媒体：
- ❌ 助教组长
- ❌ 助教
- ❌ 学生

### 权限设计原因

**为什么限制上传权限？**
- 媒体文件占用存储空间
- 需要审核管理权限
- 防止滥用和垃圾文件
- 确保内容质量

**建议角色分配：**
- **教师**：适合日常教学需要上传资料的教师
- **教师组长**：适合需要管理和审核的教师组长
- **助教**：只能查看和使用现有媒体，不能上传

## 🔄 完整操作流程

### 1. 修改用户角色

```
超级管理员登录
    ↓
进入用户管理
    ↓
找到用户 999@test.com
    ↓
编辑角色为"教师"
    ↓
保存修改
```

### 2. 用户重新登录

```
用户退出登录
    ↓
重新登录（获取新Token）
    ↓
新Token包含"教师"角色
```

### 3. 上传媒体

```
使用新Token调用上传接口
    ↓
POST /media/upload
    ↓
上传成功 ✅
```

## ⚠️ 注意事项

1. **修改角色后需要重新登录**
   - 旧的 Token 仍然包含旧角色信息
   - 必须重新登录获取新 Token

2. **角色选择建议**
   - 一般教师用户：选择"教师"角色
   - 管理教师资源的：选择"教师组长"
   - 不需要上传的：保持"助教"或"学生"角色

3. **权限传递**
   - 教师组长拥有教师的所有权限
   - 助教组长拥有助教的所有权限

## 🧪 测试验证

### 修改角色后测试上传

```bash
# 1. 用户登录获取新Token
curl -X POST "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"999@test.com","password":"123456"}'

# 2. 复制返回的 token

# 3. 上传媒体文件
curl -X POST "http://localhost:3000/media/upload" \
  -H "Authorization: Bearer NEW_TOKEN" \
  -F "file=@/path/to/image.jpg"

# 如果返回200，说明权限修复成功
```

## 📊 权限矩阵

### 媒体相关权限

| 操作     | 超级管理员 | 管理员 | 教师组长 | 教师 | 助教组长 | 助教 | 学生 |
| -------- | ---------- | ------ | -------- | ---- | -------- | ---- | ---- |
| 上传媒体 | ✅          | ✅      | ✅        | ✅    | ❌        | ❌    | ❌    |
| 查看媒体 | ✅          | ✅      | ✅        | ✅    | ✅        | ✅    | ✅    |
| 更新媒体 | ✅          | ✅      | ✅        | ✅    | ✅        | ✅    | ❌    |
| 删除媒体 | ✅          | ✅      | ✅        | ✅    | ❌        | ❌    | ❌    |

## 💡 快速修复命令

如果你有数据库访问权限，一条 SQL 即可修复：

```sql
-- 将用户角色改为"教师"
UPDATE "User"
SET "roleId" = (SELECT id FROM "Role" WHERE name = '教师' LIMIT 1)
WHERE email = '999@test.com';
```

## 📞 相关文档

- [角色权限系统](./ROLE_PERMISSION_SYSTEM_README.md)
- [用户管理指南](./ADMIN_SYSTEM_README.md)
- [媒体管理API](./ADMIN_MEDIA_MANAGEMENT_API.md)

---

**问题**：用户无法上传媒体  
**原因**：角色权限不足  
**解决**：修改为教师或教师组长角色  
**状态**：✅ 可立即解决  

**创建日期**：2025年10月8日
