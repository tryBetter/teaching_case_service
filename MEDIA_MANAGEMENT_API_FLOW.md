# 媒体管理模块接口业务流程文档

## 📋 接口总览

媒体管理模块提供了完整的媒体文件管理功能，包括上传、查询、更新、删除和统计等操作。

### 接口列表

| 序号 | 方法   | 路径                        | 功能         | 权限                           | 备注                                     |
| ---- | ------ | --------------------------- | ------------ | ------------------------------ | ---------------------------------------- |
| 1    | POST   | `/media/upload`             | 上传媒体文件 | 教师、教师组长                 | **常用** - 上传文件到服务器              |
| 2    | POST   | `/media`                    | 创建媒体记录 | 教师、教师组长                 | **特殊场景** - 仅注册外部URL，不上传文件 |
| 3    | GET    | `/media`                    | 获取媒体列表 | 已登录用户                     |                                          |
| 4    | GET    | `/media/:id`                | 获取媒体详情 | 已登录用户                     |
| 5    | PATCH  | `/media/:id`                | 更新媒体信息 | 教师、教师组长、助教、助教组长 |
| 6    | DELETE | `/media/:id`                | 删除媒体文件 | 有删除权限的用户               |
| 7    | DELETE | `/media/batch`              | 批量删除媒体 | 超级管理员                     |
| 8    | GET    | `/media/stats/overview`     | 媒体统计概览 | 超级管理员                     |
| 9    | GET    | `/media/stats/distribution` | 类型分布统计 | 超级管理员                     |
| 10   | GET    | `/media/recent`             | 最近上传媒体 | 超级管理员                     |

---

## 🎯 业务场景与接口调用流程

### ⚠️ 接口说明

**POST /media** vs **POST /media/upload**

大多数情况下，你应该使用 **POST /media/upload** 接口。

**POST /media** 仅在以下特殊场景使用：
- 注册外部CDN的媒体资源
- 批量导入已有的媒体文件信息
- 集成第三方存储服务（阿里云OSS、AWS S3等）
- 文件已经在服务器上，只需要在数据库中注册

**普通用户请使用 POST /media/upload 接口！**

---

### 场景1：教师上传教学案例配图

**业务描述**：教师在撰写教学案例时，需要上传相关的图片素材。

**角色**：教师、教师组长

**流程步骤**：

```
1. 用户登录系统 → 获取 JWT Token
   POST /auth/login
   
2. 选择图片文件（本地）
   
3. 上传图片到服务器
   POST /media/upload
   Body: multipart/form-data
   - file: [图片文件]
   - articleIds: [1, 2] (可选，关联到文章)
   
   返回：
   {
     "id": 1,
     "type": "IMAGE",
     "url": "http://localhost:3000/uploads/images/1703123456789_abc123.jpg",
     "originalName": "teaching_case_01.jpg",
     "size": 1024000,
     "mimetype": "image/jpeg",
     "createdAt": "2024-01-01T00:00:00.000Z"
   }
   
4. 在文章编辑器中使用返回的 url 插入图片
```

**注意事项**：
- ✅ 支持格式：JPEG, PNG, GIF, WebP
- ⚠️ 大小限制：≤ 50MB
- 💡 文件会自动存储到 `/uploads/images/` 目录
- 🔗 可以同时关联到多个文章

---

### 场景2：教师上传实验视频

**业务描述**：教师需要上传实验演示视频作为教学素材。

**角色**：教师、教师组长

**流程步骤**：

```
1. 用户登录系统
   POST /auth/login
   
2. 选择视频文件
   
3. 上传视频到服务器
   POST /media/upload
   Body: multipart/form-data
   - file: [视频文件]
   - articleIds: [5] (可选)
   
   返回：
   {
     "id": 10,
     "type": "VIDEO",
     "url": "http://localhost:3000/uploads/videos/1703234567890_xyz456.mp4",
     "originalName": "experiment_demo.mp4",
     "size": 52428800, // 50MB
     "mimetype": "video/mp4",
     "createdAt": "2024-01-01T10:30:00.000Z"
   }
   
4. 在文章中嵌入视频播放器，使用返回的 url
```

