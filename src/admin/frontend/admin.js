// 全局变量
let authToken = localStorage.getItem('adminToken');
let currentUser = null;
const API_BASE_URL = window.location.origin;

// 初始化
document.addEventListener('DOMContentLoaded', function () {
  console.log('页面加载完成，开始检查认证状态');
  checkAuthStatus();
});

// 检查认证状态
function checkAuthStatus() {
  if (authToken) {
    // 验证token是否有效
    fetch(`${API_BASE_URL}/admin/auth/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ token: authToken }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.isSuperAdmin) {
          currentUser = data.user;
          showAdminInterface();
          loadDashboard();
        } else {
          showLoginForm();
        }
      })
      .catch((error) => {
        console.error('Token验证失败:', error);
        showLoginForm();
      });
  } else {
    showLoginForm();
  }
}

// 显示登录表单
function showLoginForm() {
  const loginSection = document.getElementById('loginSection');
  const sidebar = document.querySelector('nav.sidebar');
  const mainContent = document.querySelector('main.main-content');

  if (loginSection) {
    loginSection.style.display = 'block';
    loginSection.style.visibility = 'visible';
    loginSection.style.opacity = '1';
    loginSection.style.zIndex = '1000';
  }
  if (sidebar) sidebar.style.display = 'none';
  if (mainContent) mainContent.style.display = 'none';

  // 绑定登录表单事件
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
}

// 显示管理界面
function showAdminInterface() {
  console.log('showAdminInterface 被调用');
  const loginSection = document.getElementById('loginSection');
  const sidebar = document.querySelector('nav.sidebar');
  const mainContent = document.querySelector('main.main-content');

  console.log('找到的元素:', { loginSection, sidebar, mainContent });

  if (loginSection) {
    loginSection.style.display = 'none !important';
    loginSection.style.visibility = 'hidden';
    loginSection.style.opacity = '0';
    loginSection.style.zIndex = '-1';
    console.log('隐藏登录表单');
  }
  if (sidebar) {
    sidebar.style.display = 'block';
    console.log('显示侧边栏');
  }
  if (mainContent) {
    mainContent.style.display = 'block';
    console.log('显示主内容区');
  }

  // 更新用户信息
  const currentUserElement = document.getElementById('currentUser');
  if (currentUserElement) {
    currentUserElement.textContent = currentUser
      ? currentUser.name || currentUser.email
      : '超级管理员';
    console.log('更新用户信息:', currentUserElement.textContent);
  }
}

// 处理登录
async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorElement = document.getElementById('loginError');

  try {
    const response = await fetch(`${API_BASE_URL}/admin/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('登录成功，数据:', data);
      authToken = data.access_token;
      currentUser = data.user;
      localStorage.setItem('adminToken', authToken);
      console.log('调用 showAdminInterface');
      showAdminInterface();
      loadDashboard();
      errorElement.style.display = 'none';
    } else {
      errorElement.textContent = data.message || '登录失败';
      errorElement.style.display = 'block';
    }
  } catch (error) {
    console.error('登录错误:', error);
    errorElement.textContent = '网络错误，请稍后重试';
    errorElement.style.display = 'block';
  }
}

// 退出登录
function logout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('adminToken');
  showLoginForm();
}

// 显示指定区域
function showSection(sectionName) {
  // 隐藏所有内容区域
  document.querySelectorAll('.content-section').forEach((section) => {
    section.style.display = 'none';
  });

  // 移除所有导航链接的active类
  document.querySelectorAll('.nav-link').forEach((link) => {
    link.classList.remove('active');
  });

  // 显示指定区域
  const targetSection = document.getElementById(sectionName + 'Section');
  if (targetSection) {
    targetSection.style.display = 'block';
  }

  // 激活对应的导航链接
  event.target.classList.add('active');

  // 根据区域加载对应数据
  switch (sectionName) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'users':
      loadUsers();
      break;
    case 'articles':
      loadArticles();
      break;
    case 'categories':
      loadCategories();
      break;
    case 'media':
      loadMedia();
      break;
    case 'comments':
      loadComments();
      break;
    case 'notes':
      loadNotes();
      break;
    case 'favorites':
      loadFavorites();
      break;
    case 'roles':
      loadRoles();
      break;
    case 'stats':
      loadStats();
      break;
  }
}

