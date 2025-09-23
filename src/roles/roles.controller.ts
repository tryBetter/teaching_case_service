import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RequirePermissions } from '../auth/decorators/roles.decorator';
import { Permission } from '../auth/enums/permissions.enum';

@ApiTags('角色权限管理')
@Controller('roles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // ==================== 角色管理 ====================

  @ApiOperation({ summary: '创建角色' })
  @ApiResponse({ status: 201, description: '角色创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 409, description: '角色名称已存在' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @RequirePermissions([Permission.ROLE_MANAGE])
  @Post()
  createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.createRole(createRoleDto);
  }

  @ApiOperation({ summary: '获取所有角色' })
  @ApiResponse({ status: 200, description: '获取角色列表成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @RequirePermissions([Permission.ROLE_MANAGE])
  @Get()
  findAllRoles() {
    return this.rolesService.findAllRoles();
  }

  @ApiOperation({ summary: '根据ID获取角色' })
  @ApiParam({ name: 'id', description: '角色ID' })
  @ApiResponse({ status: 200, description: '获取角色成功' })
  @ApiResponse({ status: 404, description: '角色不存在' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @RequirePermissions([Permission.ROLE_MANAGE])
  @Get(':id')
  findRoleById(@Param('id') id: string) {
    return this.rolesService.findRoleById(+id);
  }

  @ApiOperation({ summary: '更新角色信息' })
  @ApiParam({ name: 'id', description: '角色ID' })
  @ApiResponse({ status: 200, description: '角色更新成功' })
  @ApiResponse({ status: 404, description: '角色不存在' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 409, description: '角色名称已存在' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @RequirePermissions([Permission.ROLE_MANAGE])
  @Patch(':id')
  updateRole(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.updateRole(+id, updateRoleDto);
  }

  @ApiOperation({ summary: '删除角色' })
  @ApiParam({ name: 'id', description: '角色ID' })
  @ApiResponse({ status: 200, description: '角色删除成功' })
  @ApiResponse({ status: 404, description: '角色不存在' })
  @ApiResponse({ status: 403, description: '权限不足或系统角色不能删除' })
  @ApiResponse({ status: 409, description: '角色下还有用户，无法删除' })
  @RequirePermissions([Permission.ROLE_MANAGE])
  @Delete(':id')
  deleteRole(@Param('id') id: string) {
    return this.rolesService.deleteRole(+id);
  }

  // ==================== 权限管理 ====================

  @ApiOperation({ summary: '创建权限' })
  @ApiResponse({ status: 201, description: '权限创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 409, description: '权限代码已存在' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @RequirePermissions([Permission.ROLE_MANAGE])
  @Post('permissions')
  createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    return this.rolesService.createPermission(createPermissionDto);
  }

  @ApiOperation({ summary: '获取所有权限' })
  @ApiResponse({ status: 200, description: '获取权限列表成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @RequirePermissions([Permission.ROLE_MANAGE])
  @Get('permissions')
  findAllPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @ApiOperation({ summary: '根据ID获取权限' })
  @ApiParam({ name: 'id', description: '权限ID' })
  @ApiResponse({ status: 200, description: '获取权限成功' })
  @ApiResponse({ status: 404, description: '权限不存在' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @RequirePermissions([Permission.ROLE_MANAGE])
  @Get('permissions/:id')
  findPermissionById(@Param('id') id: string) {
    return this.rolesService.findPermissionById(+id);
  }

  @ApiOperation({ summary: '更新权限信息' })
  @ApiParam({ name: 'id', description: '权限ID' })
  @ApiResponse({ status: 200, description: '权限更新成功' })
  @ApiResponse({ status: 404, description: '权限不存在' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 409, description: '权限代码已存在' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @RequirePermissions([Permission.ROLE_MANAGE])
  @Patch('permissions/:id')
  updatePermission(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.rolesService.updatePermission(+id, updatePermissionDto);
  }

  @ApiOperation({ summary: '删除权限' })
  @ApiParam({ name: 'id', description: '权限ID' })
  @ApiResponse({ status: 200, description: '权限删除成功' })
  @ApiResponse({ status: 404, description: '权限不存在' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @RequirePermissions([Permission.ROLE_MANAGE])
  @Delete('permissions/:id')
  deletePermission(@Param('id') id: string) {
    return this.rolesService.deletePermission(+id);
  }

  // ==================== 角色权限分配 ====================

  @ApiOperation({ summary: '为角色分配权限' })
  @ApiParam({ name: 'id', description: '角色ID' })
  @ApiResponse({ status: 200, description: '权限分配成功' })
  @ApiResponse({ status: 404, description: '角色不存在或部分权限不存在' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @RequirePermissions([Permission.ROLE_MANAGE])
  @Post(':id/permissions')
  assignPermissionsToRole(
    @Param('id') id: string,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    return this.rolesService.assignPermissionsToRole(+id, assignPermissionsDto);
  }

  @ApiOperation({ summary: '获取角色的权限列表' })
  @ApiParam({ name: 'id', description: '角色ID' })
  @ApiResponse({ status: 200, description: '获取角色权限成功' })
  @ApiResponse({ status: 404, description: '角色不存在' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @RequirePermissions([Permission.ROLE_MANAGE])
  @Get(':id/permissions')
  getRolePermissions(@Param('id') id: string) {
    return this.rolesService.getRolePermissions(+id);
  }

  // ==================== 初始化数据 ====================

  @ApiOperation({ summary: '创建默认权限' })
  @ApiResponse({ status: 201, description: '默认权限创建成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @RequirePermissions([Permission.ROLE_MANAGE])
  @Post('permissions/init')
  createDefaultPermissions() {
    return this.rolesService.createDefaultPermissions();
  }

  @ApiOperation({ summary: '创建默认角色' })
  @ApiResponse({ status: 201, description: '默认角色创建成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @RequirePermissions([Permission.ROLE_MANAGE])
  @Post('init')
  createDefaultRoles() {
    return this.rolesService.createDefaultRoles();
  }
}
