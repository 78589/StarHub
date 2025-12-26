# 数据管理

本节介绍 StarHub 的数据存储机制和管理方法。

## 数据存储

### 存储位置

StarHub 使用浏览器 IndexedDB 存储所有数据：

| 数据类型 | 存储位置 | 说明 |
|----------|----------|------|
| 仓库数据 | IndexedDB `repos` 表 | 所有 Star 仓库信息 |
| 标签数据 | IndexedDB `tags` 表 | 自定义标签 |
| 标签关联 | IndexedDB `repoTags` 表 | 仓库-标签关系 |
| 用户设置 | localStorage | 主题、语言、AI 配置 |
| 登录状态 | localStorage | Token 信息 |

### 数据库结构

```
StarHubDB
├── repos          # 仓库表
│   ├── id         # GitHub 仓库 ID
│   ├── name       # 仓库名称
│   ├── full_name  # 完整名称 (owner/repo)
│   ├── description
│   ├── language
│   ├── stargazers_count
│   └── ...
├── tags           # 标签表
│   ├── id         # 标签 ID
│   ├── name       # 标签名称
│   ├── emoji      # Emoji 图标
│   ├── color      # 颜色
│   └── repos      # 关联的仓库 ID 列表
└── repoTags       # 关联表
    ├── repoId
    └── tagId
```

---

## 数据同步

### 首次同步

登录后自动同步所有 Star 仓库：

1. 调用 GitHub API 获取 Star 列表
2. 分页获取（每页 100 个）
3. 存储到 IndexedDB

### 增量同步

后续登录只获取新增的 Star，减少 API 调用。

### 手动重新同步

1. 点击右上角用户头像
2. 选择 **重新抓取**
3. 等待同步完成

> ⚠️ **注意**：重新抓取会删除所有本地数据，包括标签关联。

---

## 清空数据

### 通过设置页面

1. 点击右上角用户头像 → **设置**
2. 在 **数据管理** 区域点击 **清空所有数据**
3. 确认操作

### 通过控制台

如果页面操作无效，可以使用控制台脚本：

```javascript
// 彻底清空
fetch('/emergency-clear.js').then(r => r.text()).then(eval);
```

### 手动清空

1. 打开开发者工具 (F12)
2. 进入 **Application** 标签
3. 在左侧找到 **IndexedDB** → **StarHubDB**
4. 右键选择 **Delete database**
5. 清空 **Local Storage** 中的相关条目
6. 刷新页面

---

## 存储限制

### IndexedDB 限制

| 浏览器 | 限制 |
|--------|------|
| Chrome | 硬盘空间的 60% |
| Firefox | 2GB 或 10% 硬盘空间 |
| Safari | 1GB |

### 空间不足

如果遇到 `QuotaExceededError`：

```javascript
// 修复脚本
fetch('/fix-quota-error.js').then(r => r.text()).then(eval);
```

---

## 数据隐私

### 本地存储

- 所有仓库和标签数据存储在本地浏览器
- 不会上传到任何服务器
- 清除浏览器数据会删除所有数据

### GitHub Token

- OAuth Token 存储在 localStorage
- 用于调用 GitHub API
- 退出登录时会清除

### AI API Key

- 存储在 localStorage
- 仅用于调用 AI 服务
- 不会上传或分享

---

## 故障恢复

### 数据库损坏

如果数据库损坏：

1. 尝试刷新页面
2. 运行紧急清空脚本
3. 重新登录同步数据

### 标签丢失

如果标签关联丢失：

1. 检查 IndexedDB 中的 `repoTags` 表
2. 如果为空，需要重新分类
3. 可以使用 AI 快速重新分类

### 登录状态丢失

如果意外退出登录：

1. 清除 localStorage
2. 刷新页面
3. 重新登录

---

## 常见问题

### 数据同步后仓库数量不对？

1. GitHub API 有速率限制，等待后重试
2. 尝试使用"重新抓取"功能

### 清空数据后仍有残留？

使用紧急清空脚本：

```javascript
fetch('/emergency-clear.js').then(r => r.text()).then(eval);
```

### IndexedDB 无法打开？

1. 检查浏览器是否支持 IndexedDB
2. 确认浏览器不是隐私模式
3. 尝试清除浏览器数据后重试

