# 用户模块接口统一说明

## 📋 更新概述

统一了 `/users` 和 `/admin/users` 两套用户接口的行为和返回格式，提供一致的API体验。

**更新日期**：2025年10月8日

## 🔄 主要改动

### 1. 用户列表接口统一

#### 之前的行为

**`/users` 接口：**
```javascript
// 请求
GET /users

// 返回（无分页）
[
  { id: 1, email: "user1@test.com", name: "用户1", role: {...} },
  { id: 2, email: "user2@test.com", name: "用户2", role: {...} },
  ...所有用户
]
```

**`/admin/users` 接口：**
```javascript
// 请求
GET /admin/users?page=1&limit=10

// 返回（有分页）
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  }
}
```

#### 现在的行为（统一后）

**`/users` 接口现在支持两种模式：**

**模式 1：不带分页参数（向后兼容）**
```javascript
// 请求
GET /users

// 返回所有用户（保持兼容）
[
  { id: 1, email: "user1@test.com", ... },
  { id: 2, email: "user2@test.com", ... },
  ...
]
```

**模式 2：带分页参数（与admin统一）**
```javascript
// 请求
GET /users?page=1&limit=10&search=张三&role=教师

// 返回分页格式（与admin一致）
{
  "data": [
    {
      "id": 1,
      "email": "user@test.com",
      "name": "张三",
      "role": {
        "id": 4,
        "name": "教师",
        "description": "教师角色"
      },
      "_count": {
        "articles": 5,
        "comments": 12,
        "notes": 8,
        "favorites": 15
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  }
}
```

### 2. 查询参数支持

#### 新增查询参数

| 参数   | 类型   | 必填 | 说明                     | 示例   |
| ------ | ------ | ---- | ------------------------ | ------ |
| page   | number | 否   | 页码                     | 1      |
| limit  | number | 否   | 每页数量                 | 10     |
| role   | string | 否   | 角色筛选                 | "教师" |
| search | string | 否   | 搜索关键词（姓名或邮箱） | "张三" |

### 3. 返回数据增强

#### 之前
```javascript
{
  "id": 1,
  "email": "user@test.com",
  "name": "张三",
  "role": { "id": 4, "name": "教师" }
}
```

#### 现在
```javascript
{
  "id": 1,
  "email": "user@test.com",
  "name": "张三",
  "role": {
    "id": 4,
    "name": "教师",
    "description": "教师角色"  // 新增
  },
  "_count": {  // 新增统计信息
    "articles": 5,
    "comments": 12,
    "notes": 8,
    "favorites": 15
  }
}
```

### 4. 操作接口统一

#### 更新用户接口增强

**之前：**
```javascript
PATCH /users/:id
// 返回：基本用户信息
```

**现在：**
```javascript
PATCH /users/:id
// 返回：包含完整角色信息的用户数据
// 支持密码自动加密
```

#### 删除用户接口增强

**之前：**
```javascript
DELETE /users/:id
// 返回：Prisma删除结果
```

**现在：**
```javascript
DELETE /users/:id
// 返回：
{
  "id": 1,
  "email": "user@test.com",
  "name": "张三",
  "message": "用户删除成功"
}
```

#### 新增接口

**`/users/:id/disable` - 禁用用户**
```javascript
PATCH /users/:id/disable

// 返回：
{
  "id": 1,
  "email": "user@test.com",
  "name": "张三",
  "status": "INACTIVE",
  "message": "用户已禁用"
}
```

**`/users/:id/enable` - 启用用户**
```javascript
PATCH /users/:id/enable

// 返回：
{
  "id": 1,
  "email": "user@test.com",
  "name": "张三",
  "status": "ACTIVE",
  "message": "用户已启用"
}
```

## 📊 接口对比表

### 功能对比

| 功能     | `/users` (之前) | `/users` (现在) | `/admin/users` |
| -------- | --------------- | --------------- | -------------- |
| 获取列表 | ✅ 无分页        | ✅ 支持分页      | ✅ 支持分页     |
| 搜索筛选 | ❌               | ✅               | ✅              |
| 角色筛选 | ❌               | ✅               | ✅              |
| 统计信息 | ❌               | ✅               | ✅              |
| 禁用用户 | ❌               | ✅               | ✅              |
| 启用用户 | ❌               | ✅               | ✅              |
| 批量导入 | ✅               | ✅               | ✅              |
| 下载模板 | ✅               | ✅               | ✅              |

