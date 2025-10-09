# 媒体上传者信息显示功能

## 🎯 功能说明

在后台管理系统的媒体管理模块，列表和预览弹窗中添加显示上传媒体文件的用户信息（姓名、邮箱、角色）。

## 📊 实现内容

### 1. 数据库层 - 添加上传者字段

**文件：** `prisma/schema.prisma`

#### Media 模型添加上传者关联

```prisma
model Media {
  id           Int      @id @default(autoincrement())
  type         MediaType
  url          String
  originalName String?  
  size         Int?     
  createdAt    DateTime @default(now())

  // 上传者关联
  uploader   User? @relation(fields: [uploaderId], references: [id])
  uploaderId Int?

  articles  ArticleMedia[]
}
```

#### User 模型添加反向关联

```prisma
model User {
  // ... 其他字段
  uploadedMedia Media[] // 用户上传的媒体文件
}
```

#### 数据库迁移

```bash
npx prisma migrate dev --name add_media_uploader
```

### 2. 后端 Service 层 - 记录上传者

**文件：** `src/media/media.service.ts`

```typescript
async uploadFile(
  file: UploadedFileInterface, 
  articleIds?: number[], 
  uploaderId?: number  // ← 新增参数
) {
  // 创建媒体记录
  const media = await this.prisma.media.create({
    data: {
      type: mediaType,
      url: fileUrl,
      originalName: file.originalname,
      size: file.size,
      uploaderId, // ← 记录上传者ID
    },
  });
}
```

### 3. 后端 Controller 层 - 传递用户ID

**文件：** `src/media/media.controller.ts`

```typescript
@Post('upload')
async uploadFile(
  @UploadedFile() file: UploadedFileInterface,
  @Body() uploadMediaDto: UploadMediaDto,
  @CurrentUser() user: AuthenticatedUser, // ← 获取当前用户
) {
  return this.mediaService.uploadFile(
    file, 
    uploadMediaDto.articleIds, 
    user.id  // ← 传递用户ID
  );
}
```

### 4. 后端查询 - 包含上传者信息

**文件：** `src/admin/media/admin-media.service.ts`

#### 列表查询

```typescript
this.prisma.media.findMany({
  include: {
    uploader: {
      select: {
        id: true,
        name: true,
        email: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    },
    // ... 其他关联
  },
})
```

#### 单个媒体查询

```typescript
async findOne(id: number) {
  const media = await this.prisma.media.findUnique({
    where: { id },
    include: {
      uploader: {
        select: {
          id: true,
          name: true,
          email: true,
          role: { select: { name: true } },
        },
      },
      articles: { ... },
    },
  });
  // ...
}
```

### 5. 前端 HTML - 添加显示列

**文件：** `src/admin/frontend/index.html`

#### 媒体列表表格

```html
<thead>
  <tr>
    <th>ID</th>
    <th>文件名</th>
    <th>类型</th>
    <th>大小</th>
    <th>上传者</th>  <!-- ← 新增列 -->
    <th>创建时间</th>
    <th>操作</th>
  </tr>
</thead>
```

#### 查看媒体弹窗

```html
<tr>
  <th>上传者:</th>
  <td id="mediaDetailUploader">-</td>  <!-- ← 新增字段 -->
</tr>
```

### 6. 前端 JavaScript - 渲染上传者信息

**文件：** `src/admin/frontend/admin.js`

#### 列表渲染

```javascript
// 处理上传者信息
const uploaderInfo = media.uploader
  ? `<div><strong>${media.uploader.name || '未知用户'}</strong></div>
     <div class="text-muted small">${media.uploader.email || '-'}</div>
     <div><span class="badge bg-secondary">${media.uploader.role?.name || '-'}</span></div>`
  : '<span class="text-muted">未知</span>';

return `
  <tr>
    <td>${media.id}</td>
    <td>${fileName}</td>
    <td>${typeBadge}</td>
    <td>${fileSize}</td>
    <td>${uploaderInfo}</td>  <!-- ← 显示上传者 -->
    <td>${formatDate(media.createdAt)}</td>
    <td>${actionButtons}</td>
  </tr>
`;
```

#### 弹窗渲染

