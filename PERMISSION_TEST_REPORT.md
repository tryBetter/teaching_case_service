# API 权限测试报告

**测试日期**: 2025年10月10日  
**测试范围**: 所有已合并的API接口权限控制  
**测试方法**: 自动化测试脚本

---

## 📊 测试结果概览

- **总计测试**: 33个接口
- **通过**: 22个 (66.67%)
- **失败**: 11个 (33.33%)

### 通过率分析

| 模块             | 通过率       |
| ---------------- | ------------ |
| 公开接口         | 100% (2/2) ✅ |
| 无认证访问       | 100% (3/3) ✅ |
| 后台管理接口     | 100% (6/6) ✅ |
| 文章管理（部分） | 71% (5/7) ⚠️  |
| 媒体管理（部分） | 67% (4/6) ⚠️  |
| 用户管理         | 25% (1/4) ❌  |

---

## ✅ 成功的测试（22个）

### 1. 公开接口（无需认证）
- ✅ GET /articles - 获取文章列表
- ✅ GET /categories - 获取分类列表

### 2. 需要认证的普通接口
- ✅ GET /users - 获取用户列表
- ✅ GET /media - 获取媒体列表

### 3. 文章管理（管理员功能 - 权限控制正常）
- ✅ POST /articles/:id/publish - 教师访问返回403 ✅
- ✅ POST /articles/:id/feature - 教师访问返回403 ✅
- ✅ POST /articles/:id/unfeature - 教师访问返回403 ✅
- ✅ POST /articles/:id/restore - 教师访问返回403 ✅
- ✅ DELETE /articles/:id/permanent - 教师访问返回403 ✅

### 4. 媒体管理（管理员功能 - 权限控制正常）
- ✅ GET /media/stats/overview - 教师访问返回403 ✅
- ✅ GET /media/stats/overview - 管理员访问返回200 ✅
- ✅ GET /media/stats/distribution - 教师访问返回403 ✅
- ✅ GET /media/stats/distribution - 管理员访问返回200 ✅

### 5. 后台管理专属接口（全部通过）
- ✅ GET /admin/roles - 教师访问返回403 ✅
- ✅ GET /admin/roles - 管理员访问返回200 ✅
- ✅ GET /admin/stats/overview - 教师访问返回403 ✅
- ✅ GET /admin/stats/overview - 管理员访问返回200 ✅
- ✅ GET /admin/stats/users - 教师访问返回403 ✅
- ✅ GET /admin/stats/users - 管理员访问返回200 ✅

### 6. 无认证访问保护接口
- ✅ GET /users - 无token返回401 ✅
- ✅ POST /articles - 无token返回401 ✅
- ✅ GET /media - 无token返回401 ✅（已修复）

---

## ❌ 失败的测试（11个）

所有失败的测试都返回 **500 Internal Server Error** 而不是预期的状态码。

### 1. 用户管理接口（4个失败）
| 接口                       | 预期 | 实际 | 问题 |
| -------------------------- | ---- | ---- | ---- |
| GET /users/roles（教师）   | 403  | 500  | ❌    |
| GET /users/roles（管理员） | 200  | 500  | ❌    |
| GET /users/stats（教师）   | 403  | 500  | ❌    |
| GET /users/stats（管理员） | 200  | 500  | ❌    |

### 2. 文章管理接口（4个失败）
| 接口                            | 预期 | 实际 | 问题 |
| ------------------------------- | ---- | ---- | ---- |
| GET /articles/deleted（教师）   | 403  | 500  | ❌    |
| GET /articles/deleted（管理员） | 200  | 500  | ❌    |
| GET /articles/stats（教师）     | 403  | 500  | ❌    |
| GET /articles/stats（管理员）   | 200  | 500  | ❌    |

### 3. 媒体管理接口（3个失败）
| 接口                        | 预期 | 实际 | 问题 |
| --------------------------- | ---- | ---- | ---- |
| DELETE /media/batch（教师） | 403  | 500  | ❌    |
| GET /media/recent（教师）   | 403  | 500  | ❌    |
| GET /media/recent（管理员） | 200  | 500  | ❌    |

---

## 🔍 问题分析

### 失败模式
所有失败的接口都有以下共同特征：
1. 使用了 `@RequireAdmin()` 装饰器
2. 返回 500 Internal Server Error
3. 响应体为：`{"statusCode":500,"message":"Internal server error"}`

### 可能的原因

#### 1. RolesGuard 异常
- RolesGuard 在某些条件下抛出未捕获的异常
- 可能在调用 `getUserPermissions()` 时出错

#### 2. Service 层错误
- AdminArticlesService 或 AdminMediaService 中的方法抛出异常
- 数据库查询失败

#### 3. 依赖注入问题
- PrismaService 或其他依赖未正确注入

### 对比成功的接口

成功的接口特征：
- `/admin/roles` 和 `/admin/stats/*` 使用 `@RequireSuperAdmin()` 装饰器 ✅
- 使用明确的权限检查逻辑 ✅
- 直接抛出 `ForbiddenException(403)` ✅

失败的接口特征：
- 使用 `@RequireAdmin()` 装饰器 ❌
- 依赖 RolesGuard 自动检查 ❌
- 未捕获的异常导致500错误 ❌

---

## 🔧 建议的修复方案

### 方案1：替换装饰器
将失败接口的 `@RequireAdmin()` 替换为 `@RequireSuperAdmin()`：

```typescript
// 修改前
@RequireAdmin()
@Get('roles')
async findRoles() {
  return this.prisma.role.findMany(...);
}

// 修改后
@RequireSuperAdmin()
@Get('roles')
async findRoles() {
  return this.prisma.role.findMany(...);
}
```

### 方案2：修复 RolesGuard
在 RolesGuard 中添加异常捕获和日志：

```typescript
try {
  const userPermissions = await this.rolesService.getUserPermissions(user.id);
  // ...
} catch (error) {
  console.error('获取用户权限失败:', error);
  throw new ForbiddenException('无法验证用户权限');
}
```

### 方案3：统一使用 Guards
为所有管理员接口统一使用 `SuperAdminGuard`：

```typescript
@UseGuards(SuperAdminGuard)
@Get('roles')
async findRoles() {
  return this.prisma.role.findMany(...);
}
```

---

## 📝 下一步行动

### 立即修复（优先级高）
1. ✅ 修复 GET /media 的公开访问问题（已完成）
2. ⬜ 调查 RolesGuard 500错误的根本原因
3. ⬜ 修复所有返回500的接口

### 短期优化（1-2天内）
1. 统一权限装饰器的使用
2. 添加错误处理和日志记录
3. 完善测试覆盖

### 中期改进（1周内）
1. 重构权限检查逻辑
2. 添加单元测试
3. 优化错误消息

---

## 🎯 总结

### 优点
- ✅ 基础认证功能正常
- ✅ 后台管理接口权限控制正确
- ✅ 大部分管理员接口能正确返回403
- ✅ 无认证访问保护有效

### 问题
- ❌ 11个接口返回500而非预期状态码
- ❌ `@RequireAdmin()` 装饰器存在问题
- ❌ 错误处理不够完善

### 建议
优先修复返回500的接口，确保所有接口都能返回正确的HTTP状态码。可以考虑统一使用 `SuperAdminGuard` 来替代 `@RequireAdmin()` 装饰器。

---

**报告生成时间**: 2025年10月10日  
**测试工具**: Node.js 自动化测试脚本  
**测试环境**: localhost:3000

