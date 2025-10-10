# Guards 和装饰器的关系详解

## 🤔 问题

`@UseGuards(RolesGuard, SuperAdminGuard)` 和 `@RequireSuperAdmin()` 这两个装饰器有什么关系？

---

## ✅ 简单回答

**有关联！它们是配合使用的：**
- `@RequireSuperAdmin()` - **设置元数据**（声明"这个方法需要超级管理员权限"）
- `@UseGuards(SuperAdminGuard)` - **注册 Guard**（实际执行权限检查）
- `SuperAdminGuard` - **读取元数据并执行逻辑**

---

## 📚 详细解释

### 1. `@RequireSuperAdmin()` 装饰器

**文件**: `src/admin/decorators/super-admin.decorator.ts`

```typescript
export const SUPER_ADMIN_KEY = 'super_admin';

export const RequireSuperAdmin = () => SetMetadata(SUPER_ADMIN_KEY, true);
```

**作用**:
- 仅仅是 `SetMetadata` 的封装
- 在方法上设置元数据：`{ 'super_admin': true }`
- **不执行任何逻辑**，只是"打标记"

**类比**: 就像在函数上贴一个便签纸，写着"这个需要超级管理员权限"

---

### 2. `SuperAdminGuard` 守卫

**文件**: `src/admin/guards/super-admin.guard.ts`

```typescript
export class SuperAdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 步骤1: 读取元数据（检查是否有 @RequireSuperAdmin() 标记）
    const requireSuperAdmin = this.reflector.getAllAndOverride<boolean>(
      SUPER_ADMIN_KEY,  // 👈 读取 @RequireSuperAdmin() 设置的元数据
      [context.getHandler(), context.getClass()],
    );

    // 步骤2: 如果没有标记，直接放行
    if (!requireSuperAdmin) {
      return true;  // 不需要超级管理员权限
    }

    // 步骤3: 如果有标记，检查用户角色
    const user = context.switchToHttp().getRequest().user;
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('权限不足');
    }

    return true;
  }
}
```

**作用**:
- **读取** `@RequireSuperAdmin()` 设置的元数据
- **执行** 权限检查逻辑
- 决定是否允许访问

---

### 3. `@UseGuards()` 装饰器

**NestJS 内置装饰器**

```typescript
@UseGuards(RolesGuard, SuperAdminGuard)  // 注册这些 Guards
```

**作用**:
- 告诉 NestJS：在执行这个控制器/方法之前，先运行这些 Guards
- Guards 按注册顺序依次执行：RolesGuard → SuperAdminGuard

---

## 🔄 完整执行流程

### 示例代码
```typescript
@Controller('users')
@UseGuards(RolesGuard, SuperAdminGuard)  // 👈 1. 注册 Guards
export class UsersController {
  
  @RequireSuperAdmin()  // 👈 2. 设置元数据
  @Get('roles')
  async findRoles() {
    return this.prisma.role.findMany();
  }
}
```

### 执行顺序

#### 当请求 `GET /users/roles` 时：

**步骤1**: NestJS 看到 `@UseGuards(RolesGuard, SuperAdminGuard)`
- 准备执行这两个 Guards

**步骤2**: 执行 `RolesGuard.canActivate()`
- 检查是否有 `@Roles()` 装饰器（本例中没有）
- 检查是否有 `@RequirePermissions()` 装饰器（本例中没有）
- 没有要求，返回 `true`（放行）

**步骤3**: 执行 `SuperAdminGuard.canActivate()`
- 使用 `Reflector` 读取元数据：
  ```typescript
  const requireSuperAdmin = this.reflector.getAllAndOverride(
    SUPER_ADMIN_KEY,  // 'super_admin'
    [context.getHandler(), context.getClass()]
  );
  // 结果: requireSuperAdmin = true (因为有 @RequireSuperAdmin())
  ```
- 检查用户角色是否为 `ADMIN`
- 如果是，返回 `true`；否则抛出 `ForbiddenException(403)`

**步骤4**: 所有 Guards 通过后，执行 `findRoles()` 方法

---

## 🔑 关键点

### 为什么需要两个装饰器？

#### ❌ 只用 `@RequireSuperAdmin()`（不行）
```typescript
@Controller('users')
export class UsersController {
  @RequireSuperAdmin()  // ❌ 只设置了元数据，但没有 Guard 来读取和执行
  @Get('roles')
  findRoles() {}
}
```
**结果**: 元数据设置了，但没有人读取，权限检查不会执行

#### ❌ 只用 `@UseGuards(SuperAdminGuard)`（不完整）
```typescript
@Controller('users')
@UseGuards(SuperAdminGuard)
export class UsersController {
  // ❌ 没有 @RequireSuperAdmin()，Guard 读取不到元数据
  @Get('roles')
  findRoles() {}
}
```
**结果**: Guard 执行了，但读取到的 `requireSuperAdmin = undefined`，会直接放行（第23-25行）

