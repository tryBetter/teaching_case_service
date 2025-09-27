# 系统统计API文档

## 概述

系统统计API提供了教学案例服务的各项统计数据，包括用户数、文章数、访问量、资源文件统计、热门文章、活跃用户等信息。

## API接口

### 1. 获取完整系统统计

**接口地址：** `GET /stats`

**权限要求：** 需要系统管理员权限 (`SYSTEM_ADMIN`)

**请求头：**
```
Authorization: Bearer <jwt-token>
```

**响应示例：**
```json
{
  "totalUsers": 150,
  "totalArticles": 1250,
  "todayVisits": 125,
  "totalVisits": 12500,
  "mediaStats": {
    "totalCount": 1250,
    "totalSize": 52428800,
    "imageCount": 800,
    "videoCount": 300,
    "documentCount": 150,
    "todayUploadCount": 25,
    "todayUploadSize": 1048576
  },
  "hotArticles": [
    {
      "id": 1,
      "title": "热门教学案例",
      "viewCount": 1250,
      "likeCount": 89,
      "commentCount": 23,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "authorName": "张老师"
    }
  ],
  "activeUsers": [
    {
      "id": 1,
      "name": "张老师",
      "email": "teacher@example.com",
      "role": "教师",
      "articleCount": 15,
      "lastActiveAt": "2024-01-01T00:00:00.000Z",
      "commentCount": 45,
      "noteCount": 12
    }
  ],
  "generatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 2. 获取基础统计数据

**接口地址：** `GET /stats/basic`

**权限要求：** 无需特殊权限，登录即可访问

**请求头：**
```
Authorization: Bearer <jwt-token>
```

**响应示例：**
```json
{
  "totalUsers": 150,
  "totalArticles": 1250,
  "generatedAt": "2024-01-01T00:00:00.000Z"
}
```

## 数据结构说明

### 系统统计数据 (SystemStatsDto)

| 字段          | 类型         | 说明         |
| ------------- | ------------ | ------------ |
| totalUsers    | number       | 用户总数     |
| totalArticles | number       | 文章总数     |
| todayVisits   | number       | 今日访问量   |
| totalVisits   | number       | 总访问量     |
| mediaStats    | MediaStats   | 资源文件统计 |
| hotArticles   | HotArticle[] | 热门文章列表 |
| activeUsers   | ActiveUser[] | 活跃用户列表 |
| generatedAt   | Date         | 统计时间     |

### 资源文件统计 (MediaStats)

| 字段             | 类型   | 说明                 |
| ---------------- | ------ | -------------------- |
| totalCount       | number | 总文件数量           |
| totalSize        | number | 总文件大小（字节）   |
| imageCount       | number | 图片文件数量         |
| videoCount       | number | 视频文件数量         |
| documentCount    | number | 文档文件数量         |
| todayUploadCount | number | 今日上传数量         |
| todayUploadSize  | number | 今日上传大小（字节） |

### 热门文章 (HotArticle)

| 字段         | 类型   | 说明     |
| ------------ | ------ | -------- |
| id           | number | 文章ID   |
| title        | string | 文章标题 |
| viewCount    | number | 浏览量   |
| likeCount    | number | 点赞数量 |
| commentCount | number | 评论数量 |
| createdAt    | Date   | 创建时间 |
| authorName   | string | 作者姓名 |

### 活跃用户 (ActiveUser)

| 字段         | 类型   | 说明         |
| ------------ | ------ | ------------ |
| id           | number | 用户ID       |
| name         | string | 用户姓名     |
| email        | string | 用户邮箱     |
| role         | string | 用户角色     |
| articleCount | number | 文章数量     |
| lastActiveAt | Date   | 最后活跃时间 |
| commentCount | number | 评论数量     |
| noteCount    | number | 笔记数量     |

## 使用示例

### 1. 获取完整统计（需要管理员权限）

```bash
# 1. 先登录获取token
curl -X POST -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  http://localhost:3000/auth/login

# 2. 使用token获取统计数据
curl -X GET \
  -H "Authorization: Bearer <your-jwt-token>" \
  http://localhost:3000/stats
```

### 2. 获取基础统计（登录即可）

```bash
# 使用token获取基础统计数据
curl -X GET \
  -H "Authorization: Bearer <your-jwt-token>" \
  http://localhost:3000/stats/basic
```

## 在Swagger中使用

1. 访问 `http://localhost:3000/api`
2. 登录获取JWT token
3. 点击右上角 "Authorize" 配置认证
4. 在 "系统统计" 标签下找到相关接口
5. 点击 "Try it out" 测试接口

## 注意事项

1. **权限控制**：
   - 完整统计接口需要系统管理员权限
   - 基础统计接口只需要登录认证

2. **数据实时性**：
   - 统计数据是实时计算的，不是缓存的
   - 每次请求都会重新计算统计信息

3. **性能考虑**：
   - 完整统计接口涉及多个数据库查询，可能耗时较长
   - 建议在需要时调用，不要频繁请求

4. **数据限制**：
   - 热门文章默认返回前10条
   - 活跃用户默认返回前10条
   - 活跃用户统计基于最近30天的活动

5. **字段说明**：
   - 当前系统中某些字段（如viewCount、fileSize）暂时设为0
   - 这些字段在后续版本中会通过专门的统计表来实现

## 扩展建议

1. **访问统计表**：建议添加专门的访问日志表来准确统计访问量
2. **缓存机制**：对于不经常变化的统计数据，可以考虑添加缓存
3. **定时任务**：可以添加定时任务来预计算统计数据
4. **更多维度**：可以添加按时间、按分类等维度的统计
