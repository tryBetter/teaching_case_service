import { ApiProperty } from '@nestjs/swagger';

export class FilterConditionType {
  @ApiProperty({ description: '筛选条件类型ID', example: 1 })
  id: number;

  @ApiProperty({ description: '筛选条件类型名称', example: '知识点' })
  name: string;

  @ApiProperty({
    description: '筛选条件类型描述',
    example: '文章涉及的知识点分类',
    required: false,
  })
  description?: string;

  @ApiProperty({ description: '创建时间', example: '2023-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间', example: '2023-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ description: '关联的筛选条件列表', required: false })
  filterConditions?: any[];
}
