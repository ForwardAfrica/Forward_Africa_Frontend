/**
 * Local Storage Management Utilities
 * Provides functions to manage browser local storage
 */

export interface StorageItem {
  key: string;
  value: any;
  timestamp: number;
}

/**
 * Clear all local storage data
 * @param showConfirmation - Whether to show confirmation dialog
 * @param reloadPage - Whether to reload the page after clearing
 */
export const clearLocalStorage = (
  showConfirmation: boolean = true,
  reloadPage: boolean = false
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      if (showConfirmation) {
        const confirmed = confirm(
          'Are you sure you want to clear all local storage data? This will log you out and reset all saved preferences.'
        );
        if (!confirmed) {
          resolve();
          return;
        }
      }

      // Clear all local storage
      localStorage.clear();

      console.log('🧹 Local storage cleared successfully');

      // Show success message
      if (showConfirmation) {
        alert('Local storage cleared successfully!');
      }

      // Optionally reload the page
      if (reloadPage) {
        if (confirm('Would you like to reload the page to ensure a clean state?')) {
          window.location.reload();
        }
      }

      resolve();
    } catch (error) {
      console.error('❌ Error clearing local storage', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (showConfirmation) {
        alert('Error clearing local storage: ' + errorMessage);
      }

      reject(new Error(errorMessage));
    }
  });
};

/**
 * Clear specific items from local storage
 * @param keys - Array of keys to remove
 * @param showConfirmation - Whether to show confirmation dialog
 */
export const clearSpecificStorageItems = (
  keys: string[],
  showConfirmation: boolean = true
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      if (showConfirmation) {
        const confirmed = confirm(
          `Are you sure you want to clear the following items: ${keys.join(', ')}?`
        );
        if (!confirmed) {
          resolve();
          return;
        }
      }

      keys.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log('🧹 Specific storage items cleared:', keys);

      if (showConfirmation) {
        alert(`Cleared ${keys.length} storage items successfully!`);
      }

      resolve();
    } catch (error) {
      console.error('❌ Error clearing specific storage items', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (showConfirmation) {
        alert('Error clearing storage items: ' + errorMessage);
      }

      reject(new Error(errorMessage));
    }
  });
};

/**
 * Get all local storage items with metadata
 */
export const getAllStorageItems = (): StorageItem[] => {
  const items: StorageItem[] = [];

  try {
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
  } catch (error) {
    console.error('❌ Error getting storage items', error);
  }

  return items;
};

/**
 * Get storage size information
 */
export const getStorageInfo = () => {
  try {
    const items = getAllStorageItems();
    const totalSize = new Blob(items.map(item => JSON.stringify(item))).size;

    return {
      itemCount: items.length,
      totalSize: totalSize,
      totalSizeKB: (totalSize / 1024).toFixed(2),
      items: items
    };
  } catch (error) {
    console.error('❌ Error getting storage info', error);
    return null;
  }
};

/**
 * Export local storage data as JSON
 */
export const exportStorageData = (): string => {
  try {
    const data = {
      timestamp: Date.now(),
      items: getAllStorageItems()
    };
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('❌ Error exporting storage data', error);
    throw error;
  }
};

/**
 * Import local storage data from JSON
 * @param jsonData - JSON string containing storage data
 * @param clearExisting - Whether to clear existing data before import
 */
export const importStorageData = (
  jsonData: string,
  clearExisting: boolean = false
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const data = JSON.parse(jsonData);

      if (clearExisting) {
        localStorage.clear();
      }

      data.items.forEach((item: StorageItem) => {
        localStorage.setItem(item.key, JSON.stringify(item.value));
      });

      console.log('📥 Storage data imported successfully');
      resolve();
    } catch (error) {
      console.error('❌ Error importing storage data', error);
      reject(error);
    }
  });
};