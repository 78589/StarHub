// 修复 QuotaExceededError - 在浏览器控制台运行此脚本
// Fix QuotaExceededError - Run this in browser console

async function fixQuotaError() {
  console.log('=== 开始修复存储配额错误 ===');
  
  try {
    // Step 1: Close any open database connections
    console.log('Step 1: 关闭数据库连接...');
    // Force close by attempting to open and immediately close
    try {
      const openReq = indexedDB.open('StarHubDB');
      openReq.onsuccess = (e) => {
        e.target.result.close();
        console.log('✓ 数据库连接已关闭');
      };
    } catch (e) {
      console.log('- 没有活动的数据库连接');
    }
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Step 2: Delete the database
    console.log('Step 2: 删除损坏的数据库...');
    const deleteRequest = indexedDB.deleteDatabase('StarHubDB');
    
    deleteRequest.onsuccess = () => {
      console.log('✓ 数据库已删除');
    };
    
    deleteRequest.onerror = (e) => {
      console.error('✗ 删除失败:', e);
    };
    
    deleteRequest.onblocked = () => {
      console.warn('⚠ 删除被阻止，请关闭所有 StarHub 标签页后重试');
      alert('请关闭所有 StarHub 的标签页（除了这个），然后重新运行此脚本');
      return;
    };
    
    await new Promise((resolve, reject) => {
      deleteRequest.onsuccess = resolve;
      deleteRequest.onerror = reject;
    });
    
    // Step 3: Clear localStorage
    console.log('Step 3: 清理 localStorage...');
    Object.keys(localStorage).forEach(key => {
      if (!key.includes('theme') && !key.includes('language') && !key.includes('ai_') && !key.includes('category_presets')) {
        localStorage.removeItem(key);
      }
    });
    console.log('✓ localStorage 已清理');
    
    // Step 4: Clear sessionStorage
    console.log('Step 4: 清理 sessionStorage...');
    sessionStorage.clear();
    console.log('✓ sessionStorage 已清理');
    
    console.log('=== 修复完成 ===');
    console.log('即将刷新页面...');
    
    // Ask to reload
    setTimeout(() => {
      if (confirm('修复完成！是否立即刷新页面？')) {
        window.location.reload();
      }
    }, 1000);
    
  } catch (error) {
    console.error('=== 修复失败 ===');
    console.error(error);
    console.log('\n手动修复步骤:');
    console.log('1. 关闭所有 StarHub 标签页（除了这个）');
    console.log('2. 按 F12 打开开发者工具');
    console.log('3. 进入 Application 标签页');
    console.log('4. 在左侧找到 "Storage" → "IndexedDB"');
    console.log('5. 右键点击 "StarHubDB" 并选择 "Delete database"');
    console.log('6. 在 "Local Storage" 中清理相关数据');
    console.log('7. 刷新页面');
  }
}

// 运行修复
fixQuotaError();