#### ✅ 两者配合使用（正确）
```typescript
@Controller('users')
@UseGuards(RolesGuard, SuperAdminGuard)  // ✅ 注册 Guard
export class UsersController {
  @RequireSuperAdmin()  // ✅ 设置元数据
  @Get('roles')
  findRoles() {}
}
```
**结果**: Guard 执行 + 读取到元数据 + 执行权限检查 ✅

---

## 📊 类比说明

### 装饰器 = 便签纸
- `@RequireSuperAdmin()` = 在方法上贴便签："需要超级管理员"
- `@Roles(UserRole.TEACHER)` = 在方法上贴便签："需要教师角色"

### Guards = 门卫
- `SuperAdminGuard` = 门卫读取便签，检查是否写着"需要超级管理员"
- 如果有这个便签，门卫就检查你的身份证
- 如果没有这个便签，门卫直接放行

### @UseGuards = 雇佣门卫
- `@UseGuards(SuperAdminGuard)` = 在这个入口雇佣这个门卫

---

## 🏗️ 为什么这样设计？

### 优点1：灵活性
同一个 Guard 可以用于多个场景：

```typescript
@UseGuards(SuperAdminGuard)  // 注册一次
export class UsersController {
  
  @RequireSuperAdmin()  // 这个需要检查
  @Get('roles')
  findRoles() {}
  
  // 这个不需要检查（Guard 会自动放行）
  @Get()
  findAll() {}
}
```

### 优点2：可组合性
可以组合多个 Guards 和装饰器：

```typescript
@UseGuards(RolesGuard, SuperAdminGuard)
export class UsersController {
  
  @RequirePermissions([Permission.USER_CREATE])  // RolesGuard 读取
  @Post()
  create() {}
  
  @RequireSuperAdmin()  // SuperAdminGuard 读取
  @Get('stats')
  getStats() {}
}
```

### 优点3：关注点分离
- **装饰器**：声明"需要什么"（What）
- **Guard**：实现"如何检查"（How）

---

## 💡 实战示例

### 我们项目中的使用

```typescript
@Controller('users')
@UseGuards(RolesGuard, SuperAdminGuard)  // 类级别注册 Guards
export class UsersController {
  
  // 普通用户接口 - 两个 Guards 都会执行，但都会放行
  @RequirePermissions([Permission.USER_READ])
  @Get()
  findAll() {}
  
  // 管理员接口 - SuperAdminGuard 读取元数据并检查权限
  @RequireSuperAdmin()
  @Get('roles')
  findRoles() {}
}
```

### 执行流程对比

#### 访问 `GET /users` (普通接口)
1. `RolesGuard` 执行：检查到 `@RequirePermissions`，验证权限 ✅
2. `SuperAdminGuard` 执行：没有 `@RequireSuperAdmin`，直接返回 `true` ✅
3. 执行 `findAll()` 方法 ✅

#### 访问 `GET /users/roles` (管理员接口)
1. `RolesGuard` 执行：没有 `@RequirePermissions`，直接返回 `true` ✅
2. `SuperAdminGuard` 执行：检查到 `@RequireSuperAdmin`，验证是否为超级管理员 ✅
3. 执行 `findRoles()` 方法 ✅

---

## 🎯 总结

### 关系图

```
@UseGuards(SuperAdminGuard)  ←─────┐
                                   │
@RequireSuperAdmin()          ─────┤ 配合使用
    ↓                              │
SetMetadata('super_admin', true)   │
    ↓                              │
SuperAdminGuard 读取元数据 ←───────┘
    ↓
执行权限检查
```

### 关键要点

1. **必须配合使用**
   - `@UseGuards(SuperAdminGuard)` - 注册守卫
   - `@RequireSuperAdmin()` - 设置标记

2. **两者缺一不可**
   - 没有 Guard，元数据不会被读取
   - 没有装饰器，Guard 不知道要检查什么

3. **可以类级别注册，方法级别使用**
   ```typescript
   @UseGuards(SuperAdminGuard)  // 类级别注册一次
   export class Controller {
     @RequireSuperAdmin()  // 方法级别标记
     method1() {}
     
     @RequireSuperAdmin()  // 方法级别标记
     method2() {}
     
     // 不标记，Guard 会自动放行
     method3() {}
   }
   ```

---

**答案**: **是的，它们有紧密的关联！** 

- `@UseGuards(SuperAdminGuard)` 负责**注册**守卫
- `@RequireSuperAdmin()` 负责**标记**需要检查的方法
- `SuperAdminGuard` **读取标记并执行检查**

三者配合完成权限控制！🎯