**注意事项**：
- ✅ 支持格式：MP4, AVI, MOV, WMV
- ⚠️ 大小限制：≤ 1GB
- 💡 文件会自动存储到 `/uploads/videos/` 目录
- ⏳ 大文件上传可能需要较长时间

---

### 场景3：后台管理员查看所有媒体文件

**业务描述**：管理员需要查看系统中所有用户上传的媒体文件，进行统一管理。

**角色**：超级管理员、管理员

**流程步骤**：

```
1. 管理员登录
   POST /auth/login
   
2. 获取媒体文件列表（分页）
   GET /media?page=1&limit=50
   
   返回：
   {
     "data": [
       {
         "id": 1,
         "type": "IMAGE",
         "url": "http://...",
         "originalName": "photo.jpg",
         "size": 1024000,
         "createdAt": "2024-01-01T00:00:00.000Z",
         "uploader": {
           "id": 5,
           "name": "张老师",
           "email": "teacher@example.com",
           "role": { "name": "教师" }
         },
         "articles": [
           {
             "article": {
               "id": 1,
               "title": "机器学习案例",
               "author": { "id": 5, "name": "张老师" }
             }
           }
         ]
       },
       // ... 更多媒体文件
     ],
     "pagination": {
       "page": 1,
       "limit": 50,
       "total": 230,
       "totalPages": 5
     }
   }
   
3. 查看媒体统计信息
   GET /media/stats/overview
   
   返回：
   {
     "totalMedia": 230,
     "totalImages": 180,
     "totalVideos": 50,
     "totalSize": 15728640000, // 15GB
     "averageSize": 68385739
   }
```

**注意事项**：
- 📊 返回完整的媒体信息，包括上传者和关联文章
- 🔍 可以看到所有用户的媒体文件
- 📈 配合统计接口了解存储使用情况

---

### 场景4：教师查看自己上传的媒体文件

**业务描述**：教师想查看自己历史上传的所有媒体文件。

**角色**：教师、教师组长

**流程步骤**：

```
1. 教师登录
   POST /auth/login
   返回：{ "userId": 5, "access_token": "..." }
   
2. 获取自己上传的媒体列表
   GET /media?userId=5&page=1&limit=20
   
   返回：
   {
     "data": [
       {
         "id": 15,
         "type": "IMAGE",
         "url": "http://localhost:3000/uploads/images/xxx.jpg",
         "originalName": "my_teaching_case.jpg",
         "size": 2048000,
         "createdAt": "2024-01-15T10:30:00.000Z",
         "uploader": {
           "id": 5,
           "name": "张老师",
           "email": "teacher@example.com"
         },
         "articles": [
           {
             "article": {
               "id": 8,
               "title": "深度学习案例研究"
             }
           }
         ]
       }
       // ... 更多自己上传的文件
     ],
     "pagination": {
       "page": 1,
       "limit": 20,
       "total": 35,
       "totalPages": 2
     }
   }
```

**注意事项**：
- 🔐 userId 参数筛选特定用户的媒体
- 📁 包含自己上传的文件和关联到自己文章的文件
- 🔗 可以看到每个文件关联的文章列表

---

### 场景5：查看媒体文件详情

**业务描述**：用户需要查看某个媒体文件的完整信息。

**角色**：所有已登录用户

**流程步骤**：

```
1. 用户登录
   POST /auth/login
   
2. 通过ID获取媒体详情
   GET /media/15
   
   返回：
   {
     "id": 15,
     "type": "IMAGE",
     "url": "http://localhost:3000/uploads/images/xxx.jpg",
     "originalName": "teaching_material.jpg",
     "size": 2048000,
     "createdAt": "2024-01-15T10:30:00.000Z",
     "updatedAt": "2024-01-15T10:30:00.000Z",
     "articles": [
       {
         "mediaId": 15,
         "articleId": 8,
         "article": {
           "id": 8,
           "title": "深度学习案例研究",
           "author": {
             "id": 5,
             "name": "张老师",
             "email": "teacher@example.com"
           }
         }
       },
       {
         "mediaId": 15,
         "articleId": 12,
         "article": {
           "id": 12,
           "title": "神经网络基础"
         }
       }
     ]
   }
```

**使用场景**：
- 📸 预览媒体文件
- 🔗 查看文件被哪些文章使用
- 📊 了解文件的详细信息（大小、类型等）

---

### 场景6：更新媒体文件关联的文章

