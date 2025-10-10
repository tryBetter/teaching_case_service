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

  @ApiOperation({ summary: '创建用户' })
  @ApiResponse({ status: 201, description: '用户创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 409, description: '邮箱已存在' })
  @ApiResponse({
    status: 403,
    description: '权限不足，需要管理员或超级管理员角色',
  })
  @RequireAdmin()
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @ApiOperation({
    summary: '获取所有用户',
    description: '获取用户列表，支持分页和筛选（与admin接口统一）',
  })
  @ApiQuery({
    name: 'page',
    description: '页码',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: '每页数量',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'role',
    description: '角色筛选',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'search',
    description: '搜索关键词（姓名或邮箱）',
    required: false,
    type: String,
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
    summary: '获取角色选项列表',
    description:
      '获取所有可用角色的简化列表（不包含超级管理员），用于用户创建/编辑时的角色下拉选择',
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

  @ApiOperation({ summary: '根据ID获取用户' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({ status: 200, description: '获取用户成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @RequirePermissions([Permission.USER_READ])
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @ApiOperation({ summary: '更新用户信息' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({ status: 200, description: '用户更新成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({
    status: 403,
    description: '权限不足，需要管理员或超级管理员角色',
  })
  @RequireAdmin()
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @ApiOperation({ summary: '删除用户' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({
    status: 200,
    description: '用户删除成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        email: { type: 'string' },
        name: { type: 'string' },
        message: { type: 'string', example: '用户删除成功' },
      },
    },
  })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @ApiResponse({
    status: 403,
    description: '权限不足，需要管理员或超级管理员角色',
  })
  @RequireAdmin()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @ApiOperation({
    summary: '禁用用户',
    description: '禁用用户（软删除），用户将无法登录',
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
    summary: '启用用户',
    description: '启用被禁用的用户',
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
    summary: '批量创建用户',
    description:
      '通过上传Excel文件批量创建用户。Excel文件必须包含邮箱、姓名、密码、角色列。',
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
