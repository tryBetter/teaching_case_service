import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { seedRolePermissions } from './role-permission.seed';

@Injectable()
export class SeedService {
  constructor(private prisma: PrismaService) {}

  async seedDefaultData() {
    // 首先初始化角色权限
    await seedRolePermissions(this.prisma);

    // 创建默认分类
    const categories = [
      { name: '科研案例', description: '科研相关的教学案例' },
      { name: '军事案例', description: '军事相关的教学案例' },
      { name: '工程案例', description: '工程相关的教学案例' },
      { name: '生活案例', description: '生活相关的教学案例' },
      { name: '思政案例', description: '思政相关的教学案例' },
    ];

    for (const category of categories) {
      await this.prisma.category.upsert({
        where: { name: category.name },
        update: {},
        create: category,
      });
    }

    // 创建筛选条件类型
    const filterConditionTypes = [
      { name: '知识点', description: '文章涉及的知识点分类' },
      { name: '发动机类型', description: '文章涉及的发动机类型分类' },
      { name: '难度等级', description: '文章内容的难度等级分类' },
    ];

    for (const type of filterConditionTypes) {
      await this.prisma.filterConditionType.upsert({
        where: { name: type.name },
        update: {},
        create: type,
      });
    }

    // 获取筛选条件类型ID
    const knowledgeType = await this.prisma.filterConditionType.findUnique({
      where: { name: '知识点' },
    });
    const engineType = await this.prisma.filterConditionType.findUnique({
      where: { name: '发动机类型' },
    });
    const difficultyType = await this.prisma.filterConditionType.findUnique({
      where: { name: '难度等级' },
    });

    if (!knowledgeType || !engineType || !difficultyType) {
      throw new Error('筛选条件类型创建失败');
    }

    // 创建知识点筛选条件
    const knowledgeConditions = [
      {
        name: '雾化机理',
        description: '液体燃料雾化过程机理研究',
        typeId: knowledgeType.id,
      },
      {
        name: '点火过程',
        description: '燃烧室点火过程研究',
        typeId: knowledgeType.id,
      },
      {
        name: '燃烧不稳定性',
        description: '燃烧不稳定性机理分析',
        typeId: knowledgeType.id,
      },
      {
        name: '高温燃气流动',
        description: '高温燃气流动特性研究',
        typeId: knowledgeType.id,
      },
      {
        name: '喷注器设计',
        description: '喷注器设计理论与方法',
        typeId: knowledgeType.id,
      },
    ];

    for (const condition of knowledgeConditions) {
      await this.prisma.filterCondition
        .upsert({
          where: {
            id: -1, // 临时ID，实际不会匹配
          },
          update: {},
          create: condition,
        })
        .catch(async () => {
          // 如果创建失败，尝试查找现有记录
          const existing = await this.prisma.filterCondition.findFirst({
            where: {
              name: condition.name,
              typeId: condition.typeId,
            },
          });
          if (!existing) {
            await this.prisma.filterCondition.create({
              data: condition,
            });
          }
        });
    }

    // 创建发动机类型筛选条件
    const engineConditions = [
      {
        name: '液体火箭发动机',
        description: '液体推进剂火箭发动机',
        typeId: engineType.id,
      },
      {
        name: '固体火箭发动机',
        description: '固体推进剂火箭发动机',
        typeId: engineType.id,
      },
      {
        name: '超燃冲压发动机',
        description: '超音速燃烧冲压发动机',
        typeId: engineType.id,
      },
      {
        name: '燃气涡轮发动机',
        description: '燃气涡轮发动机',
        typeId: engineType.id,
      },
      {
        name: '组合发动机',
        description: '组合循环发动机',
        typeId: engineType.id,
      },
    ];

    for (const condition of engineConditions) {
      await this.prisma.filterCondition
        .upsert({
          where: {
            id: -1, // 临时ID，实际不会匹配
          },
          update: {},
          create: condition,
        })
        .catch(async () => {
          // 如果创建失败，尝试查找现有记录
          const existing = await this.prisma.filterCondition.findFirst({
            where: {
              name: condition.name,
              typeId: condition.typeId,
            },
          });
          if (!existing) {
            await this.prisma.filterCondition.create({
              data: condition,
            });
          }
        });
    }

    // 创建难度等级筛选条件
    const difficultyConditions = [
      {
        name: '基础',
        description: '研究生入门级别',
        typeId: difficultyType.id,
      },
      {
        name: '进阶',
        description: '科研深度分析级别',
        typeId: difficultyType.id,
      },
      {
        name: '前沿',
        description: '最新研究成果级别',
        typeId: difficultyType.id,
      },
    ];

    for (const condition of difficultyConditions) {
      await this.prisma.filterCondition
        .upsert({
          where: {
            id: -1, // 临时ID，实际不会匹配
          },
          update: {},
          create: condition,
        })
        .catch(async () => {
          // 如果创建失败，尝试查找现有记录
          const existing = await this.prisma.filterCondition.findFirst({
            where: {
              name: condition.name,
              typeId: condition.typeId,
            },
          });
          if (!existing) {
            await this.prisma.filterCondition.create({
              data: condition,
            });
          }
        });
    }

    console.log('默认数据创建完成！');
  }
}
