/**
 * Console Storage Management Utilities
 * These functions can be run directly in the browser console
 */

// Make functions available globally for console access
declare global {
  interface Window {
    clearStorage: () => void;
    showStorage: () => void;
    exportStorage: () => void;
    storageInfo: () => void;
  }
}

/**
 * Clear all local storage
 */
export const clearStorage = () => {
  try {
    const itemCount = localStorage.length;
    localStorage.clear();
    console.log(`🧹 Cleared ${itemCount} items from local storage`);
    console.log('✅ Local storage cleared successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error clearing local storage:', error);
    return false;
  }
};

/**
 * Show all local storage items
 */
export const showStorage = () => {
  try {
    const items: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        items.push({
          key,
          value: value ? JSON.parse(value) : null,
          size: value ? value.length : 0
        });
      }
    }

    console.table(items);
    console.log(`📊 Total items: ${items.length}`);
    return items;
  } catch (error) {
    console.error('❌ Error showing storage:', error);
    return null;
  }
};

/**
 * Export local storage as JSON
 */
export const exportStorage = () => {
  try {
    const items: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        items.push({
          key,
          value: value ? JSON.parse(value) : null,
          timestamp: Date.now()
        });
      }
    }

    const data = {
      timestamp: Date.now(),
      items
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `local-storage-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('📤 Storage exported successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error exporting storage:', error);
    return false;
  }
};

/**
 * Show storage information
 */
export const storageInfo = () => {
  try {
    const items = showStorage();
    if (!items) return null;

    const totalSize = items.reduce((sum, item) => sum + (item.size || 0), 0);
    const totalSizeKB = (totalSize / 1024).toFixed(2);

    const info = {
      itemCount: items.length,
      totalSize: totalSize,
      totalSizeKB: totalSizeKB,
      keys: items.map(item => item.key)
    };

    console.log('📊 Storage Information:', info);
    return info;
  } catch (error) {
    console.error('❌ Error getting storage info:', error);
    return null;
  }
};

/**
 * Clear specific storage items by key pattern
 */
export const clearStorageByPattern = (pattern: string) => {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(pattern)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`🧹 Cleared ${keysToRemove.length} items matching pattern "${pattern}"`);
    console.log('Removed keys:', keysToRemove);
    return keysToRemove;
  } catch (error) {
    console.error('❌ Error clearing storage by pattern:', error);
    return [];
  }
};

/**
 * Initialize console utilities
 */
export const initConsoleStorage = () => {
  // Make functions available globally
  window.clearStorage = clearStorage;
  window.showStorage = showStorage;
  window.exportStorage = exportStorage;
  window.storageInfo = storageInfo;

  console.log('🔧 Storage utilities initialized!');
  console.log('Available commands:');
  console.log('- clearStorage() - Clear all local storage');
  console.log('- showStorage() - Show all storage items');
  console.log('- exportStorage() - Export storage as JSON');
  console.log('- storageInfo() - Show storage information');
  console.log('- clearStorageByPattern(pattern) - Clear items by pattern');
};

// Auto-initialize when this module is loaded
if (typeof window !== 'undefined') {
  initConsoleStorage();
}