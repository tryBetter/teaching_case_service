import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Role {
  @ApiProperty({ description: '角色ID', example: 1 })
  id: number;

  @ApiProperty({ description: '角色名称', example: '高级教师' })
  name: string;

  @ApiPropertyOptional({
    description: '角色描述',
    example: '拥有高级权限的教师角色',
  })
  description?: string;

  @ApiProperty({ description: '是否为系统角色', example: false })
  isSystem: boolean;

  @ApiProperty({ description: '是否启用', example: true })
  isActive: boolean;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: '权限列表', type: [Object] })
  permissions?: any[];
}
