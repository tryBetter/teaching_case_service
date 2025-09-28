# 统计接口完整文档

## 概述

本文档描述了教学案例服务系统中完整的统计接口功能。系统提供了全面的数据统计和分析功能，包括总体统计、用户统计、内容统计、访问统计、趋势分析、热门内容和活跃用户等。

## 接口列表

### 1. 基础统计接口

#### GET /stats/basic
获取基础统计数据（简化版）

**响应示例：**
```json
{
  "totalUsers": 16,
  "totalArticles": 10,
  "generatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### GET /stats/system
获取完整系统统计数据

**响应示例：**
```json
{
  "totalUsers": 16,
  "totalArticles": 10,
  "hotArticles": [...],
  "activeUsers": [...],
  "mediaStats": {...},
  "todayVisits": 0,
  "totalVisits": 10,
  "generatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 2. 总体统计接口

#### GET /stats/overview
获取系统总体统计数据

**功能：**
- 用户总数、文章总数、评论总数、收藏总数、笔记总数、媒体总数
- 今日新增用户、今日新增文章、今日访问量

**响应示例：**
```json
{
  "totalUsers": 16,
  "totalArticles": 10,
  "totalComments": 18,
  "totalFavorites": 35,
  "totalNotes": 5,
  "totalMedia": 17,
  "todayNewUsers": 0,
  "todayNewArticles": 0,
  "todayVisits": 0,
  "generatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 3. 用户统计接口

#### GET /stats/users
获取用户相关统计数据

**功能：**
- 用户总数、今日新增、本周新增、本月新增
- 活跃用户数量
- 用户角色分布统计

**响应示例：**
```json
{
  "totalUsers": 16,
  "todayNewUsers": 0,
  "weekNewUsers": 0,
  "monthNewUsers": 0,
  "activeUsers": 9,
  "roleStats": [
    {
      "roleName": "学生",
      "count": 8,
      "percentage": 50.0
    },
    {
      "roleName": "教师",
      "count": 4,
      "percentage": 25.0
    }
  ],
  "generatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 4. 内容统计接口

#### GET /stats/content
获取内容相关统计数据

**功能：**
- 文章统计（总数、已发布、草稿、精选）
- 评论统计、收藏统计、笔记统计
- 媒体文件统计（图片、视频）
- 时间维度统计（今日、本周、本月）

**响应示例：**
```json
{
  "totalArticles": 10,
  "publishedArticles": 8,
  "draftArticles": 2,
  "featuredArticles": 3,
  "todayNewArticles": 0,
  "weekNewArticles": 0,
  "monthNewArticles": 0,
  "totalComments": 18,
  "todayNewComments": 0,
  "totalFavorites": 35,
  "totalNotes": 5,
  "totalMedia": 17,
  "imageCount": 12,
  "videoCount": 5,
  "generatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 5. 访问统计接口

#### GET /stats/visits
获取访问相关统计数据

**功能：**
- 访问量统计（今日、昨日、本周、本月、总计）
- 独立访客统计
- 平均每日访问量

**响应示例：**
```json
{
  "todayVisits": 0,
  "yesterdayVisits": 0,
  "weekVisits": 0,
  "monthVisits": 0,
  "totalVisits": 10,
  "todayUniqueVisitors": 0,
  "weekUniqueVisitors": 0,
  "monthUniqueVisitors": 0,
  "averageDailyVisits": 0.33,
  "generatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 6. 时间范围统计接口

#### GET /stats/time-range?startDate=2024-01-01T00:00:00.000Z&endDate=2024-01-31T23:59:59.999Z
获取指定时间范围内的统计数据

**参数：**
- `startDate`: 开始日期（ISO格式）
- `endDate`: 结束日期（ISO格式）

**响应示例：**
```json
{
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-01-31T23:59:59.999Z",
  "users": 16,
  "articles": 10,
  "comments": 18,
  "favorites": 35,
  "notes": 5,
  "visits": 10,
  "generatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 7. 趋势分析接口

#### GET /stats/user-growth?days=30
获取用户增长趋势数据

**参数：**
- `days`: 统计天数（默认30天）

**响应示例：**
```json
{
  "data": [
    {
      "date": "2024-01-01",
      "value": 2
    },
    {
      "date": "2024-01-02",
      "value": 1
    }
  ],
  "totalGrowth": 16,
  "averageDailyGrowth": 2.29,
  "generatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### GET /stats/content-growth?days=30
获取内容增长趋势数据

**参数：**
- `days`: 统计天数（默认30天）

**响应示例：**
```json
{
  "articles": [
    {
      "date": "2024-01-01",
      "value": 1
    }
  ],
  "comments": [
    {
      "date": "2024-01-01",
      "value": 3
    }
  ],
  "favorites": [
    {
      "date": "2024-01-01",
      "value": 5
    }
  ],
  "generatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### GET /stats/visit-trend?days=30
获取访问趋势数据

**参数：**
- `days`: 统计天数（默认30天）

**响应示例：**
```json
{
  "data": [
    {
      "date": "2024-01-01",
      "value": 2
    }
  ],
  "totalVisits": 10,
  "averageDailyVisits": 0.33,
  "peakVisits": 10,
  "peakDate": "2024-01-01",
  "generatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 8. 热门内容接口

#### GET /stats/popular-content?limit=10
获取热门内容数据

**参数：**
- `limit`: 返回数量限制（默认10）

**响应示例：**
```json
{
  "popularArticles": [
    {
      "id": "article-id",
      "title": "文章标题",
      "authorName": "作者姓名",
      "viewCount": 0,
      "likeCount": 5,
      "commentCount": 3,
      "favoriteCount": 5,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "popularComments": [
    {
      "id": "comment-id",
      "title": "评论内容...",
      "authorName": "评论者姓名",
      "viewCount": 0,
      "likeCount": 2,
      "commentCount": 0,
      "favoriteCount": 0,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "generatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 9. 活跃用户接口

#### GET /stats/active-users?limit=20
获取活跃用户数据

**参数：**
- `limit`: 返回数量限制（默认20）

**响应示例：**
```json
{
  "activeUsers": [
    {
      "id": "user-id",
      "name": "用户姓名",
      "email": "user@example.com",
      "role": "学生",
      "articleCount": 2,
      "commentCount": 5,
      "noteCount": 1,
      "favoriteCount": 3,
      "lastActiveAt": "2024-01-01T00:00:00.000Z",
      "activityScore": 45.0
    }
  ],
  "totalActiveUsers": 9,
  "todayActiveUsers": 0,
  "weekActiveUsers": 0,
  "monthActiveUsers": 0,
  "generatedAt": "2024-01-01T00:00:00.000Z"
}
```

## 权限要求

所有统计接口都需要以下权限：
- 需要JWT认证
- 需要`VIEW_STATS`权限

## 使用示例

### 1. 获取总体统计
```bash
curl -X GET "http://localhost:3000/stats/overview" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. 获取用户增长趋势（最近7天）
```bash
curl -X GET "http://localhost:3000/stats/user-growth?days=7" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. 获取时间范围统计
```bash
curl -X GET "http://localhost:3000/stats/time-range?startDate=2024-01-01T00:00:00.000Z&endDate=2024-01-31T23:59:59.999Z" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 测试

运行统计接口测试：
```bash
npm run test:stats
```

## 技术实现

### 数据模型
- 基于Prisma ORM
- 支持复杂查询和聚合统计
- 优化的数据库查询性能

### 性能优化
- 使用Promise.all并行查询
- 合理的数据库索引
- 缓存机制（可扩展）

### 扩展性
- 模块化设计
- 易于添加新的统计维度
- 支持自定义时间范围

## 注意事项

1. **访问统计**：当前使用文章更新次数作为访问量的近似值，建议在生产环境中添加专门的访问日志表
2. **性能考虑**：大量数据时建议添加分页和缓存机制
3. **数据准确性**：统计结果基于当前数据库状态，实时性取决于数据更新频率
4. **权限控制**：所有接口都需要适当的权限验证

## 更新日志

- **v1.0.0** (2024-01-01): 初始版本，包含所有基础统计功能
- 支持总体统计、用户统计、内容统计、访问统计
- 支持趋势分析、热门内容、活跃用户分析
- 完整的API文档和测试用例
