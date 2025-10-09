# 调试媒体上传权限检查

## 🎯 调试目标

调试 `@RequireTeacherLeaderOrTeacher()` 装饰器，查看权限检查失败时的具体属性值。

## 📍 关键断点位置

### 断点 1：RolesGuard - 权限检查入口

**文件：** `src/auth/guards/roles.guard.ts`  
**位置：** 第 66 行

```typescript:64:72:src/auth/guards/roles.guard.ts
// 检查角色权限
if (requiredRoles && requiredRoles.length > 0) {
  const hasRequiredRole = requiredRoles.includes(user.role); // ← 断点打这里
  if (!hasRequiredRole) {
    throw new ForbiddenException(
      `需要以下角色之一: ${requiredRoles.join(', ')}`,
    );
  }
}
```

**查看的变量：**
- `requiredRoles` - 需要的角色列表（应该是 `["TEACHER_LEADER", "TEACHER"]`）
- `user` - 当前用户信息
- `user.role` - 用户的角色（这里会看到实际的角色值）
- `hasRequiredRole` - 是否有权限（true/false）

### 断点 2：获取当前用户

**文件：** `src/auth/guards/roles.guard.ts`  
**位置：** 第 58 行

```typescript:54:62:src/auth/guards/roles.guard.ts
// 获取当前用户
const request: { user: AuthenticatedUser } = context
  .switchToHttp()
  .getRequest();
const user: AuthenticatedUser = request.user; // ← 断点打这里

if (!user) {
  throw new ForbiddenException('用户未认证');
}
```

**查看的变量：**
- `request.user` - 从 JWT Token 解析出的用户信息
- `user.id` - 用户ID
- `user.email` - 用户邮箱
- `user.role` - **用户角色（关键！）**

### 断点 3：装饰器解析

**文件：** `src/auth/guards/roles.guard.ts`  
**位置：** 第 31 行

```typescript:29:35:src/auth/guards/roles.guard.ts
async canActivate(context: ExecutionContext): Promise<boolean> {
  // 获取需要的角色
  const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>( // ← 断点打这里
    ROLES_KEY,
    [context.getHandler(), context.getClass()],
  );
```

**查看的变量：**
- `requiredRoles` - 装饰器要求的角色列表

## 🚀 完整调试流程

### 步骤 1：打断点

在 `src/auth/guards/roles.guard.ts` 中打以下断点：

1. **第 31 行** - 查看装饰器要求的角色
2. **第 58 行** - 查看当前用户信息
3. **第 66 行** - 查看角色匹配结果

### 步骤 2：启动调试模式

在 VS Code 中按 **`F5`**

或在终端运行：
```bash
npm run start:debug
```

然后在 VS Code 调试面板选择"附加到运行中的进程"

### 步骤 3：发送上传请求

```bash
curl -X POST "http://localhost:3000/media/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test.jpg"
```

### 步骤 4：代码暂停在断点

#### 在第 31 行断点（装饰器要求）

查看 **变量面板** 或 **调试控制台**：

```javascript
> requiredRoles
["TEACHER_LEADER", "TEACHER"]  // ← @RequireTeacherLeaderOrTeacher() 要求的角色
```

按 **F5** 继续

#### 在第 58 行断点（当前用户）

查看变量：

```javascript
> user
{
  id: 1,
  email: "999@test.com",
  role: "STUDENT"  // ← 这里！Token中的角色
}

> user.role
"STUDENT"  // ← 发现问题：角色是 STUDENT，不是 TEACHER
```

按 **F5** 继续

#### 在第 66 行断点（权限检查）

查看变量：

```javascript
> requiredRoles
["TEACHER_LEADER", "TEACHER"]

> user.role
"STUDENT"

> hasRequiredRole
false  // ← 权限检查失败

> requiredRoles.includes(user.role)
false  // ← STUDENT 不在允许的角色列表中
```

## 📊 调试结果分析

### 典型的调试输出

