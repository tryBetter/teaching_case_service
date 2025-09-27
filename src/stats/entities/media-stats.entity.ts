import { ApiProperty } from '@nestjs/swagger';

export class MediaStats {
  @ApiProperty({ description: '总文件数量', example: 1250 })
  totalCount: number;

  @ApiProperty({ description: '总文件大小（字节）', example: 52428800 })
  totalSize: number;

  @ApiProperty({ description: '图片文件数量', example: 800 })
  imageCount: number;

  @ApiProperty({ description: '视频文件数量', example: 300 })
  videoCount: number;

  @ApiProperty({ description: '文档文件数量', example: 150 })
  documentCount: number;

  @ApiProperty({ description: '今日上传数量', example: 25 })
  todayUploadCount: number;

  @ApiProperty({ description: '今日上传大小（字节）', example: 1048576 })
  todayUploadSize: number;
}
