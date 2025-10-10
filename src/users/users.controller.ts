import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BatchCreateUserResult } from './dto/batch-create-user.dto';
import { ExcelService } from './services/excel.service';
import {
  RequirePermissions,
  RequireAdmin,
} from '../auth/decorators/roles.decorator';
import { Permission } from '../auth/enums/permissions.enum';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import { RequireSuperAdmin } from '../admin/decorators/super-admin.decorator';
import { SuperAdminGuard } from '../admin/guards/super-admin.guard';

@ApiTags('用户管理')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(RolesGuard, SuperAdminGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly excelService: ExcelService,
    private readonly prisma: PrismaService,
  ) {}

  @ApiOperation({
    summary: '创建用户',
    description:
      '【管理员专用】创建新用户账号。可以指定用户的邮箱、姓名、密码和角色。密码会自动加密存储。注意：不能创建超级管理员角色。适用场景：后台管理系统手动添加用户、批量导入前的单个用户验证。',
  })
  @ApiResponse({
    status: 201,
    description: '用户创建成功，返回用户完整信息（不包含密码）',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1, description: '用户唯一标识' },
        email: {
          type: 'string',
          example: 'teacher@example.com',
          description: '用户邮箱（登录凭证）',
        },
        name: { type: 'string', example: '张老师', description: '用户姓名' },
        roleId: { type: 'number', example: 4, description: '角色ID' },
        status: {
          type: 'string',
          example: 'ACTIVE',
          description: '用户状态：ACTIVE-活跃 | INACTIVE-禁用',
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          description: '创建时间',
        },
        role: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 4 },
            name: { type: 'string', example: '教师' },
          },
          description: '角色信息',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误：邮箱格式不正确、密码不符合要求等',
  })
  @ApiResponse({ status: 409, description: '邮箱已存在，无法创建重复用户' })
  @ApiResponse({
    status: 403,
    description: '权限不足，仅管理员和超级管理员可创建用户',
  })
  @RequireAdmin()
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @ApiOperation({
    summary: '获取用户列表（分页）',
    description:
      '获取系统中所有用户的列表，支持分页、角色筛选和关键词搜索。适用场景：后台管理系统用户管理页面、教师查看助教列表、组长查看成员列表。返回数据包含用户基本信息、角色信息和用户状态。',
  })
  @ApiQuery({
    name: 'page',
    description: '页码，从1开始。不提供时默认返回第1页',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: '每页显示的用户数量。建议值：10（默认）、20、50、100',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'role',
    description:
      '按角色筛选用户。可选值：超级管理员、管理员、教师组长、教师、助教组长、助教、学生。不提供时返回所有角色用户',
    required: false,
    type: String,
    example: '教师',
  })
  @ApiQuery({
    name: 'search',
    description:
      '搜索关键词，支持模糊匹配用户姓名或邮箱。示例：搜索"张"可以找到"张老师"、"zhangsan@example.com"',
    required: false,
    type: String,
    example: '张老师',
  })
  @ApiResponse({
    status: 200,
    description: '获取用户列表成功',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { type: 'object' },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: '权限不足，需要教师或助教角色' })
  @RequirePermissions([Permission.USER_LIST])
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: string,
    @Query('search') search?: string,
  ) {
    // 如果提供了分页参数，返回分页格式
    if (page || limit) {
      return this.usersService.findAllPaginated({
        page: parseInt(page || '1'),
        limit: parseInt(limit || '10'),
        role,
        search,
      });
    }
    // 否则返回所有用户（向后兼容）
    return this.usersService.findAll();
  }

  @ApiOperation({
    summary: '下载用户导入模板',
    description: '下载Excel格式的用户导入模板文件，包含示例数据。',
  })
  @ApiResponse({
    status: 200,
    description: '模板文件下载成功',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足，需要管理员或超级管理员角色',
  })
  @RequireAdmin()
  @Get('template')
  downloadTemplate(@Res() res: Response) {
    try {
      const templateBuffer = this.excelService.generateUserTemplate();

      // 使用 RFC 5987 编码格式处理中文文件名
      const filename = encodeURIComponent('用户导入模板.xlsx');

      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="user-template.xlsx"; filename*=UTF-8''${filename}`,
        'Content-Length': templateBuffer.length.toString(),
      });

      res.send(templateBuffer);
    } catch (error) {
      console.error('生成模板失败:', error);
      res.status(500).json({
        statusCode: 500,
        message: '生成模板失败',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  @ApiOperation({
    summary: '获取角色下拉选项列表',
    description:
      '【超级管理员专用】获取可用于创建/编辑用户时选择的角色列表。返回简化的角色信息（仅ID和名称）。注意：为了安全考虑，超级管理员角色不在返回列表中，只能通过系统初始化脚本创建。适用场景：后台管理系统添加用户/编辑用户时的角色下拉框数据源。',
  })
  @ApiResponse({
    status: 200,
    description: '获取角色列表成功',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 3, description: '角色ID' },
          name: { type: 'string', example: '教师', description: '角色名称' },
        },
      },
    },
  })
  @RequireSuperAdmin()
  @Get('roles')
  async findRoles() {
    return this.prisma.role.findMany({
      where: {
        isActive: true,
        name: { not: '超级管理员' }, // 排除超级管理员角色
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  @ApiOperation({
    summary: '获取用户统计信息',
    description: '获取用户相关的统计数据，包括总数、角色分布、新增用户等',
  })
  @ApiResponse({
    status: 200,
    description: '返回用户统计信息',
  })
  @RequireSuperAdmin()
  @Get('stats')
  async getUserStats() {
    return this.usersService.getUserStats();
  }

  @ApiOperation({
    summary: '获取用户详情',
    description:
      '根据用户ID获取单个用户的完整信息。返回用户基本信息、角色信息、权限列表（不返回密码）。适用场景：查看用户详细资料、编辑用户前获取当前信息、验证用户身份。',
  })
  @ApiParam({
    name: 'id',
    description: '用户ID，数字类型。示例：1、2、3',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '获取用户详情成功，返回完整的用户信息（不包含密码）',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        email: { type: 'string', example: 'teacher@example.com' },
        name: { type: 'string', example: '张老师' },
        roleId: { type: 'number', example: 4 },
        status: { type: 'string', example: 'ACTIVE' },
        createdAt: { type: 'string', format: 'date-time' },
        role: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string', example: '教师' },
            description: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '用户不存在，找不到指定ID的用户',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足，需要用户查看权限（USER_READ）',
  })
  @RequirePermissions([Permission.USER_READ])
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @ApiOperation({
    summary: '更新用户信息',
    description:
      '【管理员专用】更新指定用户的信息。可以修改邮箱、姓名、密码、角色等。密码字段为可选，不提供时保持原密码不变。注意：不能将用户改为超级管理员角色。适用场景：后台管理系统编辑用户、修改用户角色、重置用户密码。',
  })
  @ApiParam({
    name: 'id',
    description: '要更新的用户ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '用户更新成功，返回更新后的用户信息（不包含密码）',
  })
  @ApiResponse({
    status: 404,
    description: '用户不存在，找不到指定ID的用户',
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误：邮箱格式不正确、角色ID无效等',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足，仅管理员和超级管理员可更新用户信息',
  })
  @RequireAdmin()
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @ApiOperation({
    summary: '删除用户',
    description:
      '【管理员专用】删除指定用户账号。这是硬删除操作，用户数据将从数据库中永久移除。如果只想临时禁用用户，建议使用禁用接口（PATCH /users/:id/disable）。注意：删除前请确保该用户无关联数据（文章、评论等），否则可能导致数据完整性问题。适用场景：删除测试账号、清理无用用户。',
  })
  @ApiParam({
    name: 'id',
    description: '要删除的用户ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '用户删除成功，返回已删除用户的基本信息',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        email: { type: 'string', example: 'user@example.com' },
        name: { type: 'string', example: '张三' },
        message: { type: 'string', example: '用户删除成功' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '用户不存在，找不到指定ID的用户',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足，仅管理员和超级管理员可删除用户',
  })
  @RequireAdmin()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @ApiOperation({
    summary: '禁用用户账号',
    description:
      '【管理员专用】禁用指定用户，禁用后用户无法登录系统，但用户数据保留在数据库中（软删除）。这是可逆操作，可以通过启用接口恢复用户访问权限。适用场景：临时限制用户访问、处理违规用户、学期结束后暂停学生账号。',
  })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({
    status: 200,
    description: '用户禁用成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        email: { type: 'string' },
        name: { type: 'string' },
        status: { type: 'string', example: 'INACTIVE' },
        message: { type: 'string', example: '用户已禁用' },
      },
    },
  })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @ApiResponse({
    status: 403,
    description: '权限不足，需要管理员或超级管理员角色',
  })
  @RequireAdmin()
  @Patch(':id/disable')
  disable(@Param('id') id: string) {
    return this.usersService.disable(+id);
  }

  @ApiOperation({
    summary: '启用用户账号',
    description:
      '【管理员专用】启用已被禁用的用户，用户将恢复登录和访问系统的权限。适用场景：恢复被误禁用的用户、新学期重新开放学生账号、解除临时限制。',
  })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({
    status: 200,
    description: '用户启用成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        email: { type: 'string' },
        name: { type: 'string' },
        status: { type: 'string', example: 'ACTIVE' },
        message: { type: 'string', example: '用户已启用' },
      },
    },
  })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @ApiResponse({
    status: 403,
    description: '权限不足，需要管理员或超级管理员角色',
  })
  @RequireAdmin()
  @Patch(':id/enable')
  enable(@Param('id') id: string) {
    return this.usersService.enable(+id);
  }

  @ApiOperation({
    summary: '批量导入用户',
    description:
      '【管理员专用】通过上传Excel文件批量创建用户账号。适用场景：学期初批量创建学生账号、新教师入职批量创建账号。Excel文件必须按模板格式填写，包含4列：邮箱、姓名、密码、角色。系统会逐行解析Excel，成功的用户会被创建，失败的会在返回结果中标注错误原因（如邮箱格式错误、角色不存在等）。支持的角色：管理员、教师组长、教师、助教组长、助教、学生（不支持超级管理员）。',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Excel文件',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Excel文件，必须包含邮箱、姓名、密码、角色列',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '批量创建用户成功',
    schema: {
      type: 'object',
      properties: {
        successCount: {
          type: 'number',
          example: 5,
          description: '成功创建的用户数量',
        },
        failureCount: {
          type: 'number',
          example: 2,
          description: '失败的用户数量',
        },
        totalCount: { type: 'number', example: 7, description: '总处理数量' },
        successUsers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              email: { type: 'string', example: 'user@example.com' },
              name: { type: 'string', example: '张三' },
              password: { type: 'string', example: '[已加密]' },
              role: { type: 'string', example: 'STUDENT' },
            },
          },
          description: '成功创建的用户列表',
        },
        failedUsers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'user@example.com' },
                  name: { type: 'string', example: '张三' },
                  password: { type: 'string', example: 'password123' },
                  role: { type: 'string', example: 'STUDENT' },
                },
              },
              error: { type: 'string', example: '邮箱已存在' },
              row: { type: 'number', example: 3 },
            },
          },
          description: '失败的用户信息',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Excel文件格式错误或数据验证失败',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'Excel文件标题行必须包含: 邮箱, 姓名, 密码, 角色',
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: '权限不足，需要管理员或超级管理员角色',
  })
  @RequireAdmin()
  @Post('batch')
  @UseInterceptors(FileInterceptor('file'))
  async batchCreate(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<BatchCreateUserResult> {
    if (!file) {
      throw new Error('请上传Excel文件');
    }

    // 验证文件类型
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('只支持Excel文件格式(.xlsx, .xls)');
    }

    // 解析Excel文件
    const users = await this.excelService.parseUserExcel(file.buffer);

    // 批量创建用户
    return this.usersService.batchCreate(users);
  }
}