### 权限对比

| 接口           | 权限要求   | 适用场景     |
| -------------- | ---------- | ------------ |
| `/users`       | 教师或助教 | 日常用户管理 |
| `/admin/users` | 超级管理员 | 系统级管理   |

## 🎯 使用示例

### 示例 1：获取所有用户（向后兼容）

```bash
GET /users
```

**返回：**
```json
[
  { "id": 1, "email": "user1@test.com", ... },
  { "id": 2, "email": "user2@test.com", ... }
]
```

### 示例 2：分页获取用户（新功能）

```bash
GET /users?page=1&limit=10
```

**返回：**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  }
}
```

### 示例 3：搜索用户（新功能）

```bash
GET /users?page=1&limit=10&search=张三
```

**返回：**匹配"张三"的用户列表（分页格式）

### 示例 4：按角色筛选（新功能）

```bash
GET /users?page=1&limit=10&role=教师
```

**返回：**所有教师用户（分页格式）

### 示例 5：组合查询（新功能）

```bash
GET /users?page=1&limit=10&role=教师&search=李&status=ACTIVE
```

**返回：**姓名包含"李"的活跃教师用户

### 示例 6：禁用用户（新功能）

```bash
PATCH /users/1/disable
```

**返回：**
```json
{
  "id": 1,
  "email": "user@test.com",
  "name": "张三",
  "status": "INACTIVE",
  "message": "用户已禁用"
}
```

## 🔧 技术实现

### Service 层改动

**`src/users/users.service.ts`**

#### 新增方法：

1. **`findAllPaginated(options)`** - 分页查询
```typescript
async findAllPaginated(options: {
  page: number;
  limit: number;
  role?: string;
  search?: string;
}) {
  // 支持分页、搜索、角色筛选
  // 返回格式与 admin 接口一致
}
```

#### 增强方法：

2. **`findOne(id)`** - 返回完整角色信息
3. **`update(id, data)`** - 自动加密密码，返回完整数据
4. **`remove(id)`** - 返回包含 message 的结果
5. **`disable(id)`** - 返回包含 message 的结果
6. **`enable(id)`** - 返回包含 message 的结果

### Controller 层改动

**`src/users/users.controller.ts`**

#### 增强接口：

1. **`GET /users`** - 支持分页和筛选参数
2. **`PATCH /users/:id/disable`** - 新增禁用接口
3. **`PATCH /users/:id/enable`** - 新增启用接口

## 🎨 向后兼容

### 不带参数（保持原有行为）

```bash
GET /users
# 返回所有用户数组（无分页）
```

### 带分页参数（新行为）

```bash
GET /users?page=1&limit=10
# 返回分页格式
```

## ⚠️ 重要说明

### 破坏性变更

❌ **无**！此次更新完全向后兼容。

### 推荐做法

- ✅ 新代码建议使用分页参数
- ✅ 旧代码无需修改，仍然可用
- ✅ 逐步迁移到分页格式

## 📝 迁移指南

### 从旧接口迁移

**之前：**
```javascript
// 获取所有用户
const users = await axios.get('/users');
// users 是数组
```

**迁移到：**
```javascript
// 方式1: 保持不变（向后兼容）
const users = await axios.get('/users');
// users 仍然是数组

