import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateNoteDto } from './create-note.dto';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateNoteDto extends PartialType(CreateNoteDto) {
  @ApiProperty({
    description: '笔记内容',
    example:
      '更新后的笔记内容，这篇文章很有用，特别是关于NestJS的依赖注入部分。',
    minLength: 1,
    maxLength: 2000,
    required: false,
  })
  @IsOptional()
  @IsString({ message: '笔记内容必须是字符串' })
  @IsNotEmpty({ message: '笔记内容不能为空' })
  content?: string;
}
