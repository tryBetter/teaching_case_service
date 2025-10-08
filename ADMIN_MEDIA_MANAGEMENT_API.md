# 后台媒体管理API文档

## 概述

后台媒体管理模块提供了完整的媒体文件管理功能，包括分页查询、高级搜索、排序、统计分析和批量操作等功能。

## API接口

### 1. 获取媒体文件列表（支持高级搜索）

**接口地址：** `GET /admin/media`

**权限要求：** 超级管理员

**查询参数：**

| 参数名    | 类型   | 必填 | 默认值    | 说明                                       |
| --------- | ------ | ---- | --------- | ------------------------------------------ |
| page      | number | 否   | 1         | 页码                                       |
| limit     | number | 否   | 10        | 每页数量（1-100）                          |
| type      | string | 否   | -         | 媒体类型：IMAGE/VIDEO                      |
| keyword   | string | 否   | -         | 文件名搜索关键词                           |
| minSize   | number | 否   | -         | 最小文件大小（字节）                       |
| maxSize   | number | 否   | -         | 最大文件大小（字节）                       |
| startDate | string | 否   | -         | 开始日期（YYYY-MM-DD）                     |
| endDate   | string | 否   | -         | 结束日期（YYYY-MM-DD）                     |
| sortBy    | string | 否   | createdAt | 排序字段：createdAt/size/type/originalName |
| sortOrder | string | 否   | desc      | 排序方向：asc/desc                         |

**响应示例：**

```json
{
  "data": [
    {
      "id": 1,
      "type": "IMAGE",
      "url": "http://localhost:3000/uploads/images/1234567890_abc123.jpg",
      "originalName": "example.jpg",
      "size": 1024000,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "articleCount": 2,
      "articles": [
        {
          "id": 1,
          "title": "示例文章",
          "author": {
            "id": 1,
            "name": "张三"
          }
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  },
  "filters": {
    "type": null,
    "keyword": null,
    "minSize": null,
    "maxSize": null,
    "startDate": null,
    "endDate": null,
    "sortBy": "createdAt",
    "sortOrder": "desc"
  }
}
```

### 2. 删除媒体文件

**接口地址：** `DELETE /admin/media/:id`

**权限要求：** 超级管理员

**路径参数：**
- `id`: 媒体文件ID

**响应示例：**

```json
{
  "id": 1,
  "originalName": "example.jpg",
  "message": "媒体文件删除成功"
}
```

### 3. 获取媒体统计信息

**接口地址：** `GET /admin/media/stats/overview`

**权限要求：** 超级管理员

**响应示例：**

```json
{
  "totalMedia": 1000,
  "imageCount": 800,
  "videoCount": 200,
  "totalSize": 10737418240,
  "averageSize": 10737418,
  "todayUploads": 5,
  "weekUploads": 25,
  "monthUploads": 100
}
```

### 4. 获取媒体类型分布统计

**接口地址：** `GET /admin/media/stats/distribution`

**权限要求：** 超级管理员

**响应示例：**

```json
[
  {
    "type": "IMAGE",
    "count": 800,
    "totalSize": 8589934592
  },
  {
    "type": "VIDEO",
    "count": 200,
    "totalSize": 2147483648
  }
]
```

### 5. 获取最近上传的媒体文件

**接口地址：** `GET /admin/media/recent`

**权限要求：** 超级管理员

**查询参数：**
- `limit`: 返回数量限制（可选，默认10）

**响应示例：**

```json
[
  {
    "id": 100,
    "type": "IMAGE",
    "url": "http://localhost:3000/uploads/images/1234567890_def456.jpg",
    "originalName": "recent_image.jpg",
    "size": 2048000,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

### 6. 批量删除媒体文件

**接口地址：** `DELETE /admin/media/batch`

**权限要求：** 超级管理员

**查询参数：**
- `ids`: 媒体文件ID列表，用逗号分隔

**响应示例：**

```json
{
  "deletedCount": 8,
  "failedCount": 2,
  "errors": [
    "ID 5: 媒体文件不存在",
    "ID 10: 媒体文件不存在"
  ]
}
```

## 使用示例

### 基础分页查询

```bash
GET /admin/media?page=1&limit=20
```

### 按类型过滤

```bash
GET /admin/media?type=IMAGE&page=1&limit=10
```

### 关键词搜索

```bash
GET /admin/media?keyword=logo&page=1&limit=10
```

### 文件大小范围过滤

```bash
GET /admin/media?minSize=1048576&maxSize=10485760&page=1&limit=10
```

### 日期范围过滤

```bash
GET /admin/media?startDate=2024-01-01&endDate=2024-01-31&page=1&limit=10
```

### 复合搜索条件

```bash
GET /admin/media?type=IMAGE&keyword=avatar&minSize=102400&maxSize=5242880&startDate=2024-01-01&sortBy=size&sortOrder=desc&page=1&limit=15
```

### 批量删除

```bash
DELETE /admin/media/batch?ids=1,2,3,4,5
```

## 功能特性

### 1. 分页功能
- 支持页码跳转
- 返回完整的分页信息（总数、总页数、是否有下一页/上一页）
- 可配置每页显示数量（1-100）

### 2. 高级搜索
- **关键词搜索：** 支持按文件名和URL搜索（不区分大小写）
- **类型过滤：** 支持按媒体类型（图片/视频）过滤
- **大小范围：** 支持按文件大小范围过滤
- **时间范围：** 支持按上传时间范围过滤

### 3. 排序功能
- 支持按创建时间、文件大小、媒体类型、文件名排序
- 支持升序/降序排列

### 4. 统计分析
- 总体统计信息（总数、类型分布、大小统计）
- 时间维度统计（今日、本周、本月上传量）
- 类型分布统计

### 5. 批量操作
- 支持批量删除媒体文件
- 返回详细的删除结果和错误信息

### 6. 数据关联
- 显示媒体文件关联的文章信息
- 统计每个媒体文件的使用次数

## 注意事项

1. 所有接口都需要超级管理员权限
2. 文件大小以字节为单位
3. 日期格式为 YYYY-MM-DD
4. 批量删除时，如果部分文件删除失败，会返回详细的错误信息
5. 搜索关键词支持模糊匹配，不区分大小写
6. 排序字段必须是预定义的值，否则会使用默认排序

## 错误处理

接口会返回标准的HTTP状态码：
- `200`: 成功
- `400`: 请求参数错误
- `401`: 未授权
- `403`: 权限不足
- `404`: 资源不存在
- `500`: 服务器内部错误

错误响应格式：
```json
{
  "statusCode": 400,
  "message": "参数验证失败",
  "error": "Bad Request"
}
```

