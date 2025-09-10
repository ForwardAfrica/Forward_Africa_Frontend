import React, { useState, useRef } from 'react';
import Button from './ui/Button';
import ErrorMessage from './ui/ErrorMessage';
import { SuccessMessage } from './ui/SuccessMessage';
import { useFileUpload } from '../hooks/useFileUpload';

interface VideoUploadProps {
  lessonId: string;
  onUploadComplete?: (videoAssetId: string) => void;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({ lessonId, onUploadComplete }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // File upload hook
  const {
    isUploading,
    error,
    success,
    uploadFile,
    clearError,
    clearSuccess
  } = useFileUpload({
    endpoint: `/api/video-content/upload/${lessonId}`,
    fieldName: 'video',
    maxSize: 500 * 1024 * 1024, // 500MB
    allowedTypes: ['video/mp4', 'video/mov', 'video/avi', 'video/webm'],
    onSuccess: (data) => {
      if (onUploadComplete) {
        onUploadComplete(data.videoAssetId);
      }
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      clearError();
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    await uploadFile(selectedFile);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Upload Video</h2>

      {error && <ErrorMessage message={error} onClose={clearError} />}
      {success && <SuccessMessage message={success} onClose={clearSuccess} />}

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="space-y-4">
          <div className="text-gray-600">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Select Video File
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            MP4, MOV, AVI up to 500MB
          </p>
        </div>
      </div>

      {selectedFile && (
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-2">Selected File:</h3>
          <p className="text-sm text-gray-600">
            {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </p>
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="mt-4 bg-green-600 hover:bg-green-700"
          >
            {isUploading ? 'Uploading...' : 'Upload Video'}
          </Button>
        </div>
      )}
    </div>
  );
};