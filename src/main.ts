import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 配置静态文件服务
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // 配置 Swagger
  const config = new DocumentBuilder()
    .setTitle('Teaching Case Service API')
    .setDescription(
      `
# 教学案例服务 API 文档

## 认证说明

本API使用JWT Bearer Token进行身份认证。要访问需要登录的接口，请按以下步骤操作：

### 1. 获取访问令牌

首先调用登录接口获取JWT token：

\`\`\`
POST /auth/login
{
  "email": "admin@example.com",
  "password": "admin123"
}
\`\`\`

### 2. 配置认证

在Swagger UI中：

1. 点击右上角的 **"Authorize"** 按钮
2. 在弹出的对话框中输入：\`Bearer <your-jwt-token>\`
3. 点击 **"Authorize"** 确认
4. 现在可以访问所有需要认证的接口了

### 3. 权限说明

- 不同角色拥有不同的权限
- 系统预设角色：超级管理员、管理员、教师、助教、学生
- 管理员可以创建自定义角色并分配权限
- 权限格式：\`模块:操作\`，如 \`user:create\`、\`article:read\`

## 角色权限系统

本系统采用基于角色的访问控制（RBAC）：

- **角色管理**：创建、修改、删除角色
- **权限管理**：定义细粒度的操作权限
- **用户管理**：为用户分配角色
- **动态权限**：角色权限变更会自动同步到用户
    `,
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: '输入JWT token，格式：Bearer <token>',
        in: 'header',
      },
      'JWT-auth', // 这是认证方案的名称
    )
    .addTag('认证管理', '用户登录、注册、JWT token管理')
    .addTag('用户管理', '用户的创建、查询、更新、删除')
    .addTag('角色权限管理', '角色和权限的CRUD操作、权限分配')
    .addTag('文章管理', '文章的创建、查询、更新、删除')
    .addTag('分类管理', '文章分类的管理')
    .addTag('评论管理', '评论的创建、查询、更新、删除')
    .addTag('收藏管理', '收藏的创建、查询、删除')
    .addTag('笔记管理', '笔记的创建、查询、更新、删除')
    .addTag('媒体管理', '文件上传、下载、删除')
    .addTag('筛选条件管理', '筛选条件的管理')
    .addTag('热搜词条管理', '热搜关键词的管理')
    .addTag('应用', '系统基础信息和状态')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // 保持认证状态
      // tagsSorter: 'alpha', // 移除字母排序，使用定义的顺序
      operationsSorter: 'alpha', // 操作按字母排序
    },
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`应用运行在: http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`Swagger 文档: http://localhost:${process.env.PORT ?? 3000}/api`);
  console.log(
    `文件访问地址: http://localhost:${process.env.PORT ?? 3000}/uploads/`,
  );
}
bootstrap().catch(console.error);
