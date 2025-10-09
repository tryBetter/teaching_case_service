#!/usr/bin/env node

/**
 * JWT Token 角色验证工具
 * 用于查看 Token 中包含的用户角色信息
 *
 * 使用方法：
 * node verify-token-role.js YOUR_JWT_TOKEN
 */

const token = process.argv[2];

if (!token) {
  console.log('\n❌ 错误：未提供 Token\n');
  console.log('用法：node verify-token-role.js YOUR_JWT_TOKEN\n');
  console.log('示例：');
  console.log(
    '  node verify-token-role.js eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\n',
  );
  process.exit(1);
}

try {
  // 解码 Token
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error(
      'Token 格式无效，应该包含3个部分（header.payload.signature）',
    );
  }

  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

  console.log('\n📋 Token 信息：');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  用户ID:', payload.userId || payload.sub);
  console.log('  邮箱:', payload.email);
  console.log('  角色:', payload.role);

  if (payload.name) {
    console.log('  姓名:', payload.name);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(
    '  签发时间:',
    new Date(payload.iat * 1000).toLocaleString('zh-CN'),
  );
  console.log(
    '  过期时间:',
    new Date(payload.exp * 1000).toLocaleString('zh-CN'),
  );

  // 检查是否过期
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    const expiredMinutes = Math.floor((now - payload.exp) / 60);
    console.log('  状态: ❌ Token 已过期（' + expiredMinutes + ' 分钟前）');
  } else {
    const remainingMinutes = Math.floor((payload.exp - now) / 60);
    const remainingHours = Math.floor(remainingMinutes / 60);
    const remainingDays = Math.floor(remainingHours / 24);

    let remainingText = '';
    if (remainingDays > 0) {
      remainingText = `${remainingDays} 天 ${remainingHours % 24} 小时`;
    } else if (remainingHours > 0) {
      remainingText = `${remainingHours} 小时 ${remainingMinutes % 60} 分钟`;
    } else {
      remainingText = `${remainingMinutes} 分钟`;
    }

    console.log('  状态: ✅ Token 有效（剩余 ' + remainingText + '）');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 角色权限提示
  const rolePermissions = {
    SUPER_ADMIN: '超级管理员 - 所有权限',
    ADMIN: '管理员 - 系统管理权限',
    TEACHER_LEADER: '教师组长 - 可上传媒体、管理教师资源',
    TEACHER: '教师 - 可上传媒体、创建文章',
    ASSISTANT_LEADER: '助教组长 - 辅助教学管理',
    ASSISTANT: '助教 - 辅助教学',
    STUDENT: '学生 - 基础学习权限',
  };

  const permission = rolePermissions[payload.role] || '未知角色';
  console.log('🔑 角色权限：', permission);

  // 媒体上传权限检查
  const canUploadMedia = [
    'SUPER_ADMIN',
    'ADMIN',
    'TEACHER_LEADER',
    'TEACHER',
  ].includes(payload.role);
  console.log('📤 可否上传媒体：', canUploadMedia ? '✅ 是' : '❌ 否');

  if (!canUploadMedia) {
    console.log('\n💡 提示：当前角色无法上传媒体。');
    console.log('   如需上传媒体，请联系管理员修改角色为：');
    console.log('   - 教师 (TEACHER)');
    console.log('   - 教师组长 (TEACHER_LEADER)');
    console.log('   修改后请重新登录获取新Token！\n');
  } else {
    console.log('\n✅ 当前角色可以上传媒体文件\n');
  }
} catch (error) {
  console.log('\n❌ Token 解析失败:', error.message);
  console.log('\n可能的原因：');
  console.log('  1. Token 格式错误');
  console.log('  2. Token 不完整（复制时被截断）');
  console.log('  3. Token 被篡改\n');
  process.exit(1);
}
