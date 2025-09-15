import { Module } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';

/**
 * @Module() 装饰器将一个普通的类标记为 NestJS 模块。
 * 这个元数据对象告诉 NestJS 如何组织这个模块。
 */
@Module({
  // controllers 数组列出了所有属于这个模块的控制器。
  // ArticlesController 将会处理所有与文章相关的 HTTP 请求。
  controllers: [ArticlesController],

  // providers 数组列出了所有这个模块需要实例化的服务。
  // ArticlesService 在这里被注册，然后就可以被注入到 ArticlesController 中。
  providers: [ArticlesService],

  // 如果 ArticlesService 需要被其他模块使用（例如在评论模块中），
  // 则需要在这里导出： exports: [ArticlesService]
})
export class ArticlesModule {}
