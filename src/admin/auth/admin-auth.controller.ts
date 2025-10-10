import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { Public } from '../../auth/public.decorator';

@ApiTags('后台管理认证')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @ApiOperation({
    summary: '超级管理员登录',
    description: '超级管理员登录接口，只有超级管理员角色才能登录后台管理系统',
  })
  @ApiBody({ type: AdminLoginDto })
  @ApiResponse({
    status: 200,
    description: '登录成功',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description: 'JWT访问令牌',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', example: 'admin@example.com' },
            name: { type: 'string', example: '超级管理员' },
            role: { type: 'string', example: '超级管理员' },
            roleId: { type: 'number', example: 1 },
          },
          description: '用户信息',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '登录失败',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: '邮箱或密码错误' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: '权限不足',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: {
          type: 'string',
          example: '权限不足，只有超级管理员才能登录后台管理系统',
        },
        error: { type: 'string', example: 'Forbidden' },
      },
    },
  })
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() adminLoginDto: AdminLoginDto) {
    console.log('AdminAuthController: 收到登录请求', adminLoginDto);
    try {
      const result = await this.adminAuthService.login(adminLoginDto);
      console.log('AdminAuthController: 登录成功');
      return result;
    } catch (error) {
      console.log(
        'AdminAuthController: 登录失败',
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }

  @ApiOperation({
    summary: '检查超级管理员状态',
    description: '检查当前登录用户是否为超级管理员',
  })
  @ApiResponse({
    status: 200,
    description: '检查成功',
    schema: {
      type: 'object',
      properties: {
        isSuperAdmin: { type: 'boolean', example: true },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', example: 'admin@example.com' },
            name: { type: 'string', example: '超级管理员' },
            role: { type: 'string', example: '超级管理员' },
          },
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  @Post('check')
  async checkSuperAdminStatus(@Body() body: { token: string }) {
    return this.adminAuthService.checkSuperAdminStatus(body.token);
  }
}
