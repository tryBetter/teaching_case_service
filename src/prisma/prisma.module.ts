// src/prisma/prisma.module.ts
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';
@Global() // 将模块设为全局，这样其他模块就无需导入 PrismaModule 也能注入 PrismaService
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // 导出服务，使其可在其他模块中使用
})
export class PrismaModule {}
