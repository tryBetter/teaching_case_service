import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({ description: '权限代码', example: 'user:create' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: '权限名称', example: '创建用户' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: '权限描述', example: '允许创建新用户' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '所属模块', example: 'user' })
  @IsString()
  @IsNotEmpty()
  module: string;

  @ApiProperty({ description: '操作类型', example: 'create' })
  @IsString()
  @IsNotEmpty()
  action: string;
}
