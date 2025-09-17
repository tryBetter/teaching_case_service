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
} from '@nestjs/swagger';
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { UploadMediaDto } from './dto/upload-media.dto';
import type { UploadedFile as UploadedFileInterface } from './interfaces/uploaded-file.interface';

@ApiTags('媒体管理')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @ApiOperation({ summary: '创建媒体文件' })
  @ApiResponse({ status: 201, description: '媒体文件创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @Post()
  create(@Body() createMediaDto: CreateMediaDto) {
    return this.mediaService.create(createMediaDto);
  }

  @ApiOperation({
    summary: '上传媒体文件',
    description:
      '支持上传图片和视频文件到服务器，文件将存储在服务器上并返回可访问的HTTP链接。支持的文件格式：图片(JPEG, PNG, GIF, WebP)，视频(MP4, AVI, MOV, WMV)。文件大小限制：图片最大50MB，视频最大1GB。',
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
  @UseInterceptors(FileInterceptor('file'))
  @Post('upload')
  async uploadFile(
    @UploadedFile() file: UploadedFileInterface,
    @Body() uploadMediaDto: UploadMediaDto,
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

    return this.mediaService.uploadFile(file, uploadMediaDto.articleIds);
  }

  @ApiOperation({ summary: '获取所有媒体文件' })
  @ApiQuery({
    name: 'userId',
    description: '用户ID',
    required: false,
    type: Number,
  })
  @ApiResponse({ status: 200, description: '获取媒体文件列表成功' })
  @Get()
  findAll(@Query('userId') userId?: string) {
    return this.mediaService.findAll(userId ? +userId : undefined);
  }

  @ApiOperation({ summary: '根据ID获取媒体文件' })
  @ApiParam({ name: 'id', description: '媒体文件ID' })
  @ApiResponse({ status: 200, description: '获取媒体文件成功' })
  @ApiResponse({ status: 404, description: '媒体文件不存在' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mediaService.findOne(+id);
  }

  @ApiOperation({ summary: '更新媒体文件信息' })
  @ApiParam({ name: 'id', description: '媒体文件ID' })
  @ApiResponse({ status: 200, description: '媒体文件更新成功' })
  @ApiResponse({ status: 404, description: '媒体文件不存在' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMediaDto: UpdateMediaDto) {
    return this.mediaService.update(+id, updateMediaDto);
  }

  @ApiOperation({ summary: '删除媒体文件' })
  @ApiParam({ name: 'id', description: '媒体文件ID' })
  @ApiResponse({ status: 200, description: '媒体文件删除成功' })
  @ApiResponse({ status: 404, description: '媒体文件不存在' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mediaService.remove(+id);
  }
}
