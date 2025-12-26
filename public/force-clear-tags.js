// 强制清空所有标签关联 - 在浏览器控制台运行
// Force clear all tag associations - Run in browser console

async function forceClearTags() {
  console.log('=== 强制清空所有标签关联 ===');
  
  try {
    // Step 1: Open database
    console.log('Step 1: 打开数据库...');
    const openRequest = indexedDB.open('StarHubDB');
    
    await new Promise((resolve, reject) => {
      openRequest.onsuccess = (e) => {
        const db = e.target.result;
        console.log('✓ 数据库已打开');
        
        // Step 2: Clear all tags' repos field
        console.log('Step 2: 清空所有标签的 repos 字段...');
        const tagsTx = db.transaction(['tags'], 'readwrite');
        const tagsStore = tagsTx.objectStore('tags');
        const getAllRequest = tagsStore.getAll();
        
        getAllRequest.onsuccess = () => {
          const tags = getAllRequest.result;
          console.log(`找到 ${tags.length} 个标签`);
          
          // Show current state
          tags.forEach(tag => {
            if (tag.repos && tag.repos.length > 0) {
              console.log(`  - ${tag.name}: ${tag.repos.length} 个关联`);
            }
          });
          
          // Clear all repos
          const clearPromises = tags.map(tag => {
            return new Promise((res, rej) => {
              const updateRequest = tagsStore.put({
                ...tag,
                repos: [],
                updatedAt: Date.now()
              });
              updateRequest.onsuccess = res;
              updateRequest.onerror = rej;
            });
          });
          
          Promise.all(clearPromises).then(() => {
            console.log('✓ 所有标签的 repos 字段已清空');
            
            // Step 3: Clear repoTags table if exists
            if (db.objectStoreNames.contains('repoTags')) {
              console.log('Step 3: 清空 repoTags 表...');
              const repoTagsTx = db.transaction(['repoTags'], 'readwrite');
              const repoTagsStore = repoTagsTx.objectStore('repoTags');
              const clearRequest = repoTagsStore.clear();
              
              clearRequest.onsuccess = () => {
                console.log('✓ repoTags 表已清空');
                
                // Step 4: Verify
                console.log('Step 4: 验证清空结果...');
                const verifyTx = db.transaction(['tags'], 'readonly');
                const verifyStore = verifyTx.objectStore('tags');
                const verifyRequest = verifyStore.getAll();
                
                verifyRequest.onsuccess = () => {
                  const verifiedTags = verifyRequest.result;
                  let totalRepos = 0;
                  
                  verifiedTags.forEach(tag => {
                    if (tag.repos && tag.repos.length > 0) {
                      totalRepos += tag.repos.length;
                      console.warn(`  ⚠ ${tag.name} 仍有 ${tag.repos.length} 个关联`);
                    }
                  });
                  
                  if (totalRepos === 0) {
                    console.log('✅ 验证成功！所有标签关联已清空');
                    console.log('=== 清空完成，请刷新页面 ===');
                    
                    db.close();
                    
                    if (confirm('清空成功！是否立即刷新页面？')) {
                      window.location.reload();
                    }
                  } else {
                    console.error(`❌ 验证失败！仍有 ${totalRepos} 个关联`);
                    console.log('建议：使用"清空所有数据"功能');
                    db.close();
                  }
                  
                  resolve();
                };
              };
            } else {
              console.log('Step 3: 没有 repoTags 表，跳过');
              db.close();
              resolve();
            }
          });
        };
      };
      
      openRequest.onerror = (e) => {
        console.error('✗ 打开数据库失败:', e);
        reject(e);
      };
    });
    
  } catch (error) {
    console.error('=== 清空失败 ===');
    console.error(error);
    console.log('\n如果上述方法失败，请使用以下方法：');
    console.log('1. 设置页面 → 清空所有数据');
    console.log('2. 右上角头像 → 重新抓取');
    console.log('3. 手动删除数据库：F12 → Application → IndexedDB → 删除 StarHubDB');
  }
}

// 运行清空
forceClearTags();


