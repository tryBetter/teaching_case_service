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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Public } from '../auth/public.decorator';
import {
  RequireAdmin,
  RequireAdminOrTeacher,
} from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('分类管理')
@ApiBearerAuth('JWT-auth')
@Controller('categories')
@UseGuards(RolesGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @ApiOperation({
    summary: '创建分类',
    description: '创建新的文章分类，需要管理员权限',
  })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({ status: 201, description: '分类创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 409, description: '分类名称已存在' })
  @ApiResponse({ status: 403, description: '权限不足，需要管理员角色' })
  @RequireAdmin()
  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @ApiOperation({
    summary: '获取所有分类',
    description: '获取系统中所有可用的文章分类',
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
          createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
          updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        },
      },
    },
  })
  @Public()
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @ApiOperation({
    summary: '根据ID获取分类',
    description: '获取指定分类的详细信息，包括关联的文章列表',
  })
  @ApiParam({ name: 'id', description: '分类ID' })
  @ApiResponse({
    status: 200,
    description: '获取分类成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: '科研案例' },
        description: { type: 'string', example: '科研相关的教学案例' },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        articles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              title: { type: 'string', example: '文章标题' },
              published: { type: 'boolean', example: true },
              createdAt: {
                type: 'string',
                example: '2023-01-01T00:00:00.000Z',
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: '分类不存在' })
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(+id);
  }

  @ApiOperation({
    summary: '更新分类',
    description: '更新分类信息，需要管理员或教师权限',
  })
  @ApiParam({ name: 'id', description: '分类ID' })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiResponse({ status: 200, description: '分类更新成功' })
  @ApiResponse({ status: 404, description: '分类不存在' })
  @ApiResponse({ status: 409, description: '分类名称已存在' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @RequireAdminOrTeacher()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(+id, updateCategoryDto);
  }

  @ApiOperation({
    summary: '删除分类',
    description:
      '删除分类，需要管理员权限。注意：如果分类下还有文章，将无法删除',
  })
  @ApiParam({ name: 'id', description: '分类ID' })
  @ApiResponse({ status: 200, description: '分类删除成功' })
  @ApiResponse({ status: 404, description: '分类不存在' })
  @ApiResponse({ status: 409, description: '无法删除，该分类下还有文章' })
  @ApiResponse({ status: 403, description: '权限不足，需要管理员角色' })
  @RequireAdmin()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(+id);
  }
}
