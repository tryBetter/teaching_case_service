import { ApiProperty } from '@nestjs/swagger';

export class HotSearch {
  @ApiProperty({ description: '热搜词条ID', example: 1 })
  id: number;

  @ApiProperty({ description: '热搜关键词', example: 'NestJS 教程' })
  keyword: string;

  @ApiProperty({
    description: '热搜描述',
    example: '最新的 NestJS 学习教程和最佳实践',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: '排序权重，数字越大越靠前',
    example: 100,
  })
  order: number;

  @ApiProperty({ description: '是否启用', example: true })
  isActive: boolean;

  @ApiProperty({ description: '点击次数', example: 1250 })
  clickCount: number;

  @ApiProperty({ description: '创建时间', example: '2023-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间', example: '2023-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
