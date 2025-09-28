import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { TestDataSeedService } from './test-data.seed';
import { PrismaModule } from '../prisma/prisma.module';
import { StatsService } from '../stats/stats.service';

@Module({
  imports: [PrismaModule],
  providers: [SeedService, TestDataSeedService, StatsService],
})
export class SeedModule {}
