# 角色映射修复 - 快速测试指南

## 🎯 测试目标

验证中文角色名称（"教师"）能正确转换为英文枚举值（`TEACHER`），使权限检查正常工作。

## 📋 测试步骤

### 步骤 1：重新登录获取新 Token

**重要**：必须重新登录才能获得包含英文枚举值的新 Token！

```bash
curl -X POST "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"999@test.com\",\"password\":\"123456\"}"
```

**预期响应：**
```json
{
  "access_token": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "999@test.com",
    "name": "vvv",
    "role": "TEACHER",  // ← 关键！现在是英文枚举值了！
    "roleId": 3
  }
}
```

✅ **验证点**：`role` 字段应该是 `"TEACHER"`（英文），而不是 `"教师"`（中文）

### 步骤 2：验证 Token 内容

使用验证脚本查看 Token 中的角色：

```bash
node verify-token-role.js <新的TOKEN>
```

**预期输出：**
```
📋 Token 信息：
  用户ID: 1
  邮箱: 999@test.com
  角色: TEACHER          ← 应该是英文 "TEACHER"
  角色名称: 教师
  
🔑 角色权限： 教师 - 可上传媒体、创建文章
📤 可否上传媒体： ✅ 是

✅ Token 有效（距离过期还有 7 天）
```

✅ **验证点**：角色应该显示为 `TEACHER`（英文）

### 步骤 3：上传媒体文件

使用新 Token 上传媒体文件：

```bash
curl -X POST "http://localhost:3000/media/upload" \
  -H "Authorization: Bearer <新的TOKEN>" \
  -F "file=@uploads/images/1760020222824_fzwoqb1x014.png"
```

**预期响应：** HTTP 201 Created

```json
{
  "id": 1,
  "filename": "1734567890123_abc123.png",
  "originalName": "test.png",
  "type": "IMAGE",
  "size": 12345,
  "url": "http://localhost:3000/uploads/images/1734567890123_abc123.png",
  "uploadedAt": "2025-10-08T..."
}
```

✅ **验证点**：应该成功上传，返回 201 状态码和媒体信息

## 🐛 调试验证（可选）

### 使用断点查看角色转换

1. 在 VS Code 中打开 `src/auth/guards/roles.guard.ts`
2. 在第 66 行打断点：
   ```typescript
   const hasRequiredRole = requiredRoles.includes(user.role); // ← 这里
   ```
3. 按 `F5` 启动调试
4. 发送上传请求
5. 代码暂停在断点时，查看变量：

**变量面板应该显示：**
```javascript
user.role: "TEACHER"                      // ← 现在是英文了！
requiredRoles: ["TEACHER_LEADER", "TEACHER"]
hasRequiredRole: true                     // ← 匹配成功！
```

## ✅ 成功标准

### 测试通过的标志

- ✅ 登录响应中 `role` 为 `"TEACHER"`（英文）
- ✅ Token 解码后角色为 `"TEACHER"`
- ✅ 上传媒体成功返回 201
- ✅ 没有 403 权限错误

### 测试失败的标志

- ❌ 登录响应中 `role` 仍然是 `"教师"`（中文）
- ❌ 上传时返回 403：需要以下角色之一: TEACHER_LEADER, TEACHER
- ❌ 断点显示 `user.role` 仍然是中文

## 🔧 故障排除

### 问题 1：登录后 role 仍然是中文

**原因**：代码未正确应用

**解决**：
```bash
# 确保代码已编译
npm run build

# 重启服务
# Ctrl + C
npm run start:dev
```

### 问题 2：上传时仍然提示 403

**可能原因**：
1. 使用了旧 Token（没有重新登录）
2. 服务未重启

**解决**：
```bash
# 1. 确保服务已重启
# 2. 重新登录获取新 Token
# 3. 使用新 Token 上传
```

### 问题 3：Token 过期

**错误**：`401 Unauthorized`

**解决**：重新登录
```bash
curl -X POST "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"999@test.com\",\"password\":\"123456\"}"
```

## 📊 预期结果对比

### 修复前

| 操作     | 结果                | 说明                  |
| -------- | ------------------- | --------------------- |
| 登录     | `role: "教师"`      | 中文                  |
| 上传媒体 | 403 Forbidden       | 权限检查失败          |
| 断点查看 | `user.role: "教师"` | 与 `"TEACHER"` 不匹配 |

### 修复后

| 操作     | 结果                   | 说明                  |
| -------- | ---------------------- | --------------------- |
| 登录     | `role: "TEACHER"`      | 英文枚举值 ✅          |
| 上传媒体 | 201 Created            | 成功上传 ✅            |
| 断点查看 | `user.role: "TEACHER"` | 与 `"TEACHER"` 匹配 ✅ |

## 🧪 额外测试（可选）

### 测试其他角色

#### 1. 测试学生角色（应该失败）

```bash
# 登录为学生
curl -X POST "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"student@test.com\",\"password\":\"123456\"}"

# 响应中应该是 "role": "STUDENT"

# 尝试上传
curl -X POST "http://localhost:3000/media/upload" \
  -H "Authorization: Bearer <学生TOKEN>" \
  -F "file=@test.jpg"

# 应该返回 403：需要以下角色之一: TEACHER_LEADER, TEACHER
```

✅ **验证点**：学生无法上传，返回 403

#### 2. 测试教师组长（应该成功）

```bash
# 登录为教师组长
curl -X POST "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"leader@test.com\",\"password\":\"123456\"}"

# 响应中应该是 "role": "TEACHER_LEADER"

# 上传
curl -X POST "http://localhost:3000/media/upload" \
  -H "Authorization: Bearer <组长TOKEN>" \
  -F "file=@test.jpg"

# 应该成功 201
```

✅ **验证点**：教师组长可以上传

## 📞 相关文档

- [角色映射修复说明](./ROLE_NAME_MAPPING_FIX.md) - 详细技术说明
- [Token 验证脚本使用](./verify-token-role.js) - Token 解码工具
- [调试权限检查](./DEBUG_MEDIA_UPLOAD_PERMISSION.md) - 调试指南

## 🎉 测试完成

完成上述所有测试后：

- ✅ 角色名称已正确转换为英文枚举值
- ✅ 权限检查正常工作
- ✅ 教师可以上传媒体文件
- ✅ 其他角色权限正常

---

**修复版本**：2025-10-08  
**测试状态**：待验证  
**重要提示**：所有用户必须重新登录！

**创建日期**：2025年10月8日
