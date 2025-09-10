import React, { useState, useEffect } from 'react';
import { Trash2, Download, Upload, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  clearLocalStorage,
  clearSpecificStorageItems,
  getAllStorageItems,
  getStorageInfo,
  exportStorageData,
  importStorageData,
  StorageItem
} from '../../utils/storage';

interface StorageManagerProps {
  showDebugInfo?: boolean;
  className?: string;
}

export default function StorageManager({ showDebugInfo = false, className = '' }: StorageManagerProps) {
  const [storageInfo, setStorageInfo] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Load storage info on component mount
  useEffect(() => {
    loadStorageInfo();
  }, []);

  const loadStorageInfo = () => {
    const info = getStorageInfo();
    setStorageInfo(info);
  };

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleClearAll = async () => {
    setIsLoading(true);
    try {
      await clearLocalStorage(true, false);
      showMessage('success', 'Local storage cleared successfully!');
      loadStorageInfo();
    } catch (error) {
      showMessage('error', 'Failed to clear local storage');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSelected = async () => {
    if (selectedItems.length === 0) {
      showMessage('info', 'Please select items to clear');
      return;
    }

    setIsLoading(true);
    try {
      await clearSpecificStorageItems(selectedItems, true);
      showMessage('success', `Cleared ${selectedItems.length} items successfully!`);
      setSelectedItems([]);
      loadStorageInfo();
    } catch (error) {
      showMessage('error', 'Failed to clear selected items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    try {
      const data = exportStorageData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `local-storage-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showMessage('success', 'Storage data exported successfully!');
    } catch (error) {
      showMessage('error', 'Failed to export storage data');
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonData = e.target?.result as string;
        await importStorageData(jsonData, true);
        showMessage('success', 'Storage data imported successfully!');
        loadStorageInfo();
      } catch (error) {
        showMessage('error', 'Failed to import storage data');
      }
    };
    reader.readAsText(file);
  };

  const toggleItemSelection = (key: string) => {
    setSelectedItems(prev =>
      prev.includes(key)
        ? prev.filter(item => item !== key)
        : [...prev, key]
    );
  };

  const selectAll = () => {
    if (storageInfo?.items) {
      setSelectedItems(storageInfo.items.map((item: StorageItem) => item.key));
    }
  };

  const deselectAll = () => {
    setSelectedItems([]);
  };

  if (!storageInfo) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
          <span className="ml-2 text-gray-400">Loading storage info...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Info className="h-5 w-5 mr-2" />
          Local Storage Manager
        </h3>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <span>{storageInfo.itemCount} items</span>
          <span>•</span>
          <span>{storageInfo.totalSizeKB} KB</span>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg flex items-center ${
          message.type === 'success' ? 'bg-green-900 text-green-200' :
          message.type === 'error' ? 'bg-red-900 text-red-200' :
          'bg-blue-900 text-blue-200'
        }`}>
          {message.type === 'success' && <CheckCircle className="h-4 w-4 mr-2" />}
          {message.type === 'error' && <AlertTriangle className="h-4 w-4 mr-2" />}
          {message.type === 'info' && <Info className="h-4 w-4 mr-2" />}
          {message.text}
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <button
          onClick={handleClearAll}
          disabled={isLoading || storageInfo.itemCount === 0}
          className="flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All
        </button>

        <button
          onClick={handleClearSelected}
          disabled={isLoading || selectedItems.length === 0}
          className="flex items-center justify-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Selected ({selectedItems.length})
        </button>

        <button
          onClick={handleExport}
          disabled={isLoading || storageInfo.itemCount === 0}
          className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </button>

        <label className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors">
          <Upload className="h-4 w-4 mr-2" />
          Import
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </label>
      </div>

      {/* Selection Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={selectAll}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Select All
          </button>
          <button
            onClick={deselectAll}
            className="text-sm text-gray-400 hover:text-gray-300"
          >
            Deselect All
          </button>
        </div>
        <span className="text-sm text-gray-400">
          {selectedItems.length} of {storageInfo.itemCount} selected
        </span>
      </div>

      {/* Storage Items List */}
      <div className="max-h-96 overflow-y-auto">
        <div className="space-y-2">
          {storageInfo.items.map((item: StorageItem) => (
            <div
              key={item.key}
              className={`flex items-center p-3 rounded-lg border transition-colors ${
                selectedItems.includes(item.key)
                  ? 'bg-blue-900 border-blue-600'
                  : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedItems.includes(item.key)}
                onChange={() => toggleItemSelection(item.key)}
                className="mr-3"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium truncate">{item.key}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {showDebugInfo && (
                  <div className="text-xs text-gray-400 mt-1">
                    <pre className="whitespace-pre-wrap break-all">
                      {JSON.stringify(item.value, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {storageInfo.itemCount === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No items in local storage</p>
        </div>
      )}
    </div>
  );
}