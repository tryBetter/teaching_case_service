# 批量用户导入功能 API 文档

## 概述

批量用户导入功能允许教师通过上传Excel文件来批量创建用户账户。系统支持解析Excel文件中的用户信息，包括邮箱、姓名、密码和角色，并自动处理数据验证、密码加密和重复检查。

## 功能特性

- ✅ Excel文件解析：支持.xlsx和.xls格式
- ✅ 数据验证：邮箱格式、必填字段验证
- ✅ 重复检查：自动检查邮箱是否已存在
- ✅ 批量处理：支持一次性导入多个用户
- ✅ 错误处理：详细的错误信息和行号定位
- ✅ 模板下载：提供标准Excel模板
- ✅ 权限控制：仅教师角色可执行批量导入
- ✅ 结果统计：成功/失败数量统计

## API 接口

### 1. 批量创建用户

**POST** `/users/batch`

通过上传Excel文件批量创建用户。

#### 请求头
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

#### 请求体
```
file: [Excel文件]
```

#### Excel文件格式要求

**必需列（按顺序）：**
1. **邮箱** - 用户邮箱地址（必填）
2. **姓名** - 用户姓名（可选）
3. **密码** - 用户密码（必填）
4. **角色** - 用户角色（可选，默认为"学生"）

**支持的角色值：**
- `教师` 或 `TEACHER`
- `助教` 或 `ASSISTANT`
- `学生` 或 `STUDENT`

#### Excel示例数据
| 邮箱              | 姓名 | 密码        | 角色 |
| ----------------- | ---- | ----------- | ---- |
| user1@example.com | 张三 | password123 | 学生 |
| user2@example.com | 李四 | password456 | 助教 |
| user3@example.com | 王五 | password789 | 教师 |

#### 响应示例
```json
{
  "successCount": 2,
  "failureCount": 1,
  "totalCount": 3,
  "successUsers": [
    {
      "email": "user1@example.com",
      "name": "张三",
      "password": "[已加密]",
      "role": "STUDENT"
    },
    {
      "email": "user3@example.com",
      "name": "王五",
      "password": "[已加密]",
      "role": "TEACHER"
    }
  ],
  "failedUsers": [
    {
      "user": {
        "email": "user2@example.com",
        "name": "李四",
        "password": "password456",
        "role": "ASSISTANT"
      },
      "error": "邮箱已存在",
      "row": 3
    }
  ]
}
```

#### 错误响应
- `400 Bad Request`: Excel文件格式错误或数据验证失败
- `403 Forbidden`: 权限不足，需要教师角色
- `401 Unauthorized`: 未授权访问

---

### 2. 下载用户导入模板

**GET** `/users/template`

下载Excel格式的用户导入模板文件，包含示例数据。

#### 请求头
```
Authorization: Bearer <JWT_TOKEN>
```

#### 响应
- **Content-Type**: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **Content-Disposition**: `attachment; filename="用户导入模板.xlsx"`
- **Body**: Excel文件二进制数据

#### 错误响应
- `403 Forbidden`: 权限不足，需要教师角色
- `401 Unauthorized`: 未授权访问

---

## 使用示例

### 1. 批量创建用户
```bash
curl -X POST http://localhost:3000/users/batch \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@users.xlsx"
```

### 2. 下载模板
```bash
curl -X GET http://localhost:3000/users/template \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o "用户导入模板.xlsx"
```

### 3. JavaScript示例
```javascript
// 批量创建用户
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('/users/batch', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log(`成功创建 ${result.successCount} 个用户`);
console.log(`失败 ${result.failureCount} 个用户`);

// 下载模板
const templateResponse = await fetch('/users/template', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const blob = await templateResponse.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = '用户导入模板.xlsx';
a.click();
```

---

## 数据验证规则

### 1. 邮箱验证
- 必须符合标准邮箱格式
- 不能为空
- 系统内必须唯一

### 2. 密码验证
- 不能为空
- 自动进行bcrypt加密存储

### 3. 姓名验证
- 可选字段
- 如果提供，必须是字符串

### 4. 角色验证
- 可选字段，默认为"学生"
- 支持中文和英文角色名称
- 自动映射到系统角色枚举

---

## 错误处理

### 1. 文件格式错误
```json
{
  "statusCode": 400,
  "message": "只支持Excel文件格式(.xlsx, .xls)",
  "error": "Bad Request"
}
```

### 2. Excel结构错误
```json
{
  "statusCode": 400,
  "message": "Excel文件标题行必须包含: 邮箱, 姓名, 密码, 角色",
  "error": "Bad Request"
}
```

### 3. 数据验证错误
```json
{
  "statusCode": 400,
  "message": "第3行: 邮箱格式不正确",
  "error": "Bad Request"
}
```

### 4. 权限错误
```json
{
  "statusCode": 403,
  "message": "需要以下角色之一: TEACHER",
  "error": "Forbidden"
}
```

---

## 最佳实践

### 1. Excel文件准备
- 使用提供的模板文件
- 确保列标题完全匹配
- 避免空行和特殊字符
- 邮箱地址使用标准格式

### 2. 数据质量
- 预先检查邮箱是否已存在
- 使用强密码
- 角色名称使用标准格式
- 避免重复数据

### 3. 批量导入策略
- 建议单次导入不超过1000个用户
- 分批处理大量数据
- 导入前备份现有数据
- 导入后验证结果

### 4. 错误处理
- 仔细查看失败用户列表
- 根据错误信息修正数据
- 重新导入修正后的数据
- 记录导入日志

---

## 技术实现

### 1. 依赖包
- `xlsx`: Excel文件解析和生成
- `multer`: 文件上传处理
- `bcrypt`: 密码加密

### 2. 核心组件
- `ExcelService`: Excel文件处理服务
- `UsersService.batchCreate()`: 批量创建用户逻辑
- `UsersController.batchCreate()`: 批量创建接口
- `UsersController.downloadTemplate()`: 模板下载接口

### 3. 数据流程
1. 接收Excel文件上传
2. 验证文件格式和结构
3. 解析Excel数据
4. 验证用户数据
5. 检查邮箱重复
6. 批量创建用户
7. 返回处理结果

---

## 安全考虑

### 1. 权限控制
- 仅教师角色可执行批量导入
- JWT令牌验证
- 接口访问日志

### 2. 数据安全
- 密码自动加密存储
- 敏感信息不在响应中暴露
- 文件上传大小限制

### 3. 输入验证
- 严格的Excel格式验证
- 邮箱格式验证
- 角色枚举验证
- SQL注入防护

---

## 更新日志

### v1.0.0 (2024-01-01)
- ✅ 实现Excel文件解析功能
- ✅ 支持批量用户创建
- ✅ 添加数据验证和错误处理
- ✅ 提供模板下载功能
- ✅ 完整的权限控制
- ✅ 详细的API文档和示例
- ✅ 支持角色映射和默认值
- ✅ 成功/失败统计和详细报告