```javascript
// 填充上传者信息
const uploaderElement = document.getElementById('mediaDetailUploader');
if (media.uploader) {
  uploaderElement.innerHTML = `
    <div><strong>${media.uploader.name || '未知用户'}</strong></div>
    <div class="text-muted small">${media.uploader.email || '-'}</div>
    <div><span class="badge bg-secondary">${media.uploader.role?.name || '-'}</span></div>
  `;
} else {
  uploaderElement.textContent = '未知';
}
```

## 🎯 显示效果

### 媒体列表

| ID  | 文件名    | 类型  | 大小  | 上传者                                      | 创建时间   | 操作      |
| --- | --------- | ----- | ----- | ------------------------------------------- | ---------- | --------- |
| 1   | test.jpg  | IMAGE | 123KB | **张老师**<br>teacher@test.com<br>`教师`    | 2025-10-09 | 预览/删除 |
| 2   | video.mp4 | VIDEO | 5.2MB | **李老师**<br>leader@test.com<br>`教师组长` | 2025-10-09 | 预览/删除 |

### 查看媒体弹窗

```
ID:          1
文件名:      test.jpg
类型:        IMAGE
大小:        123 KB
上传者:      张老师
            teacher@test.com
            教师
创建时间:    2025-10-09 15:30:00
URL:         http://localhost:3000/uploads/images/xxx.jpg
关联文章:    文章标题1  文章标题2
```

## 📁 修改的文件

| 文件                                     | 修改内容                                         |
| ---------------------------------------- | ------------------------------------------------ |
| `prisma/schema.prisma`                   | 添加 Media.uploaderId 和 User.uploadedMedia 关联 |
| `src/media/media.service.ts`             | uploadFile 方法添加 uploaderId 参数并保存        |
| `src/media/media.controller.ts`          | 获取当前用户并传递给 service                     |
| `src/admin/media/admin-media.service.ts` | 查询时包含 uploader 信息                         |
| `src/admin/frontend/index.html`          | 添加"上传者"列和弹窗字段                         |
| `src/admin/frontend/admin.js`            | 渲染上传者信息                                   |

## 🔧 数据结构

### API 响应示例

#### 媒体列表

```json
{
  "data": [
    {
      "id": 1,
      "type": "IMAGE",
      "url": "http://localhost:3000/uploads/images/xxx.jpg",
      "originalName": "test.jpg",
      "size": 123456,
      "createdAt": "2025-10-09T15:30:00.000Z",
      "uploader": {
        "id": 1,
        "name": "张老师",
        "email": "teacher@test.com",
        "role": {
          "name": "教师"
        }
      }
    }
  ]
}
```

#### 单个媒体详情

```json
{
  "id": 1,
  "type": "IMAGE",
  "url": "http://localhost:3000/uploads/images/xxx.jpg",
  "originalName": "test.jpg",
  "size": 123456,
  "createdAt": "2025-10-09T15:30:00.000Z",
  "uploader": {
    "id": 1,
    "name": "张老师",
    "email": "teacher@test.com",
    "role": {
      "name": "教师"
    }
  },
  "articles": [
    {
      "id": 10,
      "title": "文章标题",
      "author": {
        "id": 1,
        "name": "张老师"
      }
    }
  ]
}
```

## ⚠️ 注意事项

### 1. 历史数据处理

**现有媒体文件的 `uploaderId` 为 `null`**

对于数据库中已存在的媒体文件：
- `uploaderId` 字段为 `null`
- 前端显示为"未知"
- 不影响功能使用

如需更新历史数据，可以运行：
```sql
-- 将所有历史媒体设置为超级管理员上传
UPDATE "Media" 
SET "uploaderId" = 1 
WHERE "uploaderId" IS NULL;
```

### 2. 用户删除影响

`uploaderId` 使用了可选关联（`User?`），所以：
- ✅ 删除用户不会影响媒体文件
- ✅ 媒体的 `uploaderId` 会变为 `null`
- ✅ 前端显示为"未知"

### 3. 新上传的媒体

从现在开始，所有新上传的媒体都会自动记录上传者信息。

## 🧪 测试方法

### 1. 重启服务

```bash
npm run start:dev
```

### 2. 上传新媒体

```bash
curl -X POST "http://localhost:3000/media/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.jpg"
```

### 3. 查看媒体列表

登录后台 → 媒体管理
- ✅ 应该看到"上传者"列
- ✅ 显示：姓名、邮箱、角色

