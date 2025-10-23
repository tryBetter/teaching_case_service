# 导航图标显示测试

## 🔍 问题诊断

如果角色权限和热搜管理按钮没有显示图标，请按以下步骤检查：

### 1. **检查 Bootstrap Icons 是否加载**

在浏览器控制台中执行：
```javascript
// 检查 Bootstrap Icons 是否加载
console.log('Bootstrap Icons 版本:', document.querySelector('link[href*="bootstrap-icons"]')?.href);
```

### 2. **检查图标类名是否正确**

在浏览器控制台中执行：
```javascript
// 检查角色权限图标
const rolesIcon = document.querySelector('a[onclick="showSection(\'roles\')"] i');
console.log('角色权限图标:', rolesIcon?.className);

// 检查热搜管理图标
const hotSearchIcon = document.querySelector('a[onclick="showSection(\'hotSearch\')"] i');
console.log('热搜管理图标:', hotSearchIcon?.className);
```

### 3. **手动测试图标显示**

在浏览器控制台中执行：
```javascript
// 创建测试图标
const testIcon = document.createElement('i');
testIcon.className = 'bi bi-person-gear';
testIcon.style.fontSize = '20px';
testIcon.style.color = 'red';
document.body.appendChild(testIcon);

// 如果看到红色图标，说明 Bootstrap Icons 正常工作
```

## 🎯 当前图标配置

### 角色权限
```html
<a class="nav-link" href="#" onclick="showSection('roles')">
  <i class="bi bi-person-gear"></i>
  角色权限
</a>
```

### 热搜管理
```html
<a class="nav-link" href="#" onclick="showSection('hotSearch')">
  <i class="bi bi-fire"></i>
  热搜管理
</a>
```

## 🔧 可能的解决方案

### 方案1：强制刷新页面
- 按 `Ctrl + Shift + R` 强制刷新
- 或按 `F12` 打开开发者工具，右键刷新按钮选择"清空缓存并硬性重新加载"

### 方案2：检查网络连接
- 确认能够访问 `https://cdn.jsdelivr.net`
- 检查是否有网络代理或防火墙阻止

### 方案3：本地图标文件
如果 CDN 无法访问，可以下载 Bootstrap Icons 到本地：

1. 下载 Bootstrap Icons 字体文件
2. 将文件放在 `public/admin/` 目录下
3. 修改 HTML 中的链接路径

## 📋 验证步骤

1. 打开浏览器开发者工具（F12）
2. 切换到 Network 标签
3. 刷新页面
4. 查看是否有 `bootstrap-icons.css` 的请求
5. 检查请求状态是否为 200

## 🎨 图标预览

- **角色权限**：`bi-person-gear` - 齿轮人物图标
- **热搜管理**：`bi-fire` - 火焰图标

如果图标仍然不显示，请告诉我具体的错误信息或截图。
