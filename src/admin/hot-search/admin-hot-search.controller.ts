import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminHotSearchService } from './admin-hot-search.service';
import { RequireSuperAdmin } from '../decorators/super-admin.decorator';
import { SuperAdminGuard } from '../guards/super-admin.guard';

@ApiTags('后台管理-热搜管理')
@ApiBearerAuth('JWT-auth')
@Controller('admin/hot-search')
@UseGuards(SuperAdminGuard)
export class AdminHotSearchController {
  constructor(private readonly adminHotSearchService: AdminHotSearchService) {}

  @ApiOperation({
    summary: '获取所有热搜词条',
    description: '超级管理员获取系统中所有热搜词条',
  })
  @RequireSuperAdmin()
  @Get()
  async findAll() {
    return this.adminHotSearchService.findAll();
  }

  @ApiOperation({
    summary: '创建热搜词条',
    description: '超级管理员创建新热搜词条',
  })
  @RequireSuperAdmin()
  @Post()
  async create(@Body() createHotSearchDto: any) {
    return this.adminHotSearchService.create(createHotSearchDto);
  }

  @ApiOperation({
    summary: '更新热搜词条',
    description: '超级管理员更新热搜词条',
  })
  @RequireSuperAdmin()
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateHotSearchDto: any) {
    return this.adminHotSearchService.update(+id, updateHotSearchDto);
  }

  @ApiOperation({
    summary: '删除热搜词条',
    description: '超级管理员删除热搜词条',
  })
  @RequireSuperAdmin()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.adminHotSearchService.remove(+id);
  }
}
