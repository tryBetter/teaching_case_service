# 超级管理员账号实现指南

## 概述

超级管理员账号是系统的最高权限用户，拥有所有权限，可以管理整个系统。本文档介绍如何实现和配置超级管理员账号。

## 实现方案

### 1. 环境变量配置方案（推荐）

#### 1.1 环境变量配置

在 `.env` 文件中添加超级管理员配置：

```env
# 超级管理员配置
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=SuperAdmin123!
SUPER_ADMIN_NAME=系统超级管理员

# 是否自动创建超级管理员
AUTO_CREATE_SUPER_ADMIN=true
```

#### 1.2 种子数据服务更新

更新 `src/seed/seed.service.ts`：

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { seedRolePermissions } from './role-permission.seed';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
  constructor(private prisma: PrismaService) {}

  async seedDefaultData() {
    // 首先初始化角色权限
    await seedRolePermissions(this.prisma);

    // 创建超级管理员账号
    await this.createSuperAdmin();

    // ... 其他初始化逻辑
  }

  private async createSuperAdmin() {
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@example.com';
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';
    const superAdminName = process.env.SUPER_ADMIN_NAME || '系统超级管理员';
    const autoCreate = process.env.AUTO_CREATE_SUPER_ADMIN === 'true';

    if (!autoCreate) {
      console.log('跳过超级管理员账号创建');
      return;
    }

    // 检查超级管理员是否已存在
    const existingAdmin = await this.prisma.user.findUnique({
      where: { email: superAdminEmail },
    });

    if (existingAdmin) {
      console.log(`超级管理员账号已存在: ${superAdminEmail}`);
      return;
    }

    // 获取超级管理员角色
    const superAdminRole = await this.prisma.role.findFirst({
      where: { name: '超级管理员' },
    });

    if (!superAdminRole) {
      throw new Error('超级管理员角色不存在，请先初始化角色权限');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(superAdminPassword, 12);

    // 创建超级管理员用户
    const superAdmin = await this.prisma.user.create({
      data: {
        email: superAdminEmail,
        name: superAdminName,
        password: hashedPassword,
        roleId: superAdminRole.id,
      },
      include: {
        role: true,
      },
    });

    console.log(`超级管理员账号创建成功: ${superAdminEmail}`);
    console.log(`角色: ${superAdmin.role.name}`);
  }
}
```

### 2. 命令行工具方案

#### 2.1 创建超级管理员命令

创建 `src/scripts/create-super-admin.ts`：

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as readline from 'readline';

async function createSuperAdmin() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    // 获取用户输入
    const email = await question(rl, '请输入超级管理员邮箱: ');
    const name = await question(rl, '请输入超级管理员姓名: ');
    const password = await question(rl, '请输入超级管理员密码: ');

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('该邮箱已存在！');
      return;
    }

    // 获取超级管理员角色
    const superAdminRole = await prisma.role.findFirst({
      where: { name: '超级管理员' },
    });

    if (!superAdminRole) {
      console.log('超级管理员角色不存在，请先初始化角色权限！');
      return;
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);

    // 创建超级管理员
    const superAdmin = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        roleId: superAdminRole.id,
      },
      include: {
        role: true,
      },
    });

    console.log('超级管理员创建成功！');
    console.log(`邮箱: ${superAdmin.email}`);
    console.log(`姓名: ${superAdmin.name}`);
    console.log(`角色: ${superAdmin.role.name}`);

  } catch (error) {
    console.error('创建超级管理员失败:', error);
  } finally {
    rl.close();
    await app.close();
  }
}

function question(rl: readline.Interface, query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

createSuperAdmin();
```

#### 2.2 添加 npm 脚本

在 `package.json` 中添加：

```json
{
  "scripts": {
    "create-super-admin": "ts-node src/scripts/create-super-admin.ts"
  }
}
```

### 3. API 接口方案

#### 3.1 创建超级管理员接口

在 `src/roles/roles.controller.ts` 中添加：

```typescript
@ApiOperation({
  summary: '创建超级管理员',
  description: '系统初始化时创建超级管理员账号。此接口只能在系统首次部署时使用，且只能调用一次。',
})
@ApiResponse({
  status: 201,
  description: '超级管理员创建成功',
})
@ApiResponse({
  status: 409,
  description: '超级管理员已存在',
})
@Post('create-super-admin')
async createSuperAdmin(@Body() createSuperAdminDto: CreateSuperAdminDto) {
  return this.rolesService.createSuperAdmin(createSuperAdminDto);
}
```

