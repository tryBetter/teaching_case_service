import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    description: '角色名称，必须唯一',
    example: '高级教师',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: '角色描述，详细说明角色的用途和职责',
    example: '拥有高级权限的教师角色，可以管理课程、审核学生作业等',
    maxLength: 200,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: '是否为系统角色。系统角色不能删除，通常用于系统预定义角色',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;

  @ApiPropertyOptional({
    description: '是否启用该角色。禁用的角色不会在用户角色选择中显示',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
