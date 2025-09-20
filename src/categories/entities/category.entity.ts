import { ApiProperty } from '@nestjs/swagger';

export class Category {
  @ApiProperty({ description: '分类ID', example: 1 })
  id: number;

  @ApiProperty({ description: '分类名称', example: '科研案例' })
  name: string;

  @ApiProperty({
    description: '分类描述',
    example: '科研相关的教学案例',
    required: false,
  })
  description?: string;

  @ApiProperty({ description: '创建时间', example: '2023-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间', example: '2023-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ description: '关联的文章列表', required: false })
  articles?: any[];
}
