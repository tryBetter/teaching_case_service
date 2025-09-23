import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayNotEmpty } from 'class-validator';

export class AssignPermissionsDto {
  @ApiProperty({
    description: '权限ID数组，此操作会替换角色的所有现有权限',
    example: [1, 2, 3, 5, 8],
    type: [Number],
    minItems: 1,
    maxItems: 100,
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  permissionIds: number[];
}
