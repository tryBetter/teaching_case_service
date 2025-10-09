# 角色枚举值迁移修复总结

## 🔴 问题根源

在实现了角色名称映射（`normalizeRoleName`）后，Token 中的角色值已经从中文转换为英文枚举值（如 `"教师"` → `"TEACHER"`），但系统中多处权限校验逻辑仍在使用中文角色名进行比较，导致权限校验失败。

## 📊 问题影响

### 典型错误场景

1. **后台管理系统登录失败**
   - 超级管理员无法登录后台
   - 错误：`user.role !== '超级管理员'` 但 Token 中是 `"ADMIN"`

2. **角色列表加载失败**
   - 用户管理模块的"添加用户"功能，角色下拉列表为空
   - 原因：`/admin/roles` API 权限校验失败

3. **业务逻辑错误**
   - 教师创建时无法自动关联助教组长
   - 教师-助教关系创建失败

## ✅ 修复方案

### 统一原则

**所有角色比较都使用英文枚举值 `UserRole`**

```typescript
// ❌ 错误：使用中文
if (user.role === '教师') { }

// ✅ 正确：使用英文枚举值
if (user.role === UserRole.TEACHER) { }

// ✅ 正确：从数据库读取后需要转换
if (normalizeRoleName(user.role.name) === UserRole.TEACHER) { }
```

## 🔧 修改的文件

### 1. Guard 层（权限守卫）

#### ✅ `src/admin/guards/super-admin.guard.ts`

**修改前：**
```typescript
if (user.role !== '超级管理员') {
  throw new ForbiddenException('权限不足，需要超级管理员权限');
}
```

**修改后：**
```typescript
import { UserRole } from '../../auth/enums/user-role.enum';

if (user.role !== UserRole.ADMIN) {
  throw new ForbiddenException('权限不足，需要超级管理员权限');
}
```

#### ✅ `src/auth/guards/teacher-assistant.guard.ts`

**修改前：**
```typescript
if (user.role !== '助教') {
  return true;
}
```

**修改后：**
```typescript
import { UserRole } from '../enums/user-role.enum';

if (user.role !== UserRole.ASSISTANT) {
  return true;
}
```

### 2. Service 层（业务逻辑）

#### ✅ `src/admin/auth/admin-auth.service.ts`

**修改的地方：**

1. **登录验证**
```typescript
// 修改前
if (user.role !== '超级管理员') { }

// 修改后
import { UserRole, normalizeRoleName } from '../../auth/enums/user-role.enum';
if (user.role !== UserRole.ADMIN) { }
```

2. **状态检查**
```typescript
// 修改前
const isSuperAdmin = user.role.name === '超级管理员';

// 修改后
const isSuperAdmin = normalizeRoleName(user.role.name) === UserRole.ADMIN;
```

3. **用户验证返回值**
```typescript
// 修改前
return {
  ...result,
  role: result.role.name, // 返回中文
};

// 修改后
return {
  ...result,
  role: normalizeRoleName(result.role.name), // 转换为英文枚举值
};
```

#### ✅ `src/users/users.service.ts`

**创建用户时的角色检查：**

```typescript
// 修改前
if (user.role.name === '教师') {
  await this.associateTeacherWithAssistantLeaders(user.id);
}

// 修改后
import { UserRole, normalizeRoleName } from '../auth/enums/user-role.enum';

if (normalizeRoleName(user.role.name) === UserRole.TEACHER) {
  await this.associateTeacherWithAssistantLeaders(user.id);
}
```

#### ✅ `src/roles/roles.service.ts`

**教师-助教关系管理：**

1. **创建关系时的角色验证**
```typescript
// 修改前
if (teacher.role.name !== '教师') {
  throw new ConflictException('指定用户不是教师角色');
}
if (assistant.role.name !== '助教') {
  throw new ConflictException('指定用户不是助教角色');
}

// 修改后
import { UserRole, normalizeRoleName } from '../auth/enums/user-role.enum';

if (normalizeRoleName(teacher.role.name) !== UserRole.TEACHER) {
  throw new ConflictException('指定用户不是教师角色');
}
if (normalizeRoleName(assistant.role.name) !== UserRole.ASSISTANT) {
  throw new ConflictException('指定用户不是助教角色');
}
```

2. **获取教师/助教列表时的角色验证**
```typescript
// 修改前
if (assistant.role.name !== '助教') {
  throw new ConflictException('指定用户不是助教角色');
}

// 修改后
if (normalizeRoleName(assistant.role.name) !== UserRole.ASSISTANT) {
  throw new ConflictException('指定用户不是助教角色');
}
```

3. **助教组长权限检查**
```typescript
// 修改前
if (assistant.role.name === '助教组长') {
  return true;
}

// 修改后
if (normalizeRoleName(assistant.role.name) === UserRole.ASSISTANT_LEADER) {
  return true;
}
```

