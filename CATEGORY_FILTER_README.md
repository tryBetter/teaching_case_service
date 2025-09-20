# 文章分类和筛选条件功能说明

## 概述

为文章系统添加了分类和筛选条件功能，支持管理员创建和管理分类、筛选条件类型和筛选条件值，文章创建时必须选择分类，可选择多个筛选条件。

## 功能特性

### 1. 文章分类管理
- 支持创建、查看、更新、删除文章分类
- 分类名称唯一性约束
- 分类下有关联文章时无法删除

### 2. 筛选条件管理
- **筛选条件类型管理**：创建和管理筛选条件的分类（如知识点、发动机类型、难度等级）
- **筛选条件值管理**：为每个类型创建具体的筛选条件值
- 支持按类型查询筛选条件
- 同一类型下筛选条件名称唯一

### 3. 文章关联
- 文章创建时必须选择分类
- 文章可选择多个筛选条件
- 支持文章更新时修改分类和筛选条件

## 默认数据

### 默认分类
1. **科研案例** - 科研相关的教学案例
2. **军事案例** - 军事相关的教学案例
3. **工程案例** - 工程相关的教学案例
4. **生活案例** - 生活相关的教学案例
5. **思政案例** - 思政相关的教学案例

### 默认筛选条件类型和值

#### 1. 知识点
- 雾化机理 - 液体燃料雾化过程机理研究
- 点火过程 - 燃烧室点火过程研究
- 燃烧不稳定性 - 燃烧不稳定性机理分析
- 高温燃气流动 - 高温燃气流动特性研究
- 喷注器设计 - 喷注器设计理论与方法

#### 2. 发动机类型
- 液体火箭发动机 - 液体推进剂火箭发动机
- 固体火箭发动机 - 固体推进剂火箭发动机
- 超燃冲压发动机 - 超音速燃烧冲压发动机
- 燃气涡轮发动机 - 燃气涡轮发动机
- 组合发动机 - 组合循环发动机

#### 3. 难度等级
- 基础 - 研究生入门级别
- 进阶 - 科研深度分析级别
- 前沿 - 最新研究成果级别

## API 接口

### 分类管理接口

#### 创建分类
```
POST /categories
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "新分类",
  "description": "分类描述"
}
```

#### 获取所有分类
```
GET /categories
```

#### 获取分类详情
```
GET /categories/:id
```

#### 更新分类
```
PATCH /categories/:id
Authorization: Bearer <admin_or_teacher_token>
Content-Type: application/json

{
  "name": "更新后的分类名",
  "description": "更新后的描述"
}
```

#### 删除分类
```
DELETE /categories/:id
Authorization: Bearer <admin_token>
```

### 筛选条件管理接口

#### 创建筛选条件类型
```
POST /filter-conditions/types
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "新类型",
  "description": "类型描述"
}
```

#### 获取所有筛选条件类型
```
GET /filter-conditions/types
```

#### 创建筛选条件
```
POST /filter-conditions
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "筛选条件名称",
  "description": "筛选条件描述",
  "typeId": 1
}
```

#### 获取筛选条件
```
GET /filter-conditions
GET /filter-conditions?typeId=1  # 按类型筛选
```

### 文章管理接口（更新）

#### 创建文章
```
POST /articles
Authorization: Bearer <teacher_or_assistant_token>
Content-Type: application/json

{
  "title": "文章标题",
  "content": "文章内容",
  "published": false,
  "authorId": 1,
  "categoryId": 1,
  "filterConditionIds": [1, 2, 3]
}
```

#### 更新文章
```
PATCH /articles/:id
Authorization: Bearer <authenticated_user>
Content-Type: application/json

{
  "title": "更新后的标题",
  "categoryId": 2,
  "filterConditionIds": [4, 5]
}
```

## 数据库设计

### 表结构

#### Category（分类表）
```sql
CREATE TABLE "Category" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR UNIQUE NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

#### FilterConditionType（筛选条件类型表）
```sql
CREATE TABLE "FilterConditionType" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR UNIQUE NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

#### FilterCondition（筛选条件表）
```sql
CREATE TABLE "FilterCondition" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR NOT NULL,
  "description" TEXT,
  "typeId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("typeId") REFERENCES "FilterConditionType"("id"),
  UNIQUE("name", "typeId")
);
```

#### ArticleFilterCondition（文章筛选条件关联表）
```sql
CREATE TABLE "ArticleFilterCondition" (
  "id" SERIAL PRIMARY KEY,
  "articleId" INTEGER NOT NULL,
  "filterConditionId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE,
  FOREIGN KEY ("filterConditionId") REFERENCES "FilterCondition"("id") ON DELETE CASCADE,
  UNIQUE("articleId", "filterConditionId")
);
```

