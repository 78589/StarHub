# 技术栈

StarHub 使用现代化的前端技术栈构建，本页详细介绍所使用的技术。

## 核心框架

### Vue 3

- **版本**：^3.4
- **特性**：组合式 API、响应式系统、Teleport、Suspense
- **文档**：https://vuejs.org/

Vue 3 是 StarHub 的核心框架，使用组合式 API 编写所有组件。

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const count = ref(0)
const doubled = computed(() => count.value * 2)
</script>
```

### TypeScript

- **版本**：~5.4
- **特性**：类型安全、IDE 支持、更好的重构体验
- **文档**：https://www.typescriptlang.org/

所有代码使用 TypeScript 编写，提供完整的类型定义。

### Vite

- **版本**：^5.1
- **特性**：极速启动、HMR 热更新、优化的构建
- **文档**：https://vitejs.dev/

Vite 作为构建工具，开发体验极佳。

---

## 状态管理

### Pinia

- **版本**：^2.1
- **特性**：类型安全、DevTools 支持、模块化
- **文档**：https://pinia.vuejs.org/

```typescript
// stores/repo.ts
import { defineStore } from 'pinia'

export const useRepoStore = defineStore('repo', {
  state: () => ({
    repos: [],
    loading: false
  }),
  actions: {
    async loadRepos() {
      // ...
    }
  }
})
```

---

## 路由

### Vue Router

- **版本**：^4.3
- **特性**：路由守卫、动态路由、嵌套路由
- **文档**：https://router.vuejs.org/

```typescript
// router/index.ts
const routes = [
  { path: '/login', component: Login },
  { 
    path: '/', 
    component: HomeLayout,
    children: [
      { path: '', component: Home },
      { path: 'settings', component: Settings }
    ]
  }
]
```

---

## UI 组件库

### Element Plus

- **版本**：^2.5
- **特性**：丰富的组件、主题定制、国际化
- **文档**：https://element-plus.org/

使用的主要组件：
- `ElButton`、`ElInput`、`ElSelect`
- `ElDialog`、`ElDrawer`
- `ElTable`、`ElTree`
- `ElMessage`、`ElNotification`

---

## 样式

### SCSS

- **版本**：^1.71
- **特性**：变量、嵌套、混入、模块化
- **文档**：https://sass-lang.com/

```scss
// styles/variables.scss
$primary-color: #3b82f6;
$bg-primary: #ffffff;

// 使用
.button {
  background: $primary-color;
  
  &:hover {
    opacity: 0.9;
  }
}
```

---

## 数据存储

### Dexie.js

- **版本**：^3.2
- **特性**：IndexedDB 封装、Promise API、事务支持
- **文档**：https://dexie.org/

```typescript
// db/index.ts
import Dexie from 'dexie'

class StarHubDB extends Dexie {
  repos!: Dexie.Table<Repo, number>
  tags!: Dexie.Table<Tag, string>
  
  constructor() {
    super('StarHubDB')
    this.version(1).stores({
      repos: 'id, full_name, language',
      tags: 'id, name'
    })
  }
}
```

---

## Markdown 渲染

### Marked

- **版本**：^17.0
- **特性**：GFM 支持、可扩展、高性能
- **文档**：https://marked.js.org/

### highlight.js

- **版本**：^11.10
- **特性**：100+ 语言支持、多主题
- **文档**：https://highlightjs.org/

### DOMPurify

- **版本**：^3.0
- **特性**：XSS 防护、安全渲染
- **文档**：https://github.com/cure53/DOMPurify

```typescript
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'

const html = DOMPurify.sanitize(marked(markdown))
```

---

## 国际化

### Vue I18n

- **版本**：^9.14
- **特性**：响应式、多种格式、懒加载
- **文档**：https://vue-i18n.intlify.dev/

```typescript
// i18n/index.ts
import { createI18n } from 'vue-i18n'
import zh from './locales/zh'
import en from './locales/en'

export const i18n = createI18n({
  locale: 'zh',
  messages: { zh, en }
})
```

---

## HTTP 请求

### Axios

- **版本**：^1.6
- **特性**：拦截器、取消请求、自动转换
- **文档**：https://axios-http.com/

```typescript
// api/request.ts
import axios from 'axios'

const instance = axios.create({
  baseURL: 'https://api.github.com',
  timeout: 30000
})

instance.interceptors.request.use(config => {
  config.headers.Authorization = `token ${token}`
  return config
})
```

---

## 虚拟滚动

### vue-virtual-scroller

- **版本**：^2.0.0-beta.8
- **特性**：高性能、动态高度、水平滚动
- **文档**：https://github.com/Akryum/vue-virtual-scroller

用于渲染大量仓库列表，确保滚动流畅。

---

## 开发工具

### ESLint

- **版本**：^8.57
- **配置**：Vue 3 + TypeScript 推荐规则

### Vue TSC

用于 TypeScript 类型检查。

---

## 项目配置文件

| 文件 | 说明 |
|------|------|
| `vite.config.ts` | Vite 配置 |
| `tsconfig.json` | TypeScript 配置 |
| `.eslintrc.js` | ESLint 配置 |
| `package.json` | 依赖管理 |

