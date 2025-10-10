import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminAuthModule } from './auth/admin-auth.module';
import { AdminRolesModule } from './roles/admin-roles.module';
import { AdminStatsModule } from './stats/admin-stats.module';

@Module({
  imports: [
    AdminAuthModule, // 后台登录认证
    AdminRolesModule, // 角色权限管理（管理员专属）
    AdminStatsModule, // 统计信息（管理员专属）
  ],
  controllers: [AdminController], // 提供后台管理界面HTML
  providers: [AdminService],
})
export class AdminModule {}