// 加载仪表盘数据
async function loadDashboard() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/overview`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();

      // 更新统计数据
      document.getElementById('totalUsers').textContent =
        data.statistics.totalUsers || 0;
      document.getElementById('totalArticles').textContent =
        data.statistics.totalArticles || 0;
      document.getElementById('totalComments').textContent =
        data.statistics.totalComments || 0;
      document.getElementById('totalMedia').textContent =
        data.statistics.totalMedia || 0;

      // 显示最近用户
      const recentUsersHtml = data.recentActivity.recentUsers
        .map(
          (user) => `
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <div>
                        <strong>${user.name || '未设置'}</strong>
                        <small class="text-muted d-block">${user.email}</small>
                    </div>
                    <small class="text-muted">${formatDate(user.createdAt)}</small>
                </div>
            `,
        )
        .join('');
      document.getElementById('recentUsers').innerHTML =
        recentUsersHtml || '<p class="text-muted">暂无数据</p>';

      // 显示最近文章
      const recentArticlesHtml = data.recentActivity.recentArticles
        .map(
          (article) => `
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <div>
                        <strong>${article.title}</strong>
                        <small class="text-muted d-block">${article.author.name || article.author.email}</small>
                    </div>
                    <small class="text-muted">${formatDate(article.createdAt)}</small>
                </div>
            `,
        )
        .join('');
      document.getElementById('recentArticles').innerHTML =
        recentArticlesHtml || '<p class="text-muted">暂无数据</p>';
    }
  } catch (error) {
    console.error('加载仪表盘数据失败:', error);
  }
}

// 用户管理分页相关变量
let currentUserPage = 1;
let currentUserPageSize = 10;
let currentUserSearch = '';
let currentUserRole = '';

// 文章管理分页相关变量
let currentArticlePage = 1;
let currentArticlePageSize = 10;
let currentArticleSearch = '';
let currentArticleStatus = '';
let currentArticleCategory = '';
let currentArticleAuthor = '';

// 加载用户列表
async function loadUsers(page = 1, pageSize = 10, search = '', role = '') {
  try {
    // 构建查询参数
    const params = new URLSearchParams({
      page: page.toString(),
      limit: pageSize.toString(),
    });

    if (search) {
      params.append('search', search);
    }

    if (role) {
      params.append('role', role);
    }

    const response = await fetch(`${API_BASE_URL}/admin/users?${params}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const tbody = document.getElementById('usersTableBody');

      // 更新当前分页状态
      currentUserPage = page;
      currentUserPageSize = pageSize;
      currentUserSearch = search;
      currentUserRole = role;

      if (data.data && data.data.length > 0) {
        tbody.innerHTML = data.data
          .map(
            (user) => `
                    <tr>
                        <td>${user.id}</td>
                        <td>${user.name || '未设置'}</td>
                        <td>${user.email}</td>
                        <td><span class="badge bg-primary">${user.role.name}</span></td>
                        <td>
                            <span class="badge ${user.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}">
                                ${user.status === 'ACTIVE' ? '活跃' : '禁用'}
                            </span>
                        </td>
                        <td>${formatDate(user.createdAt)}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary" onclick="editUser(${user.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            ${
                              user.status === 'ACTIVE'
                                ? `<button class="btn btn-sm btn-outline-warning" onclick="disableUser(${user.id})">
                                   <i class="bi bi-ban"></i>
                                 </button>`
                                : `<button class="btn btn-sm btn-outline-success" onclick="enableUser(${user.id})">
                                   <i class="bi bi-check-circle"></i>
                                 </button>`
                            }
                        </td>
                    </tr>
                `,
          )
          .join('');

        // 更新分页组件
        updateUsersPagination(data.pagination);
      } else {
        tbody.innerHTML =
          '<tr><td colspan="7" class="text-center text-muted">暂无数据</td></tr>';
        // 清空分页组件
        document.getElementById('usersPagination').innerHTML = '';
        document.getElementById('usersPaginationInfo').innerHTML = '';
      }
    }
  } catch (error) {
    console.error('加载用户列表失败:', error);
    document.getElementById('usersTableBody').innerHTML =
      '<tr><td colspan="7" class="text-center text-danger">加载失败</td></tr>';
  }
}

// 更新用户分页组件
function updateUsersPagination(pagination) {
  const { page, limit, total, totalPages } = pagination;
  const paginationContainer = document.getElementById('usersPagination');
  const paginationInfo = document.getElementById('usersPaginationInfo');

  // 更新分页信息
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);
  paginationInfo.innerHTML = `显示第 ${startItem}-${endItem} 条，共 ${total} 条记录`;

  // 生成分页按钮
  let paginationHTML = '';

  // 上一页按钮
  if (page > 1) {
    paginationHTML += `
      <li class="page-item">
        <a class="page-link" href="#" onclick="goToUserPage(${page - 1})">上一页</a>
      </li>
    `;
  }

  // 页码按钮
  const startPage = Math.max(1, page - 2);
  const endPage = Math.min(totalPages, page + 2);

  if (startPage > 1) {
    paginationHTML += `
      <li class="page-item">
        <a class="page-link" href="#" onclick="goToUserPage(1)">1</a>
      </li>
    `;
    if (startPage > 2) {
      paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    const isActive = i === page ? 'active' : '';
    paginationHTML += `
      <li class="page-item ${isActive}">
        <a class="page-link" href="#" onclick="goToUserPage(${i})">${i}</a>
      </li>
    `;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
    paginationHTML += `
      <li class="page-item">
        <a class="page-link" href="#" onclick="goToUserPage(${totalPages})">${totalPages}</a>
      </li>
    `;
  }

  // 下一页按钮
  if (page < totalPages) {
    paginationHTML += `
      <li class="page-item">
        <a class="page-link" href="#" onclick="goToUserPage(${page + 1})">下一页</a>
      </li>
    `;
  }

  paginationContainer.innerHTML = paginationHTML;
}

// 跳转到指定页面
function goToUserPage(page) {
  loadUsers(page, currentUserPageSize, currentUserSearch, currentUserRole);
}

// 搜索用户
function searchUsers() {
  const searchInput = document.getElementById('userSearchInput');
  const searchTerm = searchInput.value.trim();
  loadUsers(1, currentUserPageSize, searchTerm, currentUserRole);
}

