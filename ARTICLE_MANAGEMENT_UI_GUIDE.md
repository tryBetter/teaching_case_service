# 后台文章管理界面使用指南

## 功能概述

后台文章管理系统支持完整的软删除功能，管理员可以：
- 查看所有文章（包括已删除的）
- 软删除文章（可恢复）
- 恢复已删除的文章
- 永久删除文章（不可恢复）
- 查看回收站

## API 使用

### 1. 获取文章列表（支持显示已删除文章）

**端点：** `GET /api/admin/articles`

**查询参数：**

| 参数               | 类型        | 必填   | 说明                     | 示例           |
| ------------------ | ----------- | ------ | ------------------------ | -------------- |
| page               | number      | 否     | 页码                     | 1              |
| limit              | number      | 否     | 每页数量                 | 10             |
| published          | boolean     | 否     | 是否发布                 | true/false     |
| categoryId         | number      | 否     | 分类ID                   | 1              |
| authorId           | number      | 否     | 作者ID                   | 1              |
| search             | string      | 否     | 搜索关键词               | "案例"         |
| **includeDeleted** | **boolean** | **否** | **是否包括已删除的文章** | **true/false** |

**示例请求：**

```bash
# 查看所有文章（不包括已删除）
GET /api/admin/articles?page=1&limit=10

# 查看所有文章（包括已删除）
GET /api/admin/articles?page=1&limit=10&includeDeleted=true
```

**响应数据：**

```json
{
  "data": [
    {
      "id": 1,
      "title": "文章标题",
      "summary": "文章摘要",
      "published": true,
      "featured": false,
      "deletedAt": null,  // null = 正常，有值 = 已删除
      "createdAt": "2025-10-08T10:00:00.000Z",
      "updatedAt": "2025-10-08T12:00:00.000Z",
      "author": {
        "id": 1,
        "name": "作者姓名",
        "email": "author@example.com"
      },
      "category": {
        "id": 1,
        "name": "分类名称"
      }
    },
    {
      "id": 2,
      "title": "已删除的文章",
      "deletedAt": "2025-10-08T15:30:00.000Z",  // 有值表示已删除
      // ... 其他字段
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### 2. 软删除文章

**端点：** `DELETE /api/admin/articles/:id`

**示例：**
```bash
DELETE /api/admin/articles/1
```

**响应：**
```json
{
  "id": 1,
  "title": "文章标题",
  "message": "文章已软删除成功"
}
```

### 3. 恢复已删除文章

**端点：** `POST /api/admin/articles/:id/restore`

**示例：**
```bash
POST /api/admin/articles/1/restore
```

**响应：**
```json
{
  "id": 1,
  "title": "文章标题",
  "message": "文章恢复成功"
}
```

### 4. 查看回收站（仅已删除文章）

**端点：** `GET /api/admin/articles/deleted/list`

**查询参数：**
- `page`: 页码
- `limit`: 每页数量
- `search`: 搜索关键词

**示例：**
```bash
GET /api/admin/articles/deleted/list?page=1&limit=10
```

### 5. 永久删除文章

**端点：** `DELETE /api/admin/articles/:id/permanent`

⚠️ **注意：** 此操作不可恢复！只有无关联数据的文章才能永久删除。

**示例：**
```bash
DELETE /api/admin/articles/1/permanent
```

## 前端实现建议

### 1. 文章列表页面设计

#### 布局结构

```
┌─────────────────────────────────────────────────────┐
│ 文章管理                                              │
├─────────────────────────────────────────────────────┤
│ [搜索框]  [分类筛选] [状态筛选] [刷新]                │
│                                                       │
│ 状态筛选:                                             │
│  ○ 全部  ○ 正常  ○ 已删除                            │
├─────────────────────────────────────────────────────┤
│ ID │ 标题      │ 作者  │ 分类 │ 状态 │ 操作           │
├────┼──────────┼──────┼─────┼─────┼─────────────────┤
│ 1  │ 文章标题  │ 张三  │ 科研 │ 正常 │ [编辑][删除]  │
│ 2  │ 已删文章  │ 李四  │ 教学 │ 已删 │ [恢复][永久删]│
│ 3  │ 草稿文章  │ 王五  │ 实验 │ 草稿 │ [编辑][删除]  │
└─────────────────────────────────────────────────────┘
```

#### 状态显示

根据 `deletedAt` 字段判断文章状态：

```javascript
// 获取文章状态
function getArticleStatus(article) {
  if (article.deletedAt !== null) {
    return {
      label: '已删除',
      color: 'red',
      badge: 'error'
    };
  }
  if (!article.published) {
    return {
      label: '草稿',
      color: 'orange',
      badge: 'warning'
    };
  }
  return {
    label: '已发布',
    color: 'green',
    badge: 'success'
  };
}
```

#### 操作按钮

根据文章状态显示不同的操作按钮：

```javascript
// 渲染操作按钮
function renderActions(article) {
  if (article.deletedAt !== null) {
    // 已删除的文章
    return (
      <>
        <Button onClick={() => restoreArticle(article.id)}>
          恢复
        </Button>
        <Button danger onClick={() => permanentlyDelete(article.id)}>
          永久删除
        </Button>
      </>
    );
  } else {
    // 正常文章
    return (
      <>
        <Button onClick={() => editArticle(article.id)}>
          编辑
        </Button>
        <Button danger onClick={() => softDelete(article.id)}>
          删除
        </Button>
      </>
    );
  }
}
```

### 2. 状态筛选实现

```javascript
const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'normal', 'deleted'

