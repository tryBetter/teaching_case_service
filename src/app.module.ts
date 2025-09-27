import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ArticlesModule } from './articles/articles.module';
import { MediaModule } from './media/media.module';
import { CommentModule } from './comment/comment.module';
import { FavoriteModule } from './favorite/favorite.module';
import { NoteModule } from './note/note.module';
import { CategoriesModule } from './categories/categories.module';
import { FilterConditionsModule } from './filter-conditions/filter-conditions.module';
import { HotSearchModule } from './hot-search/hot-search.module';
import { RolesModule } from './roles/roles.module';
import { StatsModule } from './stats/stats.module';
import { JwtAuthGuard } from './auth/auth.guard';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    RolesModule,
    ArticlesModule,
    UsersModule,
    MediaModule,
    CommentModule,
    FavoriteModule,
    NoteModule,
    CategoriesModule,
    FilterConditionsModule,
    HotSearchModule,
    StatsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
