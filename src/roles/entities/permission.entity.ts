import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Permission {
  @ApiProperty({ description: '权限ID', example: 1 })
  id: number;

  @ApiProperty({ description: '权限代码', example: 'user:create' })
  code: string;

  @ApiProperty({ description: '权限名称', example: '创建用户' })
  name: string;

  @ApiPropertyOptional({ description: '权限描述', example: '允许创建新用户' })
  description?: string;

  @ApiProperty({ description: '所属模块', example: 'user' })
  module: string;

  @ApiProperty({ description: '操作类型', example: 'create' })
  action: string;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}
