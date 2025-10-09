# 角色名称映射修复说明

## 🔴 发现的问题

### 问题描述

用户角色权限检查失败，即使数据库中角色正确，仍然提示权限不足。

**根本原因：** 角色名称不匹配！

- **装饰器检查**：使用英文枚举值 `TEACHER`、`TEACHER_LEADER`
- **Token 中存储**：使用中文名称 `"教师"`、`"教师组长"`
- **结果**：`"教师" !== "TEACHER"` → 权限检查失败 ❌

## 📋 问题分析

### 数据流

```
数据库 Role 表
  ↓ (name字段为中文)
role.name = "教师"
  ↓ (登录时)
Token payload.role = "教师"
  ↓ (权限检查时)
user.role = "教师"
  ↓ (装饰器要求)
requiredRoles = ["TEACHER", "TEACHER_LEADER"]
  ↓ (比较)
"教师" !== "TEACHER"  → 失败 ❌
```

### 为什么会出现这个问题？

1. **数据库设计**：角色表的 `name` 字段使用中文（"教师"、"学生"等）
2. **代码枚举**：权限检查使用英文枚举（`TEACHER`、`STUDENT`等）
3. **没有映射**：Token 直接使用数据库中的中文名称，没有转换

## ✅ 解决方案

### 实现角色名称标准化

添加了角色名称映射机制，自动将中文名称转换为英文枚举值。

#### 1. 添加映射表

**文件：** `src/auth/enums/user-role.enum.ts`

```typescript
export const ROLE_NAME_TO_ENUM: Record<string, UserRole> = {
  '超级管理员': UserRole.ADMIN,
  '管理员': UserRole.ADMIN,
  '教师组长': UserRole.TEACHER_LEADER,
  '教师': UserRole.TEACHER,          // ← "教师" → "TEACHER"
  '助教组长': UserRole.ASSISTANT_LEADER,
  '助教': UserRole.ASSISTANT,
  '学生': UserRole.STUDENT,
};
```

#### 2. 添加标准化函数

```typescript
export function normalizeRoleName(roleName: string): UserRole {
  // 如果已经是英文枚举值，直接返回
  if (Object.values(UserRole).includes(roleName as UserRole)) {
    return roleName as UserRole;
  }
  
  // 如果是中文名称，转换为枚举值
  const enumValue = ROLE_NAME_TO_ENUM[roleName];
  if (enumValue) {
    return enumValue;  // "教师" → "TEACHER"
  }
  
  // 未知角色，返回原值并警告
  console.warn(`未知的角色名称: ${roleName}`);
  return roleName as UserRole;
}
```

#### 3. 在登录时转换

**文件：** `src/auth/auth.service.ts`

```typescript
// 修改前
role: result.role.name,  // "教师"

// 修改后
role: normalizeRoleName(result.role.name),  // "TEACHER"
```

#### 4. 在 JWT 验证时转换

**文件：** `src/auth/jwt.strategy.ts`

```typescript
// 修改前
role: user.role.name,  // "教师"

// 修改后
role: normalizeRoleName(user.role.name),  // "TEACHER"
```

## 🎯 修复效果

### 修复前

```javascript
// Token payload
{
  userId: 1,
  email: "999@test.com",
  role: "教师"           // ← 中文
}

// 权限检查
requiredRoles.includes("教师")     // false
requiredRoles: ["TEACHER", "TEACHER_LEADER"]
user.role: "教师"
→ "教师" !== "TEACHER" → 失败 ❌
```

### 修复后

```javascript
// Token payload
{
  userId: 1,
  email: "999@test.com",
  role: "TEACHER"        // ← 英文枚举值
}

// 权限检查
requiredRoles.includes("TEACHER")  // true
requiredRoles: ["TEACHER", "TEACHER_LEADER"]
user.role: "TEACHER"
→ "TEACHER" === "TEACHER" → 成功 ✅
```

## 📊 角色映射表

| 数据库中的名称（中文） | 转换后的枚举值     | 说明                |
| ---------------------- | ------------------ | ------------------- |
| 超级管理员             | `ADMIN`            | 超级管理员角色      |
| 管理员                 | `ADMIN`            | 管理员角色          |
| 教师组长               | `TEACHER_LEADER`   | 教师组长            |
| **教师**               | **`TEACHER`**      | **教师角色** ← 关键 |
| 助教组长               | `ASSISTANT_LEADER` | 助教组长            |
| 助教                   | `ASSISTANT`        | 助教                |
| 学生                   | `STUDENT`          | 学生角色            |

## 🔧 技术实现

### 修改的文件

1. ✅ `src/auth/enums/user-role.enum.ts` - 添加映射表和转换函数
2. ✅ `src/auth/auth.service.ts` - 登录时转换角色
3. ✅ `src/auth/jwt.strategy.ts` - JWT 验证时转换角色

### 工作流程