#### 3.2 创建 DTO

创建 `src/roles/dto/create-super-admin.dto.ts`：

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, MinLength } from 'class-validator';

export class CreateSuperAdminDto {
  @ApiProperty({ 
    description: '超级管理员邮箱', 
    example: 'admin@example.com' 
  })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @ApiProperty({ 
    description: '超级管理员姓名', 
    example: '系统超级管理员' 
  })
  @IsString({ message: '姓名必须是字符串' })
  name: string;

  @ApiProperty({ 
    description: '超级管理员密码', 
    example: 'SuperAdmin123!',
    minLength: 8
  })
  @IsString({ message: '密码必须是字符串' })
  @MinLength(8, { message: '密码长度至少8位' })
  password: string;
}
```

#### 3.3 服务层实现

在 `src/roles/roles.service.ts` 中添加：

```typescript
async createSuperAdmin(createSuperAdminDto: CreateSuperAdminDto) {
  // 检查是否已有超级管理员
  const existingSuperAdmin = await this.prisma.user.findFirst({
    where: {
      role: {
        name: '超级管理员',
      },
    },
  });

  if (existingSuperAdmin) {
    throw new ConflictException('超级管理员已存在');
  }

  // 检查邮箱是否已存在
  const existingUser = await this.prisma.user.findUnique({
    where: { email: createSuperAdminDto.email },
  });

  if (existingUser) {
    throw new ConflictException('该邮箱已存在');
  }

  // 获取超级管理员角色
  const superAdminRole = await this.prisma.role.findFirst({
    where: { name: '超级管理员' },
  });

  if (!superAdminRole) {
    throw new NotFoundException('超级管理员角色不存在');
  }

  // 加密密码
  const hashedPassword = await bcrypt.hash(createSuperAdminDto.password, 12);

  // 创建超级管理员
  const superAdmin = await this.prisma.user.create({
    data: {
      email: createSuperAdminDto.email,
      name: createSuperAdminDto.name,
      password: hashedPassword,
      roleId: superAdminRole.id,
    },
    include: {
      role: true,
    },
  });

  return {
    message: '超级管理员创建成功',
    user: {
      id: superAdmin.id,
      email: superAdmin.email,
      name: superAdmin.name,
      role: superAdmin.role.name,
    },
  };
}
```

## 安全考虑

### 1. 密码安全

- 使用强密码策略（至少8位，包含大小写字母、数字、特殊字符）
- 使用 bcrypt 加密，salt rounds 设置为 12
- 定期更换超级管理员密码

### 2. 账号保护

- 超级管理员账号不可删除
- 超级管理员角色不可修改
- 限制超级管理员账号的创建次数

### 3. 访问控制

- 超级管理员操作需要额外的安全验证
- 记录超级管理员的所有操作日志
- 限制超级管理员账号的并发登录

## 部署说明

### 1. 环境变量配置

```env
# 生产环境配置
SUPER_ADMIN_EMAIL=admin@yourdomain.com
SUPER_ADMIN_PASSWORD=YourStrongPassword123!
SUPER_ADMIN_NAME=系统超级管理员
AUTO_CREATE_SUPER_ADMIN=true
```

### 2. 初始化步骤

1. 运行数据库迁移
2. 初始化角色权限：`POST /roles/init`
3. 创建超级管理员（选择以下方式之一）：
   - 自动创建：设置 `AUTO_CREATE_SUPER_ADMIN=true`
   - 命令行创建：`npm run create-super-admin`
   - API 创建：`POST /roles/create-super-admin`

### 3. 验证

登录验证超级管理员账号：

```bash
POST /auth/login
{
  "email": "admin@example.com",
  "password": "SuperAdmin123!"
}
```

## 最佳实践

1. **首次部署**：使用环境变量自动创建
2. **生产环境**：使用强密码，定期更换
3. **备份恢复**：确保超级管理员账号信息安全备份
4. **监控告警**：监控超级管理员账号的异常操作

## 故障排除

### 1. 超级管理员账号丢失

```bash
# 使用命令行工具重新创建
npm run create-super-admin
```

### 2. 密码忘记

```bash
# 重置密码（需要数据库直接操作）
UPDATE users SET password = '$2b$12$...' WHERE email = 'admin@example.com';
```

### 3. 角色权限问题

```bash
# 重新初始化角色权限
POST /roles/init
```
