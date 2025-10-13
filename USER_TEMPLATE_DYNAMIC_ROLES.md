# 用户导入模板 - 动态角色功能

## 📝 功能概述

用户导入模板现在会**动态生成所有角色的示例**（排除超级管理员），不再是固定的几个角色示例。

**接口：** `GET /users/template`

---

## ✅ 修改内容

### 修改前的模板示例

模板固定包含4个示例：
```
| 邮箱                  | 姓名   | 密码        | 角色       |
| --------------------- | ------ | ----------- | ---------- |
| admin@example.com     | 管理员 | admin123    | 超级管理员 |
| teacher@example.com   | 张老师 | password123 | 教师       |
| assistant@example.com | 李助教 | password456 | 助教       |
| student@example.com   | 王同学 | password789 | 学生       |
```

❌ 问题：
- 包含超级管理员（不应该通过导入创建）
- 缺少"管理员"、"教师组长"、"助教组长"角色
- 示例不完整

### 修改后的模板示例

模板动态生成，包含所有可用角色（除超级管理员）：
```
| 邮箱                    | 姓名       | 密码        | 角色     |
| ----------------------- | ---------- | ----------- | -------- |
| guanliyuan1@example.com | 张管理员   | password123 | 管理员   |
| jiaoshizuzhang2@...     | 李教师组长 | password223 | 教师组长 |
| jiaoshi3@example.com    | 王老师     | password323 | 教师     |
| zhujiaozuzhang4@...     | 赵助教组长 | password423 | 助教组长 |
| zhujiao5@example.com    | 刘助教     | password523 | 助教     |
| xuesheng6@example.com   | 陈同学     | password623 | 学生     |
```

✅ 优势：
- 自动排除超级管理员
- 包含所有系统角色
- 包含自定义角色（如果有）
- 每个角色都有示例

---

## 🔧 实现细节

### 1. 从数据库动态加载角色

```typescript
// 查询所有角色（排除超级管理员）
const roles = await this.prisma.role.findMany({
  where: {
    isActive: true,
    name: { not: '超级管理员' }, // 排除超级管理员
  },
  orderBy: { id: 'asc' },
});
```

### 2. 为每个角色生成示例数据

```typescript
roles.forEach((role, index) => {
  const namePrefix = nameTemplates[index % nameTemplates.length];
  const nameSuffix = nameTypes[role.name] || '用户';
  const sampleName = `${namePrefix}${nameSuffix}`;
  const sampleEmail = `${role.name.toLowerCase().replace(/[^a-z]/g, '')}${index + 1}@example.com`;
  const samplePassword = `password${index + 1}23`;

  sampleData.push([
    sampleEmail,
    sampleName,
    samplePassword,
    role.name,
  ]);
});
```

### 3. 示例数据生成规则

| 角色     | 示例邮箱                    | 示例姓名   | 示例密码    |
| -------- | --------------------------- | ---------- | ----------- |
| 管理员   | guanliyuan1@example.com     | 张管理员   | password123 |
| 教师组长 | jiaoshizuzhang2@example.com | 李教师组长 | password223 |
| 教师     | jiaoshi3@example.com        | 王老师     | password323 |
| 助教组长 | zhujiaozuzhang4@example.com | 赵助教组长 | password423 |
| 助教     | zhujiao5@example.com        | 刘助教     | password523 |
| 学生     | xuesheng6@example.com       | 陈同学     | password623 |

**规则说明：**
- 邮箱：角色拼音 + 序号 + @example.com
- 姓名：姓氏 + 角色类型
- 密码：password + 序号 + 23

---

## 📊 模板格式

### Excel 列定义

| 列名 | 必填 | 说明                               | 示例                  |
| ---- | ---- | ---------------------------------- | --------------------- |
| 邮箱 | ✅ 是 | 用户邮箱，必须唯一                 | `teacher@example.com` |
| 姓名 | ❌ 否 | 用户姓名                           | `张老师`              |
| 密码 | ✅ 是 | 登录密码                           | `password123`         |
| 角色 | ✅ 是 | 角色名称（必须是系统中存在的角色） | `教师`                |

### 支持的角色名称

模板中会自动包含以下角色（根据数据库实际数据）：
- ✅ 管理员
- ✅ 教师组长
- ✅ 教师
- ✅ 助教组长
- ✅ 助教
- ✅ 学生
- ✅ 任何自定义角色

❌ 不包含：
- 超级管理员（出于安全考虑）

---

## 🚀 使用流程

### 1. 下载模板

在后台管理系统中：
1. 点击"用户管理"
2. 点击"下载模板"按钮
3. 保存 Excel 文件

或通过 API：
```bash
curl -X GET http://localhost:3000/users/template \
  -H "Authorization: Bearer <token>" \
  --output 用户导入模板.xlsx
```

### 2. 填写用户数据