```
断点 1 (line 31):
  requiredRoles = ["TEACHER_LEADER", "TEACHER"]
  ✅ 装饰器配置正确

断点 2 (line 58):
  user.id = 1
  user.email = "999@test.com"
  user.role = "STUDENT"                    ← 问题在这里！
  ✅ 用户信息正确，但角色是 STUDENT

断点 3 (line 66):
  hasRequiredRole = false
  ❌ 角色不匹配，权限检查失败
  → 抛出异常：需要以下角色之一: TEACHER_LEADER, TEACHER
```

### 问题定位

**发现：** Token 中的 `user.role` 是 `"STUDENT"`

**原因：** 用户使用的是旧的 Token，登录时角色还是学生

**解决：** 重新登录获取新 Token

## 🔍 查看 Token 内容

### 在调试控制台中查看完整的 request

在断点暂停时，在调试控制台输入：

```javascript
// 查看完整的 request 对象
request.user

// 查看 Authorization 头
request.headers.authorization

// 查看 Token（去掉 Bearer 前缀）
request.headers.authorization.replace('Bearer ', '')
```

### 解码 Token

在断点暂停时执行：

```javascript
// 获取 Token
const token = request.headers.authorization.replace('Bearer ', '');

// 解码 Token（查看 payload）
const payload = JSON.parse(
  Buffer.from(token.split('.')[1], 'base64').toString()
);

console.log('Token payload:', payload);
console.log('Token中的角色:', payload.role);
```

## 🎨 调试面板使用

### 1. 变量面板

自动显示当前作用域的所有变量：

```
▼ Local
  ▼ user
    id: 1
    email: "999@test.com"
    role: "STUDENT"          ← 直接看到角色值
  ▼ requiredRoles
    0: "TEACHER_LEADER"
    1: "TEACHER"
  hasRequiredRole: false
```

### 2. 监视面板

添加表达式监视：

点击 **监视** 面板的 **+** 号，添加：

```javascript
user.role
requiredRoles
requiredRoles.includes(user.role)
user.email
```

这样每次暂停都能看到这些值。

### 3. 调用堆栈

查看函数调用链：

```
canActivate (roles.guard.ts:29)
  ↑
RolesGuard.canActivate
  ↑
uploadFile (media.controller.ts:181)
  ↑
...
```

### 4. 调试控制台

暂停时可以执行任意代码：

```javascript
// 查看变量
user.role

// 执行表达式
requiredRoles.includes("TEACHER")

// 修改变量（测试）
user.role = "TEACHER"

// 继续执行会按新值运行
```

## 💡 高级调试技巧

### 技巧 1：条件断点

只在特定条件下暂停：

1. 右键断点 → **编辑断点**
2. 选择"表达式"
3. 输入条件：
```javascript
user.email === '999@test.com'
```

现在只有当用户是 `999@test.com` 时才会暂停。

### 技巧 2：日志断点

不暂停执行，只输出日志：

1. 右键断点 → **编辑断点**
2. 勾选"记录消息"
3. 输入消息：
```
用户 {user.email} 的角色是 {user.role}，需要角色：{requiredRoles}
```

会在调试控制台输出，不会暂停。

### 技巧 3：监视 Token 角色

在监视面板添加：

```javascript
request.user.role
request.headers.authorization.substring(0, 50) + "..."
```

每次请求都能看到 Token 中的角色。

## 🧪 实战演示

### 场景：调试为什么 999@test.com 无法上传

#### 1. 打断点

在 `src/auth/guards/roles.guard.ts:66`

#### 2. 启动调试

按 `F5`

#### 3. 发送请求

```bash
curl -X POST "http://localhost:3000/media/upload" \
  -H "Authorization: Bearer eyJhbGc..." \
  -F "file=@test.jpg"
```

#### 4. 代码暂停，查看变量

```
变量面板显示：
  user:
    id: 1
    email: "999@test.com"
    role: "STUDENT"           ← 问题！Token中是STUDENT
  
  requiredRoles:
    [0]: "TEACHER_LEADER"
    [1]: "TEACHER"
  
  hasRequiredRole: false      ← 权限检查失败
```

#### 5. 在调试控制台验证

```javascript
> user.role
"STUDENT"

> requiredRoles
["TEACHER_LEADER", "TEACHER"]

> requiredRoles.includes("STUDENT")
false  // ← 学生不在允许列表中

> requiredRoles.includes("TEACHER")
true   // ← 如果是教师就会通过
```

