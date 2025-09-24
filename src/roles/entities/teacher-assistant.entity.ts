import { ApiProperty } from '@nestjs/swagger';

export class TeacherAssistantEntity {
  @ApiProperty({ description: '关联ID', example: 1 })
  id: number;

  @ApiProperty({ description: '教师用户ID', example: 1 })
  teacherId: number;

  @ApiProperty({ description: '助教用户ID', example: 2 })
  assistantId: number;

  @ApiProperty({ description: '创建时间', type: Date })
  createdAt: Date;

  @ApiProperty({ description: '更新时间', type: Date })
  updatedAt: Date;

  @ApiProperty({
    description: '教师信息',
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      name: { type: 'string', example: '张老师' },
      email: { type: 'string', example: 'teacher@example.com' },
    },
  })
  teacher?: any;

  @ApiProperty({
    description: '助教信息',
    type: 'object',
    properties: {
      id: { type: 'number', example: 2 },
      name: { type: 'string', example: '李助教' },
      email: { type: 'string', example: 'assistant@example.com' },
    },
  })
  assistant?: any;
}