**业务描述**：用户需要修改媒体文件关联的文章列表。

**角色**：教师、教师组长、助教、助教组长

**流程步骤**：

```
1. 用户登录
   POST /auth/login
   
2. 获取当前媒体信息
   GET /media/15
   
3. 更新媒体文件关联
   PATCH /media/15
   Body: {
     "articleIds": [8, 12, 20]  // 新的文章ID列表
   }
   
   返回：
   {
     "id": 15,
     "type": "IMAGE",
     "url": "http://...",
     "originalName": "teaching_material.jpg",
     "size": 2048000,
     "updatedAt": "2024-01-20T14:30:00.000Z"
   }
   
4. 系统自动处理：
   - 删除原有的文章关联
   - 创建新的文章关联
```

**注意事项**：
- 🔄 更新关联会完全替换现有关联
- 📝 可以传空数组 [] 来移除所有关联
- ⚡ 操作是原子性的（全部成功或全部失败）

---

### 场景7：删除媒体文件

**业务描述**：删除不再需要的媒体文件。

**角色**：有删除权限的用户

**流程步骤**：

```
1. 用户登录
   POST /auth/login
   
2. （可选）先查看媒体详情，确认是否被文章使用
   GET /media/15
   
3. 删除媒体文件
   DELETE /media/15
   
   返回：
   {
     "id": 15,
     "type": "IMAGE",
     "url": "http://...",
     "originalName": "teaching_material.jpg"
   }
   
4. 系统自动处理：
   - 删除数据库中的媒体记录
   - 删除关联关系（ArticleMedia）
   - 物理文件保留在服务器（可以手动清理）
```

**注意事项**：
- ⚠️ 删除是硬删除（不可恢复）
- 🔗 会自动删除所有文章关联
- 💾 物理文件不会自动删除（需要管理员手动清理）
- 🚨 删除前建议检查是否被重要文章使用

---

### 场景8：批量删除媒体文件（管理员）

**业务描述**：管理员需要批量清理无用的媒体文件。

**角色**：超级管理员

**流程步骤**：

```
1. 超级管理员登录
   POST /auth/login
   
2. 获取需要删除的媒体ID列表
   GET /media?page=1&limit=100
   // 筛选出无用的文件
   
3. 批量删除
   DELETE /media/batch?ids=5,12,18,25,33
   
   返回：
   {
     "deletedCount": 4,
     "failedCount": 1,
     "errors": [
       "ID 18: 媒体文件不存在"
     ]
   }
```

**注意事项**：
- 🔐 仅超级管理员可用
- ✅ 返回详细的成功/失败信息
- 🔄 部分失败不影响其他文件删除
- 📊 建议定期清理未使用的媒体文件

---

### 场景9：查看媒体统计报表（管理员）

**业务描述**：管理员查看系统媒体使用情况统计。

**角色**：超级管理员

**流程步骤**：

```
1. 超级管理员登录
   POST /auth/login
   
2. 获取媒体统计概览
   GET /media/stats/overview
   
   返回：
   {
     "totalMedia": 230,
     "totalImages": 180,
     "totalVideos": 50,
     "totalSize": 15728640000, // 约 15GB
     "averageSize": 68385739,
     "imageSize": 3670016000,  // 约 3.5GB
     "videoSize": 12058624000  // 约 11.5GB
   }
   
3. 获取类型分布统计
   GET /media/stats/distribution
   
   返回：
   {
     "byType": [
       { "type": "IMAGE", "count": 180, "percentage": 78.26 },
       { "type": "VIDEO", "count": 50, "percentage": 21.74 }
     ],
     "byUser": [
       {
         "userId": 5,
         "userName": "张老师",
         "count": 45,
         "totalSize": 2147483648
       },
       // ... 更多用户
     ]
   }
   
4. 获取最近上传的媒体
   GET /media/recent?limit=20
   
   返回：
   [
     {
       "id": 230,
       "type": "IMAGE",
       "url": "http://...",
       "originalName": "latest_case.jpg",
       "size": 1024000,
       "createdAt": "2024-01-20T16:45:00.000Z",
       "uploader": {
         "id": 8,
         "name": "李老师",
         "email": "li@example.com"
       }
     },
     // ... 更多最近上传的文件
   ]
```

