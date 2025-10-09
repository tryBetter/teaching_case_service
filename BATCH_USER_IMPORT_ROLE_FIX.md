# 批量导入用户角色识别修复

## 🔴 问题描述

后台管理系统的用户管理模块，批量导入用户时角色权限没有识别成功。

### 根本原因

在 `src/users/services/excel.service.ts` 的 `parseUserExcel` 方法中：

```typescript
// ❌ 错误代码
roleId: role ? parseInt(role) : undefined,
```

代码试图将 `UserRole` 枚举值（字符串如 `"TEACHER"`、`"STUDENT"`）通过 `parseInt()` 转换为数字，导致：
- `parseInt("TEACHER")` 返回 `NaN`
- 角色ID设置失败
- 用户创建时使用默认学生角色

## ✅ 修复方案

### 1. 注入 PrismaService

在 `ExcelService` 中注入数据库服务：

```typescript
@Injectable()
export class ExcelService {
  constructor(private prisma: PrismaService) {}
}
```

### 2. 根据角色名称查询数据库

修改角色解析逻辑，从数据库查询正确的角色ID：

```typescript
// 验证角色并查询角色ID
let roleId: number | undefined = undefined;
if (roleStr) {
  const roleMapping: { [key: string]: UserRole } = {
    管理员: UserRole.ADMIN,
    超级管理员: UserRole.ADMIN,
    ADMIN: UserRole.ADMIN,
    教师组长: UserRole.TEACHER_LEADER,
    TEACHER_LEADER: UserRole.TEACHER_LEADER,
    教师: UserRole.TEACHER,
    TEACHER: UserRole.TEACHER,
    助教组长: UserRole.ASSISTANT_LEADER,
    ASSISTANT_LEADER: UserRole.ASSISTANT_LEADER,
    助教: UserRole.ASSISTANT,
    ASSISTANT: UserRole.ASSISTANT,
    学生: UserRole.STUDENT,
    STUDENT: UserRole.STUDENT,
  };

  const mappedRole = roleMapping[roleStr];
  if (mappedRole) {
    // 根据角色枚举值查询数据库中的角色ID
    const roleName = ROLE_DESCRIPTIONS[mappedRole];
    const roleRecord = await this.prisma.role.findFirst({
      where: { name: roleName, isActive: true },
    });
    if (roleRecord) {
      roleId = roleRecord.id;
    }
  }
}

users.push({
  email,
  name: name || undefined,
  password,
  roleId, // ✅ 使用数据库查询到的角色ID
});
```

### 3. 更新方法签名

将 `parseUserExcel` 改为异步方法：

```typescript
// 修改前
parseUserExcel(buffer: Buffer): BatchCreateUserDto[]

// 修改后
async parseUserExcel(buffer: Buffer): Promise<BatchCreateUserDto[]>
```

### 4. 更新调用处

添加 `await` 关键字：

**src/admin/users/admin-users.service.ts:**
```typescript
const users = await this.excelService.parseUserExcel(file.buffer);
```

**src/users/users.controller.ts:**
```typescript
const users = await this.excelService.parseUserExcel(file.buffer);
```

### 5. 更新模板示例

优化 Excel 模板中的角色示例：

```typescript
const sampleData = [
  ['admin@example.com', '管理员', 'admin123', '超级管理员'],
  ['teacher@example.com', '张老师', 'password123', '教师'],
  ['assistant@example.com', '李助教', 'password456', '助教'],
  ['student@example.com', '王同学', 'password789', '学生'],
];
```

## 🎯 修复效果

### 支持的角色格式

Excel 中的角色列可以使用以下任意格式：

| 中文名称   | 英文名称         | 映射到数据库角色 |
| ---------- | ---------------- | ---------------- |
| 超级管理员 | ADMIN            | 超级管理员       |
| 管理员     | ADMIN            | 超级管理员       |
| 教师组长   | TEACHER_LEADER   | 教师组长         |
| 教师       | TEACHER          | 教师             |
| 助教组长   | ASSISTANT_LEADER | 助教组长         |
| 助教       | ASSISTANT        | 助教             |
| 学生       | STUDENT          | 学生             |

