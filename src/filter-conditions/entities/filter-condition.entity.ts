import { ApiProperty } from '@nestjs/swagger';

export class FilterCondition {
  @ApiProperty({ description: '筛选条件ID', example: 1 })
  id: number;

  @ApiProperty({ description: '筛选条件名称', example: '雾化机理' })
  name: string;

  @ApiProperty({
    description: '筛选条件描述',
    example: '液体燃料雾化过程机理研究',
    required: false,
  })
  description?: string;

  @ApiProperty({ description: '创建时间', example: '2023-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间', example: '2023-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ description: '筛选条件类型ID', example: 1 })
  typeId: number;

  @ApiProperty({ description: '关联的筛选条件类型', required: false })
  type?: any;

  @ApiProperty({ description: '关联的文章列表', required: false })
  articles?: any[];
}
