# NestJS 调试指南

## ✅ 调试配置已完成

VS Code 调试配置文件已创建：`.vscode/launch.json`

## 🚀 如何使用调试

### 方法 1：使用 VS Code 调试器（推荐）⭐

#### 步骤 1：打断点

1. 在 VS Code 中打开你要调试的文件（如 `src/auth/guards/roles.guard.ts`）
2. 在代码行号左侧点击，出现红点即为断点
3. 可以打多个断点

#### 步骤 2：启动调试

有两种方式：

**方式 A：直接启动调试**
1. 按 `F5` 键
2. 或点击左侧"运行和调试"图标
3. 选择"调试 NestJS 应用"
4. 点击绿色播放按钮

**方式 B：附加到运行中的进程**
1. 先在终端运行：`npm run start:debug`
2. 按 `F5` 或点击调试按钮
3. 选择"附加到运行中的进程"

#### 步骤 3：触发断点

1. 发送 API 请求（Postman / Swagger / curl）
2. 当代码执行到断点时会自动暂停
3. 在 VS Code 中查看变量值

#### 步骤 4：调试操作

- **继续（F5）**：继续执行到下一个断点
- **单步跳过（F10）**：执行当前行，不进入函数内部
- **单步进入（F11）**：进入函数内部
- **单步跳出（Shift+F11）**：跳出当前函数
- **重启（Ctrl+Shift+F5）**：重启调试
- **停止（Shift+F5）**：停止调试

### 方法 2：使用终端调试

#### 启动调试模式

```bash
npm run start:debug
```

输出会显示：
```
Debugger listening on ws://127.0.0.1:9229/...
```

#### 在 Chrome 中调试

1. 打开 Chrome 浏览器
2. 访问：`chrome://inspect`
3. 点击"inspect"连接到 Node.js 进程
4. 在 Sources 标签打断点

## 🔍 断点不生效的常见原因

### 原因 1：没有使用调试模式启动

❌ **错误：**
```bash
npm run start        # 普通模式，断点不生效
npm run start:dev    # 热重载模式，断点不生效
```

✅ **正确：**
```bash
npm run start:debug  # 调试模式，断点生效
```

或在 VS Code 中按 **F5** 启动调试。

### 原因 2：断点打在错误的文件

❌ **错误：在 `dist` 目录打断点**
```
dist/auth/guards/roles.guard.js  ← 编译后的文件
```

✅ **正确：在 `src` 目录打断点**
```
src/auth/guards/roles.guard.ts   ← 源代码文件
```

### 原因 3：Source Map 未生成

检查 `tsconfig.json`：

```json
{
  "compilerOptions": {
    "sourceMap": true  // ← 必须为 true
  }
}
```

✅ 你的配置已经正确！

### 原因 4：代码未重新编译

如果修改了代码，需要重新构建：

```bash
npm run build
```

或使用 `--watch` 模式自动重新编译：

```bash
npm run start:debug  # 带 --watch，会自动重新编译
```

### 原因 5：断点条件错误

如果设置了条件断点，检查条件是否正确。

右键断点 → 编辑断点 → 检查表达式

## 📋 完整调试流程

### 调试权限检查

假设要调试 `src/auth/guards/roles.guard.ts` 的权限检查：

#### 步骤 1：打断点

在 `roles.guard.ts` 的第 66 行打断点：

```typescript:src/auth/guards/roles.guard.ts
// 检查角色权限
if (requiredRoles && requiredRoles.length > 0) {
  const hasRequiredRole = requiredRoles.includes(user.role); // ← 在这行打断点
  if (!hasRequiredRole) {
    throw new ForbiddenException(
      `需要以下角色之一: ${requiredRoles.join(', ')}`,
    );
  }
}
```

#### 步骤 2：启动调试

按 `F5` 或在调试面板选择"调试 NestJS 应用"

#### 步骤 3：发送请求

```bash
curl -X POST "http://localhost:3000/media/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.jpg"
```

#### 步骤 4：查看变量

当代码暂停在断点时，可以查看：
- `requiredRoles`：需要的角色列表
- `user.role`：当前用户的角色
- `hasRequiredRole`：是否有权限

#### 步骤 5：分析问题

在"调试控制台"或"变量"面板查看：
```
requiredRoles: ["TEACHER_LEADER", "TEACHER"]
user.role: "STUDENT"                          ← 这里就能看到角色不匹配
hasRequiredRole: false
```

## 🎯 快速测试调试配置

### 测试 1：简单断点

1. 在 `src/main.ts` 的第 8 行打断点
2. 按 `F5` 启动调试
3. 应该会在启动时暂停
4. 按 `F5` 继续

### 测试 2：API 请求断点