**使用场景**：
- 📊 了解存储使用情况
- 👥 查看各用户的上传统计
- 📈 监控媒体增长趋势
- 🗄️ 规划存储容量

---

## 🔐 权限矩阵

| 操作     | 超级管理员 | 管理员 | 教师组长 | 教师  | 助教组长 | 助教  | 学生  |
| -------- | :--------: | :----: | :------: | :---: | :------: | :---: | :---: |
| 上传媒体 |     ✅      |   ❌    |    ✅     |   ✅   |    ❌     |   ❌   |   ❌   |
| 查看列表 |     ✅      |   ✅    |    ✅     |   ✅   |    ✅     |   ✅   |   ✅   |
| 查看详情 |     ✅      |   ✅    |    ✅     |   ✅   |    ✅     |   ✅   |   ✅   |
| 更新信息 |     ✅      |   ✅    |    ✅     |   ✅   |    ✅     |   ✅   |   ❌   |
| 删除文件 |     ✅      |   ✅    |    ✅     |   ✅   |    ✅     |   ✅   |   ❌   |
| 批量删除 |     ✅      |   ❌    |    ❌     |   ❌   |    ❌     |   ❌   |   ❌   |
| 统计报表 |     ✅      |   ❌    |    ❌     |   ❌   |    ❌     |   ❌   |   ❌   |

---

## 📝 数据模型

### Media 表结构

```typescript
interface Media {
  id: number;                // 媒体文件ID
  type: 'IMAGE' | 'VIDEO';   // 媒体类型
  url: string;               // 访问URL
  originalName: string;      // 原始文件名
  size: number;              // 文件大小（字节）
  uploaderId?: number;       // 上传者ID
  createdAt: Date;           // 创建时间
  updatedAt: Date;           // 更新时间
}
```

### ArticleMedia 关联表

```typescript
interface ArticleMedia {
  id: number;        // 关联ID
  mediaId: number;   // 媒体ID
  articleId: number; // 文章ID
  createdAt: Date;   // 关联创建时间
}
```

---

## 🔄 完整业务流程图

### 流程1：教师创建文章并上传配图

```
┌─────────────┐
│  教师登录    │
└──────┬──────┘
       │
       ↓
┌─────────────────┐
│ 创建文章草稿     │  POST /articles
│ (获得文章ID: 1)  │
└──────┬──────────┘
       │
       ↓
┌─────────────────┐
│ 选择图片文件     │
└──────┬──────────┘
       │
       ↓
┌─────────────────────────┐
│ 上传图片                 │  POST /media/upload
│ articleIds: [1]          │  - file: [图片]
│                          │  - articleIds: [1]
└──────┬──────────────────┘
       │
       ↓ 返回 { id: 10, url: "http://..." }
       │
┌─────────────────────────┐
│ 在文章编辑器中           │
│ 插入图片 URL             │
└──────┬──────────────────┘
       │
       ↓
┌─────────────────┐
│ 保存文章         │  PATCH /articles/1
└─────────────────┘
```

### 流程2：管理员审核和管理媒体

```
┌─────────────────┐
│ 管理员登录       │
└──────┬──────────┘
       │
       ↓
┌─────────────────────┐
│ 查看媒体统计概览     │  GET /media/stats/overview
│ - 总数: 230个        │
│ - 图片: 180个        │
│ - 视频: 50个         │
│ - 存储: 15GB         │
└──────┬──────────────┘
       │
       ↓
┌─────────────────────┐
│ 查看最近上传         │  GET /media/recent?limit=20
└──────┬──────────────┘
       │
       ↓
┌─────────────────────┐
│ 发现问题文件         │
│ IDs: 5, 12, 18       │
└──────┬──────────────┘
       │
       ↓
┌─────────────────────┐
│ 批量删除             │  DELETE /media/batch?ids=5,12,18
│ 结果: 2成功, 1失败   │
└─────────────────────┘
```

---

## ⚠️ 常见错误处理

### 1. 上传文件类型不支持

```json
{
  "statusCode": 400,
  "message": "不支持的文件类型，请上传图片或视频文件",
  "error": "Bad Request"
}
```

**解决方案**：检查文件类型，只上传支持的格式。

### 2. 文件大小超限

