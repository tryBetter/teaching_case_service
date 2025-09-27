import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class LikeCommentDto {
  @ApiProperty({
    description: '评论ID',
    example: 1,
  })
  @IsNotEmpty({ message: '评论ID不能为空' })
  @IsNumber({}, { message: '评论ID必须是数字' })
  commentId: number;
}