```
用户登录
    ↓
数据库查询 → role.name = "教师"
    ↓
normalizeRoleName("教师") → "TEACHER"
    ↓
生成 Token payload.role = "TEACHER"
    ↓
用户使用 Token 访问 API
    ↓
JWT 验证 → normalizeRoleName("教师") → "TEACHER"
    ↓
权限检查：user.role = "TEACHER"
    ↓
requiredRoles.includes("TEACHER") → true ✅
    ↓
权限通过！
```

## 🚀 使用方法

### 步骤 1：重启服务

```bash
npm run start:dev
```

或调试模式：
```bash
npm run start:debug
```

### 步骤 2：用户重新登录

**重要**：现有的 Token 仍然包含中文角色，用户需要重新登录获取新的 Token。

```bash
curl -X POST "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "999@test.com",
    "password": "123456"
  }'
```

**响应：**
```json
{
  "access_token": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "999@test.com",
    "role": "TEACHER"  // ← 现在是英文枚举值了！
  }
}
```

### 步骤 3：使用新 Token 上传

```bash
curl -X POST "http://localhost:3000/media/upload" \
  -H "Authorization: Bearer 新的TOKEN" \
  -F "file=@test.jpg"
```

✅ **上传成功！**

## 🧪 验证修复

### 测试 1：验证新 Token 中的角色

```bash
node verify-token-role.js 新的TOKEN
```

**应该显示：**
```
📋 Token 信息：
  用户ID: 1
  邮箱: 999@test.com
  角色: TEACHER          ← 英文枚举值
  
🔑 角色权限： 教师 - 可上传媒体、创建文章
📤 可否上传媒体： ✅ 是
```

### 测试 2：调试查看变量

在 `src/auth/guards/roles.guard.ts:66` 打断点，查看：

```javascript
user.role: "TEACHER"                      // ← 现在是英文了
requiredRoles: ["TEACHER_LEADER", "TEACHER"]
hasRequiredRole: true                     // ← 匹配成功！
```

### 测试 3：实际上传

```bash
curl -X POST "http://localhost:3000/media/upload" \
  -H "Authorization: Bearer 新TOKEN" \
  -F "file=@test.jpg"

# 应该返回 201 Created
{
  "id": 1,
  "type": "IMAGE",
  "url": "http://localhost:3000/uploads/images/...",
  ...
}
```

## ⚠️ 重要提示

### 1. 所有用户需要重新登录

修复后，所有现有的 Token 仍然包含中文角色名称，需要重新登录。

### 2. 向后兼容

`normalizeRoleName` 函数支持两种输入：
- 中文："教师" → 转换为 "TEACHER"
- 英文："TEACHER" → 直接返回 "TEACHER"

所以即使未来数据库改为存储英文名称，代码仍然能正常工作。

### 3. 数据库不需要修改

不需要修改数据库中的角色名称，仍然可以使用中文。

## 📊 修复前后对比

### 修复前

| 步骤                 | 值                   | 结果   |
| -------------------- | -------------------- | ------ |
| 数据库 role.name     | "教师"               | -      |
| Token payload.role   | "教师"               | 中文   |
| 权限检查 user.role   | "教师"               | 中文   |
| 装饰器 requiredRoles | ["TEACHER"]          | 英文   |
| 匹配结果             | "教师" !== "TEACHER" | ❌ 失败 |

### 修复后

| 步骤                 | 值                      | 结果     |
| -------------------- | ----------------------- | -------- |
| 数据库 role.name     | "教师"                  | -        |
| **标准化转换**       | **"教师" → "TEACHER"**  | **英文** |
| Token payload.role   | "TEACHER"               | 英文     |
| 权限检查 user.role   | "TEACHER"               | 英文     |
| 装饰器 requiredRoles | ["TEACHER"]             | 英文     |
| 匹配结果             | "TEACHER" === "TEACHER" | ✅ 成功   |

## 💡 设计说明

### 为什么不直接修改数据库？

**保持中文的好处：**
- ✅ 后台管理界面显示友好（显示"教师"而不是"TEACHER"）
- ✅ 用户容易理解
- ✅ 不需要迁移现有数据

**使用映射的好处：**
- ✅ 代码中统一使用英文枚举
- ✅ 类型安全
- ✅ 易于维护
- ✅ 向后兼容

### 最佳实践

```
数据库存储：中文（用户友好）
    ↓ (映射层)
代码使用：英文枚举（类型安全）
    ↓ (显示层)
界面展示：中文（用户友好）
```

## 🔍 调试验证

### 在登录时查看转换

在 `src/auth/auth.service.ts:36` 打断点：

```typescript
role: normalizeRoleName(result.role.name), // ← 断点
```

查看：
```javascript
result.role.name: "教师"                    // 输入
normalizeRoleName("教师"): "TEACHER"       // 输出
```

### 在 JWT 验证时查看转换

在 `src/auth/jwt.strategy.ts:46` 打断点：

