# 存储问题

本页介绍 StarHub 常见的存储相关问题和解决方案。

## QuotaExceededError

### 问题描述

控制台显示 `QuotaExceededError` 或提示「存储空间已满」。

### 原因

- 浏览器存储配额耗尽
- IndexedDB 数据库损坏
- 存储大量数据后空间不足

### 解决方案

#### 方案 1：使用修复脚本（推荐）

在浏览器控制台 (F12) 运行：

```javascript
fetch('/fix-quota-error.js').then(r => r.text()).then(eval);
```

#### 方案 2：手动清理

1. 打开开发者工具 (F12)
2. 进入 **Application** 标签
3. 找到 **Storage** → **IndexedDB**
4. 右键 **StarHubDB** → **Delete database**
5. 刷新页面

#### 方案 3：清除浏览器数据

1. 浏览器设置 → 隐私和安全
2. 清除浏览数据
3. 选择「Cookie 和其他网站数据」
4. 清除后刷新页面

---

## DatabaseClosedError

### 问题描述

控制台显示 `DatabaseClosedError: Database has been closed`。

### 原因

- 数据库连接意外关闭
- 其他标签页操作导致冲突
- 存储空间不足触发关闭

### 解决方案

1. **刷新页面**：大多数情况下刷新即可

2. **关闭其他标签页**：确保只有一个 StarHub 标签页

3. **删除数据库重建**：
   ```javascript
   indexedDB.deleteDatabase('StarHubDB');
   location.reload();
   ```

---

## 数据清空后仍有残留

### 问题描述

点击「清空所有数据」后，左侧标签仍显示有数字。

### 原因

- IndexedDB 事务未完全提交
- `repoTags` 表未清空
- 缓存数据未更新

### 解决方案

#### 方案 1：强制清空标签关联

```javascript
fetch('/force-clear-tags.js').then(r => r.text()).then(eval);
```

#### 方案 2：彻底清空脚本

```javascript
(async function() {
  // 清空所有表
  const openReq = indexedDB.open('StarHubDB');
  openReq.onsuccess = async (e) => {
    const db = e.target.result;
    const stores = ['repos', 'tags', 'repoTags'];
    const tx = db.transaction(stores, 'readwrite');
    
    for (const store of stores) {
      if (db.objectStoreNames.contains(store)) {
        tx.objectStore(store).clear();
      }
    }
    
    db.close();
    
    // 删除数据库
    await indexedDB.deleteDatabase('StarHubDB');
    
    // 清除 localStorage
    localStorage.clear();
    
    // 刷新
    location.reload();
  };
})();
```

#### 方案 3：紧急清空

```javascript
fetch('/emergency-clear.js').then(r => r.text()).then(eval);
```

---

## IndexedDB 无法打开

### 问题描述

页面加载时提示数据库无法打开。

### 原因

- 数据库版本冲突
- 数据库文件损坏
- 浏览器隐私模式

### 解决方案

1. **确认不是隐私模式**：隐私模式下 IndexedDB 可能受限

2. **删除数据库**：
   - 开发者工具 → Application → IndexedDB
   - 删除 StarHubDB

3. **重置浏览器存储**：
   - 浏览器设置 → 网站设置
   - 找到 StarHub 网站 → 清除数据

---

## 存储容量查看

### 检查当前使用量

在控制台运行：

```javascript
if (navigator.storage && navigator.storage.estimate) {
  navigator.storage.estimate().then(({ usage, quota }) => {
    console.log(`已使用: ${(usage / 1024 / 1024).toFixed(2)} MB`);
    console.log(`配额: ${(quota / 1024 / 1024).toFixed(2)} MB`);
    console.log(`使用率: ${((usage / quota) * 100).toFixed(2)}%`);
  });
}
```

### 各浏览器存储限制

| 浏览器 | 限制 |
|--------|------|
| Chrome | 硬盘空间的 60% |
| Firefox | 2GB 或硬盘 10% |
| Safari | 1GB |
| Edge | 同 Chrome |

---

## 预防措施

1. **定期清理**：如果 Star 数量很多，定期使用「重新抓取」更新数据

2. **避免重复同步**：不要频繁点击「重新抓取」

3. **关闭无用标签页**：避免多个 StarHub 标签页同时操作

