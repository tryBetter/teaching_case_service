import { Controller, Get, UseGuards, Res } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { RequireSuperAdmin } from './decorators/super-admin.decorator';
import { SuperAdminGuard } from './guards/super-admin.guard';
import { Public } from '../auth/public.decorator';

@ApiTags('后台管理系统')
@ApiBearerAuth('JWT-auth')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Public()
  @Get()
  getAdminIndex(@Res() res) {
    const { join } = require('path');
    const fs = require('fs');

    try {
      // 尝试多个可能的路径
      const possiblePaths = [
        join(__dirname, 'frontend', 'index.html'), // 编译后的路径
        join(__dirname, '..', '..', 'src', 'admin', 'frontend', 'index.html'), // 开发环境路径
        join(process.cwd(), 'src', 'admin', 'frontend', 'index.html'), // 项目根目录路径
      ];

      let htmlContent = null;
      for (const htmlPath of possiblePaths) {
        try {
          if (fs.existsSync(htmlPath)) {
            htmlContent = fs.readFileSync(htmlPath, 'utf8');
            break;
          }
        } catch (error) {
          // 继续尝试下一个路径
        }
      }

      if (htmlContent) {
        res.setHeader('Content-Type', 'text/html');
        res.send(htmlContent);
      } else {
        res.status(500).send(`
          <html>
            <body>
              <h1>无法加载管理界面</h1>
              <p>请检查文件路径是否正确。</p>
              <p>尝试的路径：</p>
              <ul>
                ${possiblePaths.map((path) => `<li>${path}</li>`).join('')}
              </ul>
            </body>
          </html>
        `);
      }
    } catch (error) {
      res.status(500).send(`
        <html>
          <body>
            <h1>无法加载管理界面</h1>
            <p>错误：${error.message}</p>
          </body>
        </html>
      `);
    }
  }

  @ApiOperation({
    summary: '获取后台管理概览',
    description: '获取后台管理系统的概览信息，包括系统状态、统计数据等',
  })
  @ApiResponse({
    status: 200,
    description: '获取概览信息成功',
    schema: {
      type: 'object',
      properties: {
        systemInfo: {
          type: 'object',
          properties: {
            version: { type: 'string', example: '1.0.0' },
            environment: { type: 'string', example: 'production' },
            uptime: { type: 'string', example: '2 days, 5 hours' },
          },
        },
        statistics: {
          type: 'object',
          properties: {
            totalUsers: { type: 'number', example: 150 },
            totalArticles: { type: 'number', example: 1250 },
            totalComments: { type: 'number', example: 5600 },
            totalMedia: { type: 'number', example: 320 },
          },
        },
        recentActivity: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', example: 'user_registration' },
              description: { type: 'string', example: '新用户注册' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: '权限不足，需要超级管理员权限' })
  @ApiOperation({
    summary: '后台管理首页',
    description: '后台管理系统的首页信息',
  })
  @ApiResponse({
    status: 200,
    description: '获取首页信息成功',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '欢迎使用后台管理系统' },
        version: { type: 'string', example: '1.0.0' },
        availableEndpoints: {
          type: 'array',
          items: { type: 'string' },
          example: [
            '/admin/overview',
            '/admin/health',
            '/admin/users',
            '/admin/articles',
          ],
        },
      },
    },
  })
  @UseGuards(SuperAdminGuard)
  @RequireSuperAdmin()
  @Get('api')
  getAdminHome() {
    return {
      message: '欢迎使用后台管理系统',
      version: '1.0.0',
      availableEndpoints: [
        '/admin/api/overview',
        '/admin/api/health',
        '/admin/users',
        '/admin/articles',
        '/admin/categories',
        '/admin/media',
        '/admin/comments',
        '/admin/favorites',
        '/admin/notes',
        '/admin/roles',
        '/admin/stats',
      ],
    };
  }

  @ApiOperation({
    summary: '获取后台管理概览',
    description: '获取后台管理系统的概览信息，包括系统状态、统计数据等',
  })
  @ApiResponse({
    status: 200,
    description: '获取概览信息成功',
    schema: {
      type: 'object',
      properties: {
        systemInfo: {
          type: 'object',
          properties: {
            version: { type: 'string', example: '1.0.0' },
            environment: { type: 'string', example: 'production' },
            uptime: { type: 'string', example: '2 days, 5 hours' },
          },
        },
        statistics: {
          type: 'object',
          properties: {
            totalUsers: { type: 'number', example: 150 },
            totalArticles: { type: 'number', example: 1250 },
            totalComments: { type: 'number', example: 5600 },
            totalMedia: { type: 'number', example: 320 },
          },
        },
        recentActivity: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', example: 'user_registration' },
              description: { type: 'string', example: '新用户注册' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: '权限不足，需要超级管理员权限' })
  @UseGuards(SuperAdminGuard)
  @RequireSuperAdmin()
  @Get('overview')
  getOverview() {
    return this.adminService.getOverview();
  }

  @ApiOperation({
    summary: '获取系统健康状态',
    description: '检查系统各个组件的健康状态',
  })
  @ApiResponse({
    status: 200,
    description: '获取健康状态成功',
    schema: {
      type: 'object',
      properties: {
        database: { type: 'string', example: 'healthy' },
        storage: { type: 'string', example: 'healthy' },
        cache: { type: 'string', example: 'healthy' },
        overall: { type: 'string', example: 'healthy' },
      },
    },
  })
  @UseGuards(SuperAdminGuard)
  @RequireSuperAdmin()
  @Get('health')
  getHealthStatus() {
    return this.adminService.getHealthStatus();
  }
}
