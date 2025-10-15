# Swagger 文章接口参数说明文档更新

## 更新概述

本次更新为创建文章接口 `POST /articles` 和更新文章接口 `PATCH /articles/:id` 的 Swagger 文档补充了详细的参数说明，特别是 `categoryId` 和 `filterConditionIds` 参数的枚举值说明。

## 更新时间

2025-10-15

## 更新内容

### 1. 文章分类参数 (`categoryId`)

为 `categoryId` 参数添加了详细的可用值说明：

```typescript
@ApiProperty({
  description: `文章分类ID（必填）。可用分类如下：
  • 1 - 科研案例：科研相关的教学案例
  • 2 - 军事案例：军事相关的教学案例
  • 3 - 工程案例：工程相关的教学案例
  • 4 - 生活案例：生活相关的教学案例
  • 5 - 思政案例：思政相关的教学案例
  注意：可以通过 GET /categories 接口获取最新的分类列表`,
  example: 1,
  required: true,
})
categoryId: number;
```

#### 可用分类列表

| ID | 分类名称 | 说明 |
|----|---------|------|
| 1  | 科研案例 | 科研相关的教学案例 |
| 2  | 军事案例 | 军事相关的教学案例 |
| 3  | 工程案例 | 工程相关的教学案例 |
| 4  | 生活案例 | 生活相关的教学案例 |
| 5  | 思政案例 | 思政相关的教学案例 |

### 2. 筛选条件参数 (`filterConditionIds`)

为 `filterConditionIds` 参数添加了详细的可用值说明，按类型分组展示：

```typescript
@ApiProperty({
  description: `筛选条件ID列表（选填，支持多选）。可用筛选条件按类型分组如下：
  
  【知识点类型】
  • 1 - 雾化机理：液体燃料雾化过程机理研究
  • 2 - 点火过程：燃烧室点火过程研究
  • 3 - 燃烧不稳定性：燃烧不稳定性机理分析
  • 4 - 高温燃气流动：高温燃气流动特性研究
  • 5 - 喷注器设计：喷注器设计理论与方法
  
  【发动机类型】
  • 6 - 液体火箭发动机：液体推进剂火箭发动机
  • 7 - 固体火箭发动机：固体推进剂火箭发动机
  • 8 - 超燃冲压发动机：超音速燃烧冲压发动机
  • 9 - 燃气涡轮发动机：燃气涡轮发动机
  • 10 - 组合发动机：组合循环发动机
  
  【难度等级】
  • 11 - 基础：研究生入门级别
  • 12 - 进阶：科研深度分析级别
  • 13 - 前沿：最新研究成果级别
  
  注意：可以通过 GET /filter-conditions 接口获取最新的筛选条件列表`,
  example: [1, 6, 11],
  type: [Number],
  required: false,
})
filterConditionIds?: number[];
```

#### 可用筛选条件列表

##### 知识点类型

| ID | 名称 | 说明 |
|----|------|------|
| 1  | 雾化机理 | 液体燃料雾化过程机理研究 |
| 2  | 点火过程 | 燃烧室点火过程研究 |
| 3  | 燃烧不稳定性 | 燃烧不稳定性机理分析 |
| 4  | 高温燃气流动 | 高温燃气流动特性研究 |
| 5  | 喷注器设计 | 喷注器设计理论与方法 |

##### 发动机类型

| ID | 名称 | 说明 |
|----|------|------|
| 6  | 液体火箭发动机 | 液体推进剂火箭发动机 |
| 7  | 固体火箭发动机 | 固体推进剂火箭发动机 |
| 8  | 超燃冲压发动机 | 超音速燃烧冲压发动机 |
| 9  | 燃气涡轮发动机 | 燃气涡轮发动机 |
| 10 | 组合发动机 | 组合循环发动机 |

##### 难度等级

| ID | 名称 | 说明 |
|----|------|------|
| 11 | 基础 | 研究生入门级别 |
| 12 | 进阶 | 科研深度分析级别 |
| 13 | 前沿 | 最新研究成果级别 |

## 修改的文件

1. `src/articles/dto/create-article.dto.ts` - 创建文章 DTO
2. `src/articles/dto/update-article.dto.ts` - 更新文章 DTO

## 使用示例

### 创建文章示例

```bash
POST http://localhost:3000/articles
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "液体火箭发动机雾化机理研究",
  "content": "本文深入研究了液体火箭发动机的雾化机理...",
  "summary": "液体火箭发动机雾化机理研究",
  "keywords": ["液体火箭发动机", "雾化机理", "燃烧"],
  "published": true,
  "featured": false,
  "categoryId": 1,
  "filterConditionIds": [1, 6, 11]
}
```

### 参数说明

- `categoryId: 1` - 选择"科研案例"分类
- `filterConditionIds: [1, 6, 11]` - 选择了三个筛选条件：
  - `1` - 雾化机理（知识点）
  - `6` - 液体火箭发动机（发动机类型）
  - `11` - 基础（难度等级）

## 获取最新数据

虽然文档中列出了当前可用的分类和筛选条件，但系统支持动态添加新的分类和筛选条件。建议通过以下接口获取最新数据：

### 获取所有分类

```bash
GET http://localhost:3000/categories
```

### 获取所有筛选条件

```bash
GET http://localhost:3000/filter-conditions
```

### 按类型获取筛选条件

```bash
GET http://localhost:3000/filter-conditions?typeId=1  # 获取知识点类型的筛选条件
GET http://localhost:3000/filter-conditions?typeId=2  # 获取发动机类型的筛选条件
GET http://localhost:3000/filter-conditions?typeId=3  # 获取难度等级的筛选条件
```

## 效果

现在在 Swagger UI 文档中访问 `POST /articles` 接口时，会看到：

1. **categoryId 参数**：显示所有可用的分类及其说明
2. **filterConditionIds 参数**：按类型分组显示所有可用的筛选条件及其说明

这使得开发者能够快速了解可以使用哪些值，而无需查阅额外的文档或数据库。

## 相关文档

- [文章分类和筛选条件功能说明](./CATEGORY_FILTER_README.md)
- [Swagger 文档使用指南](./SWAGGER_AUTH_GUIDE.md)
- [API 接口文档改进总结](./SWAGGER_DOCUMENTATION_IMPROVEMENTS.md)

## 注意事项

1. ID 值可能会因数据库初始化顺序而有所不同，建议通过 API 接口动态获取
2. 系统管理员可以添加新的分类和筛选条件，文档中的 ID 列表仅供参考
3. 筛选条件支持多选，可以同时选择多个不同类型的筛选条件
4. 文章分类为必填项，筛选条件为可选项

