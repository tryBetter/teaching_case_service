import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { StatsService } from '../stats/stats.service';

async function testStats() {
  const app = await NestFactory.createApplicationContext(SeedModule);
  const statsService = app.get(StatsService);

  try {
    console.log('🧪 测试统计接口...');
    console.log('='.repeat(50));

    // 测试总体统计
    console.log('📊 测试总体统计接口...');
    const overviewStats = await statsService.getOverviewStats();
    console.log('✅ 总体统计:', {
      totalUsers: overviewStats.totalUsers,
      totalArticles: overviewStats.totalArticles,
      totalComments: overviewStats.totalComments,
      totalFavorites: overviewStats.totalFavorites,
    });

    // 测试用户统计
    console.log('\n👥 测试用户统计接口...');
    const userStats = await statsService.getUserStats();
    console.log('✅ 用户统计:', {
      totalUsers: userStats.totalUsers,
      todayNewUsers: userStats.todayNewUsers,
      activeUsers: userStats.activeUsers,
      roleStats: userStats.roleStats.length,
    });

    // 测试内容统计
    console.log('\n📝 测试内容统计接口...');
    const contentStats = await statsService.getContentStats();
    console.log('✅ 内容统计:', {
      totalArticles: contentStats.totalArticles,
      publishedArticles: contentStats.publishedArticles,
      totalComments: contentStats.totalComments,
      totalMedia: contentStats.totalMedia,
    });

    // 测试访问统计
    console.log('\n🌐 测试访问统计接口...');
    const visitStats = await statsService.getVisitStats();
    console.log('✅ 访问统计:', {
      todayVisits: visitStats.todayVisits,
      totalVisits: visitStats.totalVisits,
      averageDailyVisits: visitStats.averageDailyVisits,
    });

    // 测试时间范围统计
    console.log('\n📅 测试时间范围统计接口...');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date();
    const timeRangeStats = await statsService.getTimeRangeStats(
      startDate,
      endDate,
    );
    console.log('✅ 时间范围统计:', {
      users: timeRangeStats.users,
      articles: timeRangeStats.articles,
      comments: timeRangeStats.comments,
    });

    // 测试用户增长趋势
    console.log('\n📈 测试用户增长趋势接口...');
    const userGrowthTrend = await statsService.getUserGrowthTrend(7);
    console.log('✅ 用户增长趋势:', {
      totalGrowth: userGrowthTrend.totalGrowth,
      averageDailyGrowth: userGrowthTrend.averageDailyGrowth,
      dataPoints: userGrowthTrend.data.length,
    });

    // 测试内容增长趋势
    console.log('\n📊 测试内容增长趋势接口...');
    const contentGrowthTrend = await statsService.getContentGrowthTrend(7);
    console.log('✅ 内容增长趋势:', {
      articles: contentGrowthTrend.articles.length,
      comments: contentGrowthTrend.comments.length,
      favorites: contentGrowthTrend.favorites.length,
    });

    // 测试访问趋势
    console.log('\n📈 测试访问趋势接口...');
    const visitTrend = await statsService.getVisitTrend(7);
    console.log('✅ 访问趋势:', {
      totalVisits: visitTrend.totalVisits,
      peakVisits: visitTrend.peakVisits,
      dataPoints: visitTrend.data.length,
    });

    // 测试热门内容
    console.log('\n🔥 测试热门内容接口...');
    const popularContent = await statsService.getPopularContent(5);
    console.log('✅ 热门内容:', {
      popularArticles: popularContent.popularArticles.length,
      popularComments: popularContent.popularComments.length,
    });

    // 测试活跃用户
    console.log('\n👨‍💼 测试活跃用户接口...');
    const activeUsers = await statsService.getActiveUsers(10);
    console.log('✅ 活跃用户:', {
      totalActiveUsers: activeUsers.totalActiveUsers,
      todayActiveUsers: activeUsers.todayActiveUsers,
      activeUsersList: activeUsers.activeUsers.length,
    });

    console.log('\n' + '='.repeat(50));
    console.log('🎉 所有统计接口测试完成！');
  } catch (error) {
    console.error('❌ 统计接口测试失败：', error);
  } finally {
    await app.close();
  }
}

void testStats();
