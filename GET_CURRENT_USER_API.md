# 获取当前用户信息 API

## 接口说明

该接口用于在页面刷新后重新获取当前登录用户的完整信息。

## 接口详情

- **请求方法**: `GET`
- **接口路径**: `/auth/me`
- **需要认证**: ✅ 是（需要携带 JWT Token）

## 请求示例

### 使用 cURL
```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 使用 JavaScript (Fetch)
```javascript
// 从 localStorage 获取保存的 token
const token = localStorage.getItem('access_token');

fetch('http://localhost:3000/auth/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => {
    console.log('当前用户信息:', data);
    // 更新应用状态
  })
  .catch(error => {
    console.error('获取用户信息失败:', error);
    // 如果 token 过期，跳转到登录页
    window.location.href = '/login';
  });
```

### 使用 Axios
```javascript
import axios from 'axios';

const token = localStorage.getItem('access_token');

axios.get('http://localhost:3000/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
  .then(response => {
    console.log('当前用户信息:', response.data);
  })
  .catch(error => {
    console.error('获取用户信息失败:', error);
    if (error.response?.status === 401) {
      // Token 过期，清除本地存储并跳转到登录页
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
  });
```

## 响应示例

### 成功响应 (200 OK)
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "张三",
  "role": "STUDENT",
  "roleId": 5,
  "status": "ACTIVE",
  "userId": 1
}
```

### 错误响应 (401 Unauthorized)
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

## 使用场景

### 1. 页面刷新时恢复用户状态

```javascript
// App.js 或根组件
useEffect(() => {
  const token = localStorage.getItem('access_token');
  
  if (token) {
    // 页面刷新后，使用 token 重新获取用户信息
    fetch('/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(user => {
        // 恢复用户状态
        setCurrentUser(user);
      })
      .catch(() => {
        // Token 无效，清除本地存储
        localStorage.removeItem('access_token');
        setCurrentUser(null);
      });
  }
}, []);
```

### 2. 验证 Token 有效性

```javascript
async function checkTokenValidity() {
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    return false;
  }
  
  try {
    const response = await fetch('/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.ok;
  } catch (error) {
    return false;
  }
}
```

### 3. React 完整示例

```javascript
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get('/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setUser(response.data);
      } catch (error) {
        console.error('获取用户信息失败:', error);
        // 清除无效的 token
        localStorage.removeItem('access_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  if (loading) {
    return <div>加载中...</div>;
  }

  if (!user) {
    return <div>请先登录</div>;
  }

  return (
    <div>
      <h1>欢迎, {user.name}!</h1>
      <p>邮箱: {user.email}</p>
      <p>角色: {user.role}</p>
    </div>
  );
}

export default App;
```

## 响应字段说明

| 字段     | 类型   | 说明                                                                                                |
| -------- | ------ | --------------------------------------------------------------------------------------------------- |
| `id`     | number | 用户唯一标识                                                                                        |
| `email`  | string | 用户邮箱                                                                                            |
| `name`   | string | 用户姓名                                                                                            |
| `role`   | string | 用户角色枚举值（SUPER_ADMIN, ADMIN, TEACHER_LEADER, TEACHER, ASSISTANT_LEADER, ASSISTANT, STUDENT） |
| `roleId` | number | 角色ID                                                                                              |
| `status` | string | 用户状态（ACTIVE-活跃, INACTIVE-禁用）                                                              |
| `userId` | number | 用户ID（向后兼容字段，与 id 相同）                                                                  |

## 注意事项

1. **Token 必须有效**: 请求必须在 Header 中携带有效的 JWT Token
2. **Token 过期处理**: 如果 Token 过期（默认24小时），将返回 401 错误，前端需要重新登录
3. **安全存储**: Token 应存储在 localStorage 或 sessionStorage 中
4. **权限验证**: 该接口会自动验证 Token 的有效性和用户的存在性

## 与登录接口的区别

| 特性         | `POST /auth/login` | `GET /auth/me`       |
| ------------ | ------------------ | -------------------- |
| 需要密码     | ✅ 是               | ❌ 否                 |
| 需要 Token   | ❌ 否               | ✅ 是                 |
| 返回新 Token | ✅ 是               | ❌ 否                 |
| 使用场景     | 首次登录           | 页面刷新、Token 验证 |

## 前端最佳实践

### 登录流程
```javascript
// 1. 用户登录
const loginResponse = await axios.post('/auth/login', {
  email: 'user@example.com',
  password: 'password123'
});

// 2. 保存 token 和用户信息
localStorage.setItem('access_token', loginResponse.data.access_token);
localStorage.setItem('user', JSON.stringify(loginResponse.data.user));
```

### 页面刷新流程
```javascript
// 1. 从 localStorage 读取 token
const token = localStorage.getItem('access_token');

if (token) {
  // 2. 使用 token 重新获取最新用户信息
  const user = await axios.get('/auth/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  // 3. 更新应用状态
  setCurrentUser(user.data);
}
```

## Swagger 文档

启动服务后，访问 `http://localhost:3000/api` 查看完整的 Swagger API 文档。

在 Swagger 中测试该接口：
1. 先调用 `POST /auth/login` 获取 token
2. 点击页面右上角的 "Authorize" 按钮
3. 输入 token（格式：`Bearer YOUR_TOKEN`）
4. 调用 `GET /auth/me` 接口

