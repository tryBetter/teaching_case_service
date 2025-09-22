import { Module } from '@nestjs/common';
import { HotSearchService } from './hot-search.service';
import { HotSearchController } from './hot-search.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HotSearchController],
  providers: [HotSearchService],
  exports: [HotSearchService],
})
export class HotSearchModule {}
