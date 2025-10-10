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
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiQuery,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { UploadMediaDto } from './dto/upload-media.dto';
import type { UploadedFile as UploadedFileInterface } from './interfaces/uploaded-file.interface';
import { CurrentUser } from '../auth/user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/user.interface';
import {
  RequirePermissions,
  RequireTeacherLeaderOrTeacher,
  RequireTeacherLeaderOrTeacherOrAssistantLeaderOrAssistant,
} from '../auth/decorators/roles.decorator';
import { RequireSuperAdmin } from '../admin/decorators/super-admin.decorator';
import { SuperAdminGuard } from '../admin/guards/super-admin.guard';
import { Permission } from '../auth/enums/permissions.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UseGuards } from '@nestjs/common';
import { AdminMediaService } from '../admin/media/admin-media.service';

@ApiTags('媒体管理')
@ApiBearerAuth('JWT-auth')
@Controller('media')
@UseGuards(RolesGuard, SuperAdminGuard)
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
    private readonly adminMediaService: AdminMediaService,
  ) {}

  @ApiOperation({ summary: '创建媒体文件' })
  @ApiResponse({ status: 201, description: '媒体文件创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({
    status: 403,
    description: '权限不足，需要教师组长或教师角色',
  })
  @RequireTeacherLeaderOrTeacher()
  @Post()
  create(
    @Body() createMediaDto: CreateMediaDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // 如果没有指定 uploaderId，使用当前用户ID
    if (!createMediaDto.uploaderId) {
      createMediaDto.uploaderId = user.id;
    }
    return this.mediaService.create(createMediaDto);
  }

  @ApiOperation({
    summary: '上传媒体文件',
    description:
      '【教师和教师组长专用】上传图片或视频文件到服务器。文件会自动按类型分类存储，并生成可访问的HTTP URL。可以在上传时关联到指定的文章。适用场景：上传教学案例配图、上传实验视频、为文章添加多媒体素材。支持格式：图片(JPEG/PNG/GIF/WebP)、视频(MP4/AVI/MOV/WMV)。大小限制：图片≤50MB，视频≤1GB。上传后的文件会记录上传者信息，便于追溯和管理。',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description:
            '要上传的图片或视频文件。支持格式：图片(JPEG, PNG, GIF, WebP)，视频(MP4, AVI, MOV, WMV)',
        },
        articleIds: {
          type: 'array',
          items: { type: 'number' },
          description:
            '关联的文章ID列表，可选参数。如果不提供，媒体文件将不与任何文章关联',
          example: [1, 2, 3],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '文件上传成功',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: '媒体文件ID',
          example: 1,
        },
        type: {
          type: 'string',
          enum: ['IMAGE', 'VIDEO'],
          description: '媒体文件类型',
          example: 'IMAGE',
        },
        url: {
          type: 'string',
          description: '可访问的文件HTTP链接',
          example:
            'http://localhost:3000/uploads/images/1703123456789_abc123.jpg',
        },
        originalName: {
          type: 'string',
          description: '原始文件名',
          example: 'photo.jpg',
        },
        size: {
          type: 'number',
          description: '文件大小（字节）',
          example: 1024000,
        },
        mimetype: {
          type: 'string',
          description: '文件MIME类型',
          example: 'image/jpeg',
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          description: '创建时间',
          example: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '请求错误',
    schema: {
      type: 'object',
      properties: {
        statusCode: {
          type: 'number',
          example: 400,
        },
        message: {
          type: 'string',
          examples: {
            noFile: {
              summary: '未选择文件',
              value: '请选择要上传的文件',
            },
            invalidType: {
              summary: '不支持的文件类型',
              value: '不支持的文件类型，请上传图片或视频文件',
            },
            imageTooLarge: {
              summary: '图片文件过大',
              value: '图片文件大小不能超过 50MB',
            },
            videoTooLarge: {
              summary: '视频文件过大',
              value: '视频文件大小不能超过 1024MB',
            },
          },
        },
        error: {
          type: 'string',
          example: 'Bad Request',
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: '权限不足，需要教师组长或教师角色',
  })
  @RequireTeacherLeaderOrTeacher()
  @UseInterceptors(FileInterceptor('file'))
  @Post('upload')
  async uploadFile(
    @UploadedFile() file: UploadedFileInterface,
    @Body() uploadMediaDto: UploadMediaDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }

    // 验证文件类型
    const allowedImageTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    const allowedVideoTypes = [
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/wmv',
    ];
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

    const fileMimetype = file.mimetype;
    const fileSize = file.size;

    if (!allowedTypes.includes(fileMimetype)) {
      throw new BadRequestException('不支持的文件类型，请上传图片或视频文件');
    }

    // 验证文件大小 (50MB for images, 1024MB for videos)
    const maxImageSize = 50 * 1024 * 1024; // 50MB
    const maxVideoSize = 1024 * 1024 * 1024; // 1024MB

    if (allowedImageTypes.includes(fileMimetype) && fileSize > maxImageSize) {
      throw new BadRequestException('图片文件大小不能超过 50MB');
    }

    if (allowedVideoTypes.includes(fileMimetype) && fileSize > maxVideoSize) {
      throw new BadRequestException('视频文件大小不能超过 1024MB');
    }

    return this.mediaService.uploadFile(
      file,
      uploadMediaDto.articleIds,
      user.id,
    );
  }

  @ApiOperation({
    summary: '获取媒体文件列表',
    description:
      '获取系统中的媒体文件列表，支持分页和按上传者筛选。返回媒体文件的详细信息，包括文件URL、类型、大小、上传者信息、关联文章等。适用场景：后台管理系统媒体管理页面、查看特定用户上传的文件、统计存储使用情况。',
  })
  @ApiQuery({
    name: 'userId',
    description: '按上传者ID筛选。不提供时返回所有媒体文件（超级管理员模式）',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'page',
    description: '页码，从1开始。提供page和limit时返回分页数据',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: '每页媒体文件数量，建议：10、50、100',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description:
      '返回媒体文件列表。包含分页时返回：{data: [], pagination: {}}；不包含分页时返回数组',
  })
  @ApiResponse({
    status: 401,
    description: '未授权，需要登录后访问',
  })
  @Get()
  findAll(
    @Query('userId') userId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.mediaService.findAll({
      userId: userId ? +userId : undefined,
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
    });
  }

  @ApiOperation({ summary: '获取媒体统计信息（管理员）' })
  @ApiResponse({ status: 200, description: '返回媒体统计信息' })
  @RequireSuperAdmin()
  @Get('stats/overview')
  async getMediaStats() {
    return this.adminMediaService.getMediaStats();
  }

  @ApiOperation({ summary: '获取媒体类型分布统计（管理员）' })
  @ApiResponse({ status: 200, description: '返回媒体类型分布统计' })
  @RequireSuperAdmin()
  @Get('stats/distribution')
  async getMediaTypeDistribution() {
    return this.adminMediaService.getMediaTypeDistribution();
  }

  @ApiOperation({ summary: '获取最近上传的媒体文件（管理员）' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: '返回最近上传的媒体文件列表' })
  @RequireSuperAdmin()
  @Get('recent')
  async getRecentMedia(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit) : 10;
    return this.adminMediaService.getRecentMedia(limitNum);
  }

  @ApiOperation({ summary: '根据ID获取媒体文件' })
  @ApiParam({ name: 'id', description: '媒体文件ID' })
  @ApiResponse({ status: 200, description: '获取媒体文件成功' })
  @ApiResponse({ status: 404, description: '媒体文件不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mediaService.findOne(+id);
  }

  @ApiOperation({ summary: '更新媒体文件信息' })
  @ApiParam({ name: 'id', description: '媒体文件ID' })
  @ApiResponse({ status: 200, description: '媒体文件更新成功' })
  @ApiResponse({ status: 404, description: '媒体文件不存在' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({
    status: 403,
    description: '权限不足，需要教师组长、教师、助教组长或助教角色',
  })
  @RequireTeacherLeaderOrTeacherOrAssistantLeaderOrAssistant()
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMediaDto: UpdateMediaDto) {
    return this.mediaService.update(+id, updateMediaDto);
  }

  // ==================== 管理员专用功能 ====================

  @ApiOperation({ summary: '批量删除媒体文件（管理员）' })
  @ApiQuery({
    name: 'ids',
    description: '媒体ID列表（逗号分隔）',
    example: '1,2,3',
  })
  @ApiResponse({ status: 200, description: '返回删除结果' })
  @RequireSuperAdmin()
  @Delete('batch')
  async batchRemove(@Query('ids') ids: string) {
    const idList = ids
      .split(',')
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id));
    const results = {
      deletedCount: 0,
      failedCount: 0,
      errors: [] as string[],
    };

    for (const id of idList) {
      try {
        await this.mediaService.remove(id);
        results.deletedCount++;
      } catch (error) {
        results.failedCount++;
        const message = error instanceof Error ? error.message : String(error);
        results.errors.push(`ID ${id}: ${message}`);
      }
    }

    return results;
  }

  @ApiOperation({ summary: '删除媒体文件' })
  @ApiParam({ name: 'id', description: '媒体文件ID' })
  @ApiResponse({ status: 200, description: '媒体文件删除成功' })
  @ApiResponse({ status: 404, description: '媒体文件不存在' })
  @ApiResponse({ status: 403, description: '权限不足，需要教师组长或教师角色' })
  @RequirePermissions([Permission.MEDIA_DELETE])
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mediaService.remove(+id);
  }
}
