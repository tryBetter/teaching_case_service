// 全局变量
let authToken = localStorage.getItem('adminToken');
let currentUser = null;
const API_BASE_URL = window.location.origin;

// 初始化
document.addEventListener('DOMContentLoaded', function () {
  console.log('页面加载完成，开始检查认证状态');

  // 添加调试按钮（临时）
  const debugButton = document.createElement('button');
  debugButton.textContent = '测试隐藏登录表单';
  debugButton.style.position = 'fixed';
  debugButton.style.top = '10px';
  debugButton.style.right = '10px';
  debugButton.style.zIndex = '9999';
  debugButton.onclick = function () {
    console.log('手动测试隐藏登录表单');
    showAdminInterface();
  };
  document.body.appendChild(debugButton);

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

// 加载用户列表
async function loadUsers() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const tbody = document.getElementById('usersTableBody');

      if (data.data && data.data.length > 0) {
        tbody.innerHTML = data.data
          .map(
            (user) => `
                    <tr>
                        <td>${user.id}</td>
                        <td>${user.name || '未设置'}</td>
                        <td>${user.email}</td>
                        <td><span class="badge bg-primary">${user.role.name}</span></td>
                        <td>${formatDate(user.createdAt)}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary" onclick="editUser(${user.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteUser(${user.id})">
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
    console.error('加载用户列表失败:', error);
    document.getElementById('usersTableBody').innerHTML =
      '<tr><td colspan="6" class="text-center text-danger">加载失败</td></tr>';
  }
}

// 加载文章列表
async function loadArticles() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/articles`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const tbody = document.getElementById('articlesTableBody');

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
      } else {
        tbody.innerHTML =
          '<tr><td colspan="7" class="text-center text-muted">暂无数据</td></tr>';
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
          .map(
            (media) => `
                    <tr>
                        <td>${media.id}</td>
                        <td>${media.originalName}</td>
                        <td><span class="badge ${media.type === 'IMAGE' ? 'bg-info' : 'bg-warning'}">${media.type}</span></td>
                        <td>${formatFileSize(media.size)}</td>
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
                `,
          )
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
          .map(
            (favorite) => `
                    <tr>
                        <td>${favorite.id}</td>
                        <td>${favorite.user.name || favorite.user.email}</td>
                        <td>${favorite.article.title}</td>
                        <td>${formatDate(favorite.createdAt)}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteFavorite(${favorite.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `,
          )
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
                    <strong>总用户数：</strong> ${userStats.totalUsers}
                </div>
                <div class="mb-3">
                    <strong>今日新增：</strong> ${userStats.newUsersToday}
                </div>
                <div class="mb-3">
                    <strong>本周新增：</strong> ${userStats.newUsersThisWeek}
                </div>
                <div class="mb-3">
                    <strong>本月新增：</strong> ${userStats.newUsersThisMonth}
                </div>
            `;
      document.getElementById('userStats').innerHTML = userStatsHtml;
    }

    if (contentStatsResponse.ok) {
      const contentStats = await contentStatsResponse.json();
      const contentStatsHtml = `
                <div class="mb-3">
                    <strong>总文章数：</strong> ${contentStats.totalArticles}
                </div>
                <div class="mb-3">
                    <strong>已发布：</strong> ${contentStats.publishedArticles}
                </div>
                <div class="mb-3">
                    <strong>草稿：</strong> ${contentStats.draftArticles}
                </div>
                <div class="mb-3">
                    <strong>总评论数：</strong> ${contentStats.totalComments}
                </div>
                <div class="mb-3">
                    <strong>总笔记数：</strong> ${contentStats.totalNotes}
                </div>
            `;
      document.getElementById('contentStats').innerHTML = contentStatsHtml;
    }
  } catch (error) {
    console.error('加载统计数据失败:', error);
  }
}

// 工具函数
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN');
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
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
          loadUsers();
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
          loadArticles();
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
        loadArticles();
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

function deleteFavorite(favoriteId) {
  if (confirm('确定要删除这条收藏记录吗？')) {
    fetch(`${API_BASE_URL}/admin/favorites/${favoriteId}`, {
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

// 占位函数（可以后续扩展）
function editUser(userId) {
  alert('编辑用户功能待实现');
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

function showCreateUserModal() {
  alert('创建用户功能待实现');
}

function showCreateCategoryModal() {
  alert('创建分类功能待实现');
}
