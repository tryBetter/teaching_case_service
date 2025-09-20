import { PartialType } from '@nestjs/swagger';
import { CreateFilterConditionDto } from './create-filter-condition.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  IsInt,
  IsPositive,
} from 'class-validator';

export class UpdateFilterConditionDto extends PartialType(
  CreateFilterConditionDto,
) {
  @ApiProperty({
    description: '筛选条件名称',
    example: '雾化机理',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  name?: string;

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
    required: false,
  })
  @IsNumber()
  @IsInt()
  @IsPositive()
  @IsOptional()
  typeId?: number;
}