// 方式2: 使用分页（推荐）
const response = await axios.get('/users', {
  params: { page: 1, limit: 10 }
});
// response.data.data 是数组
// response.data.pagination 是分页信息
```

## 🔑 统一的接口规范

### 列表接口

**格式：**
```typescript
{
  data: T[],           // 数据数组
  pagination: {        // 分页信息
    page: number,      // 当前页
    limit: number,     // 每页数量
    total: number,     // 总记录数
    totalPages: number // 总页数
  }
}
```

### 操作接口

**格式：**
```typescript
{
  ...entityData,  // 实体数据
  message: string // 操作结果消息
}
```

## 📊 完整的用户API列表

| 端点                             | 方法   | 功能         | 权限       | 分页支持 |
| -------------------------------- | ------ | ------------ | ---------- | -------- |
| `/users`                         | GET    | 获取用户列表 | 教师/助教  | ✅ 支持   |
| `/users/:id`                     | GET    | 获取用户详情 | 教师/助教  | -        |
| `/users`                         | POST   | 创建用户     | 教师       | -        |
| `/users/:id`                     | PATCH  | 更新用户     | 教师       | -        |
| `/users/:id`                     | DELETE | 删除用户     | 教师       | -        |
| `/users/:id/disable`             | PATCH  | 禁用用户     | 教师       | -        |
| `/users/:id/enable`              | PATCH  | 启用用户     | 教师       | -        |
| `/users/batch`                   | POST   | 批量创建     | 教师       | -        |
| `/users/template`                | GET    | 下载模板     | 教师       | -        |
|                                  |        |              |            |          |
| `/admin/users`                   | GET    | 获取用户列表 | 超级管理员 | ✅ 支持   |
| `/admin/users/:id`               | GET    | 获取用户详情 | 超级管理员 | -        |
| `/admin/users`                   | POST   | 创建用户     | 超级管理员 | -        |
| `/admin/users/:id`               | PATCH  | 更新用户     | 超级管理员 | -        |
| `/admin/users/:id`               | DELETE | 删除用户     | 超级管理员 | -        |
| `/admin/users/:id/disable`       | PATCH  | 禁用用户     | 超级管理员 | -        |
| `/admin/users/:id/enable`        | PATCH  | 启用用户     | 超级管理员 | -        |
| `/admin/users/batch`             | POST   | 批量创建     | 超级管理员 | -        |
| `/admin/users/template/download` | GET    | 下载模板     | 超级管理员 | -        |
| `/admin/users/stats/overview`    | GET    | 统计信息     | 超级管理员 | -        |

## 💡 使用建议

### 选择哪个接口？

**使用 `/users`：**
- 日常用户管理
- 教师管理自己的学生
- 不需要系统级权限

**使用 `/admin/users`：**
- 系统管理员操作
- 需要全局用户管理
- 需要统计信息

### 分页参数建议

```javascript
// 推荐：使用分页提高性能
GET /users?page=1&limit=20

// 避免：大型系统不使用分页
GET /users  // 可能返回数千条记录
```

## 🎉 统一带来的好处

### 1. 一致的API体验

- ✅ 统一的返回格式
- ✅ 统一的分页逻辑
- ✅ 统一的错误处理

### 2. 功能完整性

- ✅ `/users` 现在也支持搜索和筛选
- ✅ 两个接口功能对等
- ✅ 减少接口差异困惑

### 3. 向后兼容

- ✅ 旧代码无需修改
- ✅ 平滑迁移
- ✅ 灵活使用

### 4. 性能优化

- ✅ 分页查询减少数据传输
- ✅ 按需加载
- ✅ 提高响应速度

## 🔍 测试用例

### 测试 1：向后兼容性

```bash
# 旧的调用方式应该仍然有效
curl -X GET "http://localhost:3000/users" \
  -H "Authorization: Bearer TOKEN"

# 应返回用户数组
```

### 测试 2：分页功能

```bash
# 新的分页调用
curl -X GET "http://localhost:3000/users?page=1&limit=10" \
  -H "Authorization: Bearer TOKEN"

# 应返回分页格式
```

### 测试 3：搜索功能

```bash
# 搜索用户
curl -X GET "http://localhost:3000/users?page=1&limit=10&search=张三" \
  -H "Authorization: Bearer TOKEN"

# 应返回匹配的用户
```

### 测试 4：禁用/启用

```bash
# 禁用用户
curl -X PATCH "http://localhost:3000/users/1/disable" \
  -H "Authorization: Bearer TOKEN"

# 启用用户
curl -X PATCH "http://localhost:3000/users/1/enable" \
  -H "Authorization: Bearer TOKEN"
```

## 📁 修改的文件

- ✅ `src/users/users.controller.ts` - 添加查询参数和新接口
- ✅ `src/users/users.service.ts` - 添加分页方法，增强现有方法

## 🚀 立即使用

### 重启服务

```bash
npm run start:dev
```

### 测试新功能

访问 Swagger 文档：
```
http://localhost:3000/api
```

在"用户管理"标签下可以看到更新后的接口文档。

## 📞 相关文档

- [角色权限系统](./ROLE_PERMISSION_SYSTEM_README.md)
- [用户管理指南](./ADMIN_SYSTEM_README.md)
- [后台管理系统](./ADMIN_ARTICLE_SOFT_DELETE_GUIDE.md)

---

**更新类型**：功能增强  
**兼容性**：✅ 完全向后兼容  
**影响范围**：用户模块接口  
**状态**：✅ 已完成并测试