```typescript
role: normalizeRoleName(user.role.name), // ← 断点
```

查看：
```javascript
user.role.name: "教师"                     // 输入
normalizeRoleName("教师"): "TEACHER"      // 输出
```

### 在权限检查时查看匹配

在 `src/auth/guards/roles.guard.ts:66` 打断点：

```typescript
const hasRequiredRole = requiredRoles.includes(user.role); // ← 断点
```

查看：
```javascript
user.role: "TEACHER"                       // 标准化后的值
requiredRoles: ["TEACHER", "TEACHER_LEADER"]
hasRequiredRole: true                      // ✅ 匹配成功
```

## 📁 修改的文件

- ✅ `src/auth/enums/user-role.enum.ts` - 添加映射表和转换函数
- ✅ `src/auth/auth.service.ts` - 登录时使用转换
- ✅ `src/auth/jwt.strategy.ts` - JWT 验证时使用转换

## 🎉 修复效果

### 立即生效

重启服务后：
- ✅ 新登录的用户 Token 中包含英文枚举值
- ✅ 权限检查正常工作
- ✅ 所有装饰器正常工作

### 用户需要做什么

**重新登录获取新 Token**，仅此而已！

## 🧪 完整测试流程

### 测试 1：教师角色上传媒体

```bash
# 1. 登录（获取新Token）
curl -X POST "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"999@test.com","password":"123456"}'

# 响应中 role 应该是 "TEACHER"

# 2. 上传媒体
curl -X POST "http://localhost:3000/media/upload" \
  -H "Authorization: Bearer 新TOKEN" \
  -F "file=@test.jpg"

# 应该成功 ✅
```

### 测试 2：其他角色

```bash
# 学生登录
curl -X POST "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test.com","password":"123456"}'

# 响应中 role 应该是 "STUDENT"

# 尝试上传
curl -X POST "http://localhost:3000/media/upload" \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@test.jpg"

# 应该返回 403：需要以下角色之一: TEACHER_LEADER, TEACHER ✅
```

## 📋 支持的角色映射

### 完整映射列表

| 中文名称   | 英文枚举值       | 可上传媒体 |
| ---------- | ---------------- | ---------- |
| 超级管理员 | ADMIN            | ✅ 是       |
| 管理员     | ADMIN            | ✅ 是       |
| 教师组长   | TEACHER_LEADER   | ✅ 是       |
| **教师**   | **TEACHER**      | **✅ 是**   |
| 助教组长   | ASSISTANT_LEADER | ❌ 否       |
| 助教       | ASSISTANT        | ❌ 否       |
| 学生       | STUDENT          | ❌ 否       |

## 🔑 关键代码

### 映射函数

```typescript
normalizeRoleName("教师")         → "TEACHER"
normalizeRoleName("教师组长")     → "TEACHER_LEADER"
normalizeRoleName("TEACHER")      → "TEACHER" (已经是枚举值)
normalizeRoleName("未知角色")     → "未知角色" (保持原值，打印警告)
```

### 使用示例

```typescript
// 在任何需要标准化角色的地方使用
import { normalizeRoleName } from './enums/user-role.enum';

const roleFromDB = "教师";
const normalizedRole = normalizeRoleName(roleFromDB);  // "TEACHER"

// 现在可以用于权限检查
if (normalizedRole === UserRole.TEACHER) {
  // 允许访问
}
```

## ⚠️ 注意事项

### 1. 必须重新登录

- ❌ 旧Token仍然包含中文角色
- ✅ 重新登录后Token包含英文枚举值

### 2. 所有用户都需要

- 不只是 999@test.com
- 所有用户都需要重新登录
- 才能获得包含英文枚举值的新 Token

### 3. 数据库不需要修改

- 角色表的 name 仍然是中文
- 只在代码层面转换
- 用户界面仍然显示中文

## 🎊 额外好处

### 1. 类型安全

```typescript
const role: UserRole = normalizeRoleName("教师");
// role 的类型是 UserRole 枚举，而不是 string
```

### 2. IDE 自动补全

```typescript
if (role === UserRole.TEACHER) {  // ← IDE 会提示所有可用的角色枚举
  // ...
}
```

### 3. 编译时检查

```typescript
const role = normalizeRoleName("教师");
if (role === "TEACHERR") {  // ← 拼写错误，TypeScript 会警告
  // ...
}
```

## 📞 相关文档

- [Token 刷新指南](./TOKEN_REFRESH_GUIDE.md)
- [媒体上传权限](./FIX_MEDIA_UPLOAD_PERMISSION.md)
- [调试权限检查](./DEBUG_MEDIA_UPLOAD_PERMISSION.md)

---

**问题**：中英文角色名称不匹配  
**原因**：数据库用中文，代码用英文  
**解决**：添加自动映射转换  
**状态**：✅ 已修复  
**影响**：所有用户需要重新登录  

**创建日期**：2025年10月8日