### 角色识别流程

```
Excel 角色列: "教师"
    ↓
映射到枚举: UserRole.TEACHER
    ↓
查询描述: ROLE_DESCRIPTIONS[UserRole.TEACHER] = "教师"
    ↓
数据库查询: SELECT * FROM Role WHERE name = "教师" AND isActive = true
    ↓
获取角色ID: roleId = 4
    ↓
创建用户: { email, name, password, roleId: 4 }
```

## 📁 修改的文件

| 文件                                     | 修改内容                                                                                             |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `src/users/services/excel.service.ts`    | - 注入 PrismaService<br>- 修改 `parseUserExcel` 为 async<br>- 添加角色ID数据库查询<br>- 更新模板示例 |
| `src/admin/users/admin-users.service.ts` | - 添加 await 调用                                                                                    |
| `src/users/users.controller.ts`          | - 添加 await 调用                                                                                    |

## 🧪 测试方法

### 1. 下载新模板

访问后台管理系统 → 用户管理 → 下载模板

模板内容：
```
邮箱                  | 姓名   | 密码       | 角色
admin@example.com     | 管理员 | admin123   | 超级管理员
teacher@example.com   | 张老师 | password123| 教师
assistant@example.com | 李助教 | password456| 助教
student@example.com   | 王同学 | password789| 学生
```

### 2. 填写数据

在 Excel 中填写用户信息，角色列可以使用：
- ✅ 中文：`教师`、`助教`、`学生`
- ✅ 英文：`TEACHER`、`ASSISTANT`、`STUDENT`

### 3. 上传导入

上传 Excel 文件，系统会：
1. 解析每行数据
2. 根据角色名称映射到枚举值
3. 查询数据库获取角色ID
4. 创建用户时使用正确的角色ID

### 4. 验证结果

查看导入结果：
```json
{
  "successCount": 4,
  "failureCount": 0,
  "totalCount": 4,
  "successUsers": [
    { "email": "admin@example.com", "roleId": 1 },
    { "email": "teacher@example.com", "roleId": 4 },
    { "email": "assistant@example.com", "roleId": 6 },
    { "email": "student@example.com", "roleId": 7 }
  ]
}
```

## 📊 示例对比

### 修复前

```typescript
// Excel: 角色列 = "教师"
const role = UserRole.TEACHER; // "TEACHER"
roleId: parseInt("TEACHER");   // NaN ❌
// 结果：用户创建时使用默认学生角色
```

### 修复后

```typescript
// Excel: 角色列 = "教师"
const mappedRole = UserRole.TEACHER;
const roleName = ROLE_DESCRIPTIONS[mappedRole]; // "教师"
const roleRecord = await prisma.role.findFirst({ 
  where: { name: "教师", isActive: true } 
});
roleId: roleRecord.id; // 4 ✅
// 结果：用户创建时使用正确的教师角色
```

## ⚠️ 注意事项

### 1. 角色必须存在于数据库

如果 Excel 中的角色在数据库中不存在或已禁用：
- `roleId` 将为 `undefined`
- 用户创建时使用默认学生角色

### 2. 角色名称映射

系统支持中英文角色名称，映射关系已预设。如需添加新角色：
1. 在 `UserRole` 枚举中添加
2. 在 `ROLE_DESCRIPTIONS` 中添加描述
3. 在 `roleMapping` 中添加映射关系

### 3. 数据库角色数据

确保数据库中的角色数据完整：
```sql
SELECT id, name, isActive FROM Role;
```

应包含：
- 超级管理员
- 教师组长
- 教师
- 助教组长
- 助教
- 学生

## 🎉 总结

### 问题
批量导入用户时，代码错误地使用 `parseInt(UserRole枚举)` 导致角色ID为 `NaN`。

### 解决
通过数据库查询，根据角色名称获取正确的角色ID。

### 结果
- ✅ 角色识别正常
- ✅ 支持中英文角色名称
- ✅ 用户创建时使用正确的角色
- ✅ 模板示例更新

---

**修复日期**：2025年10月9日  
**影响模块**：用户批量导入  
**状态**：✅ 已修复并测试

