import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';

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
