import React, { useState, useEffect } from 'react';
import { Upload, Play, Image, Video, Settings, Save, Trash2, Eye, EyeOff, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import Button from './Button';
import { useAuthEnhanced } from '../../hooks/useAuthEnhanced';
import { usePermissions } from '../../contexts/PermissionContext';
import PermissionGuard from './PermissionGuard';
import { apiClient } from '../../lib/authInterceptor';
import { useFileUpload } from '../../hooks/useFileUpload';

interface BannerConfig {
  homepage_banner_enabled: boolean;
  homepage_banner_type: 'video' | 'image' | 'course';
  homepage_banner_video_url: string | null;
  homepage_banner_image_url: string | null;
  homepage_banner_title: string | null;
  homepage_banner_subtitle: string | null;
  homepage_banner_description: string | null;
  homepage_banner_button_text: string;
  homepage_banner_button_url: string | null;
  homepage_banner_overlay_opacity: number;
}

const BannerManagement: React.FC = () => {
  const { user, isSuperAdmin } = useAuthEnhanced();
  const { hasPermission } = usePermissions();
  const [config, setConfig] = useState<BannerConfig>({
    homepage_banner_enabled: false,
    homepage_banner_type: 'course',
    homepage_banner_video_url: null,
    homepage_banner_image_url: null,
    homepage_banner_title: null,
    homepage_banner_subtitle: null,
    homepage_banner_description: null,
    homepage_banner_button_text: 'Get Started',
    homepage_banner_button_url: null,
    homepage_banner_overlay_opacity: 0.70
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // File upload hook
  const {
    isUploading,
    error: uploadError,
    success: uploadSuccess,
    uploadFile,
    clearError: clearUploadError,
    clearSuccess: clearUploadSuccess,
    getFileSizeMB
  } = useFileUpload({
    endpoint: '/api/banner/upload',
    fieldName: 'banner',
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'
    ],
    onSuccess: (data) => {
      // Update config based on file type
      if (data.fileType === 'video') {
        setConfig(prev => ({
          ...prev,
          homepage_banner_video_url: data.url,
          homepage_banner_type: 'video'
        }));
        setMessage({ type: 'success', text: `Video uploaded successfully!` });
      } else {
        setConfig(prev => ({
          ...prev,
          homepage_banner_image_url: data.url,
          homepage_banner_type: 'image'
        }));
        setMessage({ type: 'success', text: `Image uploaded successfully!` });
      }
      triggerBannerRefresh();
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error });
    }
  });

  // Load banner configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/banner/config');
        if (response.ok) {
          const data = await response.json();
          setConfig(data);
        }
      } catch (error) {
        console.error('Error loading banner config:', error);
        setMessage({ type: 'error', text: 'Failed to load banner configuration' });
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  // Handle file upload with simplified logic
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check for large files and warn user
    const fileSizeMB = getFileSizeMB(file);
    if (fileSizeMB > 50) {
      const proceed = typeof window !== 'undefined' && confirm(`This file is ${fileSizeMB.toFixed(1)}MB. Large files may take several minutes to upload. Do you want to continue?`);
      if (!proceed) {
        event.target.value = ''; // Clear the file input
        return;
      }
    }

    // Use the file upload hook
    await uploadFile(file);

    // Clear the file input
    event.target.value = '';
  };

  // Function to trigger banner refresh on homepage
  const triggerBannerRefresh = () => {
    // Only dispatch custom event if window is available (client-side)
    if (typeof window !== 'undefined') {
      // Dispatch custom event to notify HeroBanner
      window.dispatchEvent(new CustomEvent('banner-updated'));

      // Show a notification that changes will be visible on homepage
      console.log('✅ Banner updated! Changes will be visible on the homepage.');
    }
  };

  // Function to manually refresh banner (for the Refresh Banner button)
  const refreshBannerNow = () => {
    triggerBannerRefresh();
    setMessage({ type: 'success', text: 'Banner refreshed! Check the homepage.' });
  };

  // Save configuration with refresh trigger
  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/banner/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Banner configuration saved successfully! Changes will appear on homepage.' });

        // Trigger banner refresh
        triggerBannerRefresh();

        // Show success message with homepage link
        setTimeout(() => {
          if (typeof window !== 'undefined' && confirm('Banner updated successfully! Would you like to view the homepage to see the changes?')) {
            window.open('/', '_blank');
          }
        }, 1000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Save failed');
      }
    } catch (error) {
      console.error('Save error:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  // Clear message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        <span className="ml-2 text-gray-400">Loading banner configuration...</span>
      </div>
    );
  }

  return (
         <PermissionGuard permission="manage_system_config">
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Homepage Banner Management</h2>
            <p className="text-gray-400 text-sm">Configure the main banner displayed on the homepage</p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.open('/', '_blank');
                }
              }}
              className="flex items-center"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Homepage
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreview(!preview)}
              className="flex items-center"
            >
              {preview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {preview ? 'Hide Preview' : 'Show Preview'}
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/20'
              : 'bg-red-500/10 border border-red-500/20'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            )}
            <span className={message.type === 'success' ? 'text-green-400' : 'text-red-400'}>
              {message.text}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <div className="space-y-6">
            {/* Banner Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Banner Type</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, homepage_banner_type: 'course' }))}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    config.homepage_banner_type === 'course'
                      ? 'border-red-500 bg-red-500/10 text-red-400'
                      : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div className="text-center">
                    <Play className="h-6 w-6 mx-auto mb-2" />
                    <span className="text-sm">Course Banner</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, homepage_banner_type: 'image' }))}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    config.homepage_banner_type === 'image'
                      ? 'border-red-500 bg-red-500/10 text-red-400'
                      : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div className="text-center">
                    <Image className="h-6 w-6 mx-auto mb-2" />
                    <span className="text-sm">Custom Image</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, homepage_banner_type: 'video' }))}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    config.homepage_banner_type === 'video'
                      ? 'border-red-500 bg-red-500/10 text-red-400'
                      : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div className="text-center">
                    <Video className="h-6 w-6 mx-auto mb-2" />
                    <span className="text-sm">Custom Video</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-300">Enable Custom Banner</label>
                <p className="text-gray-400 text-xs">Show custom banner instead of course banner</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.homepage_banner_enabled}
                  onChange={(e) => setConfig(prev => ({ ...prev, homepage_banner_enabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>

            {/* File Upload */}
            {config.homepage_banner_type !== 'course' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload {config.homepage_banner_type === 'video' ? 'Video' : 'Image'}
                </label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept={config.homepage_banner_type === 'video' ? 'video/*' : 'image/*'}
                    onChange={handleFileUpload}
                    className="hidden"
                    id="banner-upload"
                    disabled={isUploading}
                  />
                  <label
                    htmlFor="banner-upload"
                    className={`cursor-pointer flex flex-col items-center ${
                      isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-400'
                    }`}
                  >
                                         {isUploading ? (
                       <div className="flex flex-col items-center">
                         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mb-2"></div>
                         <span className="text-xs text-gray-400">Uploading...</span>
                       </div>
                     ) : (
                       <Upload className="h-8 w-8 mb-2" />
                     )}
                     <span className="text-sm">
                       {isUploading ? 'Please wait...' : `Click to upload ${config.homepage_banner_type}`}
                     </span>
                                         <span className="text-xs text-gray-400 mt-1">
                       {config.homepage_banner_type === 'video'
                         ? 'MP4, WebM, OGG (max 100MB)'
                         : 'JPEG, PNG, WebP (max 100MB)'
                       }
                     </span>
                  </label>
                </div>
              </div>
            )}

            {/* Banner Content */}
            {config.homepage_banner_type !== 'course' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Banner Title</label>
                  <input
                    type="text"
                    value={config.homepage_banner_title || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, homepage_banner_title: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter banner title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Banner Subtitle</label>
                  <input
                    type="text"
                    value={config.homepage_banner_subtitle || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, homepage_banner_subtitle: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter banner subtitle"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Banner Description</label>
                  <textarea
                    value={config.homepage_banner_description || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, homepage_banner_description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter banner description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Button Text</label>
                    <input
                      type="text"
                      value={config.homepage_banner_button_text}
                      onChange={(e) => setConfig(prev => ({ ...prev, homepage_banner_button_text: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Get Started"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Button URL</label>
                    <input
                      type="url"
                      value={config.homepage_banner_button_url || ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, homepage_banner_button_url: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Overlay Opacity: {config.homepage_banner_overlay_opacity}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={config.homepage_banner_overlay_opacity}
                    onChange={(e) => setConfig(prev => ({ ...prev, homepage_banner_overlay_opacity: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Preview Panel */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Preview</h3>
            <div className="relative w-full h-64 bg-gray-900 rounded-lg overflow-hidden">
              {config.homepage_banner_enabled && config.homepage_banner_type !== 'course' ? (
                <>
                  {/* Background */}
                  {config.homepage_banner_type === 'video' && config.homepage_banner_video_url ? (
                    <video
                      src={config.homepage_banner_video_url}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  ) : config.homepage_banner_type === 'image' && config.homepage_banner_image_url ? (
                    <img
                      src={config.homepage_banner_image_url}
                      alt="Banner preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-red-600 to-purple-600 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Upload className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Upload {config.homepage_banner_type}</p>
                      </div>
                    </div>
                  )}

                  {/* Overlay */}
                  <div
                    className="absolute inset-0 bg-black"
                    style={{ opacity: config.homepage_banner_overlay_opacity }}
                  ></div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    {config.homepage_banner_title && (
                      <h2 className="text-2xl font-bold text-white mb-2">
                        {config.homepage_banner_title}
                      </h2>
                    )}
                    {config.homepage_banner_subtitle && (
                      <p className="text-red-400 font-semibold mb-2">
                        {config.homepage_banner_subtitle}
                      </p>
                    )}
                    {config.homepage_banner_description && (
                      <p className="text-gray-200 text-sm mb-4">
                        {config.homepage_banner_description}
                      </p>
                    )}
                    {config.homepage_banner_button_text && (
                      <Button variant="primary" size="sm">
                        {config.homepage_banner_button_text}
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <Settings className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-sm">Course Banner Mode</p>
                    <p className="text-xs">Shows featured course banner</p>
                  </div>
                </div>
              )}
            </div>

            {/* Current Configuration Summary */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-white mb-2">Current Configuration</h4>
              <div className="space-y-1 text-xs text-gray-300">
                <div>Status: {config.homepage_banner_enabled ? 'Enabled' : 'Disabled'}</div>
                <div>Type: {config.homepage_banner_type}</div>
                {config.homepage_banner_type === 'video' && config.homepage_banner_video_url && (
                  <div>Video: ✓ Uploaded</div>
                )}
                {config.homepage_banner_type === 'image' && config.homepage_banner_image_url && (
                  <div>Image: ✓ Uploaded</div>
                )}
                {config.homepage_banner_title && <div>Title: ✓ Set</div>}
                {config.homepage_banner_button_text && <div>Button: ✓ Configured</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default BannerManagement;