import { Module } from '@nestjs/common';
import { AdminFilterConditionsController } from './admin-filter-conditions.controller';
import { AdminFilterConditionsService } from './admin-filter-conditions.service';
import { FilterConditionsModule } from '../../filter-conditions/filter-conditions.module';

@Module({
  imports: [FilterConditionsModule],
  controllers: [AdminFilterConditionsController],
  providers: [AdminFilterConditionsService],
})
export class AdminFilterConditionsModule {}
