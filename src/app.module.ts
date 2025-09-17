import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ArticlesModule } from './articles/articles.module';
import { MediaModule } from './media/media.module';
import { CommentModule } from './comment/comment.module';
import { FavoriteModule } from './favorite/favorite.module';
import { NoteModule } from './note/note.module';

@Module({
  imports: [
    PrismaModule, // 在这里导入！
    ArticlesModule,
    UsersModule,
    MediaModule,
    CommentModule,
    FavoriteModule,
    NoteModule,
    // ... 其他模块
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
