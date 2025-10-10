/**
 * API 权限测试脚本
 * 测试不同角色用户对各接口的访问权限
 * 使用 Node.js 内置 fetch API
 */

const BASE_URL = 'http://localhost:3000';

// 测试结果统计
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
};

// 存储不同用户的 token
const tokens = {
  admin: '',
  teacher: '',
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed, expected, actual) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`✓ ${name}`, 'green');
  } else {
    testResults.failed++;
    log(`✗ ${name}`, 'red');
    log(`  预期: ${expected}, 实际: ${actual}`, 'yellow');
    testResults.errors.push({ name, expected, actual });
  }
}

// 登录获取 token
async function login(email, password, isAdmin = false) {
  try {
    const url = isAdmin
      ? `${BASE_URL}/admin/auth/login`
      : `${BASE_URL}/auth/login`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.access_token;
    }

    log(`登录失败: ${email} (${response.status})`, 'yellow');
    return null;
  } catch (error) {
    log(`登录错误: ${email} - ${error.message}`, 'red');
    return null;
  }
}

// 测试接口
async function testApi(
  name,
  method,
  url,
  expectedStatus,
  token = null,
  data = null,
) {
  try {
    const config = {
      method,
      headers: {},
    };

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
      config.headers['Content-Type'] = 'application/json';
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${BASE_URL}${url}`, config);
    const passed = response.status === expectedStatus;
    logTest(name, passed, expectedStatus, response.status);
    return passed;
  } catch (error) {
    logTest(name, false, expectedStatus, `Error: ${error.message}`);
    return false;
  }
}

// 主测试流程
async function runTests() {
  log('\n========================================', 'cyan');
  log('API 权限测试开始', 'cyan');
  log('========================================\n', 'cyan');

  // ==================== 第1步：获取 Token ====================
  log('【步骤 1】获取测试用户 Token...', 'blue');

  tokens.admin = await login('admin@test.com', '123456', true);
  if (!tokens.admin) {
    log('⚠ 管理员 token 获取失败，某些测试将被跳过', 'yellow');
  } else {
    log('✓ 管理员 token 获取成功', 'green');
  }

  tokens.teacher = await login('999@test.com', '123456');
  if (!tokens.teacher) {
    log('⚠ 教师 token 获取失败，某些测试将被跳过', 'yellow');
  } else {
    log('✓ 教师 token 获取成功', 'green');
  }

  // ==================== 第2步：测试公开接口 ====================
  log('\n【步骤 2】测试公开接口（无需认证）...', 'blue');

  await testApi('获取文章列表（公开）', 'GET', '/articles', 200);
  await testApi('获取分类列表（公开）', 'GET', '/categories', 200);

  // ==================== 第3步：测试用户管理接口 ====================
  log('\n【步骤 3】测试用户管理接口权限...', 'blue');

  // 普通接口
  if (tokens.teacher) {
    await testApi('获取用户列表（教师）', 'GET', '/users', 200, tokens.teacher);
  }

  // 管理员专用接口 - 教师访问应该403
  if (tokens.teacher) {
    await testApi(
      '获取角色列表（教师→403）',
      'GET',
      '/users/roles',
      403,
      tokens.teacher,
    );
    await testApi(
      '获取用户统计（教师→403）',
      'GET',
      '/users/stats',
      403,
      tokens.teacher,
    );
  }

  // 管理员专用接口 - 管理员访问应该200
  if (tokens.admin) {
    await testApi(
      '获取角色列表（管理员→200）',
      'GET',
      '/users/roles',
      200,
      tokens.admin,
    );
    await testApi(
      '获取用户统计（管理员→200）',
      'GET',
      '/users/stats',
      200,
      tokens.admin,
    );
  }

  // ==================== 第4步：测试文章管理接口 ====================
  log('\n【步骤 4】测试文章管理接口权限...', 'blue');

  // 管理员专用接口 - 教师访问应该403
  if (tokens.teacher) {
    await testApi(
      '获取已删除文章（教师→403）',
      'GET',
      '/articles/deleted',
      403,
      tokens.teacher,
    );
    await testApi(
      '获取文章统计（教师→403）',
      'GET',
      '/articles/stats',
      403,
      tokens.teacher,
    );
    await testApi(
      '发布文章（教师→403）',
      'POST',
      '/articles/1/publish',
      403,
      tokens.teacher,
    );
    await testApi(
      '设为推荐（教师→403）',
      'POST',
      '/articles/1/feature',
      403,
      tokens.teacher,
    );
    await testApi(
      '取消推荐（教师→403）',
      'POST',
      '/articles/1/unfeature',
      403,
      tokens.teacher,
    );
    await testApi(
      '恢复文章（教师→403）',
      'POST',
      '/articles/1/restore',
      403,
      tokens.teacher,
    );
    await testApi(
      '永久删除（教师→403）',
      'DELETE',
      '/articles/1/permanent',
      403,
      tokens.teacher,
    );
  }

  // 管理员专用接口 - 管理员访问应该200
  if (tokens.admin) {
    await testApi(
      '获取已删除文章（管理员→200）',
      'GET',
      '/articles/deleted',
      200,
      tokens.admin,
    );
    await testApi(
      '获取文章统计（管理员→200）',
      'GET',
      '/articles/stats',
      200,
      tokens.admin,
    );
  }

  // ==================== 第5步：测试媒体管理接口 ====================
  log('\n【步骤 5】测试媒体管理接口权限...', 'blue');

  // 普通接口
  if (tokens.teacher) {
    await testApi(
      '获取媒体列表（教师）',
      'GET',
      '/media?userId=2',
      200,
      tokens.teacher,
    );
  }

  // 管理员专用接口 - 教师访问应该403
  if (tokens.teacher) {
    await testApi(
      '批量删除媒体（教师→403）',
      'DELETE',
      '/media/batch?ids=999',
      403,
      tokens.teacher,
    );
    await testApi(
      '获取媒体统计（教师→403）',
      'GET',
      '/media/stats/overview',
      403,
      tokens.teacher,
    );
    await testApi(
      '获取类型分布（教师→403）',
      'GET',
      '/media/stats/distribution',
      403,
      tokens.teacher,
    );
    await testApi(
      '获取最近上传（教师→403）',
      'GET',
      '/media/recent',
      403,
      tokens.teacher,
    );
  }

  // 管理员专用接口 - 管理员访问应该200
  if (tokens.admin) {
    await testApi(
      '获取媒体统计（管理员→200）',
      'GET',
      '/media/stats/overview',
      200,
      tokens.admin,
    );
    await testApi(
      '获取类型分布（管理员→200）',
      'GET',
      '/media/stats/distribution',
      200,
      tokens.admin,
    );
    await testApi(
      '获取最近上传（管理员→200）',
      'GET',
      '/media/recent',
      200,
      tokens.admin,
    );
  }

  // ==================== 第6步：测试后台专属接口 ====================
  log('\n【步骤 6】测试后台管理专属接口权限...', 'blue');

  // 后台接口 - 教师访问应该403
  if (tokens.teacher) {
    await testApi(
      '获取所有角色（教师→403）',
      'GET',
      '/admin/roles',
      403,
      tokens.teacher,
    );
    await testApi(
      '获取系统统计（教师→403）',
      'GET',
      '/admin/stats/overview',
      403,
      tokens.teacher,
    );
    await testApi(
      '获取用户统计（教师→403）',
      'GET',
      '/admin/stats/users',
      403,
      tokens.teacher,
    );
  }

  // 后台接口 - 管理员访问应该200
  if (tokens.admin) {
    await testApi(
      '获取所有角色（管理员→200）',
      'GET',
      '/admin/roles',
      200,
      tokens.admin,
    );
    await testApi(
      '获取系统统计（管理员→200）',
      'GET',
      '/admin/stats/overview',
      200,
      tokens.admin,
    );
    await testApi(
      '获取用户统计（管理员→200）',
      'GET',
      '/admin/stats/users',
      200,
      tokens.admin,
    );
  }

  // ==================== 第7步：测试无 Token 访问需要认证的接口 ====================
  log('\n【步骤 7】测试无认证访问保护接口...', 'blue');

  await testApi('获取用户列表（无token→401）', 'GET', '/users', 401);
  await testApi('创建文章（无token→401）', 'POST', '/articles', 401, null, {
    title: '测试',
    content: '测试',
    categoryId: 1,
  });
  await testApi('获取媒体（无token→401）', 'GET', '/media', 401);

  // ==================== 测试完成，输出结果 ====================
  log('\n========================================', 'cyan');
  log('测试完成！', 'cyan');
  log('========================================\n', 'cyan');

  log(`总计测试: ${testResults.total}`, 'blue');
  log(`通过: ${testResults.passed}`, 'green');
  log(`失败: ${testResults.failed}`, 'red');

  const passRate =
    testResults.total > 0
      ? ((testResults.passed / testResults.total) * 100).toFixed(2)
      : 0;
  log(`通过率: ${passRate}%\n`, 'cyan');

  if (testResults.failed > 0) {
    log('失败的测试:', 'red');
    testResults.errors.forEach((error, index) => {
      log(`  ${index + 1}. ${error.name}`, 'yellow');
      log(
        `     预期状态码: ${error.expected}, 实际状态码: ${error.actual}`,
        'yellow',
      );
    });
    log('', 'reset');
  } else {
    log('🎉 所有测试通过！权限控制工作正常。', 'green');
  }

  // 返回退出码
  return testResults.failed === 0;
}

// 运行测试
runTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    log(`\n测试运行出错: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });
