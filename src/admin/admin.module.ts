import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminAuthModule } from './auth/admin-auth.module';
import { AdminUsersModule } from './users/admin-users.module';
import { AdminArticlesModule } from './articles/admin-articles.module';
import { AdminCategoriesModule } from './categories/admin-categories.module';
import { AdminMediaModule } from './media/admin-media.module';
import { AdminCommentModule } from './comment/admin-comment.module';
import { AdminFavoriteModule } from './favorite/admin-favorite.module';
import { AdminNoteModule } from './note/admin-note.module';
import { AdminFilterConditionsModule } from './filter-conditions/admin-filter-conditions.module';
import { AdminHotSearchModule } from './hot-search/admin-hot-search.module';
import { AdminRolesModule } from './roles/admin-roles.module';
import { AdminStatsModule } from './stats/admin-stats.module';

@Module({
  imports: [
    AdminAuthModule,
    AdminUsersModule,
    AdminArticlesModule,
    AdminCategoriesModule,
    AdminMediaModule,
    AdminCommentModule,
    AdminFavoriteModule,
    AdminNoteModule,
    AdminFilterConditionsModule,
    AdminHotSearchModule,
    AdminRolesModule,
    AdminStatsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