### 4. 点击预览

点击任意媒体的"预览"按钮
- ✅ 弹窗中显示上传者信息

## 📊 功能对比

### 修改前

| ID  | 文件名   | 类型  | 大小  | 创建时间   | 操作      |
| --- | -------- | ----- | ----- | ---------- | --------- |
| 1   | test.jpg | IMAGE | 123KB | 2025-10-09 | 预览/删除 |

**问题：** 不知道是谁上传的

### 修改后

| ID  | 文件名   | 类型  | 大小  | 上传者                                 | 创建时间   | 操作      |
| --- | -------- | ----- | ----- | -------------------------------------- | ---------- | --------- |
| 1   | test.jpg | IMAGE | 123KB | **张老师**<br>teacher@test.com<br>教师 | 2025-10-09 | 预览/删除 |

**优势：** 清晰显示上传者信息，便于管理和追溯

## 🎨 样式特点

### 列表中的上传者信息

```html
<div>
  <strong>张老师</strong>           <!-- 姓名加粗 -->
</div>
<div class="text-muted small">      <!-- 邮箱小字灰色 -->
  teacher@test.com
</div>
<div>
  <span class="badge bg-secondary"> <!-- 角色徽章 -->
    教师
  </span>
</div>
```

### 弹窗中的上传者信息

样式与列表一致，分行显示：
- 第1行：姓名（加粗）
- 第2行：邮箱（灰色小字）
- 第3行：角色（徽章样式）

## 🔑 关键代码

### 后端查询包含上传者

```typescript
include: {
  uploader: {
    select: {
      id: true,
      name: true,
      email: true,
      role: {
        select: {
          name: true,
        },
      },
    },
  },
}
```

### 前端渲染上传者

```javascript
const uploaderInfo = media.uploader
  ? `<div><strong>${media.uploader.name || '未知用户'}</strong></div>
     <div class="text-muted small">${media.uploader.email || '-'}</div>
     <div><span class="badge bg-secondary">${media.uploader.role?.name || '-'}</span></div>`
  : '<span class="text-muted">未知</span>';
```

## 🚀 使用场景

### 场景1：审计追溯

管理员可以查看每个媒体文件是谁上传的：
- 追溯上传来源
- 管理责任人
- 审计媒体使用

### 场景2：用户管理

通过上传者信息：
- 查看用户上传了哪些资源
- 评估用户活跃度
- 清理无用资源

### 场景3：问题排查

当媒体文件出现问题时：
- 快速找到上传者
- 联系相关人员
- 解决问题

## 📋 修改清单

| 文件                                     | 类型   | 修改内容                        |
| ---------------------------------------- | ------ | ------------------------------- |
| `prisma/schema.prisma`                   | 数据库 | 添加 uploaderId 字段和关联      |
| `src/media/media.service.ts`             | 后端   | uploadFile 添加 uploaderId 参数 |
| `src/media/media.controller.ts`          | 后端   | 获取当前用户并传递              |
| `src/admin/media/admin-media.service.ts` | 后端   | 查询时包含 uploader 信息        |
| `src/admin/frontend/index.html`          | 前端   | 添加"上传者"列和弹窗字段        |
| `src/admin/frontend/admin.js`            | 前端   | 渲染上传者信息                  |

**总计：** 6个文件

## ⚠️ 重要提示

### 1. 历史数据

现有的媒体文件 `uploaderId` 为 `null`，显示为"未知"。

### 2. 数据库迁移

必须运行 Prisma 迁移：
```bash
npx prisma migrate dev --name add_media_uploader
```

### 3. 用户删除

删除用户不会删除其上传的媒体，只是 `uploaderId` 变为 `null`。

## 🎉 总结

### 新增功能
- ✅ 媒体列表显示上传者（姓名、邮箱、角色）
- ✅ 媒体预览弹窗显示上传者信息
- ✅ 新上传的媒体自动记录上传者

### 数据展示
- 姓名：加粗显示
- 邮箱：灰色小字
- 角色：徽章样式

### 用户体验
- 信息清晰直观
- 便于追溯管理
- 支持审计需求

---

**开发日期**：2025年10月9日  
**功能状态**：✅ 已实现并测试  
**数据库迁移**：✅ 已完成

