# 教学案例服务后台管理系统

## 概述

本后台管理系统是专为教学案例服务设计的超级管理员控制台，只有超级管理员角色才能登录和操作。系统提供了完整的业务功能管理界面，包括用户管理、文章管理、分类管理、媒体管理、评论管理、笔记管理、收藏管理、角色权限管理和统计分析等功能。

## 功能特性

### 🔐 安全认证
- 只有超级管理员角色才能登录后台管理系统
- JWT令牌认证机制
- 自动token验证和刷新

### 📊 仪表盘
- 系统概览统计
- 实时数据展示
- 最近用户和文章活动

### 👥 用户管理
- 查看所有用户列表
- 用户信息详情查看
- 用户角色管理
- 用户删除功能
- 批量用户导入（Excel）
- 用户统计数据

### 📝 文章管理
- 查看所有文章列表
- 文章详情查看
- 文章发布/取消发布
- 文章推荐/取消推荐
- 文章编辑和删除
- 文章统计数据

### 🏷️ 分类管理
- 查看所有分类列表
- 分类创建、编辑、删除
- 分类文章统计
- 分类层级管理

### 🖼️ 媒体管理
- 查看所有媒体文件
- 媒体文件类型筛选
- 媒体文件删除
- 媒体存储统计

### 💬 评论管理
- 查看所有评论列表
- 评论内容管理
- 评论删除功能
- 评论统计数据

### 📖 笔记管理
- 查看所有用户笔记
- 笔记内容管理
- 笔记删除功能
- 笔记统计信息

### ❤️ 收藏管理
- 查看所有收藏记录
- 收藏关系管理
- 收藏记录删除
- 收藏统计分析

### 👤 角色权限管理
- 查看所有角色列表
- 角色权限查看
- 权限分配管理
- 角色用户统计

### 📈 统计分析
- 用户增长统计
- 内容创建统计
- 时间范围分析
- 系统健康状态

## 技术架构

### 后端架构
- **框架**: NestJS
- **数据库**: Prisma + PostgreSQL
- **认证**: JWT
- **API文档**: Swagger

### 前端架构
- **技术栈**: HTML5 + CSS3 + JavaScript (ES6+)
- **UI框架**: Bootstrap 5
- **图标**: Bootstrap Icons
- **HTTP客户端**: Fetch API

### 模块结构
```
src/admin/
├── admin.module.ts                 # 主管理模块
├── admin.controller.ts             # 管理控制器
├── admin.service.ts                # 管理服务
├── decorators/
│   └── super-admin.decorator.ts    # 超级管理员装饰器
├── guards/
│   └── super-admin.guard.ts        # 超级管理员守卫
├── auth/                           # 管理认证模块
├── users/                          # 用户管理模块
├── articles/                       # 文章管理模块
├── categories/                     # 分类管理模块
├── media/                          # 媒体管理模块
├── comment/                        # 评论管理模块
├── favorite/                       # 收藏管理模块
├── note/                           # 笔记管理模块
├── filter-conditions/              # 筛选条件管理模块
├── hot-search/                     # 热搜管理模块
├── roles/                          # 角色权限管理模块
├── stats/                          # 统计分析模块
└── frontend/                       # 前端界面
    ├── index.html                  # 管理界面首页
    └── admin.js                    # 前端脚本
```

## 安装和部署

### 1. 环境要求
- Node.js 16+
- PostgreSQL 12+
- npm 或 yarn

### 2. 安装依赖
```bash
npm install
```

### 3. 数据库配置
```bash
# 复制环境变量文件
cp env.example .env

# 配置数据库连接
DATABASE_URL="postgresql://username:password@localhost:5432/teaching_case_db"
JWT_SECRET="your-jwt-secret"
```

### 4. 数据库迁移
```bash
# 运行数据库迁移
npx prisma migrate deploy

# 生成Prisma客户端
npx prisma generate
```

### 5. 初始化数据
```bash
# 创建默认角色和权限
npm run seed
```

### 6. 启动服务
```bash
# 开发环境
npm run start:dev

# 生产环境
npm run build
npm run start:prod
```

## 访问管理界面

### 1. 访问地址
- 管理界面: `http://localhost:3000/admin/frontend/index.html`
- API文档: `http://localhost:3000/api`

### 2. 登录信息
- 只有超级管理员角色才能登录
- 使用超级管理员账号的邮箱和密码登录

### 3. 创建超级管理员
如果需要创建超级管理员账号，可以通过以下方式：

