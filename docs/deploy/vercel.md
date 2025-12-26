# Vercel 部署

Vercel 是另一个优秀的托管平台，部署简单快捷。

## 优势

- ✅ **一键部署**：与 GitHub 无缝集成
- ✅ **自动 HTTPS**：默认启用
- ✅ **预览部署**：每个 PR 自动预览
- ✅ **Serverless Functions**：处理 OAuth

## 部署步骤

### 方式 1：通过 Vercel 网站

1. 访问 [Vercel](https://vercel.com/)
2. 使用 GitHub 登录
3. 点击 **Import Project**
4. 选择 starhub 仓库
5. 配置构建设置（通常自动检测）
6. 点击 **Deploy**

### 方式 2：通过 CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel
```

---

## 配置环境变量

### 通过网站

1. 进入项目 **Settings**
2. 点击 **Environment Variables**
3. 添加：
   - `CLIENT_ID`
   - `CLIENT_SECRET`

### 通过 CLI

```bash
vercel env add CLIENT_ID
vercel env add CLIENT_SECRET
```

---

## 配置 Serverless Function

创建 `api/getToken.ts`：

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { code } = req.query
  
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing code' })
  }
  
  try {
    const response = await fetch(
      `https://github.com/login/oauth/access_token?code=${code}&client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}`,
      {
        method: 'POST',
        headers: { Accept: 'application/json' }
      }
    )
    
    const data = await response.json()
    return res.json(data)
  } catch (error) {
    return res.status(500).json({ error: 'Failed to exchange token' })
  }
}
```

---

## 配置文件

创建 `vercel.json`：

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vue",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 更新 GitHub OAuth

将回调地址更新为：

```
https://your-project.vercel.app/#/login
```

---

## 自定义域名

1. 进入项目 **Settings** → **Domains**
2. 添加你的域名
3. 按提示配置 DNS

---

## 故障排除

### 构建失败？

1. 检查 `package.json` 中的构建命令
2. 确认 Node.js 版本兼容
3. 查看构建日志

### API 路由不工作？

1. 确认 `api/getToken.ts` 位置正确
2. 检查环境变量是否设置
3. 查看 Function 日志

### 路由 404？

确认 `vercel.json` 中配置了 SPA 重写规则。