// 添加搜索框回车事件支持
document.addEventListener('DOMContentLoaded', function () {
  const userSearchInput = document.getElementById('userSearchInput');
  if (userSearchInput) {
    userSearchInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        searchUsers();
      }
    });
  }

  const articleSearchInput = document.getElementById('articleSearchInput');
  if (articleSearchInput) {
    articleSearchInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        searchArticles();
      }
    });
  }

  // 加载分类和作者选项
  loadArticleFilters();
});

// 加载文章筛选选项
async function loadArticleFilters() {
  try {
    // 加载分类选项
    const categoriesResponse = await fetch(`${API_BASE_URL}/admin/categories`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (categoriesResponse.ok) {
      const categories = await categoriesResponse.json();
      const categoryFilter = document.getElementById('articleCategoryFilter');
      if (categoryFilter && categories.length > 0) {
        categories.forEach((category) => {
          const option = document.createElement('option');
          option.value = category.id;
          option.textContent = category.name;
          categoryFilter.appendChild(option);
        });
      }
    }

    // 加载作者选项
    const usersResponse = await fetch(`${API_BASE_URL}/admin/users?limit=100`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      const authorFilter = document.getElementById('articleAuthorFilter');
      if (authorFilter && usersData.data && usersData.data.length > 0) {
        usersData.data.forEach((user) => {
          const option = document.createElement('option');
          option.value = user.id;
          option.textContent = user.name || user.email;
          authorFilter.appendChild(option);
        });
      }
    }
  } catch (error) {
    console.error('加载筛选选项失败:', error);
  }
}

// 筛选用户
function filterUsers() {
  const roleFilter = document.getElementById('userRoleFilter');
  const selectedRole = roleFilter.value;
  loadUsers(1, currentUserPageSize, currentUserSearch, selectedRole);
}

// 改变每页显示数量
function changePageSize() {
  const pageSizeSelect = document.getElementById('userPageSize');
  const newPageSize = parseInt(pageSizeSelect.value);
  loadUsers(1, newPageSize, currentUserSearch, currentUserRole);
}

// 更新文章分页组件
function updateArticlesPagination(pagination) {
  const { page, limit, total, totalPages } = pagination;
  const paginationContainer = document.getElementById('articlesPagination');
  const paginationInfo = document.getElementById('articlesPaginationInfo');

  // 更新分页信息
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);
  paginationInfo.innerHTML = `显示第 ${startItem}-${endItem} 条，共 ${total} 条记录`;

  // 生成分页按钮
  let paginationHTML = '';

  // 上一页按钮
  if (page > 1) {
    paginationHTML += `
      <li class="page-item">
        <a class="page-link" href="#" onclick="goToArticlePage(${page - 1})">上一页</a>
      </li>
    `;
  }

  // 页码按钮
  const startPage = Math.max(1, page - 2);
  const endPage = Math.min(totalPages, page + 2);

  if (startPage > 1) {
    paginationHTML += `
      <li class="page-item">
        <a class="page-link" href="#" onclick="goToArticlePage(1)">1</a>
      </li>
    `;
    if (startPage > 2) {
      paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    const isActive = i === page ? 'active' : '';
    paginationHTML += `
      <li class="page-item ${isActive}">
        <a class="page-link" href="#" onclick="goToArticlePage(${i})">${i}</a>
      </li>
    `;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
    paginationHTML += `
      <li class="page-item">
        <a class="page-link" href="#" onclick="goToArticlePage(${totalPages})">${totalPages}</a>
      </li>
    `;
  }

  // 下一页按钮
  if (page < totalPages) {
    paginationHTML += `
      <li class="page-item">
        <a class="page-link" href="#" onclick="goToArticlePage(${page + 1})">下一页</a>
      </li>
    `;
  }

  paginationContainer.innerHTML = paginationHTML;
}

// 跳转到指定页面
function goToArticlePage(page) {
  loadArticles(
    page,
    currentArticlePageSize,
    currentArticleSearch,
    currentArticleStatus,
    currentArticleCategory,
    currentArticleAuthor,
  );
}

// 搜索文章
function searchArticles() {
  const searchInput = document.getElementById('articleSearchInput');
  const searchTerm = searchInput.value.trim();
  loadArticles(
    1,
    currentArticlePageSize,
    searchTerm,
    currentArticleStatus,
    currentArticleCategory,
    currentArticleAuthor,
  );
}

// 筛选文章
function filterArticles() {
  const statusFilter = document.getElementById('articleStatusFilter');
  const categoryFilter = document.getElementById('articleCategoryFilter');
  const authorFilter = document.getElementById('articleAuthorFilter');

  const selectedStatus = statusFilter.value;
  const selectedCategory = categoryFilter.value;
  const selectedAuthor = authorFilter.value;

  loadArticles(
    1,
    currentArticlePageSize,
    currentArticleSearch,
    selectedStatus,
    selectedCategory,
    selectedAuthor,
  );
}

// 改变每页显示数量
function changeArticlePageSize() {
  const pageSizeSelect = document.getElementById('articlePageSize');
  const newPageSize = parseInt(pageSizeSelect.value);
  loadArticles(
    1,
    newPageSize,
    currentArticleSearch,
    currentArticleStatus,
    currentArticleCategory,
    currentArticleAuthor,
  );
}

// 加载文章列表
async function loadArticles(
  page = 1,
  pageSize = 10,
  search = '',
  status = '',
  categoryId = '',
  authorId = '',
) {
  try {
    // 构建查询参数
    const params = new URLSearchParams({
      page: page.toString(),
      limit: pageSize.toString(),
    });

    if (search) {
      params.append('search', search);
    }

    if (status) {
      params.append('published', status);
    }

    if (categoryId) {
      params.append('categoryId', categoryId);
    }

    if (authorId) {
      params.append('authorId', authorId);
    }

    const response = await fetch(`${API_BASE_URL}/admin/articles?${params}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const tbody = document.getElementById('articlesTableBody');

      // 更新当前分页状态
      currentArticlePage = page;
      currentArticlePageSize = pageSize;
      currentArticleSearch = search;
      currentArticleStatus = status;
      currentArticleCategory = categoryId;
      currentArticleAuthor = authorId;

      if (data.data && data.data.length > 0) {
        tbody.innerHTML = data.data
          .map(
            (article) => `
                    <tr>
                        <td>${article.id}</td>
                        <td>${article.title}</td>
                        <td>${article.author.name || article.author.email}</td>
                        <td>${article.category.name}</td>
                        <td>
                            <span class="badge ${article.published ? 'bg-success' : 'bg-warning'}">
                                ${article.published ? '已发布' : '草稿'}
                            </span>
                            ${article.featured ? '<span class="badge bg-info ms-1">推荐</span>' : ''}
                        </td>
                        <td>${formatDate(article.createdAt)}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary" onclick="editArticle(${article.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteArticle(${article.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                            ${
                              !article.published
                                ? `<button class="btn btn-sm btn-outline-success" onclick="publishArticle(${article.id})">
                                <i class="bi bi-check-circle"></i>
                            </button>`
                                : ''
                            }
                        </td>
                    </tr>
                `,
          )
          .join('');

        // 更新分页组件
        updateArticlesPagination(data.pagination);
      } else {
        tbody.innerHTML =
          '<tr><td colspan="7" class="text-center text-muted">暂无数据</td></tr>';
        // 清空分页组件
        document.getElementById('articlesPagination').innerHTML = '';
        document.getElementById('articlesPaginationInfo').innerHTML = '';
      }
    }
  } catch (error) {
    console.error('加载文章列表失败:', error);
    document.getElementById('articlesTableBody').innerHTML =
      '<tr><td colspan="7" class="text-center text-danger">加载失败</td></tr>';
  }
}

// 加载分类列表
async function loadCategories() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/categories`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const tbody = document.getElementById('categoriesTableBody');

      if (data && data.length > 0) {
        tbody.innerHTML = data
          .map(
            (category) => `
                    <tr>
                        <td>${category.id}</td>
                        <td>${category.name}</td>
                        <td>${category.description || '-'}</td>
                        <td><span class="badge bg-secondary">${category._count.articles}</span></td>
                        <td>${formatDate(category.createdAt)}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary" onclick="editCategory(${category.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteCategory(${category.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `,
          )
          .join('');
      } else {
        tbody.innerHTML =
          '<tr><td colspan="6" class="text-center text-muted">暂无数据</td></tr>';
      }
    }
  } catch (error) {
    console.error('加载分类列表失败:', error);
    document.getElementById('categoriesTableBody').innerHTML =
      '<tr><td colspan="6" class="text-center text-danger">加载失败</td></tr>';
  }
}

// 加载媒体列表
async function loadMedia() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/media`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const tbody = document.getElementById('mediaTableBody');

      if (data.data && data.data.length > 0) {
        tbody.innerHTML = data.data
          .map((media) => {
            // 优先使用数据库中的originalName字段，如果没有则从URL中提取
            const fileName =
              media.originalName ||
              (media.url ? media.url.split('/').pop() : '未知文件') ||
              '未知文件';
            // 处理文件大小
            const fileSize = media.size
              ? formatFileSize(media.size)
              : '未知大小';

            return `
                    <tr>
                        <td>${media.id}</td>
                        <td>${fileName}</td>
                        <td><span class="badge ${media.type === 'IMAGE' ? 'bg-info' : 'bg-warning'}">${media.type}</span></td>
                        <td>${fileSize}</td>
                        <td>${formatDate(media.createdAt)}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary" onclick="viewMedia(${media.id})">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteMedia(${media.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
          })
          .join('');
      } else {
        tbody.innerHTML =
          '<tr><td colspan="6" class="text-center text-muted">暂无数据</td></tr>';
      }
    }
  } catch (error) {
    console.error('加载媒体列表失败:', error);
    document.getElementById('mediaTableBody').innerHTML =
      '<tr><td colspan="6" class="text-center text-danger">加载失败</td></tr>';
  }
}