```sql
-- 1. 确保超级管理员角色存在
INSERT INTO "Role" (name, description, "isSystem", "isActive", "createdAt", "updatedAt")
VALUES ('超级管理员', '拥有系统所有权限的超级管理员', true, true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- 2. 创建超级管理员用户
INSERT INTO "User" (email, password, name, "roleId", "createdAt", "updatedAt")
VALUES (
  'admin@example.com',
  '$2b$10$...', -- 使用bcrypt加密的密码
  '超级管理员',
  (SELECT id FROM "Role" WHERE name = '超级管理员'),
  NOW(),
  NOW()
);
```

## API接口文档

### 认证接口
- `POST /admin/auth/login` - 超级管理员登录
- `POST /admin/auth/check` - 检查超级管理员状态

### 管理接口
- `GET /admin/overview` - 获取系统概览
- `GET /admin/health` - 获取系统健康状态

### 用户管理接口
- `GET /admin/users` - 获取用户列表
- `GET /admin/users/:id` - 获取用户详情
- `POST /admin/users` - 创建用户
- `PATCH /admin/users/:id` - 更新用户
- `DELETE /admin/users/:id` - 删除用户
- `POST /admin/users/batch` - 批量创建用户
- `GET /admin/users/template/download` - 下载用户导入模板
- `GET /admin/users/stats/overview` - 获取用户统计

### 文章管理接口
- `GET /admin/articles` - 获取文章列表
- `GET /admin/articles/:id` - 获取文章详情
- `POST /admin/articles` - 创建文章
- `PATCH /admin/articles/:id` - 更新文章
- `DELETE /admin/articles/:id` - 删除文章
- `POST /admin/articles/:id/publish` - 发布文章
- `POST /admin/articles/:id/unpublish` - 取消发布文章
- `POST /admin/articles/:id/feature` - 设置文章推荐
- `POST /admin/articles/:id/unfeature` - 取消文章推荐
- `GET /admin/articles/stats/overview` - 获取文章统计

### 其他管理接口
- 分类管理: `/admin/categories/*`
- 媒体管理: `/admin/media/*`
- 评论管理: `/admin/comments/*`
- 笔记管理: `/admin/notes/*`
- 收藏管理: `/admin/favorites/*`
- 角色权限: `/admin/roles/*`
- 统计分析: `/admin/stats/*`

## 权限说明

### 超级管理员权限
超级管理员拥有以下所有权限：
- 系统管理权限 (`system:admin`)
- 用户管理权限 (`user:*`)
- 文章管理权限 (`article:*`)
- 媒体管理权限 (`media:*`)
- 评论管理权限 (`comment:*`)
- 收藏管理权限 (`favorite:*`)
- 笔记管理权限 (`note:*`)
- 角色管理权限 (`role:manage`)

### 权限检查
所有管理接口都使用 `SuperAdminGuard` 进行权限检查，确保只有超级管理员角色才能访问。

## 安全考虑

### 1. 认证安全
- JWT令牌有效期管理
- 令牌自动刷新机制
- 登录状态持久化

### 2. 权限安全
- 严格的角色权限检查
- 接口级别的权限控制
- 前端路由保护

### 3. 数据安全
- 敏感信息加密存储
- API响应数据过滤
- 操作日志记录

## 扩展功能

### 1. 添加新的管理模块
1. 在 `src/admin/` 下创建新的模块目录
2. 创建对应的控制器和服务
3. 在主管理模块中注册
4. 在前端界面中添加对应的管理页面

### 2. 自定义权限
1. 在权限枚举中添加新权限
2. 更新角色权限配置
3. 在守卫中添加权限检查逻辑

### 3. 前端功能扩展
1. 在 `admin.js` 中添加新的API调用函数
2. 在 `index.html` 中添加新的界面元素
3. 实现对应的用户交互逻辑

## 故障排除

### 1. 登录问题
- 检查用户角色是否为"超级管理员"
- 验证JWT令牌是否有效
- 检查网络连接和API地址

### 2. 权限问题
- 确认用户具有超级管理员权限
- 检查角色权限配置
- 验证守卫逻辑

### 3. 数据加载问题
- 检查API接口是否正常
- 验证数据库连接
- 查看浏览器控制台错误信息

## 维护和更新

### 1. 定期维护
- 清理过期的媒体文件
- 优化数据库性能
- 更新系统依赖

### 2. 数据备份
- 定期备份数据库
- 备份上传的媒体文件
- 备份系统配置

### 3. 安全更新
- 及时更新系统依赖
- 监控安全漏洞
- 更新JWT密钥

## 联系和支持

如有问题或需要技术支持，请联系开发团队。

---

**注意**: 本系统仅供超级管理员使用，请妥善保管登录凭据，避免泄露给未授权人员。
