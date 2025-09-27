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
import { HotSearchService } from './hot-search.service';
import { CreateHotSearchDto } from './dto/create-hot-search.dto';
import { UpdateHotSearchDto } from './dto/update-hot-search.dto';
import { HotSearch } from './entities/hot-search.entity';
import { Public } from '../auth/public.decorator';
import { RequireAdmin } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('热搜词条管理')
@ApiBearerAuth('JWT-auth')
@Controller('hot-search')
@UseGuards(RolesGuard)
export class HotSearchController {
  constructor(private readonly hotSearchService: HotSearchService) {}

  @ApiOperation({
    summary: '创建热搜词条',
    description: '创建新的热搜词条，需要管理员权限',
  })
  @ApiBody({ type: CreateHotSearchDto })
  @ApiResponse({
    status: 201,
    description: '热搜词条创建成功',
    type: HotSearch,
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
  })
  @ApiResponse({
    status: 409,
    description: '热搜关键词已存在',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足，需要管理员权限',
  })
  @RequireAdmin()
  @Post()
  create(@Body() createHotSearchDto: CreateHotSearchDto) {
    return this.hotSearchService.create(createHotSearchDto);
  }

  @ApiOperation({
    summary: '获取所有热搜词条',
    description: '获取系统中所有热搜词条，按排序权重和点击量排序',
  })
  @ApiResponse({
    status: 200,
    description: '获取热搜词条列表成功',
    type: [HotSearch],
  })
  @Public()
  @Get()
  findAll() {
    return this.hotSearchService.findAll();
  }

  @ApiOperation({
    summary: '获取启用的热搜词条',
    description: '获取所有启用的热搜词条，用于前端展示',
  })
  @ApiResponse({
    status: 200,
    description: '获取启用的热搜词条列表成功',
    type: [HotSearch],
  })
  @Public()
  @Get('active')
  findActive() {
    return this.hotSearchService.findActive();
  }

  @ApiOperation({
    summary: '根据ID获取热搜词条',
    description: '获取指定热搜词条的详细信息',
  })
  @ApiParam({ name: 'id', description: '热搜词条ID' })
  @ApiResponse({
    status: 200,
    description: '获取热搜词条成功',
    type: HotSearch,
  })
  @ApiResponse({
    status: 404,
    description: '热搜词条不存在',
  })
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.hotSearchService.findOne(+id);
  }

  @ApiOperation({
    summary: '更新热搜词条',
    description: '更新热搜词条信息，需要管理员权限',
  })
  @ApiParam({ name: 'id', description: '热搜词条ID' })
  @ApiBody({ type: UpdateHotSearchDto })
  @ApiResponse({
    status: 200,
    description: '热搜词条更新成功',
    type: HotSearch,
  })
  @ApiResponse({
    status: 404,
    description: '热搜词条不存在',
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
  })
  @ApiResponse({
    status: 409,
    description: '热搜关键词已存在',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足，需要管理员权限',
  })
  @RequireAdmin()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateHotSearchDto: UpdateHotSearchDto,
  ) {
    return this.hotSearchService.update(+id, updateHotSearchDto);
  }

  @ApiOperation({
    summary: '删除热搜词条',
    description: '删除热搜词条，需要管理员权限',
  })
  @ApiParam({ name: 'id', description: '热搜词条ID' })
  @ApiResponse({
    status: 200,
    description: '热搜词条删除成功',
    type: HotSearch,
  })
  @ApiResponse({
    status: 404,
    description: '热搜词条不存在',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足，需要管理员权限',
  })
  @RequireAdmin()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.hotSearchService.remove(+id);
  }

  @ApiOperation({
    summary: '增加点击次数',
    description: '当用户点击热搜词条时，增加其点击次数',
  })
  @ApiParam({ name: 'id', description: '热搜词条ID' })
  @ApiResponse({
    status: 200,
    description: '点击次数增加成功',
    type: HotSearch,
  })
  @ApiResponse({
    status: 404,
    description: '热搜词条不存在',
  })
  @Public()
  @Post(':id/click')
  incrementClickCount(@Param('id') id: string) {
    return this.hotSearchService.incrementClickCount(+id);
  }
}
