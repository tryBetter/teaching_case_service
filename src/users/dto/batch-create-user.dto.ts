import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsInt, IsUrl } from 'class-validator';

export class BatchCreateUserDto {
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
    description: '角色ID',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: '角色ID必须是数字' })
  roleId?: number;

  @ApiProperty({
    description: '用户头像URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: '头像URL格式不正确' })
  avatar?: string;

  @ApiProperty({
    description: '用户专业',
    example: '计算机科学与技术',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '专业必须是字符串' })
  major?: string;
}

export class BatchCreateUserResult {
  @ApiProperty({ description: '成功创建的用户数量', example: 5 })
  successCount: number;

  @ApiProperty({ description: '失败的用户数量', example: 2 })
  failureCount: number;

  @ApiProperty({ description: '总处理数量', example: 7 })
  totalCount: number;

  @ApiProperty({
    description: '成功创建的用户列表',
    type: [BatchCreateUserDto],
  })
  successUsers: BatchCreateUserDto[];

  @ApiProperty({
    description: '失败的用户信息',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        user: { $ref: '#/components/schemas/BatchCreateUserDto' },
        error: { type: 'string', example: '邮箱已存在' },
        row: { type: 'number', example: 3 },
      },
    },
  })
  failedUsers: Array<{
    user: BatchCreateUserDto;
    error: string;
    row: number;
  }>;
}
