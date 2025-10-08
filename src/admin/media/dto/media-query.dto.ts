import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export class MediaQueryDto {
  @ApiProperty({
    description: '页码',
    example: 1,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: '每页数量',
    example: 10,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({
    description: '媒体类型',
    enum: MediaType,
    required: false,
  })
  @IsOptional()
  @IsEnum(MediaType)
  type?: MediaType;

  @ApiProperty({
    description: '文件名搜索关键词',
    example: 'image',
    required: false,
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({
    description: '最小文件大小（字节）',
    example: 1024,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minSize?: number;

  @ApiProperty({
    description: '最大文件大小（字节）',
    example: 10485760,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxSize?: number;

  @ApiProperty({
    description: '开始日期',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: '结束日期',
    example: '2024-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: '排序字段',
    example: 'createdAt',
    enum: ['createdAt', 'size', 'type', 'originalName'],
    required: false,
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiProperty({
    description: '排序方向',
    example: 'desc',
    enum: ['asc', 'desc'],
    required: false,
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class MediaStatsDto {
  @ApiProperty({ description: '总媒体文件数' })
  totalMedia: number;

  @ApiProperty({ description: '图片文件数' })
  imageCount: number;

  @ApiProperty({ description: '视频文件数' })
  videoCount: number;

  @ApiProperty({ description: '总文件大小（字节）' })
  totalSize: number;

  @ApiProperty({ description: '平均文件大小（字节）' })
  averageSize: number;

  @ApiProperty({ description: '今日上传文件数' })
  todayUploads: number;

  @ApiProperty({ description: '本周上传文件数' })
  weekUploads: number;

  @ApiProperty({ description: '本月上传文件数' })
  monthUploads: number;
}
