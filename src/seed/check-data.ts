import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { PrismaService } from '../prisma/prisma.service';

async function checkData() {
  const app = await NestFactory.createApplicationContext(SeedModule);
  const prisma = app.get(PrismaService);

  try {
    console.log('📊 数据库数据统计报告');
    console.log('='.repeat(50));

    // 统计用户数据
    const userCount = await prisma.user.count();
    const usersByRole = await prisma.user.groupBy({
      by: ['roleId'],
      _count: true,
    });
    console.log(`👥 用户总数: ${userCount}`);

    // 获取角色信息
    const roles = await prisma.role.findMany();
    for (const userGroup of usersByRole) {
      const role = roles.find((r) => r.id === userGroup.roleId);
      console.log(`   - ${role?.name || '未知角色'}: ${userGroup._count} 个`);
    }

    // 统计文章数据
    const articleCount = await prisma.article.count();
    const publishedCount = await prisma.article.count({
      where: { published: true },
    });
    const featuredCount = await prisma.article.count({
      where: { featured: true },
    });
    console.log(`\n📝 文章总数: ${articleCount}`);
    console.log(`   - 已发布: ${publishedCount} 篇`);
    console.log(`   - 推荐文章: ${featuredCount} 篇`);

    // 统计评论数据
    const commentCount = await prisma.comment.count();
    const replyCount = await prisma.comment.count({
      where: { parentId: { not: null } },
    });
    console.log(`\n💬 评论总数: ${commentCount}`);
    console.log(`   - 回复评论: ${replyCount} 条`);

    // 统计收藏数据
    const favoriteCount = await prisma.favorite.count();
    console.log(`\n❤️ 收藏总数: ${favoriteCount}`);

    // 统计笔记数据
    const noteCount = await prisma.note.count();
    console.log(`\n📝 笔记总数: ${noteCount}`);

    // 统计媒体数据
    const mediaCount = await prisma.media.count();
    const imageCount = await prisma.media.count({
      where: { type: 'IMAGE' },
    });
    const videoCount = await prisma.media.count({
      where: { type: 'VIDEO' },
    });
    console.log(`\n🎬 媒体文件总数: ${mediaCount}`);
    console.log(`   - 图片: ${imageCount} 个`);
    console.log(`   - 视频: ${videoCount} 个`);

    // 统计热搜数据
    const hotSearchCount = await prisma.hotSearch.count();
    console.log(`\n🔥 热搜总数: ${hotSearchCount}`);

    // 统计教师-助教关联
    const teacherAssistantCount = await prisma.teacherAssistant.count();
    console.log(`\n👨‍🏫 教师-助教关联: ${teacherAssistantCount} 个`);

    // 统计评论点赞
    const commentLikeCount = await prisma.commentLike.count();
    console.log(`\n👍 评论点赞总数: ${commentLikeCount}`);

    // 统计分类数据
    const categoryCount = await prisma.category.count();
    console.log(`\n📂 分类总数: ${categoryCount}`);

    // 统计筛选条件
    const filterConditionCount = await prisma.filterCondition.count();
    console.log(`\n🔍 筛选条件总数: ${filterConditionCount}`);

    console.log('\n' + '='.repeat(50));
    console.log('✅ 数据统计完成！');
  } catch (error) {
    console.error('❌ 数据统计失败：', error);
  } finally {
    await app.close();
  }
}

checkData();