打开下载的 Excel 文件：
- 参考示例行的格式
- 删除示例行或修改为实际数据
- 添加需要导入的用户

**示例：**
```
| 邮箱             | 姓名   | 密码        | 角色 |
| ---------------- | ------ | ----------- | ---- |
| zhang@school.edu | 张教授 | StrongPass1 | 教师 |
| li@school.edu    | 李助教 | StrongPass2 | 助教 |
| wang@school.edu  | 王同学 | StrongPass3 | 学生 |
```

### 3. 导入用户

1. 在后台管理系统点击"批量导入"
2. 选择填写好的 Excel 文件
3. 点击"开始导入"
4. 查看导入结果

---

## ⚠️ 注意事项

### 1. 角色名称必须准确

**正确：**
```
角色
------
管理员
教师
学生
```

**错误：**
```
角色
------
管理人员  ❌ （角色名称不存在）
老师      ❌ （应该是"教师"）
STUDENT   ❌ （应该用中文"学生"）
```

### 2. 超级管理员不能通过导入创建

如果 Excel 中包含"超级管理员"角色，导入时会失败。

**创建超级管理员的正确方法：**
```bash
# 通过初始化脚本
npm run seed

# 或使用专用脚本
node create-admin.js
```

### 3. 邮箱必须唯一

如果邮箱已存在，该行导入会失败，但不影响其他行。

### 4. 密码强度建议

虽然模板示例使用简单密码，但生产环境建议使用强密码：
- 至少8位
- 包含大小写字母、数字、特殊字符
- 例如：`Abc123!@#`

---

## 🧪 测试验证

### 测试 1：验证模板包含所有角色

1. 下载模板
2. 打开 Excel 文件
3. 检查示例行是否包含以下角色：
   - ✅ 管理员
   - ✅ 教师组长
   - ✅ 教师
   - ✅ 助教组长
   - ✅ 助教
   - ✅ 学生
   - ❌ 超级管理员（不应该包含）

### 测试 2：导入模板中的示例数据

1. 下载模板（不修改）
2. 直接导入
3. 应该全部导入成功（如果邮箱不冲突）

### 测试 3：修改角色后下载

1. 在后台创建自定义角色（如"访客"）
2. 重新下载模板
3. 模板应该包含新创建的角色示例

---

## 📋 生成的示例数据

基于7个系统角色（排除超级管理员），模板将包含6行示例：

```excel
| 序号 | 邮箱                        | 姓名       | 密码        | 角色     |
| ---- | --------------------------- | ---------- | ----------- | -------- |
| 1    | guanliyuan1@example.com     | 张管理员   | password123 | 管理员   |
| 2    | jiaoshizuzhang2@example.com | 李教师组长 | password223 | 教师组长 |
| 3    | jiaoshi3@example.com        | 王老师     | password323 | 教师     |
| 4    | zhujiaozuzhang4@example.com | 赵助教组长 | password423 | 助教组长 |
| 5    | zhujiao5@example.com        | 刘助教     | password523 | 助教     |
| 6    | xuesheng6@example.com       | 陈同学     | password623 | 学生     |
```

---

## 🔍 技术实现

### 修改的文件

1. **`src/users/services/excel.service.ts`**
   - 修改 `generateUserTemplate()` 方法
   - 从同步改为异步
   - 从数据库动态加载角色
   - 自动生成示例数据

2. **`src/users/users.controller.ts`**
   - 修改 `downloadTemplate()` 方法
   - 添加 `async` 关键字
   - 使用 `await` 调用模板生成

### 代码逻辑

```typescript
// 1. 查询所有可用角色（排除超级管理员）
const roles = await prisma.role.findMany({
  where: {
    isActive: true,
    name: { not: '超级管理员' }
  }
});

// 2. 为每个角色生成示例
roles.forEach((role, index) => {
  const sampleEmail = generateEmail(role, index);
  const sampleName = generateName(role, index);
  const samplePassword = generatePassword(index);
  
  sampleData.push([sampleEmail, sampleName, samplePassword, role.name]);
});

// 3. 生成 Excel
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
XLSX.utils.book_append_sheet(workbook, worksheet, '用户导入模板');
```

---

## 🎯 优势对比

### 修改前（硬编码）
❌ 示例固定，不够全面  
❌ 包含超级管理员（安全隐患）  
❌ 缺少某些角色示例  
❌ 新增角色需要修改代码  

### 修改后（动态生成）
✅ 自动包含所有角色  
✅ 排除超级管理员（更安全）  
✅ 示例完整，覆盖所有角色  
✅ 支持自定义角色  
✅ 无需维护示例数据  

---

## 🔄 部署到服务器

### 本地测试

```bash
# 1. 构建项目
npm run build

# 2. 启动服务
npm run start:dev

# 3. 测试下载模板
curl -X GET http://localhost:3000/users/template \
  -H "Authorization: Bearer <your-token>" \
  --output test-template.xlsx

# 4. 打开 Excel 文件验证
```

