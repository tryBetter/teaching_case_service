# 文章查询接口使用指南

## 📚 接口概述

`GET /articles/all` 接口已升级，现在支持**分页、搜索、筛选和排序**功能。

**接口地址：** `http://localhost:3000/articles/all`

**认证要求：** 公开接口，无需认证

---

## 📋 查询参数

### 分页参数

| 参数名  | 类型   | 必填 | 默认值 | 说明              |
| ------- | ------ | ---- | ------ | ----------------- |
| `page`  | number | 否   | 1      | 页码，从1开始     |
| `limit` | number | 否   | 10     | 每页数量，最大100 |

### 筛选参数

| 参数名       | 类型    | 必填 | 说明                                      |
| ------------ | ------- | ---- | ----------------------------------------- |
| `search`     | string  | 否   | 搜索关键词，模糊匹配文章标题、内容和摘要  |
| `authorId`   | number  | 否   | 作者ID，筛选指定作者的文章                |
| `categoryId` | number  | 否   | 分类ID，筛选指定分类的文章                |
| `published`  | boolean | 否   | 发布状态，`true`-已发布，`false`-草稿     |
| `featured`   | boolean | 否   | 推荐状态，`true`-推荐文章，`false`-非推荐 |

### 排序参数

| 参数名    | 类型   | 必填 | 默认值           | 说明     |
| --------- | ------ | ---- | ---------------- | -------- |
| `orderBy` | string | 否   | `createdAt_desc` | 排序方式 |

**可选的排序方式：**
- `createdAt_desc` - 按创建时间倒序（最新在前）
- `createdAt_asc` - 按创建时间正序（最早在前）
- `updatedAt_desc` - 按更新时间倒序
- `updatedAt_asc` - 按更新时间正序

---

## 📊 响应格式

```json
{
  "data": [
    {
      "id": 1,
      "title": "火箭发动机燃烧机理研究",
      "content": "...",
      "summary": "本文介绍了...",
      "cover": "http://...",
      "keywords": ["火箭", "发动机"],
      "featured": true,
      "published": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-02T00:00:00.000Z",
      "category": {
        "id": 1,
        "name": "科研案例"
      },
      "author": {
        "id": 1,
        "name": "张教授",
        "email": "zhang@example.com"
      },
      "filterConditions": [...]
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

**响应字段说明：**
- `data` - 文章列表数组
- `total` - 符合条件的文章总数
- `page` - 当前页码
- `limit` - 每页数量
- `totalPages` - 总页数

---

## 🚀 使用示例

### 示例 1：基础分页查询

获取第一页的文章，每页10条：

```bash
GET /articles/all?page=1&limit=10
```

```bash
curl "http://localhost:3000/articles/all?page=1&limit=10"
```

### 示例 2：关键词搜索

搜索包含"火箭发动机"的文章：

```bash
GET /articles/all?search=火箭发动机
```

```bash
curl "http://localhost:3000/articles/all?search=火箭发动机"
```

### 示例 3：按作者筛选

获取作者ID为1的所有文章：

```bash
GET /articles/all?authorId=1
```

```bash
curl "http://localhost:3000/articles/all?authorId=1"
```

### 示例 4：按分类筛选

获取"科研案例"分类（categoryId=1）的文章：

```bash
GET /articles/all?categoryId=1&page=1&limit=20
```

```bash
curl "http://localhost:3000/articles/all?categoryId=1&page=1&limit=20"
```

### 示例 5：获取已发布的文章

只获取已发布的文章：

```bash
GET /articles/all?published=true
```

```bash
curl "http://localhost:3000/articles/all?published=true"
```

### 示例 6：获取推荐文章

获取所有推荐文章：

```bash
GET /articles/all?featured=true
```

```bash
curl "http://localhost:3000/articles/all?featured=true"
```

### 示例 7：按时间排序

按创建时间正序（从早到晚）：

```bash
GET /articles/all?orderBy=createdAt_asc
```

按更新时间倒序（最近更新的在前）：

```bash
GET /articles/all?orderBy=updatedAt_desc
```

```bash
curl "http://localhost:3000/articles/all?orderBy=createdAt_asc"
```

### 示例 8：组合查询

搜索"发动机"关键词，只看已发布的文章，按创建时间倒序，第2页，每页20条：

```bash
GET /articles/all?search=发动机&published=true&orderBy=createdAt_desc&page=2&limit=20
```

```bash
curl "http://localhost:3000/articles/all?search=发动机&published=true&orderBy=createdAt_desc&page=2&limit=20"
```

### 示例 9：特定作者的推荐文章

获取作者ID为1的所有推荐文章：

```bash
GET /articles/all?authorId=1&featured=true
```

```bash
curl "http://localhost:3000/articles/all?authorId=1&featured=true"
```

### 示例 10：完整高级查询

搜索关键词、指定分类、只看已发布、推荐文章，按更新时间排序：

```bash
GET /articles/all?search=燃烧&categoryId=1&published=true&featured=true&orderBy=updatedAt_desc&page=1&limit=15
```

```bash
curl "http://localhost:3000/articles/all?search=燃烧&categoryId=1&published=true&featured=true&orderBy=updatedAt_desc&page=1&limit=15"
```

---

## 💻 前端使用示例

### JavaScript / Fetch

```javascript
// 基础查询
async function getArticles(page = 1, limit = 10) {
  const response = await fetch(
    `http://localhost:3000/articles/all?page=${page}&limit=${limit}`
  );
  const data = await response.json();
  return data;
}