// 获取文章列表
async function fetchArticles() {
  const params = {
    page: currentPage,
    limit: pageSize,
    includeDeleted: statusFilter === 'all' || statusFilter === 'deleted',
    // 其他筛选条件...
  };
  
  const response = await axios.get('/api/admin/articles', { params });
  
  // 如果只看已删除的，需要过滤
  let articles = response.data.data;
  if (statusFilter === 'deleted') {
    articles = articles.filter(a => a.deletedAt !== null);
  } else if (statusFilter === 'normal') {
    articles = articles.filter(a => a.deletedAt === null);
  }
  
  setArticles(articles);
}
```

### 3. React 示例代码

```jsx
import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Radio, Space, message } from 'antd';
import axios from 'axios';

function ArticleManagement() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  // 加载文章列表
  const fetchArticles = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        includeDeleted: statusFilter !== 'normal'
      };
      
      const response = await axios.get('/api/admin/articles', { params });
      let data = response.data.data;
      
      // 根据状态过滤
      if (statusFilter === 'deleted') {
        data = data.filter(a => a.deletedAt !== null);
      } else if (statusFilter === 'normal') {
        data = data.filter(a => a.deletedAt === null);
      }
      
      setArticles(data);
      setPagination({
        ...pagination,
        total: response.data.pagination.total
      });
    } catch (error) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [statusFilter, pagination.current]);

  // 软删除
  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/admin/articles/${id}`);
      message.success('删除成功');
      fetchArticles();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 恢复文章
  const handleRestore = async (id) => {
    try {
      await axios.post(`/api/admin/articles/${id}/restore`);
      message.success('恢复成功');
      fetchArticles();
    } catch (error) {
      message.error('恢复失败');
    }
  };

  // 永久删除
  const handlePermanentDelete = async (id) => {
    if (!confirm('确定要永久删除吗？此操作不可恢复！')) return;
    
    try {
      await axios.delete(`/api/admin/articles/${id}/permanent`);
      message.success('永久删除成功');
      fetchArticles();
    } catch (error) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: '标题',
      dataIndex: 'title',
      width: 200,
    },
    {
      title: '作者',
      dataIndex: ['author', 'name'],
      width: 100,
    },
    {
      title: '分类',
      dataIndex: ['category', 'name'],
      width: 100,
    },
    {
      title: '状态',
      width: 100,
      render: (_, record) => {
        if (record.deletedAt) {
          return <Tag color="red">已删除</Tag>;
        }
        if (record.published) {
          return <Tag color="green">已发布</Tag>;
        }
        return <Tag color="orange">草稿</Tag>;
      },
    },
    {
      title: '删除时间',
      dataIndex: 'deletedAt',
      width: 180,
      render: (deletedAt) => 
        deletedAt ? new Date(deletedAt).toLocaleString() : '-',
    },
    {
      title: '操作',
      width: 200,
      render: (_, record) => (
        <Space>
          {record.deletedAt ? (
            <>
              <Button 
                size="small" 
                type="primary"
                onClick={() => handleRestore(record.id)}
              >
                恢复
              </Button>
              <Button 
                size="small" 
                danger
                onClick={() => handlePermanentDelete(record.id)}
              >
                永久删除
              </Button>
            </>
          ) : (
            <>
              <Button 
                size="small"
                onClick={() => window.location.href = `/admin/articles/${record.id}/edit`}
              >
                编辑
              </Button>
              <Button 
                size="small" 
                danger
                onClick={() => handleDelete(record.id)}
              >
                删除
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h1>文章管理</h1>
      
      {/* 状态筛选 */}
      <div style={{ marginBottom: 16 }}>
        <Radio.Group 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <Radio.Button value="all">全部</Radio.Button>
          <Radio.Button value="normal">正常</Radio.Button>
          <Radio.Button value="deleted">已删除</Radio.Button>
        </Radio.Group>
      </div>

      {/* 文章列表 */}
      <Table
        columns={columns}
        dataSource={articles}
        loading={loading}
        rowKey="id"
        pagination={pagination}
        onChange={(p) => setPagination(p)}
      />
    </div>
  );
}

export default ArticleManagement;
```

