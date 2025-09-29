import { Module } from '@nestjs/common';
import { AdminHotSearchController } from './admin-hot-search.controller';
import { AdminHotSearchService } from './admin-hot-search.service';
import { HotSearchModule } from '../../hot-search/hot-search.module';

@Module({
  imports: [HotSearchModule],
  controllers: [AdminHotSearchController],
  providers: [AdminHotSearchService],
})
export class AdminHotSearchModule {}
