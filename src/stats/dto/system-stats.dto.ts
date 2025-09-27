import { ApiProperty } from '@nestjs/swagger';
import { HotArticle } from '../entities/hot-article.entity';
import { ActiveUser } from '../entities/active-user.entity';
import { MediaStats } from '../entities/media-stats.entity';

export class SystemStatsDto {
  @ApiProperty({ description: '用户总数', example: 150 })
  totalUsers: number;

  @ApiProperty({ description: '文章总数', example: 1250 })
  totalArticles: number;

  @ApiProperty({ description: '今日访问量', example: 1250 })
  todayVisits: number;

  @ApiProperty({ description: '总访问量', example: 125000 })
  totalVisits: number;

  @ApiProperty({ description: '资源文件统计', type: MediaStats })
  mediaStats: MediaStats;

  @ApiProperty({
    description: '热门文章列表',
    type: [HotArticle],
    example: [
      {
        id: 1,
        title: '热门教学案例',
        viewCount: 1250,
        likeCount: 89,
        commentCount: 23,
        createdAt: '2024-01-01T00:00:00.000Z',
        authorName: '张老师',
      },
    ],
  })
  hotArticles: HotArticle[];

  @ApiProperty({
    description: '活跃用户列表',
    type: [ActiveUser],
    example: [
      {
        id: 1,
        name: '张老师',
        email: 'teacher@example.com',
        role: '教师',
        articleCount: 15,
        lastActiveAt: '2024-01-01T00:00:00.000Z',
        commentCount: 45,
        noteCount: 12,
      },
    ],
  })
  activeUsers: ActiveUser[];

  @ApiProperty({ description: '统计时间', example: '2024-01-01T00:00:00.000Z' })
  generatedAt: Date;
}
