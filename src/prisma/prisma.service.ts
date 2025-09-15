import {
  Injectable,
  OnModuleInit,
  OnApplicationShutdown,
} from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

/**
 * @Injectable() 标记使这个类可以被 NestJS 的依赖注入容器管理。
 * * 我们继承了 PrismaClient，这样我们的服务就拥有了所有 Prisma 的数据操作方法。
 * * 我们实现了 OnModuleInit 和 OnApplicationShutdown 接口，
 * 这是 NestJS 提供的生命周期钩子，用于确保在应用启动时连接数据库，
 * 并在应用关闭时安全地断开连接。
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnApplicationShutdown
{
  constructor() {
    // 调用父类 PrismaClient 的构造函数
    super({
      log: ['query', 'info', 'warn', 'error'], // (可选) 配置日志，方便调试
    });
  }

  // 当模块初始化时，连接数据库
  async onModuleInit() {
    await this.$connect();
  }

  // 当应用关闭时，断开数据库连接
  async onApplicationShutdown() {
    await this.$disconnect();
  }
}
