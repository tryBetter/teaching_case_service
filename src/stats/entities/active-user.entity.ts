import { ApiProperty } from '@nestjs/swagger';

export class ActiveUser {
  @ApiProperty({ description: '用户ID', example: 1 })
  id: number;

  @ApiProperty({ description: '用户姓名', example: '张老师' })
  name: string;

  @ApiProperty({ description: '用户邮箱', example: 'teacher@example.com' })
  email: string;

  @ApiProperty({ description: '用户角色', example: '教师' })
  role: string;

  @ApiProperty({ description: '文章数量', example: 15 })
  articleCount: number;

  @ApiProperty({
    description: '最后活跃时间',
    example: '2024-01-01T00:00:00.000Z',
  })
  lastActiveAt: Date;

  @ApiProperty({ description: '评论数量', example: 45 })
  commentCount: number;

  @ApiProperty({ description: '笔记数量', example: 12 })
  noteCount: number;
}
