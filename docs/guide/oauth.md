# GitHub OAuth 配置

StarHub 需要通过 GitHub OAuth 获取你的 Star 数据。本节详细介绍配置步骤。

## 创建 GitHub OAuth App

### 步骤 1：打开 GitHub 设置

1. 登录你的 GitHub 账户
2. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
3. 点击左侧 **OAuth Apps**

### 步骤 2：创建新应用

点击 **New OAuth App** 按钮，填写以下信息：

| 字段 | 本地开发 | 生产环境 |
|------|----------|----------|
| Application name | StarHub Dev | StarHub |
| Homepage URL | `http://localhost:5173` | `https://yourdomain.com` |
| Application description | GitHub Stars 管理工具 | GitHub Stars 管理工具 |
| Authorization callback URL | `http://localhost:5173/#/login` | `https://yourdomain.com/#/login` |

:::warning
**回调地址必须完全匹配！** 包括协议（http/https）、端口、路径。
:::

### 步骤 3：获取凭证

1. 创建成功后，记录 **Client ID**
2. 点击 **Generate a new client secret**
3. **立即复制 Client Secret**（只显示一次！）

## 配置项目

### 配置 Client ID

编辑 `src/config/oauth.ts`：

```typescript
export const GITHUB_OAUTH_CONFIG = {
  CLIENT_ID: 'your_client_id_here'  // 替换为你的 Client ID
}
```

### 配置本地开发环境

在项目根目录创建 `.env` 文件：

```env
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret
```

:::danger
**永远不要将 Client Secret 提交到代码仓库！**

`.env` 文件已在 `.gitignore` 中，确保不会被提交。
:::

## 启动服务

### 启动 OAuth 代理服务器

```bash
node server/dev-server.js
```

成功启动后会显示：

```
🚀 本地开发服务器运行在 http://localhost:7001
📝 确保 vite.config.ts 中的 proxy 配置已启用
✅ 前端请求 /api/getToken 将被代理到此服务器
💚 健康检查: http://localhost:7001/api/health
```

### 启动前端开发服务器

在另一个终端：

```bash
npm run dev
```

## 验证配置

1. 访问 http://localhost:5173
2. 点击 **使用 GitHub 登录**
3. 在 GitHub 授权页面点击 **Authorize**
4. 成功跳转回应用并看到你的仓库列表

## 权限说明

StarHub 请求的 OAuth 权限：

| 权限 | 说明 |
|------|------|
| `read:user` | 读取用户基本信息（头像、用户名） |
| `public_repo` | 访问公开仓库（获取 Star 列表） |

:::tip
StarHub **不会**：
- 修改你的仓库
- 访问私有仓库内容
- 存储你的 GitHub 密码
:::

## 常见问题

### OAuth 回调失败

1. 检查回调地址是否完全匹配
2. 确认本地开发服务器正在运行
3. 检查控制台是否有错误

### Access Token 获取失败

1. 检查 `.env` 中的 CLIENT_SECRET 是否正确
2. 确认 OAuth 代理服务器在运行
3. 检查网络连接

### 授权后一直加载

1. 清除浏览器 localStorage
2. 刷新页面重新登录
3. 检查控制台错误

## 下一步

- [基础使用教程](basic.md)
- [AI 智能分类](ai-classification.md)