// 加载评论列表
async function loadComments() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/comments`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const tbody = document.getElementById('commentsTableBody');

      if (data.data && data.data.length > 0) {
        tbody.innerHTML = data.data
          .map(
            (comment) => `
                    <tr>
                        <td>${comment.id}</td>
                        <td>${comment.content.length > 50 ? comment.content.substring(0, 50) + '...' : comment.content}</td>
                        <td>${comment.author.name || comment.author.email}</td>
                        <td>${comment.article.title}</td>
                        <td>${formatDate(comment.createdAt)}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteComment(${comment.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `,
          )
          .join('');
      } else {
        tbody.innerHTML =
          '<tr><td colspan="6" class="text-center text-muted">暂无数据</td></tr>';
      }
    }
  } catch (error) {
    console.error('加载评论列表失败:', error);
    document.getElementById('commentsTableBody').innerHTML =
      '<tr><td colspan="6" class="text-center text-danger">加载失败</td></tr>';
  }
}

// 加载笔记列表
async function loadNotes() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/notes`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const tbody = document.getElementById('notesTableBody');

      if (data.data && data.data.length > 0) {
        tbody.innerHTML = data.data
          .map(
            (note) => `
                    <tr>
                        <td>${note.id}</td>
                        <td>${note.content.length > 50 ? note.content.substring(0, 50) + '...' : note.content}</td>
                        <td>${note.user.name || note.user.email}</td>
                        <td>${note.article.title}</td>
                        <td>${formatDate(note.createdAt)}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteNote(${note.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `,
          )
          .join('');
      } else {
        tbody.innerHTML =
          '<tr><td colspan="6" class="text-center text-muted">暂无数据</td></tr>';
      }
    }
  } catch (error) {
    console.error('加载笔记列表失败:', error);
    document.getElementById('notesTableBody').innerHTML =
      '<tr><td colspan="6" class="text-center text-danger">加载失败</td></tr>';
  }
}

