import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
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
  RequireTeacher,
} from '../auth/decorators/roles.decorator';
import { Permission } from '../auth/enums/permissions.enum';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('用户管理')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly excelService: ExcelService,
  ) {}

  @ApiOperation({ summary: '创建用户' })
  @ApiResponse({ status: 201, description: '用户创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 409, description: '邮箱已存在' })
  @ApiResponse({ status: 403, description: '权限不足，需要教师角色' })
  @RequirePermissions([Permission.USER_CREATE])
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @ApiOperation({ summary: '获取所有用户' })
  @ApiResponse({ status: 200, description: '获取用户列表成功' })
  @ApiResponse({ status: 403, description: '权限不足，需要教师或助教角色' })
  @RequirePermissions([Permission.USER_LIST])
  @Get()
  findAll() {
    return this.usersService.findAll();
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
  @ApiResponse({ status: 403, description: '权限不足' })
  @RequirePermissions([Permission.USER_UPDATE])
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @ApiOperation({ summary: '删除用户' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({ status: 200, description: '用户删除成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @ApiResponse({ status: 403, description: '权限不足，需要教师角色' })
  @RequireTeacher()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
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
    description: '权限不足，需要教师角色',
  })
  @RequireTeacher()
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
    const users = this.excelService.parseUserExcel(file.buffer);

    // 批量创建用户
    return this.usersService.batchCreate(users);
  }

  @ApiOperation({
    summary: '下载用户导入模板',
    description: '下载Excel格式的用户导入模板文件，包含示例数据。',
  })
  @ApiResponse({
    status: 200,
    description: '模板文件下载成功',
    headers: {
      'Content-Type': {
        description:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        schema: { type: 'string' },
      },
      'Content-Disposition': {
        description: 'attachment; filename="用户导入模板.xlsx"',
        schema: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: '权限不足，需要教师角色',
  })
  @RequireTeacher()
  @Get('template')
  downloadTemplate(@Res() res: Response) {
    const templateBuffer = this.excelService.generateUserTemplate();

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="用户导入模板.xlsx"',
      'Content-Length': templateBuffer.length.toString(),
    });

    res.send(templateBuffer);
  }
}