// 搜索文章
async function searchArticles(keyword, page = 1) {
  const response = await fetch(
    `http://localhost:3000/articles/all?search=${encodeURIComponent(keyword)}&page=${page}`
  );
  const data = await response.json();
  return data;
}

// 按作者筛选
async function getArticlesByAuthor(authorId, page = 1) {
  const response = await fetch(
    `http://localhost:3000/articles/all?authorId=${authorId}&page=${page}`
  );
  const data = await response.json();
  return data;
}

// 高级查询
async function advancedSearch(params) {
  const {
    search,
    authorId,
    categoryId,
    published,
    featured,
    orderBy = 'createdAt_desc',
    page = 1,
    limit = 10
  } = params;

  const queryParams = new URLSearchParams();
  
  if (search) queryParams.append('search', search);
  if (authorId) queryParams.append('authorId', authorId);
  if (categoryId) queryParams.append('categoryId', categoryId);
  if (published !== undefined) queryParams.append('published', published);
  if (featured !== undefined) queryParams.append('featured', featured);
  queryParams.append('orderBy', orderBy);
  queryParams.append('page', page);
  queryParams.append('limit', limit);

  const response = await fetch(
    `http://localhost:3000/articles/all?${queryParams.toString()}`
  );
  const data = await response.json();
  return data;
}

// 使用示例
advancedSearch({
  search: '发动机',
  categoryId: 1,
  published: true,
  orderBy: 'updatedAt_desc',
  page: 1,
  limit: 20
}).then(data => {
  console.log(`找到 ${data.total} 篇文章`);
  console.log(`当前第 ${data.page} 页，共 ${data.totalPages} 页`);
  console.log(data.data); // 文章列表
});
```

### Vue.js 示例

```vue
<template>
  <div>
    <!-- 搜索框 -->
    <input v-model="searchKeyword" @input="handleSearch" placeholder="搜索文章..." />
    
    <!-- 筛选器 -->
    <select v-model="selectedCategory" @change="handleFilter">
      <option :value="null">所有分类</option>
      <option v-for="cat in categories" :key="cat.id" :value="cat.id">
        {{ cat.name }}
      </option>
    </select>
    
    <!-- 排序 -->
    <select v-model="orderBy" @change="handleFilter">
      <option value="createdAt_desc">最新发布</option>
      <option value="createdAt_asc">最早发布</option>
      <option value="updatedAt_desc">最近更新</option>
    </select>
    
    <!-- 文章列表 -->
    <div v-for="article in articles" :key="article.id" class="article-item">
      <h3>{{ article.title }}</h3>
      <p>{{ article.summary }}</p>
      <span>作者: {{ article.author.name }}</span>
      <span>分类: {{ article.category.name }}</span>
    </div>
    
    <!-- 分页 -->
    <div class="pagination">
      <button @click="prevPage" :disabled="currentPage === 1">上一页</button>
      <span>第 {{ currentPage }} 页 / 共 {{ totalPages }} 页</span>
      <button @click="nextPage" :disabled="currentPage === totalPages">下一页</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      articles: [],
      searchKeyword: '',
      selectedCategory: null,
      orderBy: 'createdAt_desc',
      currentPage: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0,
      categories: []
    };
  },
  
  mounted() {
    this.fetchArticles();
  },
  
  methods: {
    async fetchArticles() {
      const params = new URLSearchParams({
        page: this.currentPage,
        limit: this.pageSize,
        orderBy: this.orderBy
      });
      
      if (this.searchKeyword) {
        params.append('search', this.searchKeyword);
      }
      
      if (this.selectedCategory) {
        params.append('categoryId', this.selectedCategory);
      }
      
      const response = await fetch(
        `http://localhost:3000/articles/all?${params.toString()}`
      );
      const data = await response.json();
      
      this.articles = data.data;
      this.total = data.total;
      this.totalPages = data.totalPages;
    },
    
    handleSearch() {
      this.currentPage = 1; // 搜索时重置到第一页
      this.fetchArticles();
    },
    
    handleFilter() {
      this.currentPage = 1; // 筛选时重置到第一页
      this.fetchArticles();
    },
    
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.fetchArticles();
      }
    },
    
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.fetchArticles();
      }
    }
  }
};
</script>
```

### React 示例

```jsx
import { useState, useEffect } from 'react';

