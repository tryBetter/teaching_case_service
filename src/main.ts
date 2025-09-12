import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 配置 Swagger
  const config = new DocumentBuilder()
    .setTitle('Teaching Case Service API')
    .setDescription('教学案例服务 API 文档')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`应用运行在: http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`Swagger 文档: http://localhost:${process.env.PORT ?? 3000}/api`);
}
bootstrap().catch(console.error);