#### 6. 结论

Token 中的角色是 `STUDENT`，而接口需要 `TEACHER` 或 `TEACHER_LEADER`。

**解决方案**：让用户重新登录获取包含新角色的 Token。

## 📝 完整的调试检查清单

打断点后，按顺序检查：

### ✅ 检查点 1：装饰器要求（第 31 行）

```javascript
requiredRoles = ?
```

应该是：`["TEACHER_LEADER", "TEACHER"]`

### ✅ 检查点 2：用户信息（第 58 行）

```javascript
user = ?
user.id = ?
user.email = ?
user.role = ?        // ← 重点！
```

### ✅ 检查点 3：权限匹配（第 66 行）

```javascript
hasRequiredRole = ?  // 应该是 true，如果是 false 就会失败
```

### ✅ 检查点 4：Token 内容

在调试控制台执行：

```javascript
const token = request.headers.authorization.replace('Bearer ', '');
const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
console.log('Token payload:', payload);
```

查看：
```javascript
{
  userId: 1,
  email: "999@test.com",
  role: "STUDENT"     // ← 这里是关键！
}
```

## 🎬 视频教程式步骤

### 第 1 步：准备调试环境

```bash
# 确保在项目根目录
cd d:\work\service\teaching-case-service

# 停止现有的服务（如果在运行）
# Ctrl + C

# 不要手动启动，让调试器启动
```

### 第 2 步：在 VS Code 中打断点

1. 打开文件：`src/auth/guards/roles.guard.ts`
2. 找到第 66 行：`const hasRequiredRole = requiredRoles.includes(user.role);`
3. 在行号左侧点击，出现红点 🔴

### 第 3 步：启动调试

按 **F5** 键

看到终端输出：
```
Debugger listening on ws://127.0.0.1:9229/...
应用运行在: http://localhost:3000
```

### 第 4 步：发送上传请求

打开新的终端（不要关闭调试终端），运行：

```bash
curl -X POST "http://localhost:3000/media/upload" \
  -H "Authorization: Bearer 你的TOKEN" \
  -F "file=@C:\path\to\test.jpg"
```

### 第 5 步：代码暂停在断点

VS Code 会自动切换到调试视图，代码停在第 66 行。

### 第 6 步：查看变量值

#### 方式 A：变量面板（左侧）

展开 **Local** 节点，查看：

```
▼ Local
  ▼ this
  ▼ context
  ▼ requiredRoles        ← 点击展开
    [0]: "TEACHER_LEADER"
    [1]: "TEACHER"
  ▼ user                 ← 点击展开
    id: 1
    email: "999@test.com"
    role: "STUDENT"      ← 这里！看到角色值
  hasRequiredRole: false ← 权限检查结果
```

#### 方式 B：鼠标悬停

将鼠标放在代码中的变量上，会显示值：

```typescript
const hasRequiredRole = requiredRoles.includes(user.role);
//                                              ^^^^^^^^
//                      鼠标放这里会显示 "STUDENT"
```

#### 方式 C：调试控制台

在底部的"调试控制台"输入：

```javascript
user.role           // 回车，显示 "STUDENT"
requiredRoles       // 回车，显示 ["TEACHER_LEADER", "TEACHER"]
user                // 回车，显示完整的 user 对象
```

## 📋 预期的调试结果

### 情况 1：Token 是旧的（角色未更新）

```javascript
断点处的变量值：

requiredRoles: ["TEACHER_LEADER", "TEACHER"]
user: {
  id: 1,
  email: "999@test.com",
  role: "STUDENT"        ← 问题：Token中角色是STUDENT
}
hasRequiredRole: false   ← 权限检查失败

结论：需要重新登录获取新Token
```

### 情况 2：Token 是新的（角色已更新）

```javascript
断点处的变量值：

requiredRoles: ["TEACHER_LEADER", "TEACHER"]
user: {
  id: 1,
  email: "999@test.com",
  role: "TEACHER"        ← 正确：Token中角色是TEACHER
}
hasRequiredRole: true    ← 权限检查通过

结论：应该上传成功
```

## 🎯 关键代码分析

### 装饰器如何工作

