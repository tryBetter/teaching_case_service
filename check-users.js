const { PrismaClient } = require('@prisma/client');

async function checkUsers() {
  const prisma = new PrismaClient();

  try {
    // 查找所有超级管理员用户
    const superAdmins = await prisma.user.findMany({
      where: {
        role: {
          name: '超级管理员',
        },
      },
      include: {
        role: true,
      },
    });

    console.log('超级管理员用户:');
    superAdmins.forEach((user) => {
      console.log(`- 邮箱: ${user.email}`);
      console.log(`- 姓名: ${user.name}`);
      console.log(`- 角色: ${user.role.name}`);
      console.log(`- 密码哈希: ${user.password.substring(0, 20)}...`);
      console.log('---');
    });

    // 查找所有用户
    const allUsers = await prisma.user.findMany({
      include: {
        role: true,
      },
    });

    console.log('\n所有用户:');
    allUsers.forEach((user) => {
      console.log(`- 邮箱: ${user.email}, 角色: ${user.role.name}`);
    });
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
