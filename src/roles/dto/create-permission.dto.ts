import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({
    description: '权限代码，格式为 "模块:操作"，必须唯一',
    example: 'user:create',
    pattern: '^[a-z]+:[a-z]+$',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: '权限名称，用于显示给用户',
    example: '创建用户',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: '权限描述，详细说明权限的作用和用途',
    example: '允许创建新用户，包括设置用户基本信息、角色分配等',
    maxLength: 200,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: '所属模块，表示权限所属的业务模块',
    example: 'user',
    enum: [
      'user',
      'article',
      'media',
      'comment',
      'favorite',
      'note',
      'system',
      'role',
    ],
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  module: string;

  @ApiProperty({
    description: '操作类型，表示具体的操作行为',
    example: 'create',
    enum: [
      'create',
      'read',
      'update',
      'delete',
      'list',
      'publish',
      'upload',
      'admin',
      'manage',
      'approve',
    ],
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  action: string;
}
