import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiConsumes,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AdminUsersService } from './admin-users.service';
import { RequireSuperAdmin } from '../decorators/super-admin.decorator';
import { SuperAdminGuard } from '../guards/super-admin.guard';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { UpdateUserDto } from '../../users/dto/update-user.dto';
import { BatchCreateUserResult } from '../../users/dto/batch-create-user.dto';

@ApiTags('后台管理-用户管理')
@ApiBearerAuth('JWT-auth')
@Controller('admin/users')
@UseGuards(SuperAdminGuard)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @ApiOperation({
    summary: '获取所有用户',
    description: '超级管理员获取系统中所有用户列表，支持分页和筛选',
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
    example: 'TEACHER',
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
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              email: { type: 'string', example: 'user@example.com' },
              name: { type: 'string', example: '张三' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              role: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 2 },
                  name: { type: 'string', example: '教师' },
                  description: { type: 'string', example: '教师角色' },
                },
              },
              _count: {
                type: 'object',
                properties: {
                  articles: { type: 'number', example: 5 },
                  comments: { type: 'number', example: 12 },
                  notes: { type: 'number', example: 8 },
                  favorites: { type: 'number', example: 15 },
                },
              },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 150 },
            totalPages: { type: 'number', example: 15 },
          },
        },
      },
    },
  })
  @RequireSuperAdmin()
  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('role') role?: string,
    @Query('search') search?: string,
  ) {
    return this.adminUsersService.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      role,
      search,
    });
  }

  @ApiOperation({
    summary: '根据ID获取用户详情',
    description: '超级管理员获取指定用户的详细信息',
  })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({
    status: 200,
    description: '获取用户详情成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        email: { type: 'string', example: 'user@example.com' },
        name: { type: 'string', example: '张三' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        role: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 2 },
            name: { type: 'string', example: '教师' },
            description: { type: 'string', example: '教师角色' },
          },
        },
        articles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              title: { type: 'string', example: '文章标题' },
              published: { type: 'boolean', example: true },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        comments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              content: { type: 'string', example: '评论内容' },
              createdAt: { type: 'string', format: 'date-time' },
              article: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  title: { type: 'string', example: '文章标题' },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @RequireSuperAdmin()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.adminUsersService.findOne(+id);
  }

  @ApiOperation({
    summary: '创建用户',
    description: '超级管理员创建新用户',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: '用户创建成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        email: { type: 'string', example: 'newuser@example.com' },
        name: { type: 'string', example: '新用户' },
        role: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 2 },
            name: { type: 'string', example: '教师' },
          },
        },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 409, description: '邮箱已存在' })
  @RequireSuperAdmin()
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.adminUsersService.create(createUserDto);
  }

  @ApiOperation({
    summary: '更新用户信息',
    description: '超级管理员更新用户信息，包括角色分配',
  })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: '用户更新成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        email: { type: 'string', example: 'updated@example.com' },
        name: { type: 'string', example: '更新后的姓名' },
        role: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 3 },
            name: { type: 'string', example: '助教' },
          },
        },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @RequireSuperAdmin()
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.adminUsersService.update(+id, updateUserDto);
  }

  @ApiOperation({
    summary: '删除用户',
    description: '超级管理员删除用户（谨慎操作）',
  })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({
    status: 200,
    description: '用户删除成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        email: { type: 'string', example: 'deleted@example.com' },
        name: { type: 'string', example: '被删除用户' },
        message: { type: 'string', example: '用户删除成功' },
      },
    },
  })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @RequireSuperAdmin()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.adminUsersService.remove(+id);
  }

  @ApiOperation({
    summary: '禁用用户',
    description: '超级管理员禁用用户（软删除），用户将无法登录',
  })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({
    status: 200,
    description: '用户禁用成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        email: { type: 'string', example: 'user@example.com' },
        name: { type: 'string', example: '用户姓名' },
        status: { type: 'string', example: 'INACTIVE' },
        message: { type: 'string', example: '用户已禁用' },
      },
    },
  })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @RequireSuperAdmin()
  @Patch(':id/disable')
  async disable(@Param('id') id: string) {
    return this.adminUsersService.disable(+id);
  }

  @ApiOperation({
    summary: '启用用户',
    description: '超级管理员启用被禁用的用户',
  })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({
    status: 200,
    description: '用户启用成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        email: { type: 'string', example: 'user@example.com' },
        name: { type: 'string', example: '用户姓名' },
        status: { type: 'string', example: 'ACTIVE' },
        message: { type: 'string', example: '用户已启用' },
      },
    },
  })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @RequireSuperAdmin()
  @Patch(':id/enable')
  async enable(@Param('id') id: string) {
    return this.adminUsersService.enable(+id);
  }

  @ApiOperation({
    summary: '批量创建用户',
    description: '通过Excel文件批量创建用户',
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
    type: BatchCreateUserResult,
  })
  @RequireSuperAdmin()
  @Post('batch')
  @UseInterceptors(FileInterceptor('file'))
  async batchCreate(@UploadedFile() file: Express.Multer.File) {
    return this.adminUsersService.batchCreate(file);
  }

  @ApiOperation({
    summary: '下载用户导入模板',
    description: '下载Excel格式的用户导入模板文件',
  })
  @ApiResponse({
    status: 200,
    description: '模板文件下载成功',
  })
  @RequireSuperAdmin()
  @Get('template/download')
  async downloadTemplate(@Res() res: Response) {
    return this.adminUsersService.downloadTemplate(res);
  }

  @ApiOperation({
    summary: '获取用户统计信息',
    description: '获取用户相关的统计数据',
  })
  @ApiResponse({
    status: 200,
    description: '获取统计信息成功',
    schema: {
      type: 'object',
      properties: {
        totalUsers: { type: 'number', example: 150 },
        usersByRole: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string', example: '教师' },
              count: { type: 'number', example: 25 },
            },
          },
        },
        newUsersToday: { type: 'number', example: 3 },
        newUsersThisWeek: { type: 'number', example: 15 },
        newUsersThisMonth: { type: 'number', example: 45 },
      },
    },
  })
  @RequireSuperAdmin()
  @Get('stats/overview')
  async getUserStats() {
    return this.adminUsersService.getUserStats();
  }
}