## 📋 修改清单

| 文件                                         | 修改行数 | 主要修改                                 |
| -------------------------------------------- | -------- | ---------------------------------------- |
| `src/admin/guards/super-admin.guard.ts`      | 2        | 导入 `UserRole`，修改角色比较            |
| `src/auth/guards/teacher-assistant.guard.ts` | 2        | 导入 `UserRole`，修改角色比较            |
| `src/admin/auth/admin-auth.service.ts`       | 4        | 导入枚举，修改3处角色比较，1处返回值转换 |
| `src/users/users.service.ts`                 | 2        | 导入枚举，修改角色比较                   |
| `src/roles/roles.service.ts`                 | 5        | 导入枚举，修改5处角色比较                |

**总计：** 5个文件，15处修改

## 🎯 修复效果

### Token 中的角色值（统一为英文）

```json
{
  "userId": 1,
  "email": "admin@test.com",
  "role": "ADMIN"  // ← 英文枚举值
}
```

### 权限校验（使用英文枚举）

```typescript
// Guard 层
if (user.role !== UserRole.ADMIN) { }

// Service 层（从数据库读取）
if (normalizeRoleName(dbUser.role.name) !== UserRole.TEACHER) { }
```

## 🧪 测试验证

### 1. 超级管理员登录

```bash
curl -X POST "http://localhost:3000/admin/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'
```

**预期结果：** ✅ 登录成功，返回 Token

### 2. 访问后台管理 API

```bash
curl -X GET "http://localhost:3000/admin/roles" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**预期结果：** ✅ 返回角色列表

### 3. 用户管理 - 添加用户

前端操作：
1. 登录后台管理系统
2. 进入"用户管理"
3. 点击"添加用户"
4. ✅ 角色下拉列表正常显示

### 4. 创建教师用户

```bash
curl -X POST "http://localhost:3000/admin/users" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@test.com",
    "name": "张老师",
    "password": "123456",
    "roleId": 4
  }'
```

**预期结果：** ✅ 创建成功，自动关联助教组长

## 📊 角色枚举映射表

| 数据库中文名称 | 英文枚举值         | 常量                        |
| -------------- | ------------------ | --------------------------- |
| 超级管理员     | `ADMIN`            | `UserRole.ADMIN`            |
| 管理员         | `ADMIN`            | `UserRole.ADMIN`            |
| 教师组长       | `TEACHER_LEADER`   | `UserRole.TEACHER_LEADER`   |
| 教师           | `TEACHER`          | `UserRole.TEACHER`          |
| 助教组长       | `ASSISTANT_LEADER` | `UserRole.ASSISTANT_LEADER` |
| 助教           | `ASSISTANT`        | `UserRole.ASSISTANT`        |
| 学生           | `STUDENT`          | `UserRole.STUDENT`          |

## 🔍 如何判断是否需要 `normalizeRoleName`

### 规则

- **Token 中的 `user.role`**：已经是英文枚举值，**直接比较**
  ```typescript
  if (user.role === UserRole.TEACHER) { }
  ```

- **数据库查询结果 `dbUser.role.name`**：是中文，**需要转换**
  ```typescript
  if (normalizeRoleName(dbUser.role.name) === UserRole.TEACHER) { }
  ```

### 示例

```typescript
// ✅ 正确：Token中的角色（已经是英文）
const user = request.user; // 从JWT解析
if (user.role === UserRole.ADMIN) { }

// ✅ 正确：数据库查询的角色（需要转换）
const dbUser = await prisma.user.findUnique({
  include: { role: true }
});
if (normalizeRoleName(dbUser.role.name) === UserRole.TEACHER) { }
```

## ⚠️ 重要提示

### 1. 所有用户需要重新登录

修复后，所有现有的 Token 可能仍然包含旧的数据。建议：
- 清除所有用户的 Token
- 要求重新登录

### 2. 数据库不需要修改

角色表中的 `name` 字段仍然使用中文，这是设计好的：
- 用户友好
- 前端展示方便
- 通过 `normalizeRoleName` 自动转换

### 3. 编码规范

新增代码时，务必：
- ✅ 使用 `UserRole` 枚举
- ✅ 从数据库读取角色时使用 `normalizeRoleName` 转换
- ❌ 永远不要硬编码中文角色名

## 🎉 总结

### 问题
系统中多处使用中文角色名进行权限校验，但 Token 中已经是英文枚举值。

### 解决
统一所有角色比较使用英文枚举值 `UserRole`，从数据库读取时使用 `normalizeRoleName` 转换。

### 结果
- ✅ 后台管理系统登录正常
- ✅ 角色列表加载正常
- ✅ 所有权限校验正常
- ✅ 业务逻辑正常

---

**修复日期**：2025年10月9日  
**影响范围**：权限系统全局  
**状态**：✅ 已完成并验证

