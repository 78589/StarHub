# 快速安装

本节介绍如何在本地安装和运行 StarHub。

## 环境要求

在开始之前，请确保你的系统满足以下要求：

| 依赖 | 最低版本 | 推荐版本 |
|------|----------|----------|
| Node.js | 18.0.0 | 20.x LTS |
| npm | 8.0.0 | 10.x |
| 现代浏览器 | Chrome 90+ / Firefox 88+ / Edge 90+ | 最新版本 |

## 安装步骤

### 1. 克隆项目

```bash
git clone https://github.com/mengjian-github/starhub.git
cd starhub
```

### 2. 安装依赖

```bash
npm install
```

:::tip
如果安装速度慢，可以使用国内镜像：
```bash
npm install --registry=https://registry.npmmirror.com
```
:::

### 3. 配置 GitHub OAuth

在启动前，需要配置 GitHub OAuth。详见 [OAuth 配置](oauth.md)。

### 4. 启动开发服务器

需要同时启动两个服务：

**终端 1 - OAuth 代理服务器：**
```bash
node server/dev-server.js
```

**终端 2 - 前端开发服务器：**
```bash
npm run dev
```

### 5. 访问应用

打开浏览器访问：http://localhost:5173

## 项目脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览生产构建 |
| `npm run lint` | 运行代码检查 |
| `npm run type-check` | TypeScript 类型检查 |

## 目录结构

```
starhub/
├── public/          # 静态资源
├── src/
│   ├── api/         # API 服务层
│   ├── components/  # 公共组件
│   ├── config/      # 配置文件
│   ├── db/          # 数据库定义
│   ├── i18n/        # 国际化
│   ├── layouts/     # 布局组件
│   ├── pages/       # 页面组件
│   ├── router/      # 路由配置
│   ├── services/    # 业务服务
│   ├── stores/      # 状态管理
│   ├── styles/      # 全局样式
│   ├── types/       # 类型定义
│   └── utils/       # 工具函数
├── server/          # 开发服务器
├── functions/       # Cloudflare Workers
└── docs/            # 文档
```

## 下一步

- [配置 GitHub OAuth](oauth.md)
- [基础使用教程](basic.md)