// 加载收藏列表
async function loadFavorites() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/favorites`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const tbody = document.getElementById('favoritesTableBody');

      if (data.data && data.data.length > 0) {
        tbody.innerHTML = data.data
          .map((favorite) => {
            // 安全地获取用户信息
            const userName =
              favorite.user?.name || favorite.user?.email || '未知用户';
            const userEmail = favorite.user?.email || '';
            const userDisplay =
              userName !== userEmail ? `${userName} (${userEmail})` : userName;

            // 安全地获取文章信息
            const articleTitle = favorite.article?.title || '未知文章';

            // 使用userId和articleId组合作为显示ID
            const displayId = `${favorite.userId || favorite.user?.id || '?'}-${favorite.articleId || favorite.article?.id || '?'}`;

            return `
                    <tr>
                        <td>${displayId}</td>
                        <td>${userDisplay}</td>
                        <td>${articleTitle}</td>
                        <td>${formatDate(favorite.createdAt)}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteFavorite(${favorite.userId || favorite.user?.id}, ${favorite.articleId || favorite.article?.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
          })
          .join('');
      } else {
        tbody.innerHTML =
          '<tr><td colspan="5" class="text-center text-muted">暂无数据</td></tr>';
      }
    }
  } catch (error) {
    console.error('加载收藏列表失败:', error);
    document.getElementById('favoritesTableBody').innerHTML =
      '<tr><td colspan="5" class="text-center text-danger">加载失败</td></tr>';
  }
}

// 加载角色列表
async function loadRoles() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/roles`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const tbody = document.getElementById('rolesTableBody');

      if (data && data.length > 0) {
        tbody.innerHTML = data
          .map(
            (role) => `
                    <tr>
                        <td>${role.id}</td>
                        <td>${role.name}</td>
                        <td>${role.description || '-'}</td>
                        <td><span class="badge bg-secondary">${role._count.users}</span></td>
                        <td><span class="badge bg-info">${role.rolePermissions.length}</span></td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary" onclick="viewRolePermissions(${role.id})">
                                <i class="bi bi-eye"></i>
                            </button>
                        </td>
                    </tr>
                `,
          )
          .join('');
      } else {
        tbody.innerHTML =
          '<tr><td colspan="6" class="text-center text-muted">暂无数据</td></tr>';
      }
    }
  } catch (error) {
    console.error('加载角色列表失败:', error);
    document.getElementById('rolesTableBody').innerHTML =
      '<tr><td colspan="6" class="text-center text-danger">加载失败</td></tr>';
  }
}

// 加载统计数据
async function loadStats() {
  try {
    const [userStatsResponse, contentStatsResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/admin/stats/users`, {
        headers: { Authorization: `Bearer ${authToken}` },
      }),
      fetch(`${API_BASE_URL}/admin/stats/content`, {
        headers: { Authorization: `Bearer ${authToken}` },
      }),
    ]);

    if (userStatsResponse.ok) {
      const userStats = await userStatsResponse.json();
      const userStatsHtml = `
                <div class="mb-3">
                    <strong>总用户数：</strong> ${userStats.totalUsers || 0}
                </div>
                <div class="mb-3">
                    <strong>今日新增：</strong> ${userStats.todayNewUsers || 0}
                </div>
                <div class="mb-3">
                    <strong>本周新增：</strong> ${userStats.weekNewUsers || 0}
                </div>
                <div class="mb-3">
                    <strong>本月新增：</strong> ${userStats.monthNewUsers || 0}
                </div>
            `;
      document.getElementById('userStats').innerHTML = userStatsHtml;
    }

    if (contentStatsResponse.ok) {
      const contentStats = await contentStatsResponse.json();
      const contentStatsHtml = `
                <div class="mb-3">
                    <strong>总文章数：</strong> ${contentStats.totalArticles || 0}
                </div>
                <div class="mb-3">
                    <strong>已发布：</strong> ${contentStats.publishedArticles || 0}
                </div>
                <div class="mb-3">
                    <strong>草稿：</strong> ${contentStats.draftArticles || 0}
                </div>
                <div class="mb-3">
                    <strong>总评论数：</strong> ${contentStats.totalComments || 0}
                </div>
                <div class="mb-3">
                    <strong>总笔记数：</strong> ${contentStats.totalNotes || 0}
                </div>
            `;
      document.getElementById('contentStats').innerHTML = contentStatsHtml;
    }
  } catch (error) {
    console.error('加载统计数据失败:', error);
    // 显示错误信息
    document.getElementById('userStats').innerHTML =
      '<p class="text-danger">加载用户统计数据失败</p>';
    document.getElementById('contentStats').innerHTML =
      '<p class="text-danger">加载内容统计数据失败</p>';
  }
}

