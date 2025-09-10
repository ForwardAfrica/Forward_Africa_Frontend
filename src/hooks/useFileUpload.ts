import { useState } from 'react';
import { validateFile, getFileSizeMB, formatFileSize } from '../utils/fileValidator';
import { handleUploadError, parseErrorResponse } from '../utils/errorHandler';

export interface FileUploadOptions {
  endpoint: string;
  fieldName: string;
  maxSize: number; // in bytes
  allowedTypes: string[];
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
}

export interface FileUploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  success: string | null;
}

export const useFileUpload = (options: FileUploadOptions) => {
  const [state, setState] = useState<FileUploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    success: null
  });

  const uploadFile = async (file: File) => {
    // Validate file
    const validation = validateFile(file, {
      maxSize: options.maxSize,
      allowedTypes: options.allowedTypes
    });

    if (!validation.isValid) {
      setState(prev => ({ ...prev, error: validation.error || 'Invalid file' }));
      return;
    }

    setState(prev => ({
      ...prev,
      isUploading: true,
      error: null,
      success: null,
      progress: 0
    }));

    try {
      const formData = new FormData();
      formData.append(options.fieldName, file);

      console.log('📤 Uploading file:', {
        endpoint: options.endpoint,
        fieldName: options.fieldName,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      const response = await fetch(options.endpoint, {
        method: 'POST',
        body: formData
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorMessage = await parseErrorResponse(response);
        console.log('❌ Upload failed:', errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ Upload successful:', data);

      setState(prev => ({
        ...prev,
        isUploading: false,
        progress: 100,
        success: 'Upload completed successfully'
      }));

      options.onSuccess?.(data);
    } catch (error) {
      const errorMessage = handleUploadError(error);

      setState(prev => ({
        ...prev,
        isUploading: false,
        error: errorMessage
      }));

      options.onError?.(errorMessage);
    }
  };

  const resetState = () => {
    setState({
      isUploading: false,
      progress: 0,
      error: null,
      success: null
    });
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const clearSuccess = () => {
    setState(prev => ({ ...prev, success: null }));
  };

  return {
    ...state,
    uploadFile,
    resetState,
    clearError,
    clearSuccess,
    getFileSizeMB,
    formatFileSize
  };
};