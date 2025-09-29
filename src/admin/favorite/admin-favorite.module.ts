import { Module } from '@nestjs/common';
import { AdminFavoriteController } from './admin-favorite.controller';
import { AdminFavoriteService } from './admin-favorite.service';
import { FavoriteModule } from '../../favorite/favorite.module';

@Module({
  imports: [FavoriteModule],
  controllers: [AdminFavoriteController],
  providers: [AdminFavoriteService],
})
export class AdminFavoriteModule {}
