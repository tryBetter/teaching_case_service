import { Controller, Post, Body, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.decorator';
import { CurrentUser } from './user.decorator';
import type { AuthenticatedUser } from './interfaces/user.interface';

@ApiTags('认证管理')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @ApiOperation({
    summary: '用户登录',
    description: '使用邮箱和密码登录，返回JWT访问令牌',
  })
  @ApiResponse({
    status: 200,
    description: '登录成功',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'JWT访问令牌',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1, description: '用户ID' },
            email: {
              type: 'string',
              example: 'user@example.com',
              description: '用户邮箱',
            },
            name: { type: 'string', example: '张三', description: '用户姓名' },
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
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '获取当前用户信息',
    description:
      '使用JWT令牌获取当前登录用户的完整信息。适用场景：页面刷新后重新获取用户信息、验证token有效性。',
  })
  @ApiResponse({
    status: 200,
    description: '获取用户信息成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1, description: '用户ID' },
        email: {
          type: 'string',
          example: 'user@example.com',
          description: '用户邮箱',
        },
        name: { type: 'string', example: '张三', description: '用户姓名' },
        role: {
          type: 'string',
          example: 'STUDENT',
          description: '用户角色',
        },
        roleId: { type: 'number', example: 5, description: '角色ID' },
        avatar: {
          type: 'string',
          example: 'https://example.com/avatar.jpg',
          description: '用户头像URL',
        },
        major: {
          type: 'string',
          example: '计算机科学与技术',
          description: '用户专业',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '未授权，token无效或已过期',
  })
  @Get('me')
  async getCurrentUser(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getCurrentUser(user.id);
  }
}
