# Cloudflare Pages 部署

Cloudflare Pages 是推荐的部署方式，提供免费托管和全球 CDN 加速。

## 优势

- ✅ **免费托管**：无需付费
- ✅ **全球 CDN**：加速访问
- ✅ **自动 HTTPS**：安全连接
- ✅ **Workers 支持**：处理 OAuth

## 部署步骤

### 步骤 1：构建项目

```bash
npm install
npm run build
```

构建完成后，`dist` 目录包含所有静态文件。

### 步骤 2：创建 Cloudflare 账户

1. 访问 [Cloudflare](https://dash.cloudflare.com/)
2. 注册或登录账户

### 步骤 3：创建 Pages 项目

1. 进入 **Pages** 页面
2. 点击 **Create a project**
3. 选择 **Connect to Git**
4. 连接你的 GitHub 账户
5. 选择 starhub 仓库

### 步骤 4：配置构建设置

| 设置项 | 值 |
|--------|-----|
| Framework preset | Vue |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |
| Node.js version | 18 |

点击 **Save and Deploy**。

### 步骤 5：配置环境变量

部署完成后：

1. 进入项目 **Settings**
2. 点击 **Environment variables**
3. 添加以下变量：

| 变量名 | 值 |
|--------|-----|
| `CLIENT_ID` | 你的 GitHub OAuth Client ID |
| `CLIENT_SECRET` | 你的 GitHub OAuth Client Secret |

### 步骤 6：配置 Workers

项目中的 `functions/api/getToken.ts` 会自动被识别为 Cloudflare Workers 函数。

确保文件内容正确：

```typescript
// functions/api/getToken.ts
export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url)
  const code = searchParams.get('code')
  
  if (!code) {
    return new Response(JSON.stringify({ error: 'Missing code' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  const response = await fetch(
    `https://github.com/login/oauth/access_token?code=${code}&client_id=${context.env.CLIENT_ID}&client_secret=${context.env.CLIENT_SECRET}`,
    {
      method: 'POST',
      headers: { Accept: 'application/json' }
    }
  )
  
  const data = await response.json()
  
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  })
}
```

### 步骤 7：更新 GitHub OAuth

在 GitHub OAuth App 设置中更新回调地址：

```
https://your-project.pages.dev/#/login
```

---

## 自定义域名

### 添加域名

1. 进入项目 **Custom domains**
2. 点击 **Set up a custom domain**
3. 输入你的域名
4. 按提示配置 DNS

### DNS 配置

如果域名托管在 Cloudflare：
- 自动配置，无需手动操作

如果域名在其他服务商：
- 添加 CNAME 记录指向 `your-project.pages.dev`

### 更新 OAuth 回调

别忘了更新 GitHub OAuth 回调地址为新域名。

---

## 自动部署

连接 GitHub 后，每次推送代码会自动触发部署：

- `main` 分支 → 生产环境
- 其他分支 → 预览环境

---

## 故障排除

### 构建失败？

1. 检查 Node.js 版本（需要 18+）
2. 查看构建日志中的错误
3. 本地运行 `npm run build` 确认无误

### Workers 不工作？

1. 确认 `functions/api/getToken.ts` 存在
2. 检查环境变量是否配置
3. 查看 Workers 日志

### OAuth 失败？

1. 确认回调地址完全匹配
2. 检查 CLIENT_ID 和 CLIENT_SECRET
3. 查看浏览器控制台错误