function ArticleList() {
  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [orderBy, setOrderBy] = useState('createdAt_desc');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchArticles();
  }, [search, categoryId, orderBy, page]);

  const fetchArticles = async () => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      orderBy
    });
    
    if (search) params.append('search', search);
    if (categoryId) params.append('categoryId', categoryId);

    const response = await fetch(
      `http://localhost:3000/articles/all?${params.toString()}`
    );
    const data = await response.json();
    
    setArticles(data.data);
    setTotal(data.total);
    setTotalPages(data.totalPages);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // 重置到第一页
  };

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={handleSearchChange}
        placeholder="搜索文章..."
      />
      
      <select value={orderBy} onChange={(e) => setOrderBy(e.target.value)}>
        <option value="createdAt_desc">最新发布</option>
        <option value="createdAt_asc">最早发布</option>
        <option value="updatedAt_desc">最近更新</option>
      </select>

      {articles.map(article => (
        <div key={article.id}>
          <h3>{article.title}</h3>
          <p>{article.summary}</p>
          <span>作者: {article.author.name}</span>
        </div>
      ))}

      <div>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
          上一页
        </button>
        <span>第 {page} 页 / 共 {totalPages} 页 (总计 {total} 篇)</span>
        <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
          下一页
        </button>
      </div>
    </div>
  );
}

export default ArticleList;
```

---

## 📌 注意事项

1. **分页限制**
   - 每页最大数量为 100 条
   - 建议使用 10、20、50 等常见值

2. **搜索性能**
   - 搜索会匹配标题、内容和摘要
   - 建议添加其他筛选条件以提高性能

3. **布尔参数**
   - `published=true` - 已发布
   - `published=false` - 草稿
   - 不传该参数 - 所有状态

4. **排序字段**
   - 仅支持 `createdAt` 和 `updatedAt`
   - 格式：`字段名_方向`（如 `createdAt_desc`）

5. **URL 编码**
   - 搜索关键词包含特殊字符时需要 URL 编码
   - JavaScript 使用 `encodeURIComponent()`

---

## 🔄 与旧接口的区别

### 旧接口（保留）
- `/articles` - 管理员专用，需要认证
- `/articles/many` - 复杂筛选，参数较多

### 新接口
- `/articles/all` - 公开接口，支持分页和常用查询
- 响应包含分页信息
- 参数更简洁，易于使用

---

## 🆘 常见问题

### Q1: 如何实现"加载更多"功能？

```javascript
let currentPage = 1;
const articles = [];

async function loadMore() {
  const data = await fetch(
    `http://localhost:3000/articles/all?page=${currentPage}&limit=10`
  ).then(res => res.json());
  
  articles.push(...data.data);
  currentPage++;
  
  // 判断是否还有更多
  const hasMore = currentPage <= data.totalPages;
  return { articles, hasMore };
}
```

### Q2: 如何实现搜索防抖？

```javascript
let searchTimeout;

function handleSearchInput(keyword) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    searchArticles(keyword);
  }, 500); // 500ms 防抖
}
```

### Q3: 如何获取某个作者的推荐文章？

```bash
GET /articles/all?authorId=1&featured=true&published=true
```

### Q4: 如何按多个条件组合筛选？

所有参数可以自由组合使用：

```bash
GET /articles/all?search=发动机&categoryId=1&authorId=2&published=true&featured=true&orderBy=updatedAt_desc&page=1&limit=20
```

---

*文章查询接口使用指南 - v1.0*

