import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateTeacherAssistantDto {
  @ApiProperty({
    description: '教师用户ID',
    example: 1,
    type: 'number',
  })
  @IsInt()
  @IsNotEmpty()
  teacherId: number;

  @ApiProperty({
    description: '助教用户ID',
    example: 2,
    type: 'number',
  })
  @IsInt()
  @IsNotEmpty()
  assistantId: number;
}
