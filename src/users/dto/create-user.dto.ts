import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '../../auth/enums/user-role.enum';

export class CreateUserDto {
  @ApiProperty({ description: '用户邮箱', example: 'user@example.com' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @ApiProperty({ description: '用户姓名', example: '张三', required: false })
  @IsOptional()
  @IsString({ message: '姓名必须是字符串' })
  name?: string;

  @ApiProperty({ description: '用户密码', example: 'password123' })
  @IsString({ message: '密码必须是字符串' })
  password: string;

  @ApiProperty({
    description: '用户角色',
    enum: UserRole,
    example: UserRole.STUDENT,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: '角色必须是有效的用户角色' })
  role?: UserRole;
}
