import { ApiProperty } from '@nestjs/swagger';

export class CreateFavoriteDto {
  @ApiProperty({
    description: '文章ID',
    example: 1,
  })
  articleId: number;
}
