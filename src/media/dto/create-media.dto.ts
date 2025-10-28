import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsNumber,
  IsPositive,
} from 'class-validator';

export class CreateMediaDto {
  @ApiProperty({
    description: '媒体类型',
    example: 'IMAGE',
    enum: ['IMAGE', 'VIDEO'],
  })
  @IsEnum(['IMAGE', 'VIDEO'], { message: '媒体类型必须是 IMAGE 或 VIDEO' })
  type: 'IMAGE' | 'VIDEO';

  @ApiProperty({
    description: '媒体文件URL',
    example: 'https://example.com/image.jpg',
  })
  @IsString({ message: '媒体文件URL必须是字符串' })
  @IsNotEmpty({ message: '媒体文件URL不能为空' })
  url: string;

  @ApiProperty({
    description: '关联的文章ID列表',
    example: [1, 2, 3],
    type: [Number],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: '文章ID列表必须是数组' })
  @IsNumber({}, { each: true, message: '文章ID必须是数字' })
  articleIds?: number[];

  @ApiProperty({
    description: '上传者用户ID',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: '上传者用户ID必须是数字' })
  @IsPositive({ message: '上传者用户ID必须是正数' })
  uploaderId?: number;

  @ApiProperty({
    description: '原始文件名',
    example: 'image.jpg',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '原始文件名必须是字符串' })
  originalName?: string;

  @ApiProperty({
    description: '文件大小（字节）',
    example: 123456,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: '文件大小必须是数字' })
  @IsPositive({ message: '文件大小必须是正数' })
  size?: number;

  @ApiProperty({
    description: '预览图片的base64字符串',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '预览图片的base64字符串必须是字符串' })
  previewBase64?: string;
}
