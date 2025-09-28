import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Article, Media, Comment, Note } from '../../generated/prisma';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TestDataSeedService {
  constructor(private prisma: PrismaService) {}

  /**
   * 生成全面的测试数据
   */
  async generateTestData() {
    console.log('开始生成测试数据...');

    try {
      // 1. 确保基础数据存在
      await this.ensureBaseData();

      // 2. 创建测试用户
      const users = await this.createTestUsers();

      // 3. 创建测试媒体文件
      const mediaFiles = await this.createTestMedia();

      // 4. 创建测试文章
      const articles = await this.createTestArticles(users, mediaFiles);

      // 5. 创建测试评论
      await this.createTestComments(users, articles);

      // 6. 创建测试收藏
      await this.createTestFavorites(users, articles);

      // 7. 创建测试笔记
      await this.createTestNotes(users, articles);

      // 8. 创建测试热搜
      await this.createTestHotSearches();

      // 9. 创建教师-助教关联
      await this.createTestTeacherAssistantRelations(users);

      // 10. 创建评论点赞
      await this.createTestCommentLikes(users);

      console.log('测试数据生成完成！');
    } catch (error) {
      console.error('测试数据生成失败：', error);
      throw error;
    }
  }

  /**
   * 确保基础数据存在
   */
  private async ensureBaseData() {
    console.log('检查基础数据...');

    // 检查角色
    const roles = await this.prisma.role.findMany();
    if (roles.length === 0) {
      throw new Error('请先运行基础seed脚本创建角色和权限');
    }

    // 检查分类
    const categories = await this.prisma.category.findMany();
    if (categories.length === 0) {
      throw new Error('请先运行基础seed脚本创建分类');
    }

    // 检查筛选条件
    const filterConditions = await this.prisma.filterCondition.findMany();
    if (filterConditions.length === 0) {
      throw new Error('请先运行基础seed脚本创建筛选条件');
    }

    console.log('基础数据检查完成');
  }

  /**
   * 创建测试用户
   */
  private async createTestUsers() {
    console.log('创建测试用户...');

    const roles = await this.prisma.role.findMany();
    const superAdminRole = roles.find((r) => r.name === '超级管理员');
    const adminRole = roles.find((r) => r.name === '管理员');
    const teacherLeaderRole = roles.find((r) => r.name === '教师组长');
    const teacherRole = roles.find((r) => r.name === '教师');
    const assistantLeaderRole = roles.find((r) => r.name === '助教组长');
    const assistantRole = roles.find((r) => r.name === '助教');
    const studentRole = roles.find((r) => r.name === '学生');

    const testUsers = [
      // 超级管理员
      {
        email: 'superadmin@test.com',
        name: '测试超级管理员',
        password: 'TestSuperAdmin123!',
        roleId: superAdminRole?.id,
      },
      // 管理员
      {
        email: 'admin@test.com',
        name: '测试管理员',
        password: 'TestAdmin123!',
        roleId: adminRole?.id,
      },
      // 教师组长
      {
        email: 'teacher-leader@test.com',
        name: '张教授',
        password: 'TestTeacher123!',
        roleId: teacherLeaderRole?.id,
      },
      {
        email: 'teacher-leader2@test.com',
        name: '李教授',
        password: 'TestTeacher123!',
        roleId: teacherLeaderRole?.id,
      },
      // 教师
      {
        email: 'teacher1@test.com',
        name: '王老师',
        password: 'TestTeacher123!',
        roleId: teacherRole?.id,
      },
      {
        email: 'teacher2@test.com',
        name: '刘老师',
        password: 'TestTeacher123!',
        roleId: teacherRole?.id,
      },
      {
        email: 'teacher3@test.com',
        name: '陈老师',
        password: 'TestTeacher123!',
        roleId: teacherRole?.id,
      },
      // 助教组长
      {
        email: 'assistant-leader@test.com',
        name: '赵助教长',
        password: 'TestAssistant123!',
        roleId: assistantLeaderRole?.id,
      },
      // 助教
      {
        email: 'assistant1@test.com',
        name: '孙助教',
        password: 'TestAssistant123!',
        roleId: assistantRole?.id,
      },
      {
        email: 'assistant2@test.com',
        name: '周助教',
        password: 'TestAssistant123!',
        roleId: assistantRole?.id,
      },
      {
        email: 'assistant3@test.com',
        name: '吴助教',
        password: 'TestAssistant123!',
        roleId: assistantRole?.id,
      },
      // 学生
      {
        email: 'student1@test.com',
        name: '小明',
        password: 'TestStudent123!',
        roleId: studentRole?.id,
      },
      {
        email: 'student2@test.com',
        name: '小红',
        password: 'TestStudent123!',
        roleId: studentRole?.id,
      },
      {
        email: 'student3@test.com',
        name: '小李',
        password: 'TestStudent123!',
        roleId: studentRole?.id,
      },
      {
        email: 'student4@test.com',
        name: '小王',
        password: 'TestStudent123!',
        roleId: studentRole?.id,
      },
      {
        email: 'student5@test.com',
        name: '小张',
        password: 'TestStudent123!',
        roleId: studentRole?.id,
      },
    ];

    const createdUsers: User[] = [];
    for (const userData of testUsers) {
      if (!userData.roleId) continue;

      // 检查用户是否已存在
      const existingUser = await this.prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        console.log(`用户已存在: ${userData.email}`);
        createdUsers.push(existingUser);
        continue;
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // 创建用户
      const user = await this.prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          password: hashedPassword,
          roleId: userData.roleId,
        },
      });

      createdUsers.push(user);
      console.log(`创建用户: ${userData.email} (${userData.name})`);
    }

    console.log(`创建了 ${createdUsers.length} 个测试用户`);
    return createdUsers;
  }

  /**
   * 创建测试媒体文件
   */
  private async createTestMedia() {
    console.log('创建测试媒体文件...');

    const testMedia = [
      {
        type: 'IMAGE' as const,
        url: '/uploads/images/test-image-1.jpg',
      },
      {
        type: 'IMAGE' as const,
        url: '/uploads/images/test-image-2.jpg',
      },
      {
        type: 'IMAGE' as const,
        url: '/uploads/images/test-image-3.jpg',
      },
      {
        type: 'VIDEO' as const,
        url: '/uploads/videos/test-video-1.mp4',
      },
      {
        type: 'VIDEO' as const,
        url: '/uploads/videos/test-video-2.mp4',
      },
      {
        type: 'IMAGE' as const,
        url: '/uploads/images/engine-diagram.jpg',
      },
      {
        type: 'IMAGE' as const,
        url: '/uploads/images/combustion-chamber.jpg',
      },
      {
        type: 'VIDEO' as const,
        url: '/uploads/videos/engine-test.mp4',
      },
    ];

    const createdMedia: Media[] = [];
    for (const mediaData of testMedia) {
      const media = await this.prisma.media.create({
        data: mediaData,
      });
      createdMedia.push(media);
    }

    console.log(`创建了 ${createdMedia.length} 个测试媒体文件`);
    return createdMedia;
  }

  /**
   * 创建测试文章
   */
  private async createTestArticles(users: User[], mediaFiles: Media[]) {
    console.log('创建测试文章...');

    const categories = await this.prisma.category.findMany();
    const filterConditions = await this.prisma.filterCondition.findMany();

    // 获取教师用户
    const teachers = users.filter(
      (u) => u.name?.includes('教授') || u.name?.includes('老师'),
    );

    if (teachers.length === 0) {
      throw new Error('没有找到教师用户');
    }

    const testArticles = [
      {
        title: '液体火箭发动机燃烧室设计原理',
        content: `# 液体火箭发动机燃烧室设计原理

## 概述
液体火箭发动机燃烧室是发动机的核心部件，负责将液体燃料和氧化剂混合并燃烧，产生高温高压燃气推动火箭。

## 主要组成部分
1. 燃烧室本体
2. 喷注器
3. 冷却系统
4. 点火系统

## 设计要点
- 燃烧效率优化
- 热防护设计
- 结构强度计算
- 冷却系统设计

## 案例分析
通过分析某型号液体火箭发动机的燃烧室设计，深入理解设计原理和工程实践。

## 结论
燃烧室设计需要综合考虑热力学、流体力学、材料科学等多个学科的知识。`,
        summary:
          '深入分析液体火箭发动机燃烧室的设计原理，包括结构组成、设计要点和工程实践。',
        keywords: [
          '液体火箭发动机',
          '燃烧室',
          '设计原理',
          '喷注器',
          '冷却系统',
        ],
        featured: true,
        published: true,
        cover: '/uploads/images/engine-diagram.jpg',
        authorId: teachers[0].id,
        categoryId: categories[0]?.id || 1, // 科研案例
        filterConditionIds: filterConditions.slice(0, 3).map((fc) => fc.id),
      },
      {
        title: '固体火箭发动机推进剂配方优化',
        content: `# 固体火箭发动机推进剂配方优化

## 引言
固体火箭发动机具有结构简单、可靠性高的特点，推进剂配方直接影响发动机性能。

## 推进剂组成
1. 氧化剂：通常使用高氯酸铵
2. 燃料：铝粉等金属燃料
3. 粘合剂：HTPB等
4. 添加剂：燃烧调节剂

## 配方优化方法
- 理论计算
- 实验验证
- 性能测试
- 安全性评估

## 优化目标
- 提高比冲
- 降低燃速
- 改善力学性能
- 保证安全性

## 工程应用
介绍某型固体火箭发动机推进剂配方的优化过程和效果。`,
        summary:
          '研究固体火箭发动机推进剂配方优化方法，提高发动机性能和安全性。',
        keywords: ['固体火箭发动机', '推进剂', '配方优化', '比冲', '安全性'],
        featured: false,
        published: true,
        cover: '/uploads/images/combustion-chamber.jpg',
        authorId: teachers[1]?.id || teachers[0].id,
        categoryId: categories[1]?.id || 2, // 军事案例
        filterConditionIds: filterConditions.slice(1, 4).map((fc) => fc.id),
      },
      {
        title: '超燃冲压发动机燃烧不稳定性研究',
        content: `# 超燃冲压发动机燃烧不稳定性研究

## 研究背景
超燃冲压发动机在高超声速飞行器中的应用面临燃烧不稳定性的挑战。

## 不稳定性机理
1. 声学耦合
2. 热声振荡
3. 流动不稳定性
4. 化学反应耦合

## 研究方法
- 数值模拟
- 实验研究
- 理论分析
- 稳定性判据

## 控制策略
- 主动控制
- 被动控制
- 结构优化
- 燃烧器设计

## 发展趋势
展望超燃冲压发动机燃烧不稳定性研究的发展方向。`,
        summary:
          '研究超燃冲压发动机燃烧不稳定性机理和控制策略，为高超声速飞行器发展提供支撑。',
        keywords: ['超燃冲压发动机', '燃烧不稳定性', '高超声速', '控制策略'],
        featured: true,
        published: true,
        cover: '/uploads/images/test-image-1.jpg',
        authorId: teachers[0].id,
        categoryId: categories[0]?.id || 1, // 科研案例
        filterConditionIds: filterConditions.slice(2, 5).map((fc) => fc.id),
      },
      {
        title: '燃气涡轮发动机叶片冷却技术',
        content: `# 燃气涡轮发动机叶片冷却技术

## 技术背景
燃气涡轮发动机叶片工作环境恶劣，需要先进的冷却技术保证可靠性。

## 冷却方式
1. 对流冷却
2. 冲击冷却
3. 气膜冷却
4. 复合冷却

## 设计参数
- 冷却效率
- 压力损失
- 结构强度
- 制造工艺

## 数值模拟
CFD方法在叶片冷却设计中的应用。

## 实验验证
风洞试验和发动机台架试验验证。

## 工程应用
介绍某型燃气涡轮发动机叶片冷却系统的设计。`,
        summary:
          '研究燃气涡轮发动机叶片冷却技术，提高叶片工作可靠性和发动机性能。',
        keywords: ['燃气涡轮发动机', '叶片冷却', 'CFD', '热防护'],
        featured: false,
        published: true,
        cover: '/uploads/images/test-image-2.jpg',
        authorId: teachers[2]?.id || teachers[1]?.id || teachers[0].id,
        categoryId: categories[2]?.id || 3, // 工程案例
        filterConditionIds: filterConditions.slice(0, 2).map((fc) => fc.id),
      },
      {
        title: '组合发动机系统集成技术',
        content: `# 组合发动机系统集成技术

## 系统概述
组合发动机结合多种推进方式，适应不同飞行阶段的需求。

## 组合方式
1. 火箭-冲压组合
2. 涡轮-冲压组合
3. 火箭-涡轮组合
4. 多种组合方式

## 集成挑战
- 模态转换
- 系统协调
- 重量控制
- 可靠性保证

## 关键技术
- 进气道设计
- 燃烧室共用
- 控制系统
- 热管理

## 应用前景
组合发动机在空天飞行器中的应用前景。`,
        summary: '研究组合发动机系统集成技术，实现多种推进方式的有机结合。',
        keywords: ['组合发动机', '系统集成', '模态转换', '空天飞行器'],
        featured: false,
        published: false, // 未发布文章
        cover: '/uploads/images/test-image-3.jpg',
        authorId: teachers[0].id,
        categoryId: categories[0]?.id || 1, // 科研案例
        filterConditionIds: filterConditions.slice(3, 6).map((fc) => fc.id),
      },
    ];

    const createdArticles: Article[] = [];
    for (const articleData of testArticles) {
      const { filterConditionIds, ...articleCreateData } = articleData;

      // 创建文章
      const article = await this.prisma.article.create({
        data: articleCreateData,
      });

      // 关联筛选条件
      if (filterConditionIds && filterConditionIds.length > 0) {
        const articleFilterConditions = filterConditionIds.map(
          (conditionId) => ({
            articleId: article.id,
            filterConditionId: conditionId,
          }),
        );

        await this.prisma.articleFilterCondition.createMany({
          data: articleFilterConditions,
        });
      }

      // 关联媒体文件（随机选择一些媒体文件）
      const randomMedia = mediaFiles.slice(
        0,
        Math.floor(Math.random() * 3) + 1,
      );
      for (const media of randomMedia) {
        await this.prisma.articleMedia.create({
          data: {
            articleId: article.id,
            mediaId: media.id,
          },
        });
      }

      createdArticles.push(article);
      console.log(`创建文章: ${article.title}`);
    }

    console.log(`创建了 ${createdArticles.length} 个测试文章`);
    return createdArticles;
  }

  /**
   * 创建测试评论
   */
  private async createTestComments(users: User[], articles: Article[]) {
    console.log('创建测试评论...');

    const students = users.filter((u) => u.name?.includes('小'));
    const teachers = users.filter(
      (u) => u.name?.includes('教授') || u.name?.includes('老师'),
    );
    const assistants = users.filter((u) => u.name?.includes('助教'));

    const testComments = [
      {
        content: '这篇文章写得很好，让我对液体火箭发动机有了更深入的理解。',
        authorId: students[0]?.id,
        articleId: articles[0]?.id,
      },
      {
        content: '燃烧室设计确实需要考虑很多因素，特别是热防护方面。',
        authorId: students[1]?.id,
        articleId: articles[0]?.id,
      },
      {
        content: '老师，我想了解更多关于喷注器设计的内容。',
        authorId: students[2]?.id,
        articleId: articles[0]?.id,
      },
      {
        content: '固体火箭发动机的推进剂配方确实很关键，需要平衡多个性能指标。',
        authorId: teachers[0]?.id,
        articleId: articles[1]?.id,
      },
      {
        content: '超燃冲压发动机的燃烧不稳定性是一个很有意思的研究方向。',
        authorId: assistants[0]?.id,
        articleId: articles[2]?.id,
      },
      {
        content: '叶片冷却技术的数值模拟部分很有参考价值。',
        authorId: students[3]?.id,
        articleId: articles[3]?.id,
      },
      {
        content: '组合发动机的模态转换确实是个技术难点。',
        authorId: teachers[1]?.id,
        articleId: articles[4]?.id,
      },
    ];

    const createdComments: Comment[] = [];
    for (const commentData of testComments) {
      if (!commentData.authorId || !commentData.articleId) continue;

      const comment = await this.prisma.comment.create({
        data: commentData,
      });
      createdComments.push(comment);
    }

    // 创建一些回复评论（楼中楼）
    const replyComments = [
      {
        content: '是的，喷注器的设计直接影响燃烧效率。',
        authorId: teachers[0]?.id,
        articleId: articles[0]?.id,
        parentId: createdComments[2]?.id, // 回复第三个评论
      },
      {
        content: '建议你可以看看相关的CFD仿真案例。',
        authorId: assistants[1]?.id,
        articleId: articles[3]?.id,
        parentId: createdComments[5]?.id, // 回复第六个评论
      },
    ];

    for (const replyData of replyComments) {
      if (!replyData.authorId || !replyData.articleId || !replyData.parentId)
        continue;

      await this.prisma.comment.create({
        data: replyData,
      });
    }

    console.log(
      `创建了 ${createdComments.length} 个测试评论和 ${replyComments.length} 个回复`,
    );
  }

  /**
   * 创建测试收藏
   */
  private async createTestFavorites(users: User[], articles: Article[]) {
    console.log('创建测试收藏...');

    const students = users.filter((u) => u.name?.includes('小'));
    const teachers = users.filter(
      (u) => u.name?.includes('教授') || u.name?.includes('老师'),
    );

    let favoriteCount = 0;

    // 学生收藏一些文章
    for (const student of students) {
      const articlesToFavorite = articles.slice(
        0,
        Math.floor(Math.random() * 3) + 1,
      );
      for (const article of articlesToFavorite) {
        try {
          await this.prisma.favorite.create({
            data: {
              userId: student.id,
              articleId: article.id,
            },
          });
          favoriteCount++;
        } catch {
          // 可能已经收藏过了，跳过
        }
      }
    }

    // 教师收藏一些文章
    for (const teacher of teachers) {
      const articlesToFavorite = articles.slice(
        0,
        Math.floor(Math.random() * 2) + 1,
      );
      for (const article of articlesToFavorite) {
        try {
          await this.prisma.favorite.create({
            data: {
              userId: teacher.id,
              articleId: article.id,
            },
          });
          favoriteCount++;
        } catch {
          // 可能已经收藏过了，跳过
        }
      }
    }

    console.log(`创建了 ${favoriteCount} 个测试收藏`);
  }

  /**
   * 创建测试笔记
   */
  private async createTestNotes(users: User[], articles: Article[]) {
    console.log('创建测试笔记...');

    const students = users.filter((u) => u.name?.includes('小'));

    const testNotes = [
      {
        content:
          '液体火箭发动机燃烧室的关键设计参数：\n1. 燃烧室压力\n2. 燃烧温度\n3. 停留时间\n4. 混合比',
        userId: students[0]?.id,
        articleId: articles[0]?.id,
      },
      {
        content:
          '固体火箭发动机推进剂配方优化的要点：\n- 比冲最大化\n- 燃速适中\n- 力学性能良好\n- 安全性保证',
        userId: students[1]?.id,
        articleId: articles[1]?.id,
      },
      {
        content:
          '超燃冲压发动机燃烧不稳定性的控制方法：\n1. 主动控制\n2. 被动控制\n3. 结构优化',
        userId: students[2]?.id,
        articleId: articles[2]?.id,
      },
      {
        content:
          '燃气涡轮发动机叶片冷却技术总结：\n- 对流冷却\n- 冲击冷却\n- 气膜冷却\n- 复合冷却',
        userId: students[3]?.id,
        articleId: articles[3]?.id,
      },
    ];

    const createdNotes: Note[] = [];
    for (const noteData of testNotes) {
      if (!noteData.userId || !noteData.articleId) continue;

      const note = await this.prisma.note.create({
        data: noteData,
      });
      createdNotes.push(note);
    }

    console.log(`创建了 ${createdNotes.length} 个测试笔记`);
  }

  /**
   * 创建测试热搜
   */
  private async createTestHotSearches() {
    console.log('创建测试热搜...');

    const testHotSearches = [
      {
        keyword: '液体火箭发动机',
        description: '液体火箭发动机相关技术',
        order: 10,
        isActive: true,
        clickCount: 156,
      },
      {
        keyword: '燃烧室设计',
        description: '燃烧室设计原理和方法',
        order: 9,
        isActive: true,
        clickCount: 142,
      },
      {
        keyword: '固体火箭发动机',
        description: '固体火箭发动机技术',
        order: 8,
        isActive: true,
        clickCount: 128,
      },
      {
        keyword: '推进剂配方',
        description: '火箭发动机推进剂配方优化',
        order: 7,
        isActive: true,
        clickCount: 115,
      },
      {
        keyword: '超燃冲压发动机',
        description: '超燃冲压发动机技术',
        order: 6,
        isActive: true,
        clickCount: 98,
      },
      {
        keyword: '燃烧不稳定性',
        description: '发动机燃烧不稳定性研究',
        order: 5,
        isActive: true,
        clickCount: 87,
      },
      {
        keyword: '燃气涡轮发动机',
        description: '燃气涡轮发动机技术',
        order: 4,
        isActive: true,
        clickCount: 76,
      },
      {
        keyword: '叶片冷却',
        description: '发动机叶片冷却技术',
        order: 3,
        isActive: true,
        clickCount: 65,
      },
      {
        keyword: '组合发动机',
        description: '组合发动机系统技术',
        order: 2,
        isActive: true,
        clickCount: 54,
      },
      {
        keyword: 'CFD仿真',
        description: '计算流体力学仿真技术',
        order: 1,
        isActive: true,
        clickCount: 43,
      },
    ];

    for (const hotSearchData of testHotSearches) {
      await this.prisma.hotSearch.upsert({
        where: { keyword: hotSearchData.keyword },
        update: hotSearchData,
        create: hotSearchData,
      });
    }

    console.log(`创建了 ${testHotSearches.length} 个测试热搜`);
  }

  /**
   * 创建教师-助教关联关系
   */
  private async createTestTeacherAssistantRelations(users: User[]) {
    console.log('创建教师-助教关联关系...');

    const teachers = users.filter(
      (u) => u.name?.includes('教授') || u.name?.includes('老师'),
    );
    const assistants = users.filter((u) => u.name?.includes('助教'));

    if (teachers.length === 0 || assistants.length === 0) {
      console.log('没有足够的教师或助教，跳过关联关系创建');
      return;
    }

    let relationCount = 0;

    // 为每个教师分配助教
    for (const teacher of teachers) {
      const assistantsToAssign = assistants.slice(
        0,
        Math.min(2, assistants.length),
      );
      for (const assistant of assistantsToAssign) {
        try {
          await this.prisma.teacherAssistant.create({
            data: {
              teacherId: teacher.id,
              assistantId: assistant.id,
            },
          });
          relationCount++;
        } catch {
          // 可能已经存在关联关系，跳过
        }
      }
    }

    console.log(`创建了 ${relationCount} 个教师-助教关联关系`);
  }

  /**
   * 创建测试评论点赞
   */
  private async createTestCommentLikes(users: User[]) {
    console.log('创建测试评论点赞...');

    const comments = await this.prisma.comment.findMany({
      take: 10, // 取前10个评论
    });

    if (comments.length === 0) {
      console.log('没有评论数据，跳过评论点赞创建');
      return;
    }

    const students = users.filter((u) => u.name?.includes('小'));
    const teachers = users.filter(
      (u) => u.name?.includes('教授') || u.name?.includes('老师'),
    );
    const assistants = users.filter((u) => u.name?.includes('助教'));

    let likeCount = 0;

    // 为每个评论随机添加一些点赞
    for (const comment of comments) {
      const numLikes = Math.floor(Math.random() * 5) + 1; // 1-5个点赞
      const allUsers = [...students, ...teachers, ...assistants];
      const usersToLike = allUsers.slice(
        0,
        Math.min(numLikes, allUsers.length),
      );

      for (const user of usersToLike) {
        try {
          await this.prisma.commentLike.create({
            data: {
              userId: user.id,
              commentId: comment.id,
            },
          });
          likeCount++;
        } catch {
          // 可能已经点赞过了，跳过
        }
      }
    }

    console.log(`创建了 ${likeCount} 个测试评论点赞`);
  }
}