1. 在 `src/media/media.controller.ts` 的 `uploadFile` 方法打断点
2. 按 `F5` 启动调试
3. 发送上传请求
4. 应该会暂停在断点处

## 🔧 VS Code 调试配置说明

### 配置 1：调试 NestJS 应用

```json
{
  "type": "node",
  "request": "launch",
  "name": "调试 NestJS 应用",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "start:debug"],  // 运行 npm run start:debug
  "console": "integratedTerminal",
  "restart": true,                         // 代码改变时自动重启
  "sourceMaps": true,                      // 使用 source map
  "outFiles": ["${workspaceFolder}/dist/**/*.js"]  // 编译输出目录
}
```

### 配置 2：附加到运行中的进程

如果已经运行了 `npm run start:debug`，可以使用此配置附加：

```json
{
  "type": "node",
  "request": "attach",
  "name": "附加到运行中的进程",
  "port": 9229,        // 调试端口
  "restart": true
}
```

## 📊 调试端口

NestJS 默认使用端口 `9229` 进行调试：

```bash
npm run start:debug
# 输出：Debugger listening on ws://127.0.0.1:9229/...
```

## ⚠️ 注意事项

### 1. 端口冲突

如果 9229 端口被占用，修改 `package.json`：

```json
"start:debug": "nest start --debug=9230 --watch"
```

同时修改 `.vscode/launch.json` 中的 port。

### 2. 性能影响

调试模式会略微降低性能，生产环境不要使用。

### 3. 断点位置

- ✅ 在实际执行的代码行打断点
- ❌ 不要在类型定义、接口、注释行打断点
- ❌ 不要在空行打断点

### 4. Watch 模式

使用 `start:debug` 时，代码修改会自动重新编译和重启。

## 🎨 VS Code 调试面板

调试时可以使用的面板：

1. **变量**：查看当前作用域的所有变量
2. **监视**：添加表达式监视特定值
3. **调用堆栈**：查看函数调用链
4. **断点**：管理所有断点
5. **调试控制台**：执行表达式和命令

## 💡 调试技巧

### 技巧 1：条件断点

右键断点 → 编辑断点 → 添加条件：

```javascript
user.email === '999@test.com'
```

只有当条件满足时才会暂停。

### 技巧 2：日志断点

右键断点 → 编辑断点 → 勾选"记录消息"

```
用户角色: {user.role}
```

不会暂停执行，只输出日志。

### 技巧 3：调试控制台

在断点暂停时，可以在调试控制台执行代码：

```javascript
> user.role
"STUDENT"

> requiredRoles
["TEACHER_LEADER", "TEACHER"]

> requiredRoles.includes(user.role)
false
```

## 🧪 实战示例

### 调试上传权限问题

#### 目标

找出为什么 `999@test.com` 无法上传媒体

#### 步骤

1. **打断点**
   - 文件：`src/auth/guards/roles.guard.ts`
   - 位置：第 66 行（角色检查）

2. **启动调试**
   ```bash
   按 F5
   ```

3. **发送上传请求**
   ```bash
   curl -X POST "http://localhost:3000/media/upload" \
     -H "Authorization: Bearer TOKEN" \
     -F "file=@test.jpg"
   ```

4. **代码暂停在断点**
   - 查看 `user.role` 的值
   - 查看 `requiredRoles` 的值
   - 对比是否匹配

5. **发现问题**
   ```
   user.role = "STUDENT"
   requiredRoles = ["TEACHER_LEADER", "TEACHER"]
   → 不匹配！
   ```

6. **解决方案**
   - 用户重新登录获取新 Token
   - 新 Token 中 `user.role` 会是 "TEACHER"

## 🎁 额外工具

### VS Code 插件推荐

1. **JavaScript Debugger** - VS Code 内置，无需安装
2. **Error Lens** - 实时显示错误
3. **REST Client** - 在 VS Code 中发送 HTTP 请求

### Chrome DevTools

如果你熟悉 Chrome 调试：

```bash
npm run start:debug

# 然后在 Chrome 访问
chrome://inspect
```

## 📞 快速帮助

### 问题：按 F5 没反应

**检查：**
1. 是否在项目根目录
2. 是否安装了 Node.js
3. VS Code 是否识别为 Node.js 项目

### 问题：断点显示灰色

**原因：**
- Source map 未生成
- 文件路径不匹配

**解决：**
```bash
npm run build  # 重新构建
```

### 问题：断点跳过不停

**原因：**
- 该代码未执行
- 断点在错误的分支

**解决：**
- 检查代码逻辑
- 在函数入口打断点

---

**现在按 F5 就可以开始调试了！** 🐛

## 📋 快速命令

```bash
# 启动调试模式
npm run start:debug

# 或在 VS Code 中
按 F5

# 停止调试
Shift + F5
```

**创建日期**：2025年10月8日
