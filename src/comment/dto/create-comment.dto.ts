import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    description: '评论内容',
    example: '这是一条很有用的评论！',
  })
  content: string;

  @ApiProperty({
    description: '评论作者ID',
    example: 1,
  })
  authorId: number;

  @ApiProperty({
    description: '被评论的文章ID',
    example: 1,
  })
  articleId: number;

  @ApiProperty({
    description: '父评论ID，用于楼中楼回复，可选',
    example: 1,
    required: false,
  })
  parentId?: number;
}