```json
{
  "statusCode": 400,
  "message": "图片文件大小不能超过 50MB",
  "error": "Bad Request"
}
```

**解决方案**：压缩文件后再上传，或联系管理员调整限制。

### 3. 权限不足

```json
{
  "statusCode": 403,
  "message": "权限不足，需要教师组长或教师角色",
  "error": "Forbidden"
}
```

**解决方案**：使用具有相应权限的账号登录。

### 4. 媒体文件不存在

```json
{
  "statusCode": 404,
  "message": "Media with ID 999 not found",
  "error": "Not Found"
}
```

**解决方案**：检查媒体ID是否正确。

---

## 💡 最佳实践

### 1. 上传优化

- ✅ **压缩图片**：上传前使用工具压缩图片，减小文件大小
- ✅ **命名规范**：使用有意义的文件名，便于管理
- ✅ **关联文章**：上传时就指定 articleIds，避免后续再关联
- ✅ **错误处理**：实现上传失败重试机制

### 2. 查询优化

- ✅ **使用分页**：大量数据时务必使用分页参数
- ✅ **按需查询**：教师只查询自己的文件（userId 参数）
- ✅ **缓存结果**：前端缓存媒体列表，避免重复请求

### 3. 删除管理

- ⚠️ **谨慎删除**：删除前确认文件不再使用
- ✅ **定期清理**：管理员定期清理未使用的文件
- 💾 **备份重要文件**：删除重要文件前先备份

### 4. 存储管理

- 📊 **监控容量**：定期查看存储统计，及时扩容
- 🗑️ **清理垃圾**：定期清理物理文件（数据库已删除但磁盘未删除）
- 📁 **分类存储**：系统已自动按类型分目录存储

---

## 🚀 前端集成示例

### Vue.js 示例

```vue
<template>
  <div class="media-upload">
    <input 
      type="file" 
      @change="handleFileChange" 
      accept="image/*,video/*"
    />
    <button @click="uploadFile" :disabled="uploading">
      {{ uploading ? '上传中...' : '上传' }}
    </button>
    <div v-if="uploadProgress">
      上传进度: {{ uploadProgress }}%
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const file = ref(null);
const uploading = ref(false);
const uploadProgress = ref(0);

const handleFileChange = (event) => {
  file.value = event.target.files[0];
};

const uploadFile = async () => {
  if (!file.value) {
    alert('请选择文件');
    return;
  }

  const formData = new FormData();
  formData.append('file', file.value);
  formData.append('articleIds', JSON.stringify([1, 2])); // 可选

  uploading.value = true;
  uploadProgress.value = 0;

  try {
    const response = await axios.post(
      'http://localhost:3000/media/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        onUploadProgress: (progressEvent) => {
          uploadProgress.value = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
        }
      }
    );

    console.log('上传成功:', response.data);
    alert(`文件已上传: ${response.data.url}`);
  } catch (error) {
    console.error('上传失败:', error);
    alert(`上传失败: ${error.response?.data?.message || error.message}`);
  } finally {
    uploading.value = false;
  }
};
</script>
```

### React 示例

```jsx
import React, { useState } from 'react';
import axios from 'axios';

function MediaUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const uploadFile = async () => {
    if (!file) {
      alert('请选择文件');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setProgress(0);

    try {
      const response = await axios.post(
        'http://localhost:3000/media/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          onUploadProgress: (progressEvent) => {
            setProgress(
              Math.round((progressEvent.loaded * 100) / progressEvent.total)
            );
          }
        }
      );

      console.log('上传成功:', response.data);
      alert(`文件已上传: ${response.data.url}`);
    } catch (error) {
      console.error('上传失败:', error);
      alert(`上传失败: ${error.response?.data?.message || error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        onChange={handleFileChange} 
        accept="image/*,video/*"
      />
      <button onClick={uploadFile} disabled={uploading}>
        {uploading ? `上传中... ${progress}%` : '上传'}
      </button>
    </div>
  );
}

export default MediaUpload;
```

---

## 📚 参考资料

- [Swagger API 文档](http://localhost:3000/api) - 在线测试接口
- [后台管理系统](http://localhost:3000/admin) - 可视化管理界面
- [Multer 文档](https://github.com/expressjs/multer) - 文件上传中间件

---

*文档更新时间：2025-10-11*
*版本：v1.0*

