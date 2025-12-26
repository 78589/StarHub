# 主题与语言

StarHub 支持深色/浅色主题切换和中英文界面。

## 主题设置

### 切换主题

1. 点击右上角用户头像
2. 选择 **主题**
3. 点击 **深色** 或 **浅色**

### 深色模式

特点：
- 深蓝色背景
- 降低眼睛疲劳
- 适合夜间使用

### 浅色模式

特点：
- 白色背景
- 清晰明亮
- 适合日间使用

### 主题保存

选择的主题会保存在浏览器 localStorage 中，下次访问自动应用。

---

## 语言设置

### 切换语言

1. 点击右上角用户头像
2. 选择 **语言**
3. 点击 **中文** 或 **English**

### 支持的语言

| 语言 | 代码 | 覆盖率 |
|------|------|--------|
| 简体中文 | zh | 100% |
| English | en | 100% |

### 语言保存

选择的语言会保存在浏览器 localStorage 中。

---

## 样式定制

### CSS 变量

StarHub 使用 CSS 变量定义主题颜色，主要变量：

```scss
// 浅色主题
--bg-primary: #ffffff;
--bg-secondary: #f5f5f5;
--text-primary: #303133;
--text-secondary: #606266;
--border: #e4e7ed;

// 深色主题
--bg-primary: #1a1a1a;
--bg-secondary: #242424;
--text-primary: #e8e8e8;
--text-secondary: #b8b8b8;
--border: #383838;
```

### 自定义主题

如果需要自定义主题，可以修改 `src/styles/variables.scss`：

```scss
// 自定义主色调
$primary-color: #3b82f6;

// 自定义浅色主题
$light-bg-primary: #ffffff;
$light-text-primary: #1a1a1a;

// 自定义深色主题
$dark-bg-primary: #0d1117;
$dark-text-primary: #e6edf3;
```

---

## 常见问题

### 主题不生效？

1. 刷新页面
2. 清除 localStorage 后重试
3. 检查浏览器是否支持 CSS 变量

### 部分文字看不清？

如果在某些区域文字对比度不够：

1. 尝试切换主题
2. 刷新页面
3. 清除浏览器缓存

