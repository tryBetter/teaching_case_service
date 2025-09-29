import { Module } from '@nestjs/common';
import { AdminArticlesController } from './admin-articles.controller';
import { AdminArticlesService } from './admin-articles.service';
import { ArticlesModule } from '../../articles/articles.module';

@Module({
  imports: [ArticlesModule],
  controllers: [AdminArticlesController],
  providers: [AdminArticlesService],
})
export class AdminArticlesModule {}
