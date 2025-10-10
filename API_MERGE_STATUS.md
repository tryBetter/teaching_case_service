# API 接口合并进度报告

## ✅ 已完成模块

### 1. 用户管理 `/users` ✅

**合并内容**：
- ✅ 添加 `GET /users/roles` - 获取角色选项列表（管理员专用）
- ✅ 添加 `GET /users/stats` - 获取用户统计信息（管理员专用）
- ✅ 前端更新调用路径：`/admin/roles` → `/users/roles`

**接口列表**：
```
GET    /users              - 获取用户列表（支持分页、角色、搜索）
GET    /users/roles        - 获取角色选项（管理员）⭐新增
GET    /users/stats        - 获取用户统计（管理员）⭐新增
GET    /users/template     - 下载导入模板
GET    /users/:id          - 获取用户详情
POST   /users              - 创建用户
POST   /users/batch        - 批量创建用户
PATCH  /users/:id          - 更新用户
PATCH  /users/:id/disable  - 禁用用户
PATCH  /users/:id/enable   - 启用用户
DELETE /users/:id          - 删除用户
```

**权限控制**：
- 普通操作：`@RequirePermissions([Permission.USER_XXX])`
- 管理员专用：`@RequireAdmin()`

**状态**：✅ 完全合并，`/admin/users` 可保留作为别名

---

## 📋 待合并模块

### 2. 文章管理 `/articles` 🔄

**需要添加的管理员功能**：
- [ ] `GET /articles?includeDeleted=true` - 查看已删除文章
- [ ] `GET /articles/deleted` - 获取已删除文章列表
- [ ] `POST /articles/:id/restore` - 恢复文章
- [ ] `DELETE /articles/:id/permanent` - 永久删除
- [ ] `POST /articles/:id/publish` - 发布文章
- [ ] `POST /articles/:id/unpublish` - 取消发布
- [ ] `POST /articles/:id/feature` - 设为精选
- [ ] `POST /articles/:id/unfeature` - 取消精选
- [ ] `GET /articles/stats` - 统计信息

**现有接口**：
```
GET    /articles           - 获取文章列表（已发布）
GET    /articles/:id       - 获取文章详情
POST   /articles           - 创建文章
PATCH  /articles/:id       - 更新文章
DELETE /articles/:id       - 删除文章（软删除）
```

**合并后**：
```
GET    /articles                   - 获取文章列表（支持 includeDeleted 参数）
GET    /articles/deleted           - 获取已删除文章 ⭐新增
GET    /articles/stats             - 统计信息 ⭐新增
GET    /articles/:id               - 获取文章详情
POST   /articles                   - 创建文章
POST   /articles/:id/restore       - 恢复文章 ⭐新增
POST   /articles/:id/publish       - 发布文章 ⭐新增
POST   /articles/:id/unpublish     - 取消发布 ⭐新增
POST   /articles/:id/feature       - 设为精选 ⭐新增
POST   /articles/:id/unfeature     - 取消精选 ⭐新增
PATCH  /articles/:id               - 更新文章
DELETE /articles/:id                - 软删除
DELETE /articles/:id/permanent      - 永久删除 ⭐新增
```

### 3. 媒体管理 `/media` 🔄

**需要添加的管理员功能**：
- [ ] `GET /media` - 增强搜索（类型、大小、日期范围等）
- [ ] `DELETE /media/batch` - 批量删除
- [ ] `GET /media/stats` - 统计信息
- [ ] `GET /media/stats/distribution` - 类型分布
- [ ] `GET /media/recent` - 最近上传

**现有接口**：
```
GET    /media              - 获取媒体列表（按用户过滤）✅已增强
GET    /media/:id          - 获取媒体详情
POST   /media              - 创建媒体记录
POST   /media/upload       - 上传文件
DELETE /media/:id          - 删除媒体
```

### 4. 分类管理 `/categories` 🔄

**需要添加的管理员功能**：较少，接口已基本统一

### 5. 评论管理 `/comment` 🔄

**需要添加的管理员功能**：
- [ ] 管理员查看所有评论
- [ ] 统计信息

### 6. 其他模块 🔄

- 收藏管理 `/favorite`
- 笔记管理 `/note`
- 热搜管理 `/hot-search`
- 筛选条件 `/filter-conditions`

---

## 🎯 合并策略

### 原则

1. **保留原有接口功能** - 不破坏现有客户端
2. **添加管理员功能** - 通过权限装饰器控制
3. **保留 `/admin/*` 路径** - 作为兼容别名（可选）
4. **统一权限控制** - 使用装饰器：`@RequireAdmin()`、`@RequirePermissions()`

### 权限分级

```typescript
// 公开接口
@Public()

// 需要登录
@UseGuards(JwtAuthGuard)

// 需要特定权限
@RequirePermissions([Permission.XXX])

// 需要管理员
@RequireAdmin()
```

---

## 📊 工作量评估

| 模块       | 需要添加的接口数 | 复杂度 | 预计时间 |
| ---------- | ---------------- | ------ | -------- |
| ✅ 用户管理 | 2个              | 低     | ✅ 已完成 |
| 文章管理   | 9个              | 高     | 30分钟   |
| 媒体管理   | 5个              | 中     | 20分钟   |
| 分类管理   | 1-2个            | 低     | 10分钟   |
| 评论管理   | 2-3个            | 低     | 15分钟   |
| 其他模块   | 若干             | 中     | 30分钟   |

**总计**：约 2小时

---

## 🤔 建议

鉴于工作量较大，建议：

### 方案A：渐进式合并（推荐）

1. ✅ 用户管理 - 已完成
2. 文章管理 - 核心功能，优先合并
3. 媒体管理 - 核心功能，优先合并
4. 其他模块 - 按需合并

**优点**：
- 可逐步测试验证
- 降低风险
- 可以随时暂停

### 方案B：一次性完成

直接完成所有模块的合并

**优点**：
- 一次性完成
- 接口彻底统一

**缺点**：
- 工作量大
- 测试量大
- 风险较高

---

## ⚠️ 重要考虑

### 1. 前端适配

后台管理界面 (`src/admin/frontend/`) 需要更新API路径：
- `/admin/users` → `/users`  ✅ 已更新
- `/admin/articles` → `/articles`
- `/admin/media` → `/media`
- ...

### 2. 向后兼容

是否保留 `/admin/*` 路径？

**选项1**：移除 `/admin/*`，强制使用新路径
- 优点：代码更清晰
- 缺点：需要更新所有客户端

**选项2**：保留 `/admin/*` 作为别名
- 优点：向后兼容
- 缺点：维护两套路由

### 3. 测试覆盖

必须测试：
- ✅ 各角色权限正确
- ✅ 数据隔离正确
- ✅ 现有功能不受影响

---

## 📝 下一步行动

### 立即行动

继续合并核心模块：
1. 文章管理
2. 媒体管理

### 等待确认

是否需要：
1. 合并所有模块？
2. 保留 `/admin/*` 路径？
3. 完整测试所有接口？

---

**更新时间**：2025年10月10日  
**进度**：15% (1/7)  
**当前状态**：用户管理已完成，等待继续

