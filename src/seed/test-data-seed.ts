import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { TestDataSeedService } from './test-data.seed';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedModule);
  const testDataSeedService = app.get(TestDataSeedService);

  try {
    await testDataSeedService.generateTestData();
    console.log('测试数据生成完成！');
  } catch (error) {
    console.error('测试数据生成失败：', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

void bootstrap();
