import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: '用户邮箱', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: '用户姓名', example: '张三', required: false })
  name?: string;

  @ApiProperty({ description: '用户密码', example: 'password123' })
  password: string;
}
