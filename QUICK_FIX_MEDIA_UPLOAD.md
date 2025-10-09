# 快速修复：999@test.com 无法上传媒体

## 🔴 问题

用户 `999@test.com` 已经是教师角色，但上传媒体仍然提示权限不足。

## ✅ 解决方案（1分钟搞定）

### 原因

**Token 中的角色是旧的！** 修改数据库后，必须重新登录。

### 操作步骤

#### 步骤 1：验证 Token 中的角色

```bash
node verify-token-role.js 当前使用的TOKEN
```

如果显示 `角色: STUDENT` 或其他角色，说明 Token 是旧的。

#### 步骤 2：重新登录

```bash
curl -X POST "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "999@test.com",
    "password": "123456"
  }'
```

**复制响应中的新 `token`！**

#### 步骤 3：使用新 Token 上传

```bash
curl -X POST "http://localhost:3000/media/upload" \
  -H "Authorization: Bearer 新的TOKEN" \
  -F "file=@你的图片.jpg"
```

✅ **应该上传成功！**

## 📋 详细说明

### JWT Token 包含什么？

```json
{
  "userId": 1,
  "email": "999@test.com",
  "role": "STUDENT",     // ← 这是登录时的角色
  "iat": 1696751234,
  "exp": 1696837634
}
```

Token 生成后就**固化**了，修改数据库不会影响已有的 Token。

### 为什么需要重新登录？

| 操作                 | 数据库角色 | Token中的角色 | API权限检查结果           |
| -------------------- | ---------- | ------------- | ------------------------- |
| 修改前               | 学生       | 学生          | ❌ 权限不足                |
| 修改后（未重新登录） | **教师**   | 学生          | ❌ 权限不足（Token是旧的） |
| 修改后（重新登录）   | **教师**   | **教师**      | ✅ 权限通过                |

## 🎯 一键解决

### 方式 1：Postman / Swagger

1. 访问 `http://localhost:3000/api`
2. 找到 `POST /auth/login`
3. 输入邮箱和密码
4. 点击 Execute
5. 复制返回的新 token
6. 点击右上角 Authorize，粘贴新 token
7. 尝试上传媒体

### 方式 2：命令行一步到位

```bash
# 登录并自动提取token（需要jq工具）
NEW_TOKEN=$(curl -s -X POST "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"999@test.com","password":"123456"}' | jq -r '.token')

echo "新Token: $NEW_TOKEN"

# 使用新Token上传
curl -X POST "http://localhost:3000/media/upload" \
  -H "Authorization: Bearer $NEW_TOKEN" \
  -F "file=@test.jpg"
```

### 方式 3：前端应用

如果在前端使用：
1. 点击"退出登录"
2. 重新登录
3. 系统自动获取新 Token
4. 上传媒体文件

## ⚠️ 常见误区

### ❌ 错误理解

"我在数据库中改了角色，为什么还是不行？"

### ✅ 正确理解

数据库中的角色是"源数据"，Token 中的角色是"快照"。

```
数据库 ≠ Token

数据库：存储角色（可修改）
Token：角色快照（登录时生成，不可变）

修改数据库 → Token不会自动更新
需要重新登录 → 获取新Token → 包含新角色
```

## 🔧 验证清单

在上传媒体前，请确认：

- [ ] 数据库中用户角色是"教师"或"教师组长"
- [ ] 使用的是**重新登录后**获取的新 Token
- [ ] Token 未过期
- [ ] Token 中的 role 字段是 "TEACHER" 或 "TEACHER_LEADER"

## 📞 需要帮助？

### 检查数据库角色

```sql
SELECT u.email, u.name, r.name as role
FROM "User" u
JOIN "Role" r ON u."roleId" = r.id
WHERE u.email = '999@test.com';
```

### 检查 Token 角色

```bash
node verify-token-role.js YOUR_TOKEN
```

### 如果还是不行

1. 确认密码是否正确（登录失败会返回错误）
2. 确认用户状态是 ACTIVE（被禁用的用户无法登录）
3. 检查后端日志是否有其他错误

---

**核心要点**：修改角色后，一定要重新登录！ 🔄

**创建日期**：2025年10月8日
