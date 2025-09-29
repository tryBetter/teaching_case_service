import { Module } from '@nestjs/common';
import { AdminRolesController } from './admin-roles.controller';
import { AdminRolesService } from './admin-roles.service';
import { RolesModule } from '../../roles/roles.module';

@Module({
  imports: [RolesModule],
  controllers: [AdminRolesController],
  providers: [AdminRolesService],
})
export class AdminRolesModule {}