```typescript
// media.controller.ts 中
@RequireTeacherLeaderOrTeacher()  // ← 这个装饰器
@Post('upload')
async uploadFile(...) { ... }

// 展开后相当于
@Roles(UserRole.TEACHER_LEADER, UserRole.TEACHER)
@Post('upload')
async uploadFile(...) { ... }

// RolesGuard 会检查
requiredRoles = ["TEACHER_LEADER", "TEACHER"]  // 从装饰器获取
user.role = "STUDENT"                          // 从Token获取
hasRequiredRole = requiredRoles.includes(user.role)  // false
// 权限检查失败，抛出 403 错误
```

## 💡 调试控制台命令

在断点暂停时，可以在调试控制台执行：

### 查看完整的请求对象

```javascript
request
request.headers
request.headers.authorization
```

### 解码 Token

```javascript
const token = request.headers.authorization.replace('Bearer ', '');
const parts = token.split('.');
const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
payload
```

输出：
```javascript
{
  userId: 1,
  email: "999@test.com",
  role: "STUDENT",       ← Token中的角色
  iat: 1696751234,
  exp: 1696837634
}
```

### 测试角色匹配

```javascript
// 测试当前角色
requiredRoles.includes(user.role)        // false（STUDENT不匹配）

// 测试如果是教师
requiredRoles.includes("TEACHER")        // true（TEACHER匹配）

// 查看需要哪些角色
requiredRoles.join(', ')                 // "TEACHER_LEADER, TEACHER"
```

## 🔧 其他断点建议

### 调试 JWT 验证

**文件：** `src/auth/jwt.strategy.ts`  
**位置：** `validate` 方法

查看 JWT Token 解析后的 payload

### 调试登录过程

**文件：** `src/auth/auth.service.ts`  
**位置：** `login` 方法

查看登录时如何生成 Token

## ⚠️ 调试注意事项

### 1. 使用调试模式

确保使用：
```bash
npm run start:debug  # ✅ 正确
```

而不是：
```bash
npm run start:dev    # ❌ 断点不生效
```

### 2. 断点位置

- ✅ 在 `src` 目录的 `.ts` 文件打断点
- ❌ 不要在 `dist` 目录的 `.js` 文件打断点

### 3. 热重载限制

调试模式下，修改代码后：
- 会自动重新编译
- 断点位置可能移动
- 需要重新打断点

## 📸 调试截图参考

### 变量面板应该显示

```
▼ Local
  ▼ requiredRoles: Array(2)
    [0]: "TEACHER_LEADER"
    [1]: "TEACHER"
    length: 2
  ▼ user: Object
    id: 1
    email: "999@test.com"
    role: "STUDENT"       ← 重点关注
  hasRequiredRole: false  ← 重点关注
```

### 调试控制台输入输出

```
> user.role
< "STUDENT"

> requiredRoles
< ["TEACHER_LEADER", "TEACHER"]

> hasRequiredRole
< false

> user
< {id: 1, email: "999@test.com", role: "STUDENT"}
```

## 🎁 额外技巧

### 在断点处修改变量（测试）

在调试控制台中：

```javascript
// 临时修改角色测试（仅此次请求有效）
user.role = "TEACHER"

// 继续执行（F5），会按照 TEACHER 角色通过检查
```

这样可以快速测试如果角色是 TEACHER 会怎样。

## 📞 快速参考

### 快捷键

| 操作     | 快捷键     |
| -------- | ---------- |
| 启动调试 | `F5`       |
| 继续     | `F5`       |
| 单步跳过 | `F10`      |
| 单步进入 | `F11`      |
| 停止     | `Shift+F5` |

### 关键文件

- `src/auth/guards/roles.guard.ts` - 权限检查逻辑
- `src/auth/decorators/roles.decorator.ts` - 装饰器定义
- `src/media/media.controller.ts` - 使用装饰器的地方

### 关键变量

- `requiredRoles` - 需要的角色（从装饰器）
- `user.role` - 用户的角色（从Token）
- `hasRequiredRole` - 是否有权限

---

**现在按 F5 启动调试，发送请求，就能看到所有变量值了！** 🐛

**创建日期**：2025年10月8日
