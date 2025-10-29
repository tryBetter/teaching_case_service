import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsInt,
} from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({
    description:
      '笔记内容，支持字符串、JSON对象转换的字符串、Markdown字符串等大部分特殊格式的字符串数据',
    example: '这篇文章很有用，特别是关于NestJS的依赖注入部分。',
  })
  @IsString({ message: '笔记内容必须是字符串' })
  @IsNotEmpty({ message: '笔记内容不能为空' })
  content: string;

  @ApiProperty({
    description: '关联的文章ID',
    example: 1,
    minimum: 1,
    type: 'integer',
  })
  @IsNumber({}, { message: '文章ID必须是数字' })
  @IsInt({ message: '文章ID必须是整数' })
  @IsPositive({ message: '文章ID必须是正数' })
  articleId: number;
}
