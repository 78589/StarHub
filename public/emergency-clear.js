// 紧急清空脚本 - 在浏览器控制台中运行此脚本
// Emergency Clear Script - Run this in browser console if normal clear fails

async function emergencyClear() {
  console.log('=== 开始紧急清空 ===');
  
  try {
    // Step 1: Clear localStorage
    console.log('Step 1: 清空 localStorage...');
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !key.includes('theme') && !key.includes('language') && !key.includes('ai_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`✓ 已清除 ${keysToRemove.length} 个 localStorage 项`);
    
    // Step 2: Try to clear all tables first
    console.log('Step 2: 尝试清空所有数据库表...');
    const dbName = 'StarHubDB';
    
    try {
      const openRequest = indexedDB.open(dbName);
      openRequest.onsuccess = async (event) => {
        const db = event.target.result;
        console.log('数据库已打开，开始清空表...');
        
        try {
          // Clear repos
          const reposTx = db.transaction(['repos'], 'readwrite');
          const reposStore = reposTx.objectStore('repos');
          await reposStore.clear();
          console.log('✓ repos 表已清空');
          
          // Clear tags
          const tagsTx = db.transaction(['tags'], 'readwrite');
          const tagsStore = tagsTx.objectStore('tags');
          await tagsStore.clear();
          console.log('✓ tags 表已清空');
          
          // Clear repoTags if exists
          if (db.objectStoreNames.contains('repoTags')) {
            const repoTagsTx = db.transaction(['repoTags'], 'readwrite');
            const repoTagsStore = repoTagsTx.objectStore('repoTags');
            await repoTagsStore.clear();
            console.log('✓ repoTags 表已清空');
          }
          
          db.close();
          console.log('✓ 所有表已清空');
        } catch (err) {
          console.warn('⚠ 清空表失败，将删除整个数据库:', err);
          db.close();
        }
      };
    } catch (err) {
      console.warn('⚠ 打开数据库失败，将删除整个数据库:', err);
    }
    
    // Step 3: Delete IndexedDB
    console.log('Step 3: 删除 IndexedDB...');
    
    const deleteDB = () => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = () => {
          console.log('✓ IndexedDB 删除成功');
          resolve();
        };
        request.onerror = () => {
          console.error('✗ IndexedDB 删除失败:', request.error);
          reject(request.error);
        };
        request.onblocked = () => {
          console.warn('⚠ IndexedDB 删除被阻止，请关闭所有使用该数据库的标签页');
          reject(new Error('Database deletion blocked'));
        };
      });
    };
    
    await deleteDB();
    
    // Step 4: Clear sessionStorage
    console.log('Step 4: 清空 sessionStorage...');
    sessionStorage.clear();
    console.log('✓ sessionStorage 已清空');
    
    console.log('=== 紧急清空完成 ===');
    console.log('建议现在刷新页面: window.location.reload()');
    
    // Ask to reload
    if (confirm('数据已清空！是否立即刷新页面？')) {
      window.location.reload();
    }
  } catch (error) {
    console.error('=== 紧急清空失败 ===');
    console.error(error);
    console.log('\n手动清空步骤:');
    console.log('1. 打开浏览器开发者工具 (F12)');
    console.log('2. 进入 Application 标签页');
    console.log('3. 在左侧找到 "IndexedDB" 并展开');
    console.log('4. 右键点击 "StarHubDB" 并选择 "Delete database"');
    console.log('5. 在 "Local Storage" 中删除所有条目');
    console.log('6. 刷新页面');
  }
}

// 运行紧急清空
emergencyClear();