// 工具函数
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN');
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 操作函数
function deleteUser(userId) {
  if (confirm('确定要删除这个用户吗？')) {
    fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
      .then((response) => {
        if (response.ok) {
          alert('用户删除成功');
          // 保持当前分页状态重新加载
          loadUsers(
            currentUserPage,
            currentUserPageSize,
            currentUserSearch,
            currentUserRole,
          );
        } else {
          alert('删除失败');
        }
      })
      .catch((error) => {
        console.error('删除用户失败:', error);
        alert('删除失败');
      });
  }
}

// 禁用用户
function disableUser(userId) {
  if (confirm('确定要禁用这个用户吗？禁用后用户将无法登录。')) {
    fetch(`${API_BASE_URL}/admin/users/${userId}/disable`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
      .then((response) => {
        if (response.ok) {
          alert('用户已禁用');
          // 保持当前分页状态重新加载
          loadUsers(
            currentUserPage,
            currentUserPageSize,
            currentUserSearch,
            currentUserRole,
          );
        } else {
          alert('禁用失败');
        }
      })
      .catch((error) => {
        console.error('禁用用户失败:', error);
        alert('禁用失败');
      });
  }
}

// 启用用户
function enableUser(userId) {
  if (confirm('确定要启用这个用户吗？')) {
    fetch(`${API_BASE_URL}/admin/users/${userId}/enable`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
      .then((response) => {
        if (response.ok) {
          alert('用户已启用');
          // 保持当前分页状态重新加载
          loadUsers(
            currentUserPage,
            currentUserPageSize,
            currentUserSearch,
            currentUserRole,
          );
        } else {
          alert('启用失败');
        }
      })
      .catch((error) => {
        console.error('启用用户失败:', error);
        alert('启用失败');
      });
  }
}

function deleteArticle(articleId) {
  if (confirm('确定要删除这篇文章吗？')) {
    fetch(`${API_BASE_URL}/admin/articles/${articleId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
      .then((response) => {
        if (response.ok) {
          alert('文章删除成功');
          // 保持当前分页状态重新加载
          loadArticles(
            currentArticlePage,
            currentArticlePageSize,
            currentArticleSearch,
            currentArticleStatus,
            currentArticleCategory,
            currentArticleAuthor,
          );
        } else {
          alert('删除失败');
        }
      })
      .catch((error) => {
        console.error('删除文章失败:', error);
        alert('删除失败');
      });
  }
}

function publishArticle(articleId) {
  fetch(`${API_BASE_URL}/admin/articles/${articleId}/publish`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  })
    .then((response) => {
      if (response.ok) {
        alert('文章发布成功');
        // 保持当前分页状态重新加载
        loadArticles(
          currentArticlePage,
          currentArticlePageSize,
          currentArticleSearch,
          currentArticleStatus,
          currentArticleCategory,
          currentArticleAuthor,
        );
      } else {
        alert('发布失败');
      }
    })
    .catch((error) => {
      console.error('发布文章失败:', error);
      alert('发布失败');
    });
}

function deleteCategory(categoryId) {
  if (confirm('确定要删除这个分类吗？')) {
    fetch(`${API_BASE_URL}/admin/categories/${categoryId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
      .then((response) => {
        if (response.ok) {
          alert('分类删除成功');
          loadCategories();
        } else {
          alert('删除失败');
        }
      })
      .catch((error) => {
        console.error('删除分类失败:', error);
        alert('删除失败');
      });
  }
}

function deleteMedia(mediaId) {
  if (confirm('确定要删除这个媒体文件吗？')) {
    fetch(`${API_BASE_URL}/admin/media/${mediaId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
      .then((response) => {
        if (response.ok) {
          alert('媒体文件删除成功');
          loadMedia();
        } else {
          alert('删除失败');
        }
      })
      .catch((error) => {
        console.error('删除媒体文件失败:', error);
        alert('删除失败');
      });
  }
}

function deleteComment(commentId) {
  if (confirm('确定要删除这条评论吗？')) {
    fetch(`${API_BASE_URL}/admin/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
      .then((response) => {
        if (response.ok) {
          alert('评论删除成功');
          loadComments();
        } else {
          alert('删除失败');
        }
      })
      .catch((error) => {
        console.error('删除评论失败:', error);
        alert('删除失败');
      });
  }
}

function deleteNote(noteId) {
  if (confirm('确定要删除这条笔记吗？')) {
    fetch(`${API_BASE_URL}/admin/notes/${noteId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
      .then((response) => {
        if (response.ok) {
          alert('笔记删除成功');
          loadNotes();
        } else {
          alert('删除失败');
        }
      })
      .catch((error) => {
        console.error('删除笔记失败:', error);
        alert('删除失败');
      });
  }
}

function deleteFavorite(userId, articleId) {
  if (confirm('确定要删除这条收藏记录吗？')) {
    fetch(`${API_BASE_URL}/admin/favorites/${userId}/${articleId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
      .then((response) => {
        if (response.ok) {
          alert('收藏记录删除成功');
          loadFavorites();
        } else {
          alert('删除失败');
        }
      })
      .catch((error) => {
        console.error('删除收藏记录失败:', error);
        alert('删除失败');
      });
  }
}

// 显示创建用户模态框
function showCreateUserModal() {
  // 清空表单
  document.getElementById('createUserForm').reset();
  clearFormValidation('createUserForm');

  // 加载角色选项
  loadRoleOptions('createUserRole');

  // 显示模态框
  const modal = new bootstrap.Modal(document.getElementById('createUserModal'));
  modal.show();
}

// 编辑用户
function editUser(userId) {
  // 获取用户信息
  fetch(`${API_BASE_URL}/admin/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  })
    .then((response) => response.json())
    .then((user) => {
      // 填充表单
      document.getElementById('editUserId').value = user.id;
      document.getElementById('editUserEmail').value = user.email;
      document.getElementById('editUserName').value = user.name || '';
      document.getElementById('editUserPassword').value = '';

      // 加载角色选项并设置当前角色
      loadRoleOptions('editUserRole', user.role.id);

      // 清空验证状态
      clearFormValidation('editUserForm');

      // 显示模态框
      const modal = new bootstrap.Modal(
        document.getElementById('editUserModal'),
      );
      modal.show();
    })
    .catch((error) => {
      console.error('获取用户信息失败:', error);
      alert('获取用户信息失败');
    });
}

function editArticle(articleId) {
  alert('编辑文章功能待实现');
}

function editCategory(categoryId) {
  alert('编辑分类功能待实现');
}

function viewMedia(mediaId) {
  alert('查看媒体功能待实现');
}

function viewRolePermissions(roleId) {
  alert('查看角色权限功能待实现');
}

// 加载角色选项
async function loadRoleOptions(selectId, selectedRoleId = null) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/roles`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.ok) {
      const roles = await response.json();
      const select = document.getElementById(selectId);

      // 清空现有选项（保留第一个选项）
      select.innerHTML = '<option value="">请选择角色</option>';

      // 添加角色选项
      roles.forEach((role) => {
        const option = document.createElement('option');
        option.value = role.id;
        option.textContent = role.name;
        if (selectedRoleId && role.id === selectedRoleId) {
          option.selected = true;
        }
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('加载角色选项失败:', error);
  }
}

// 清空表单验证状态
function clearFormValidation(formId) {
  const form = document.getElementById(formId);
  const inputs = form.querySelectorAll('.form-control, .form-select');
  inputs.forEach((input) => {
    input.classList.remove('is-invalid');
    const feedback = input.parentNode.querySelector('.invalid-feedback');
    if (feedback) {
      feedback.textContent = '';
    }
  });
}

// 显示字段验证错误
function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  field.classList.add('is-invalid');
  const feedback = field.parentNode.querySelector('.invalid-feedback');
  if (feedback) {
    feedback.textContent = message;
  }
}

// 提交创建用户表单
async function submitCreateUser() {
  const email = document.getElementById('createUserEmail').value.trim();
  const name = document.getElementById('createUserName').value.trim();
  const password = document.getElementById('createUserPassword').value;
  const roleId = document.getElementById('createUserRole').value;

  // 清空之前的验证状态
  clearFormValidation('createUserForm');

  // 验证必填字段
  let hasError = false;

  if (!email) {
    showFieldError('createUserEmail', '请输入邮箱');
    hasError = true;
  }

  if (!password) {
    showFieldError('createUserPassword', '请输入密码');
    hasError = true;
  }

  if (!roleId) {
    showFieldError('createUserRole', '请选择角色');
    hasError = true;
  }

  if (hasError) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        email,
        name: name || undefined,
        password,
        roleId: parseInt(roleId),
      }),
    });

    if (response.ok) {
      alert('用户创建成功');
      // 关闭模态框
      const modal = bootstrap.Modal.getInstance(
        document.getElementById('createUserModal'),
      );
      modal.hide();
      // 刷新用户列表
      loadUsers(
        currentUserPage,
        currentUserPageSize,
        currentUserSearch,
        currentUserRole,
      );
    } else {
      const error = await response.json();
      alert(error.message || '创建用户失败');
    }
  } catch (error) {
    console.error('创建用户失败:', error);
    alert('创建用户失败');
  }
}

// 提交编辑用户表单
async function submitEditUser() {
  const userId = document.getElementById('editUserId').value;
  const email = document.getElementById('editUserEmail').value.trim();
  const name = document.getElementById('editUserName').value.trim();
  const password = document.getElementById('editUserPassword').value;
  const roleId = document.getElementById('editUserRole').value;

  // 清空之前的验证状态
  clearFormValidation('editUserForm');

  // 验证必填字段
  let hasError = false;

  if (!email) {
    showFieldError('editUserEmail', '请输入邮箱');
    hasError = true;
  }

  if (!roleId) {
    showFieldError('editUserRole', '请选择角色');
    hasError = true;
  }

  if (hasError) {
    return;
  }

  try {
    const updateData = {
      email,
      name: name || undefined,
      roleId: parseInt(roleId),
    };

    // 只有在密码不为空时才更新密码
    if (password) {
      updateData.password = password;
    }

    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(updateData),
    });

    if (response.ok) {
      alert('用户更新成功');
      // 关闭模态框
      const modal = bootstrap.Modal.getInstance(
        document.getElementById('editUserModal'),
      );
      modal.hide();
      // 刷新用户列表
      loadUsers(
        currentUserPage,
        currentUserPageSize,
        currentUserSearch,
        currentUserRole,
      );
    } else {
      const error = await response.json();
      alert(error.message || '更新用户失败');
    }
  } catch (error) {
    console.error('更新用户失败:', error);
    alert('更新用户失败');
  }
}

// 显示批量导入模态框
function showBatchImportModal() {
  // 重置表单和状态
  document.getElementById('userExcelFile').value = '';
  document.getElementById('fileInfo').style.display = 'none';
  document.getElementById('importResult').style.display = 'none';
  document.getElementById('importButton').disabled = true;

  // 显示模态框
  const modal = new bootstrap.Modal(
    document.getElementById('batchImportModal'),
  );
  modal.show();
}

// 下载用户模板
async function downloadUserTemplate() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/users/template/download`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    );

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = '用户导入模板.xlsx';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } else {
      alert('下载模板失败，请重试');
    }
  } catch (error) {
    console.error('下载模板失败:', error);
    alert('下载模板失败：' + error.message);
  }
}

// 处理文件选择
function handleFileSelect(event) {
  const file = event.target.files[0];
  const fileInfo = document.getElementById('fileInfo');
  const fileInfoText = document.getElementById('fileInfoText');
  const importButton = document.getElementById('importButton');

  if (file) {
    // 验证文件类型
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ];

    if (!allowedTypes.includes(file.type)) {
      fileInfoText.textContent = '请选择Excel文件（.xlsx或.xls格式）';
      fileInfo.className = 'alert alert-danger';
      fileInfo.style.display = 'block';
      importButton.disabled = true;
      return;
    }

    // 验证文件大小（10MB限制）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      fileInfoText.textContent = '文件大小不能超过10MB';
      fileInfo.className = 'alert alert-danger';
      fileInfo.style.display = 'block';
      importButton.disabled = true;
      return;
    }

    // 显示文件信息
    fileInfoText.textContent = `已选择文件：${file.name} (${formatFileSize(file.size)})`;
    fileInfo.className = 'alert alert-success';
    fileInfo.style.display = 'block';
    importButton.disabled = false;
  } else {
    fileInfo.style.display = 'none';
    importButton.disabled = true;
  }
}

// 开始批量导入
async function startBatchImport() {
  const fileInput = document.getElementById('userExcelFile');
  const file = fileInput.files[0];

  if (!file) {
    alert('请先选择Excel文件');
    return;
  }

  const importButton = document.getElementById('importButton');
  const originalText = importButton.innerHTML;

  try {
    // 显示加载状态
    importButton.disabled = true;
    importButton.innerHTML = '<i class="bi bi-hourglass-split"></i> 导入中...';

    // 创建FormData
    const formData = new FormData();
    formData.append('file', file);

    // 发送请求
    const response = await fetch(`${API_BASE_URL}/admin/users/batch`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: formData,
    });

    if (response.ok) {
      const result = await response.json();
      displayImportResult(result);

      // 如果导入成功，刷新用户列表
      if (result.successCount > 0) {
        loadUsers(
          currentUserPage,
          currentUserPageSize,
          currentUserSearch,
          currentUserRole,
        );
      }
    } else {
      const error = await response.json();
      alert('导入失败：' + (error.message || '未知错误'));
    }
  } catch (error) {
    console.error('批量导入失败:', error);
    alert('导入失败：' + error.message);
  } finally {
    // 恢复按钮状态
    importButton.disabled = false;
    importButton.innerHTML = originalText;
  }
}

// 显示导入结果
function displayImportResult(result) {
  const importResult = document.getElementById('importResult');
  const importResultContent = document.getElementById('importResultContent');

  let resultHtml = `
    <div class="row">
      <div class="col-md-6">
        <div class="card border-success">
          <div class="card-header bg-success text-white">
            <i class="bi bi-check-circle"></i> 成功导入
          </div>
          <div class="card-body">
            <h5 class="card-title text-success">${result.successCount} 个用户</h5>
            <p class="card-text">成功创建的用户：</p>
            <ul class="list-unstyled">
  `;

  result.successUsers.forEach((user) => {
    resultHtml += `<li><i class="bi bi-person-check"></i> ${user.email} (${user.name || '未设置姓名'})</li>`;
  });

  resultHtml += `
            </ul>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card border-danger">
          <div class="card-header bg-danger text-white">
            <i class="bi bi-exclamation-circle"></i> 导入失败
          </div>
          <div class="card-body">
            <h5 class="card-title text-danger">${result.failureCount} 个用户</h5>
            <p class="card-text">失败原因：</p>
            <ul class="list-unstyled">
  `;

  result.failedUsers.forEach((failed) => {
    resultHtml += `<li><i class="bi bi-x-circle"></i> 第${failed.row}行: ${failed.error}</li>`;
  });

  resultHtml += `
            </ul>
          </div>
        </div>
      </div>
    </div>
    <div class="mt-3">
      <div class="alert alert-info">
        <i class="bi bi-info-circle"></i>
        总计：${result.totalCount} 个用户，成功：${result.successCount} 个，失败：${result.failureCount} 个
      </div>
    </div>
  `;

  importResultContent.innerHTML = resultHtml;
  importResult.style.display = 'block';
}

function showCreateCategoryModal() {
  alert('创建分类功能待实现');
}
