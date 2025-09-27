import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FilterConditionTypesService } from './filter-condition-types.service';
import { FilterConditionsService } from './filter-conditions.service';
import { CreateFilterConditionTypeDto } from './dto/create-filter-condition-type.dto';
import { UpdateFilterConditionTypeDto } from './dto/update-filter-condition-type.dto';
import { CreateFilterConditionDto } from './dto/create-filter-condition.dto';
import { UpdateFilterConditionDto } from './dto/update-filter-condition.dto';
import { Public } from '../auth/public.decorator';
import {
  RequireAdmin,
  RequireAdminOrTeacher,
} from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('筛选条件管理')
@ApiBearerAuth('JWT-auth')
@Controller('filter-conditions')
@UseGuards(RolesGuard)
export class FilterConditionsController {
  constructor(
    private readonly filterConditionTypesService: FilterConditionTypesService,
    private readonly filterConditionsService: FilterConditionsService,
  ) {}

  // 筛选条件类型管理
  @ApiOperation({
    summary: '创建筛选条件类型',
    description: '创建新的筛选条件类型，需要管理员权限',
  })
  @ApiBody({ type: CreateFilterConditionTypeDto })
  @ApiResponse({ status: 201, description: '筛选条件类型创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 409, description: '筛选条件类型名称已存在' })
  @ApiResponse({ status: 403, description: '权限不足，需要管理员角色' })
  @RequireAdmin()
  @Post('types')
  createType(
    @Body() createFilterConditionTypeDto: CreateFilterConditionTypeDto,
  ) {
    return this.filterConditionTypesService.create(
      createFilterConditionTypeDto,
    );
  }

  @ApiOperation({
    summary: '获取所有筛选条件类型',
    description: '获取系统中所有可用的筛选条件类型及其筛选条件',
  })
  @ApiResponse({
    status: 200,
    description: '获取筛选条件类型列表成功',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: '知识点' },
          description: { type: 'string', example: '文章涉及的知识点分类' },
          createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
          updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
          filterConditions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                name: { type: 'string', example: '雾化机理' },
                description: {
                  type: 'string',
                  example: '液体燃料雾化过程机理研究',
                },
                createdAt: {
                  type: 'string',
                  example: '2023-01-01T00:00:00.000Z',
                },
              },
            },
          },
        },
      },
    },
  })
  @Public()
  @Get('types')
  findAllTypes() {
    return this.filterConditionTypesService.findAll();
  }

  @ApiOperation({
    summary: '根据ID获取筛选条件类型',
    description: '获取指定筛选条件类型的详细信息',
  })
  @ApiParam({ name: 'id', description: '筛选条件类型ID' })
  @ApiResponse({ status: 200, description: '获取筛选条件类型成功' })
  @ApiResponse({ status: 404, description: '筛选条件类型不存在' })
  @Public()
  @Get('types/:id')
  findOneType(@Param('id') id: string) {
    return this.filterConditionTypesService.findOne(+id);
  }

  @ApiOperation({
    summary: '更新筛选条件类型',
    description: '更新筛选条件类型信息，需要管理员或教师权限',
  })
  @ApiParam({ name: 'id', description: '筛选条件类型ID' })
  @ApiBody({ type: UpdateFilterConditionTypeDto })
  @ApiResponse({ status: 200, description: '筛选条件类型更新成功' })
  @ApiResponse({ status: 404, description: '筛选条件类型不存在' })
  @ApiResponse({ status: 409, description: '筛选条件类型名称已存在' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @RequireAdminOrTeacher()
  @Patch('types/:id')
  updateType(
    @Param('id') id: string,
    @Body() updateFilterConditionTypeDto: UpdateFilterConditionTypeDto,
  ) {
    return this.filterConditionTypesService.update(
      +id,
      updateFilterConditionTypeDto,
    );
  }

  @ApiOperation({
    summary: '删除筛选条件类型',
    description:
      '删除筛选条件类型，需要管理员权限。注意：如果类型下还有筛选条件，将无法删除',
  })
  @ApiParam({ name: 'id', description: '筛选条件类型ID' })
  @ApiResponse({ status: 200, description: '筛选条件类型删除成功' })
  @ApiResponse({ status: 404, description: '筛选条件类型不存在' })
  @ApiResponse({ status: 409, description: '无法删除，该类型下还有筛选条件' })
  @ApiResponse({ status: 403, description: '权限不足，需要管理员角色' })
  @RequireAdmin()
  @Delete('types/:id')
  removeType(@Param('id') id: string) {
    return this.filterConditionTypesService.remove(+id);
  }

  // 筛选条件管理
  @ApiOperation({
    summary: '创建筛选条件',
    description: '创建新的筛选条件，需要管理员权限',
  })
  @ApiBody({ type: CreateFilterConditionDto })
  @ApiResponse({ status: 201, description: '筛选条件创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 409, description: '筛选条件名称已存在' })
  @ApiResponse({ status: 404, description: '筛选条件类型不存在' })
  @ApiResponse({ status: 403, description: '权限不足，需要管理员角色' })
  @RequireAdmin()
  @Post()
  create(@Body() createFilterConditionDto: CreateFilterConditionDto) {
    return this.filterConditionsService.create(createFilterConditionDto);
  }

  @ApiOperation({
    summary: '获取所有筛选条件',
    description: '获取系统中所有可用的筛选条件',
  })
  @ApiQuery({
    name: 'typeId',
    description: '筛选条件类型ID',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: '获取筛选条件列表成功',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: '雾化机理' },
          description: { type: 'string', example: '液体燃料雾化过程机理研究' },
          createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
          updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
          typeId: { type: 'number', example: 1 },
          type: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: '知识点' },
              description: { type: 'string', example: '文章涉及的知识点分类' },
            },
          },
        },
      },
    },
  })
  @Public()
  @Get()
  findAll(@Query('typeId') typeId?: string) {
    if (typeId) {
      return this.filterConditionsService.findByType(+typeId);
    }
    return this.filterConditionsService.findAll();
  }

  @ApiOperation({
    summary: '根据ID获取筛选条件',
    description: '获取指定筛选条件的详细信息，包括关联的文章列表',
  })
  @ApiParam({ name: 'id', description: '筛选条件ID' })
  @ApiResponse({ status: 200, description: '获取筛选条件成功' })
  @ApiResponse({ status: 404, description: '筛选条件不存在' })
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.filterConditionsService.findOne(+id);
  }

  @ApiOperation({
    summary: '更新筛选条件',
    description: '更新筛选条件信息，需要管理员或教师权限',
  })
  @ApiParam({ name: 'id', description: '筛选条件ID' })
  @ApiBody({ type: UpdateFilterConditionDto })
  @ApiResponse({ status: 200, description: '筛选条件更新成功' })
  @ApiResponse({ status: 404, description: '筛选条件不存在' })
  @ApiResponse({ status: 409, description: '筛选条件名称已存在' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @RequireAdminOrTeacher()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFilterConditionDto: UpdateFilterConditionDto,
  ) {
    return this.filterConditionsService.update(+id, updateFilterConditionDto);
  }

  @ApiOperation({
    summary: '删除筛选条件',
    description:
      '删除筛选条件，需要管理员权限。注意：如果筛选条件还被文章使用，将无法删除',
  })
  @ApiParam({ name: 'id', description: '筛选条件ID' })
  @ApiResponse({ status: 200, description: '筛选条件删除成功' })
  @ApiResponse({ status: 404, description: '筛选条件不存在' })
  @ApiResponse({ status: 409, description: '无法删除，该筛选条件还被文章使用' })
  @ApiResponse({ status: 403, description: '权限不足，需要管理员角色' })
  @RequireAdmin()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.filterConditionsService.remove(+id);
  }
}
