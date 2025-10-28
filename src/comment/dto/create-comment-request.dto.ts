import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';

export class CreateCommentRequestDto {
  @ApiProperty({
    description: '评论内容',
    example: '这是一条很有用的评论！',
  })
  @IsString({ message: '评论内容必须是字符串' })
  @IsNotEmpty({ message: '评论内容不能为空' })
  content: string;

  @ApiProperty({
    description: '被评论的文章ID',
    example: 1,
  })
  @IsNumber({}, { message: '文章ID必须是数字' })
  @IsPositive({ message: '文章ID必须是正数' })
  articleId: number;

  @ApiProperty({
    description: '父评论ID，用于楼中楼回复，可选',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: '父评论ID必须是数字' })
  @IsPositive({ message: '父评论ID必须是正数' })
  parentId?: number;
}
