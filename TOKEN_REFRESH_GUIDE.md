# Token 刷新和角色更新指南

## 🔴 常见问题

**问题描述：**
修改了用户角色，但 API 调用仍然提示权限不足。

```json
{
  "message": "需要以下角色之一: TEACHER_LEADER, TEACHER",
  "error": "Forbidden",
  "statusCode": 403
}
```

## 📋 原因分析

### JWT Token 的工作原理

JWT Token 在**登录时生成**，包含用户的角色信息：

```json
{
  "userId": 1,
  "email": "999@test.com",
  "role": "STUDENT",    // ← 登录时的角色
  "iat": 1696751234,    // 签发时间
  "exp": 1696837634     // 过期时间
}
```

### 为什么修改角色后仍然失败？

1. **Token 中的角色是固化的**
   - Token 生成后，内容不可变
   - 即使数据库中修改了角色
   - Token 中的角色信息仍然是旧的

2. **权限检查读取 Token**
   - API 请求时，系统读取 Token 中的角色
   - 而不是实时查询数据库
   - 所以看到的仍然是旧角色

## ✅ 解决方案

### 方案 1：重新登录（推荐）⭐

用户需要**重新登录**获取包含新角色的 Token。

```bash
# 1. 重新登录
curl -X POST "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "999@test.com",
    "password": "123456"
  }'

# 2. 响应中会包含新的 Token
{
  "token": "eyJhbGc...(新Token)",  # ← 使用这个新Token
  "user": {
    "id": 1,
    "email": "999@test.com",
    "role": "TEACHER"  # ← 现在是教师角色了
  }
}

# 3. 使用新Token上传
curl -X POST "http://localhost:3000/media/upload" \
  -H "Authorization: Bearer eyJhbGc...(新Token)" \
  -F "file=@image.jpg"

# ✅ 上传成功！
```

### 方案 2：通过前端重新登录

如果用户在前端使用：

1. **退出登录**
2. **重新登录**
3. **系统会自动获取新 Token**
4. **新 Token 包含更新后的角色**

## 🔍 如何验证 Token 中的角色

### 方法 1：解码 Token（在线工具）

访问 https://jwt.io/

1. 将 Token 粘贴到左侧
2. 右侧会显示解码后的内容
3. 查看 `role` 字段

### 方法 2：调用验证接口

```bash
curl -X POST "http://localhost:3000/admin/auth/check" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"token": "YOUR_TOKEN"}'

# 返回：
{
  "isSuperAdmin": false,
  "user": {
    "id": 1,
    "email": "999@test.com",
    "role": "TEACHER"  # ← 查看这里的角色
  }
}
```

### 方法 3：Node.js 脚本

```bash
node -e "console.log(JSON.parse(Buffer.from('YOUR_TOKEN'.split('.')[1], 'base64').toString()))"
```

## 📊 Token 生命周期

```
用户登录
    ↓
生成 Token（包含当前角色）
    ↓
用户使用 Token 访问 API
    ↓
--- 修改数据库角色 ---
    ↓
Token 中的角色仍然是旧的 ❌
    ↓
用户重新登录
    ↓
生成新 Token（包含新角色）✅
    ↓
用户使用新 Token 访问 API
    ↓
权限检查通过 ✅
```

## ⚠️ 重要说明

### 1. Token 不会自动更新

- ❌ 修改数据库角色不会更新已有的 Token
- ❌ Token 过期前一直保持原有信息
- ✅ 必须重新登录获取新 Token

### 2. Token 过期时间

默认 Token 有效期（查看 `src/auth/auth.service.ts`）：

```typescript
// 通常是 7 天或 24 小时
expiresIn: '7d'
```

在过期前，Token 一直有效且内容不变。

### 3. 安全性考虑

**为什么不实时查询角色？**
- ⚡ 性能：每个请求都查数据库会很慢
- 🔒 设计：JWT 的优势就是无状态验证
- 📦 缓存：Token 可以缓存，减少数据库压力

**正确的做法：**
- ✅ 修改角色后通知用户重新登录
- ✅ 或在后台强制 Token 失效（需要实现）
- ✅ 或使用短期 Token + Refresh Token 机制

## 🎯 完整操作流程

### 步骤 1：确认用户当前角色

```bash
# 查询数据库中的角色
psql -h localhost -U postgres -d class_case -c "
SELECT u.email, u.name, r.name as role
FROM \"User\" u
JOIN \"Role\" r ON u.\"roleId\" = r.id
WHERE u.email = '999@test.com';
"

# 应显示：
# email          | name | role
# 999@test.com   | vvv  | 教师
```

### 步骤 2：检查 Token 中的角色

```bash
# 解码当前使用的 Token
node -e "
const token = 'YOUR_CURRENT_TOKEN';
const payload = JSON.parse(
  Buffer.from(token.split('.')[1], 'base64').toString()
);
console.log('Token中的角色:', payload.role);
"

# 如果输出是 "STUDENT" 或其他角色，说明Token是旧的
```

### 步骤 3：重新登录

```bash
curl -X POST "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "999@test.com",
    "password": "123456"
  }'
```

### 步骤 4：使用新 Token

```bash
# 从步骤3的响应中复制新Token，然后：
curl -X POST "http://localhost:3000/media/upload" \
  -H "Authorization: Bearer 新的TOKEN" \
  -F "file=@test.jpg"

# 应该上传成功 ✅
```

## 🧪 快速验证脚本

创建一个验证脚本 `verify-token-role.js`：

```javascript
// verify-token-role.js
const token = process.argv[2];

if (!token) {
  console.log('用法: node verify-token-role.js YOUR_TOKEN');
  process.exit(1);
}

try {
  const payload = JSON.parse(
    Buffer.from(token.split('.')[1], 'base64').toString()
  );
  
  console.log('Token 信息：');
  console.log('  用户ID:', payload.userId);
  console.log('  邮箱:', payload.email);
  console.log('  角色:', payload.role);
  console.log('  签发时间:', new Date(payload.iat * 1000).toLocaleString());
  console.log('  过期时间:', new Date(payload.exp * 1000).toLocaleString());
  
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    console.log('  状态: ❌ Token已过期');
  } else {
    console.log('  状态: ✅ Token有效');
  }
} catch (error) {
  console.log('❌ Token 解析失败:', error.message);
}
```

使用方法：
```bash
node verify-token-role.js YOUR_TOKEN
```

## 💡 最佳实践

### 1. 角色修改后通知用户

在后台管理系统中修改用户角色后，显示提示：

```
✅ 用户角色已更新为"教师"

⚠️ 重要提示：
用户需要重新登录才能使用新角色的权限。
请通知用户退出并重新登录。
```

### 2. 前端自动处理

```javascript
// 前端接收到403错误时
if (error.response.status === 403) {
  alert('权限不足，请重新登录');
  // 清除本地Token
  localStorage.removeItem('token');
  // 跳转到登录页
  window.location.href = '/login';
}
```

### 3. 实现 Token 刷新机制（未来改进）

```
短期 Access Token (15分钟)
    +
长期 Refresh Token (7天)
    ↓
Access Token 过期时使用 Refresh Token 获取新的
```

## 📞 相关文档

- [角色权限系统](./ROLE_PERMISSION_SYSTEM_README.md)
- [媒体上传权限](./FIX_MEDIA_UPLOAD_PERMISSION.md)
- [用户接口统一](./USER_API_UNIFICATION.md)

---

**问题**：修改角色后仍然权限不足  
**原因**：Token 中的角色是旧的  
**解决**：重新登录获取新 Token  
**状态**：✅ 立即可用  

**创建日期**：2025年10月8日