### 4. Vue 示例代码

```vue
<template>
  <div class="article-management">
    <h1>文章管理</h1>
    
    <!-- 状态筛选 -->
    <el-radio-group v-model="statusFilter" @change="fetchArticles">
      <el-radio-button label="all">全部</el-radio-button>
      <el-radio-button label="normal">正常</el-radio-button>
      <el-radio-button label="deleted">已删除</el-radio-button>
    </el-radio-group>

    <!-- 文章列表 -->
    <el-table :data="articles" v-loading="loading" style="margin-top: 20px">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="title" label="标题" width="200" />
      <el-table-column prop="author.name" label="作者" width="100" />
      <el-table-column prop="category.name" label="分类" width="100" />
      
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.deletedAt" type="danger">已删除</el-tag>
          <el-tag v-else-if="row.published" type="success">已发布</el-tag>
          <el-tag v-else type="warning">草稿</el-tag>
        </template>
      </el-table-column>
      
      <el-table-column label="删除时间" width="180">
        <template #default="{ row }">
          {{ row.deletedAt ? new Date(row.deletedAt).toLocaleString() : '-' }}
        </template>
      </el-table-column>
      
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <template v-if="row.deletedAt">
            <el-button size="small" type="primary" @click="handleRestore(row.id)">
              恢复
            </el-button>
            <el-button size="small" type="danger" @click="handlePermanentDelete(row.id)">
              永久删除
            </el-button>
          </template>
          <template v-else>
            <el-button size="small" @click="handleEdit(row.id)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row.id)">
              删除
            </el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="pagination.current"
      v-model:page-size="pagination.pageSize"
      :total="pagination.total"
      @current-change="fetchArticles"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from 'axios';

const articles = ref([]);
const loading = ref(false);
const statusFilter = ref('all');
const pagination = ref({ current: 1, pageSize: 10, total: 0 });

// 加载文章列表
const fetchArticles = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.value.current,
      limit: pagination.value.pageSize,
      includeDeleted: statusFilter.value !== 'normal'
    };
    
    const response = await axios.get('/api/admin/articles', { params });
    let data = response.data.data;
    
    // 根据状态过滤
    if (statusFilter.value === 'deleted') {
      data = data.filter(a => a.deletedAt !== null);
    } else if (statusFilter.value === 'normal') {
      data = data.filter(a => a.deletedAt === null);
    }
    
    articles.value = data;
    pagination.value.total = response.data.pagination.total;
  } catch (error) {
    ElMessage.error('加载失败');
  } finally {
    loading.value = false;
  }
};

// 软删除
const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这篇文章吗？', '提示');
    await axios.delete(`/api/admin/articles/${id}`);
    ElMessage.success('删除成功');
    fetchArticles();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

// 恢复文章
const handleRestore = async (id) => {
  try {
    await axios.post(`/api/admin/articles/${id}/restore`);
    ElMessage.success('恢复成功');
    fetchArticles();
  } catch (error) {
    ElMessage.error('恢复失败');
  }
};

// 永久删除
const handlePermanentDelete = async (id) => {
  try {
    await ElMessageBox.confirm(
      '确定要永久删除吗？此操作不可恢复！',
      '危险操作',
      { type: 'warning' }
    );
    await axios.delete(`/api/admin/articles/${id}/permanent`);
    ElMessage.success('永久删除成功');
    fetchArticles();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '删除失败');
    }
  }
};

const handleEdit = (id) => {
  // 跳转到编辑页面
  window.location.href = `/admin/articles/${id}/edit`;
};

onMounted(() => {
  fetchArticles();
});
</script>
```

