import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { SeedService } from './seed.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedModule);
  const seedService = app.get(SeedService);

  try {
    await seedService.seedDefaultData();
    console.log('数据初始化完成！');
  } catch (error) {
    console.error('数据初始化失败：', error);
  } finally {
    await app.close();
  }
}

bootstrap();
