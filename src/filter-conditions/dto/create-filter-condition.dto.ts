import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsInt,
  IsPositive,
} from 'class-validator';

export class CreateFilterConditionDto {
  @ApiProperty({
    description: '筛选条件名称',
    example: '雾化机理',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: '筛选条件描述',
    example: '液体燃料雾化过程机理研究',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: '筛选条件类型ID',
    example: 1,
    required: true,
  })
  @IsNumber()
  @IsInt()
  @IsPositive()
  typeId: number;
}