#### Article（文章表更新）
```sql
ALTER TABLE "Article" ADD COLUMN "categoryId" INTEGER NOT NULL;
ALTER TABLE "Article" ADD FOREIGN KEY ("categoryId") REFERENCES "Category"("id");
```

## 权限控制

### 分类管理权限
- **创建分类**：仅管理员
- **查看分类**：公开访问
- **更新分类**：管理员或教师
- **删除分类**：仅管理员

### 筛选条件管理权限
- **创建筛选条件类型**：仅管理员
- **创建筛选条件**：仅管理员
- **查看筛选条件**：公开访问
- **更新筛选条件**：管理员或教师
- **删除筛选条件**：仅管理员

### 文章管理权限
- **创建文章**：教师或助教
- **更新文章**：根据原有权限控制
- **分类和筛选条件验证**：创建和更新时自动验证

## 使用示例

### 1. 创建带分类和筛选条件的文章

```typescript
// 创建文章请求
const createArticleRequest = {
  title: "液体火箭发动机雾化机理研究",
  content: "本文深入研究了液体火箭发动机的雾化机理...",
  published: false,
  authorId: 1,
  categoryId: 1, // 科研案例
  filterConditionIds: [1, 6, 12] // 雾化机理、液体火箭发动机、基础
};

// API 调用
const response = await fetch('/articles', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(createArticleRequest)
});
```

### 2. 查询文章（包含分类和筛选条件信息）

```typescript
// 获取文章详情
const article = await fetch('/articles/1').then(res => res.json());

// 返回的数据结构
{
  "id": 1,
  "title": "液体火箭发动机雾化机理研究",
  "content": "本文深入研究了...",
  "published": false,
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z",
  "authorId": 1,
  "categoryId": 1,
  "category": {
    "id": 1,
    "name": "科研案例",
    "description": "科研相关的教学案例"
  },
  "filterConditions": [
    {
      "id": 1,
      "filterCondition": {
        "id": 1,
        "name": "雾化机理",
        "description": "液体燃料雾化过程机理研究",
        "type": {
          "id": 1,
          "name": "知识点",
          "description": "文章涉及的知识点分类"
        }
      }
    }
  ],
  "author": {
    "id": 1,
    "name": "张三",
    "email": "zhangsan@example.com"
  }
}
```

### 3. 管理分类和筛选条件

```typescript
// 获取所有分类
const categories = await fetch('/categories').then(res => res.json());

// 获取所有筛选条件类型
const filterTypes = await fetch('/filter-conditions/types').then(res => res.json());

// 获取特定类型的筛选条件
const knowledgeConditions = await fetch('/filter-conditions?typeId=1').then(res => res.json());
```

## 技术实现

### 1. 数据库关系
- 文章与分类：多对一关系
- 文章与筛选条件：多对多关系（通过中间表）
- 筛选条件与筛选条件类型：多对一关系

### 2. 数据验证
- 创建文章时验证分类存在性
- 创建文章时验证筛选条件存在性
- 更新文章时验证新的分类和筛选条件

### 3. 权限控制
- 使用现有的角色权限系统
- 管理员拥有最高权限
- 教师和助教有部分管理权限

### 4. 数据初始化
- 提供种子脚本自动创建默认数据
- 支持重复运行（使用 upsert 操作）

## 扩展性

### 1. 新增分类
- 通过 API 接口动态添加
- 支持分类描述和排序

### 2. 新增筛选条件类型
- 支持创建新的筛选维度
- 灵活的类型描述

### 3. 新增筛选条件值
- 为现有类型添加新的筛选条件
- 支持条件描述和排序

### 4. 文章筛选
- 可基于分类和筛选条件进行文章筛选
- 支持多条件组合查询

## 总结

文章分类和筛选条件功能为教学案例系统提供了强大的内容组织和管理能力：

1. **结构化内容管理**：通过分类和筛选条件，文章内容更加有序和易于管理
2. **灵活的筛选机制**：支持多维度筛选，便于用户快速找到相关内容
3. **权限控制完善**：不同角色有不同的管理权限，确保系统安全
4. **扩展性良好**：支持动态添加新的分类和筛选条件
5. **数据完整性**：通过外键约束和验证确保数据一致性

该功能为教学案例系统提供了专业的内容管理能力，特别适合科研、工程等专业领域的案例分类和筛选需求。
