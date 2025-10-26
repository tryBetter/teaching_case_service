import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsInt } from 'class-validator';

export class CreateViewHistoryDto {
  @ApiProperty({
    description: '要查看的文章ID，必须是已存在的文章',
    example: 1,
    minimum: 1,
    type: 'integer',
  })
  @IsNumber({}, { message: '文章ID必须是数字' })
  @IsInt({ message: '文章ID必须是整数' })
  @IsPositive({ message: '文章ID必须是正数' })
  articleId: number;
}
