import { Module } from '@nestjs/common';
import { FilterConditionTypesService } from './filter-condition-types.service';
import { FilterConditionsService } from './filter-conditions.service';
import { FilterConditionsController } from './filter-conditions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [PrismaModule, RolesModule],
  controllers: [FilterConditionsController],
  providers: [FilterConditionTypesService, FilterConditionsService],
  exports: [FilterConditionTypesService, FilterConditionsService],
})
export class FilterConditionsModule {}
