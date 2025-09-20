import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    description: '分类名称',
    example: '科研案例',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: '分类描述',
    example: '科研相关的教学案例',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
