import { Module } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { RolesModule } from '../roles/roles.module';
import { AdminArticlesService } from '../admin/articles/admin-articles.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [RolesModule, PrismaModule],
  controllers: [ArticlesController],
  providers: [ArticlesService, AdminArticlesService],
  exports: [ArticlesService],
})
export class ArticlesModule {}