### 生产服务器

```bash
# 1. 进入项目目录
cd ~/apps/teaching-case-service

# 2. 拉取最新代码
git pull origin main

# 3. 重新构建
npm run build

# 4. 重启应用
pm2 restart teaching-case-service

# 5. 验证
pm2 logs teaching-case-service --lines 20
```

---

## 🧪 测试用例

### 测试用例 1：基础功能测试

```bash
# 下载模板
curl -X GET http://localhost:3000/users/template \
  -H "Authorization: Bearer <token>" \
  --output template.xlsx

# 验证文件已下载
ls -lh template.xlsx

# 使用工具查看内容（如果安装了 xlsx2csv）
# xlsx2csv template.xlsx
```

### 测试用例 2：验证角色完整性

**预期结果：**
- ✅ 包含6个角色示例（管理员、教师组长、教师、助教组长、助教、学生）
- ✅ 不包含超级管理员
- ✅ 每行数据格式正确
- ✅ 列宽适中，内容清晰可见

### 测试用例 3：导入测试

1. 下载模板
2. 修改示例数据的邮箱（避免重复）
3. 直接导入
4. 验证6个用户都创建成功

### 测试用例 4：自定义角色测试

1. 创建自定义角色（如"访客"）
2. 重新下载模板
3. 验证模板包含新角色的示例

---

## 📖 相关文档

### 使用指南
- [批量用户导入说明](./BATCH_USER_IMPORT_README.md)
- [角色权限系统](./ROLE_PERMISSION_SYSTEM_README.md)

### API 文档
- Swagger: `http://localhost:3000/api`
- 接口: `GET /users/template`

---

## 🛡️ 安全考虑

### 1. 为什么排除超级管理员？

**原因：**
- 超级管理员拥有系统最高权限
- 不应该通过批量导入随意创建
- 应该通过受控的初始化脚本创建
- 防止误操作创建多个超级管理员

**创建超级管理员的正确方式：**
```bash
# 方式1：初始化脚本
npm run seed

# 方式2：专用创建脚本
node create-admin.js

# 方式3：手动数据库操作
# （在严格的权限控制下）
```

### 2. 模板文件名编码

使用 RFC 5987 编码处理中文文件名：
```typescript
const filename = encodeURIComponent('用户导入模板.xlsx');
res.set({
  'Content-Disposition': `attachment; filename="user-template.xlsx"; filename*=UTF-8''${filename}`
});
```

确保在各种浏览器和操作系统上都能正确显示中文文件名。

---

## 💡 使用技巧

### 技巧 1：批量创建同一角色

如果需要批量创建某一角色的用户（如批量创建学生）：

1. 下载模板
2. 删除其他角色的示例行
3. 复制"学生"示例行多次
4. 修改每行的邮箱、姓名、密码
5. 导入

### 技巧 2：导入后重置密码

建议导入后提醒用户修改密码：

```typescript
// 创建用户时发送邮件通知
await sendEmail(user.email, {
  subject: '账号已创建',
  content: '您的账号已创建，请登录后立即修改密码'
});
```

### 技巧 3：预览导入数据

导入前可以先预览：
1. 选择 Excel 文件
2. 系统显示将要导入的用户列表
3. 确认无误后再执行导入

---

## 🔮 未来扩展

### 1. 模板说明页

在 Excel 中添加第二个工作表"使用说明"：

```typescript
const instructions = [
  ['用户批量导入说明'],
  [''],
  ['1. 填写说明：'],
  ['   - 邮箱：必填，需要唯一'],
  ['   - 姓名：选填'],
  ['   - 密码：必填，建议使用强密码'],
  ['   - 角色：必填，只能填写以下角色之一：'],
  ...roles.map(r => [`     • ${r.name}`]),
  [''],
  ['2. 注意事项：'],
  ['   - 请勿修改标题行'],
  ['   - 邮箱格式必须正确'],
  ['   - 角色名称必须完全匹配'],
];

XLSX.utils.book_append_sheet(workbook, instructionSheet, '使用说明');
```

### 2. 数据验证

添加 Excel 单元格验证：
- 邮箱格式验证
- 角色下拉列表选择
- 密码长度限制

### 3. 模板版本管理

在模板中添加版本信息：
```typescript
const versionInfo = [
  ['模板版本：', '2.0'],
  ['生成时间：', new Date().toLocaleString('zh-CN')],
  ['角色数量：', roles.length],
];
```

---

## 📝 更新日志

### v2.0 - 2025-10-13
- ✅ 改为动态生成模板
- ✅ 自动包含所有角色（除超级管理员）
- ✅ 支持自定义角色
- ✅ 优化示例数据生成逻辑
- ✅ 增加列宽以容纳长角色名

### v1.0 - 原始版本
- 固定4个角色示例
- 包含超级管理员

---

*用户导入模板动态角色功能 - v2.0*

