import { Module } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { RolesModule } from '../../roles/roles.module';

@Module({
  imports: [RolesModule],
  providers: [RolesGuard],
  exports: [RolesGuard],
})
export class GuardsModule {}
