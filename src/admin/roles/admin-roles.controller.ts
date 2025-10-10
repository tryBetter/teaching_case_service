import { Controller, Get, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminRolesService } from './admin-roles.service';
import { RequireSuperAdmin } from '../decorators/super-admin.decorator';
import { SuperAdminGuard } from '../guards/super-admin.guard';

@ApiTags('后台管理-角色权限管理')
@ApiBearerAuth('JWT-auth')
@Controller('admin/roles')
@UseGuards(SuperAdminGuard)
export class AdminRolesController {
  constructor(private readonly adminRolesService: AdminRolesService) {}

  @ApiOperation({
    summary: '获取所有角色',
    description: '超级管理员获取系统中所有角色',
  })
  @RequireSuperAdmin()
  @Get()
  async findAllRoles() {
    return this.adminRolesService.findAllRoles();
  }

  @ApiOperation({
    summary: '获取所有权限',
    description: '超级管理员获取系统中所有权限',
  })
  @RequireSuperAdmin()
  @Get('permissions')
  async findAllPermissions() {
    return this.adminRolesService.findAllPermissions();
  }

  @ApiOperation({
    summary: '获取角色权限',
    description: '超级管理员获取指定角色的权限',
  })
  @RequireSuperAdmin()
  @Get(':id/permissions')
  async getRolePermissions(@Param('id') id: string) {
    return this.adminRolesService.getRolePermissions(+id);
  }
}
