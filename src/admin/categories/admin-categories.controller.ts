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
import { AdminCategoriesService } from './admin-categories.service';
import { RequireSuperAdmin } from '../decorators/super-admin.decorator';
import { SuperAdminGuard } from '../guards/super-admin.guard';
import { CreateCategoryDto } from '../../categories/dto/create-category.dto';
import { UpdateCategoryDto } from '../../categories/dto/update-category.dto';

@ApiTags('后台管理-分类管理')
@ApiBearerAuth('JWT-auth')
@Controller('admin/categories')
@UseGuards(SuperAdminGuard)
export class AdminCategoriesController {
  constructor(
    private readonly adminCategoriesService: AdminCategoriesService,
  ) {}

  @ApiOperation({
    summary: '获取所有分类',
    description: '超级管理员获取系统中所有分类列表',
  })
  @ApiResponse({
    status: 200,
    description: '获取分类列表成功',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: '科研案例' },
          description: { type: 'string', example: '科研相关的教学案例' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          _count: {
            type: 'object',
            properties: {
              articles: { type: 'number', example: 25 },
            },
          },
        },
      },
    },
  })
  @RequireSuperAdmin()
  @Get()
  async findAll() {
    return this.adminCategoriesService.findAll();
  }

  @ApiOperation({
    summary: '根据ID获取分类详情',
    description: '超级管理员获取指定分类的详细信息',
  })
  @ApiParam({ name: 'id', description: '分类ID' })
  @ApiResponse({
    status: 200,
    description: '获取分类详情成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: '科研案例' },
        description: { type: 'string', example: '科研相关的教学案例' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        articles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              title: { type: 'string', example: '文章标题' },
              published: { type: 'boolean', example: true },
              createdAt: { type: 'string', format: 'date-time' },
              author: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  name: { type: 'string', example: '作者姓名' },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: '分类不存在' })
  @RequireSuperAdmin()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.adminCategoriesService.findOne(+id);
  }

  @ApiOperation({
    summary: '创建分类',
    description: '超级管理员创建新分类',
  })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({
    status: 201,
    description: '分类创建成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: '新分类' },
        description: { type: 'string', example: '分类描述' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 409, description: '分类名称已存在' })
  @RequireSuperAdmin()
  @Post()
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.adminCategoriesService.create(createCategoryDto);
  }

  @ApiOperation({
    summary: '更新分类',
    description: '超级管理员更新分类信息',
  })
  @ApiParam({ name: 'id', description: '分类ID' })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiResponse({
    status: 200,
    description: '分类更新成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: '更新后的分类名称' },
        description: { type: 'string', example: '更新后的分类描述' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: '分类不存在' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 409, description: '分类名称已存在' })
  @RequireSuperAdmin()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.adminCategoriesService.update(+id, updateCategoryDto);
  }

  @ApiOperation({
    summary: '删除分类',
    description: '超级管理员删除分类（谨慎操作）',
  })
  @ApiParam({ name: 'id', description: '分类ID' })
  @ApiResponse({
    status: 200,
    description: '分类删除成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: '被删除的分类名称' },
        message: { type: 'string', example: '分类删除成功' },
      },
    },
  })
  @ApiResponse({ status: 404, description: '分类不存在' })
  @ApiResponse({ status: 409, description: '无法删除，该分类下还有文章' })
  @RequireSuperAdmin()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.adminCategoriesService.remove(+id);
  }
}
