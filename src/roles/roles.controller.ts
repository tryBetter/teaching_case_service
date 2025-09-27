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
import { CreateTeacherAssistantDto } from './dto/create-teacher-assistant.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RequirePermissions } from '../auth/decorators/roles.decorator';
import { Permission } from '../auth/enums/permissions.enum';

@ApiTags('角色权限管理')
@Controller('roles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  /**
   * 角色权限管理系统
   *
   * 本模块提供完整的角色和权限管理功能，包括：
   * - 角色的创建、查询、更新、删除
   * - 权限的创建、查询、更新、删除
   * - 角色权限的分配和管理
   * - 系统默认角色和权限的初始化
   *
   * 使用场景：
   * 1. 管理员创建自定义角色并分配权限
   * 2. 细粒度的权限控制和管理
   * 3. 系统初始化时创建默认角色和权限
   * 4. 动态调整用户权限（通过角色权限变更）
   */

  // ==================== 角色管理 ====================

  @ApiOperation({
    summary: '创建角色',
    description:
      '创建一个新的角色。管理员可以使用此接口创建自定义角色，并为角色分配特定的权限。',
  })
  @ApiResponse({
    status: 201,
    description: '角色创建成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 6, description: '角色ID' },
        name: { type: 'string', example: '高级教师', description: '角色名称' },
        description: {
          type: 'string',
          example: '拥有高级权限的教师角色',
          description: '角色描述',
        },
        isSystem: {
          type: 'boolean',
          example: false,
          description: '是否为系统角色',
        },
        isActive: { type: 'boolean', example: true, description: '是否启用' },
        createdAt: {
          type: 'string',
          format: 'date-time',
          description: '创建时间',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          description: '更新时间',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误，请检查角色名称、描述等字段格式',
  })
  @ApiResponse({ status: 409, description: '角色名称已存在，请使用不同的名称' })
  @ApiResponse({ status: 403, description: '权限不足，需要角色管理权限' })
  @RequirePermissions([Permission.ROLE_MANAGE])
  @Post()
  createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.createRole(createRoleDto);
  }

  @ApiOperation({
    summary: '获取所有角色',
    description:
      '获取系统中所有角色的列表，包括系统角色和自定义角色。返回结果包含角色的权限信息、用户数量等详细信息。',
  })
  @ApiResponse({
    status: 200,
    description: '获取角色列表成功',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1, description: '角色ID' },
          name: { type: 'string', example: '管理员', description: '角色名称' },
          description: {
            type: 'string',
            example: '系统管理员，拥有大部分管理权限',
            description: '角色描述',
          },
          isSystem: {
            type: 'boolean',
            example: true,
            description: '是否为系统角色',
          },
          isActive: { type: 'boolean', example: true, description: '是否启用' },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: '创建时间',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: '更新时间',
          },
          rolePermissions: {
            type: 'array',
            description: '角色权限列表',
            items: {
              type: 'object',
              properties: {
                permission: {
                  type: 'object',
                  properties: {
                    id: { type: 'number', example: 1, description: '权限ID' },
                    code: {
                      type: 'string',
                      example: 'user:create',
                      description: '权限代码',
                    },
                    name: {
                      type: 'string',
                      example: '创建用户',
                      description: '权限名称',
                    },
                    module: {
                      type: 'string',
                      example: 'user',
                      description: '所属模块',
                    },
                    action: {
                      type: 'string',
                      example: 'create',
                      description: '操作类型',
                    },
                  },
                },
              },
            },
          },
          _count: {
            type: 'object',
            properties: {
              users: {
                type: 'number',
                example: 5,
                description: '使用该角色的用户数量',
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: '权限不足，需要角色管理权限' })
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

  @ApiOperation({
    summary: '创建权限',
    description:
      '创建一个新的权限。管理员可以使用此接口创建自定义权限，用于细粒度的权限控制。权限代码格式为 "模块:操作"，如 "user:create"。',
  })
  @ApiResponse({
    status: 201,
    description: '权限创建成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 32, description: '权限ID' },
        code: {
          type: 'string',
          example: 'article:approve',
          description: '权限代码',
        },
        name: { type: 'string', example: '审核文章', description: '权限名称' },
        description: {
          type: 'string',
          example: '允许审核和批准文章发布',
          description: '权限描述',
        },
        module: { type: 'string', example: 'article', description: '所属模块' },
        action: { type: 'string', example: 'approve', description: '操作类型' },
        createdAt: {
          type: 'string',
          format: 'date-time',
          description: '创建时间',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          description: '更新时间',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误，请检查权限代码、名称、模块、操作等字段格式',
  })
  @ApiResponse({ status: 409, description: '权限代码已存在，请使用不同的代码' })
  @ApiResponse({ status: 403, description: '权限不足，需要角色管理权限' })
  @RequirePermissions([Permission.ROLE_MANAGE])
  @Post('permissions')
  createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    return this.rolesService.createPermission(createPermissionDto);
  }

  @ApiOperation({
    summary: '获取所有权限',
    description:
      '获取系统中所有权限的列表，按模块和操作类型排序。管理员可以使用此接口查看所有可用权限，用于角色权限配置。',
  })
  @ApiResponse({
    status: 200,
    description: '获取权限列表成功',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1, description: '权限ID' },
          code: {
            type: 'string',
            example: 'user:create',
            description: '权限代码',
          },
          name: {
            type: 'string',
            example: '创建用户',
            description: '权限名称',
          },
          description: {
            type: 'string',
            example: '允许创建新用户',
            description: '权限描述',
          },
          module: { type: 'string', example: 'user', description: '所属模块' },
          action: {
            type: 'string',
            example: 'create',
            description: '操作类型',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: '创建时间',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: '更新时间',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: '权限不足，需要角色管理权限' })
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

  @ApiOperation({
    summary: '为角色分配权限',
    description:
      '为指定角色分配权限。此操作会替换角色的所有现有权限，请确保传递完整的权限ID列表。使用场景：管理员创建角色后需要为其分配具体权限，或修改现有角色的权限配置。',
  })
  @ApiParam({
    name: 'id',
    description: '角色ID',
    example: 1,
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: '权限分配成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1, description: '角色ID' },
        name: { type: 'string', example: '高级教师', description: '角色名称' },
        description: {
          type: 'string',
          example: '拥有高级权限的教师角色',
          description: '角色描述',
        },
        isSystem: {
          type: 'boolean',
          example: false,
          description: '是否为系统角色',
        },
        isActive: { type: 'boolean', example: true, description: '是否启用' },
        rolePermissions: {
          type: 'array',
          description: '更新后的角色权限列表',
          items: {
            type: 'object',
            properties: {
              permission: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1, description: '权限ID' },
                  code: {
                    type: 'string',
                    example: 'user:create',
                    description: '权限代码',
                  },
                  name: {
                    type: 'string',
                    example: '创建用户',
                    description: '权限名称',
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '角色不存在或部分权限不存在，请检查角色ID和权限ID',
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误，请检查权限ID数组格式',
  })
  @ApiResponse({ status: 403, description: '权限不足，需要角色管理权限' })
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

  @ApiOperation({
    summary: '创建默认权限',
    description:
      '初始化系统默认权限。此接口会创建系统中所有预定义的权限，包括用户管理、文章管理、媒体管理、评论管理、收藏管理、笔记管理和系统管理权限。通常在系统首次部署时调用。',
  })
  @ApiResponse({
    status: 201,
    description: '默认权限创建成功',
    schema: {
      type: 'array',
      description: '创建的权限列表',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1, description: '权限ID' },
          code: {
            type: 'string',
            example: 'user:create',
            description: '权限代码',
          },
          name: {
            type: 'string',
            example: '创建用户',
            description: '权限名称',
          },
          description: {
            type: 'string',
            example: '允许创建新用户',
            description: '权限描述',
          },
          module: { type: 'string', example: 'user', description: '所属模块' },
          action: {
            type: 'string',
            example: 'create',
            description: '操作类型',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: '权限不足，需要角色管理权限' })
  @RequirePermissions([Permission.ROLE_MANAGE])
  @Post('permissions/init')
  createDefaultPermissions() {
    return this.rolesService.createDefaultPermissions();
  }

  @ApiOperation({
    summary: '创建默认角色',
    description:
      '初始化系统默认角色。此接口会创建系统预定义的角色：超级管理员、管理员、教师组长、教师、助教、学生。这些角色已配置了相应的权限。通常在系统首次部署时调用。',
  })
  @ApiResponse({
    status: 201,
    description: '默认角色创建成功',
    schema: {
      type: 'array',
      description: '创建的角色列表',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1, description: '角色ID' },
          name: {
            type: 'string',
            example: '超级管理员',
            description: '角色名称',
          },
          description: {
            type: 'string',
            example: '拥有系统所有权限的超级管理员',
            description: '角色描述',
          },
          isSystem: {
            type: 'boolean',
            example: true,
            description: '是否为系统角色',
          },
          isActive: { type: 'boolean', example: true, description: '是否启用' },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: '创建时间',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: '更新时间',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: '权限不足，需要角色管理权限' })
  @RequirePermissions([Permission.ROLE_MANAGE])
  @Post('init')
  createDefaultRoles() {
    return this.rolesService.createDefaultRoles();
  }

  // ==================== 教师-助教关联管理 ====================

  @ApiOperation({
    summary: '创建教师-助教关联',
    description:
      '为助教关联一位教师。助教只能编辑和浏览被关联教师的文章和媒体资源，但不能删除或发布文章，也不能管理媒体文件。',
  })
  @ApiResponse({
    status: 201,
    description: '关联关系创建成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1, description: '关联关系ID' },
        teacherId: { type: 'number', example: 1, description: '教师用户ID' },
        assistantId: { type: 'number', example: 2, description: '助教用户ID' },
        createdAt: {
          type: 'string',
          format: 'date-time',
          description: '创建时间',
        },
        teacher: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: '张老师' },
            email: { type: 'string', example: 'teacher@example.com' },
          },
          description: '教师信息',
        },
        assistant: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 2 },
            name: { type: 'string', example: '李助教' },
            email: { type: 'string', example: 'assistant@example.com' },
          },
          description: '助教信息',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 404, description: '教师或助教不存在' })
  @ApiResponse({ status: 409, description: '关联关系已存在或角色验证失败' })
  @ApiResponse({ status: 403, description: '权限不足，需要角色管理权限' })
  @RequirePermissions([Permission.ROLE_MANAGE])
  @Post('teacher-assistant')
  createTeacherAssistantRelation(@Body() createDto: CreateTeacherAssistantDto) {
    return this.rolesService.createTeacherAssistantRelation(createDto);
  }

  @ApiOperation({
    summary: '获取所有教师-助教关联',
    description: '获取系统中所有的教师-助教关联关系列表。',
  })
  @ApiResponse({
    status: 200,
    description: '获取关联关系列表成功',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          teacherId: { type: 'number', example: 1 },
          assistantId: { type: 'number', example: 2 },
          createdAt: { type: 'string', format: 'date-time' },
          teacher: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              email: { type: 'string' },
              role: {
                type: 'object',
                properties: { name: { type: 'string' } },
              },
            },
          },
          assistant: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              email: { type: 'string' },
              role: {
                type: 'object',
                properties: { name: { type: 'string' } },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: '权限不足，需要角色管理权限' })
  @RequirePermissions([Permission.ROLE_MANAGE])
  @Get('teacher-assistant')
  getTeacherAssistantRelations() {
    return this.rolesService.getTeacherAssistantRelations();
  }

  @ApiOperation({
    summary: '获取助教关联的教师列表',
    description: '获取指定助教关联的所有教师列表。',
  })
  @ApiParam({
    name: 'assistantId',
    description: '助教用户ID',
    example: 2,
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: '获取教师列表成功',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          teacherId: { type: 'number', example: 1 },
          assistantId: { type: 'number', example: 2 },
          teacher: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              email: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: '助教不存在' })
  @ApiResponse({ status: 409, description: '指定用户不是助教角色' })
  @ApiResponse({ status: 403, description: '权限不足，需要角色管理权限' })
  @RequirePermissions([Permission.ROLE_MANAGE])
  @Get('assistant/:assistantId/teachers')
  getTeachersByAssistant(@Param('assistantId') assistantId: string) {
    return this.rolesService.getTeachersByAssistant(+assistantId);
  }

  @ApiOperation({
    summary: '获取教师关联的助教列表',
    description: '获取指定教师关联的所有助教列表。',
  })
  @ApiParam({
    name: 'teacherId',
    description: '教师用户ID',
    example: 1,
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: '获取助教列表成功',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          teacherId: { type: 'number', example: 1 },
          assistantId: { type: 'number', example: 2 },
          assistant: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              email: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: '教师不存在' })
  @ApiResponse({ status: 409, description: '指定用户不是教师角色' })
  @ApiResponse({ status: 403, description: '权限不足，需要角色管理权限' })
  @RequirePermissions([Permission.ROLE_MANAGE])
  @Get('teacher/:teacherId/assistants')
  getAssistantsByTeacher(@Param('teacherId') teacherId: string) {
    return this.rolesService.getAssistantsByTeacher(+teacherId);
  }

  @ApiOperation({
    summary: '删除教师-助教关联',
    description: '删除指定的教师-助教关联关系。',
  })
  @ApiParam({
    name: 'id',
    description: '关联关系ID',
    example: 1,
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: '关联关系删除成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        teacherId: { type: 'number', example: 1 },
        assistantId: { type: 'number', example: 2 },
      },
    },
  })
  @ApiResponse({ status: 404, description: '关联关系不存在' })
  @ApiResponse({ status: 403, description: '权限不足，需要角色管理权限' })
  @RequirePermissions([Permission.ROLE_MANAGE])
  @Delete('teacher-assistant/:id')
  deleteTeacherAssistantRelation(@Param('id') id: string) {
    return this.rolesService.deleteTeacherAssistantRelation(+id);
  }
}
