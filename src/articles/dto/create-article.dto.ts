import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsInt,
  IsPositive,
  IsArray,
} from 'class-validator';

export class CreateArticleDto {
  @ApiProperty({ description: '文章标题', example: '如何学习 NestJS' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: '文章内容',
    example: '这是一篇关于 NestJS 的学习文章...',
    required: false,
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({
    description: '文章封面图片URL',
    example: 'https://example.com/cover.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  cover?: string;

  @ApiProperty({
    description: '文章简介',
    example: '本文介绍了 NestJS 的基本概念和使用方法...',
    required: false,
  })
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiProperty({
    description: '文章关键词列表',
    example: ['NestJS', 'Node.js', 'TypeScript', '后端开发'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];

  @ApiProperty({
    description: '是否重点推荐',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @ApiProperty({ description: '是否发布', example: false, required: false })
  @IsBoolean()
  @IsOptional()
  published?: boolean;

  @ApiProperty({ description: '作者ID', example: 1 })
  @IsNumber()
  @IsInt()
  @IsPositive()
  authorId: number;

  @ApiProperty({
    description: `文章分类ID（必填）。可用分类如下：
    • 1 - 科研案例：科研相关的教学案例
    • 2 - 军事案例：军事相关的教学案例
    • 3 - 工程案例：工程相关的教学案例
    • 4 - 生活案例：生活相关的教学案例
    • 5 - 思政案例：思政相关的教学案例
    注意：可以通过 GET /categories 接口获取最新的分类列表`,
    example: 1,
    required: true,
  })
  @IsNumber()
  @IsInt()
  @IsPositive()
  categoryId: number;

  @ApiProperty({
    description: `筛选条件ID列表（选填，支持多选）。可用筛选条件按类型分组如下：
    
    【知识点类型】
    • 1 - 雾化机理：液体燃料雾化过程机理研究
    • 2 - 点火过程：燃烧室点火过程研究
    • 3 - 燃烧不稳定性：燃烧不稳定性机理分析
    • 4 - 高温燃气流动：高温燃气流动特性研究
    • 5 - 喷注器设计：喷注器设计理论与方法
    
    【发动机类型】
    • 6 - 液体火箭发动机：液体推进剂火箭发动机
    • 7 - 固体火箭发动机：固体推进剂火箭发动机
    • 8 - 超燃冲压发动机：超音速燃烧冲压发动机
    • 9 - 燃气涡轮发动机：燃气涡轮发动机
    • 10 - 组合发动机：组合循环发动机
    
    【难度等级】
    • 11 - 基础：研究生入门级别
    • 12 - 进阶：科研深度分析级别
    • 13 - 前沿：最新研究成果级别
    
    注意：可以通过 GET /filter-conditions 接口获取最新的筛选条件列表`,
    example: [1, 6, 11],
    type: [Number],
    required: false,
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @IsOptional()
  filterConditionIds?: number[];
}
