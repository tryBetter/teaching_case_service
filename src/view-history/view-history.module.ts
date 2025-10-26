import { Module } from '@nestjs/common';
import { ViewHistoryService } from './view-history.service';
import { ViewHistoryController } from './view-history.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ViewHistoryController],
  providers: [ViewHistoryService],
})
export class ViewHistoryModule {}
