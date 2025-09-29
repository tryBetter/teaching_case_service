import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminNoteService } from './admin-note.service';
import { RequireSuperAdmin } from '../decorators/super-admin.decorator';
import { SuperAdminGuard } from '../guards/super-admin.guard';

@ApiTags('后台管理-笔记管理')
@ApiBearerAuth('JWT-auth')
@Controller('admin/notes')
@UseGuards(SuperAdminGuard)
export class AdminNoteController {
  constructor(private readonly adminNoteService: AdminNoteService) {}

  @ApiOperation({
    summary: '获取所有笔记',
    description: '超级管理员获取系统中所有笔记列表',
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
  @RequireSuperAdmin()
  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.adminNoteService.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
    });
  }

  @ApiOperation({
    summary: '删除笔记',
    description: '超级管理员删除笔记',
  })
  @ApiParam({ name: 'id', description: '笔记ID' })
  @RequireSuperAdmin()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.adminNoteService.remove(+id);
  }
}
