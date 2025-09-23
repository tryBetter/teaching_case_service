import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ description: '角色名称', example: '高级教师' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: '角色描述',
    example: '拥有高级权限的教师角色',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '是否为系统角色', example: false })
  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;

  @ApiPropertyOptional({ description: '是否启用', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
