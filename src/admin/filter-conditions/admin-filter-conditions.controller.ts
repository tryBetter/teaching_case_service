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
import { AdminFilterConditionsService } from './admin-filter-conditions.service';
import { RequireSuperAdmin } from '../decorators/super-admin.decorator';
import { SuperAdminGuard } from '../guards/super-admin.guard';

@ApiTags('后台管理-筛选条件管理')
@ApiBearerAuth('JWT-auth')
@Controller('admin/filter-conditions')
@UseGuards(SuperAdminGuard)
export class AdminFilterConditionsController {
  constructor(
    private readonly adminFilterConditionsService: AdminFilterConditionsService,
  ) {}

  @ApiOperation({
    summary: '获取所有筛选条件类型',
    description: '超级管理员获取系统中所有筛选条件类型',
  })
  @RequireSuperAdmin()
  @Get('types')
  async findAllTypes() {
    return this.adminFilterConditionsService.findAllTypes();
  }

  @ApiOperation({
    summary: '获取所有筛选条件',
    description: '超级管理员获取系统中所有筛选条件',
  })
  @RequireSuperAdmin()
  @Get()
  async findAll() {
    return this.adminFilterConditionsService.findAll();
  }
}