## 使用场景

### 场景 1：查看所有文章（包括已删除）

```
1. 设置状态筛选为"全部"
2. 系统调用 API：GET /api/admin/articles?includeDeleted=true
3. 显示所有文章，已删除的文章用红色标记
```

### 场景 2：只查看正常文章

```
1. 设置状态筛选为"正常"
2. 系统调用 API：GET /api/admin/articles （默认不包括已删除）
3. 只显示未删除的文章
```

### 场景 3：只查看回收站

```
方式1: 使用专用回收站 API
GET /api/admin/articles/deleted/list

方式2: 使用主列表 API + 前端过滤
GET /api/admin/articles?includeDeleted=true
然后过滤 deletedAt !== null 的记录
```

## 统计数据

获取文章统计时会包含已删除文章数量：

```bash
GET /api/admin/articles/stats/overview
```

响应：
```json
{
  "totalArticles": 1250,      // 不包括已删除
  "publishedArticles": 980,
  "draftArticles": 270,
  "featuredArticles": 50,
  "deletedArticles": 30,      // 已删除的文章数量
  "articlesByCategory": [...],
  "newArticlesToday": 5,
  "newArticlesThisWeek": 25,
  "newArticlesThisMonth": 80
}
```

可以在 Dashboard 中显示已删除文章统计卡片。

## 注意事项

1. **默认行为**：不传 `includeDeleted` 参数时，默认不显示已删除文章
2. **权限控制**：所有操作都需要超级管理员权限
3. **永久删除限制**：有关联数据（评论/收藏/笔记）的文章无法永久删除
4. **UI 提示**：删除操作应有明确的确认提示
5. **状态标识**：建议用不同颜色标识不同状态的文章

## 快速开始

1. 启动后端服务
2. 在前端调用 `GET /api/admin/articles?includeDeleted=true` 获取所有文章
3. 根据 `deletedAt` 字段判断文章是否已删除
4. 显示相应的操作按钮（恢复/永久删除）

---

**更新日期**：2025年10月8日  
**相关文档**：
- [软删除技术文档](./ARTICLE_SOFT_DELETE_README.md)
- [快速开始指南](./ARTICLE_SOFT_DELETE_QUICKSTART.md)
