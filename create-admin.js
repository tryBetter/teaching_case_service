/**
 * 创建管理员账号脚本
 */

const { PrismaClient } = require('./generated/prisma');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('正在创建管理员账号...');

    // 1. 确保管理员角色存在
    let adminRole = await prisma.role.findFirst({
      where: { name: '超级管理员' },
    });

    if (!adminRole) {
      console.log('管理员角色不存在，正在创建...');
      adminRole = await prisma.role.create({
        data: {
          name: '超级管理员',
          description: '系统超级管理员，拥有所有权限',
          isActive: true,
        },
      });
      console.log('✓ 管理员角色创建成功');
    } else {
      console.log('✓ 管理员角色已存在');
    }

    // 2. 检查管理员账号是否存在
    let admin = await prisma.user.findUnique({
      where: { email: 'admin@test.com' },
    });

    // 3. 创建或更新管理员账号
    const hashedPassword = await bcrypt.hash('123456', 10);

    if (admin) {
      console.log('管理员账号已存在，正在更新密码和角色...');
      admin = await prisma.user.update({
        where: { email: 'admin@test.com' },
        data: {
          password: hashedPassword,
          roleId: adminRole.id,
          status: 'ACTIVE',
          name: '系统管理员',
        },
      });
      console.log('✓ 管理员账号更新成功');
    } else {
      console.log('正在创建管理员账号...');
      admin = await prisma.user.create({
        data: {
          email: 'admin@test.com',
          password: hashedPassword,
          name: '系统管理员',
          status: 'ACTIVE',
          roleId: adminRole.id,
        },
      });
      console.log('✓ 管理员账号创建成功');
    }

    console.log('\n管理员账号信息:');
    console.log('  邮箱:', admin.email);
    console.log('  密码: 123456');
    console.log('  角色: 超级管理员');
    console.log('  状态:', admin.status);

    console.log('\n✅ 完成！');
  } catch (error) {
    console.error('❌ 创建失败:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
