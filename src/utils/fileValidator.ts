export interface FileValidationOptions {
  maxSize: number; // in bytes
  allowedTypes: string[];
  allowedExtensions?: string[];
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateFile = (file: File, options: FileValidationOptions): FileValidationResult => {
  // Check file type
  if (!options.allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid file type. Allowed types: ${options.allowedTypes.join(', ')}`
    };
  }

  // Check file size
  if (file.size > options.maxSize) {
    const maxSizeMB = options.maxSize / (1024 * 1024);
    return {
      isValid: false,
      error: `File is too large. Maximum size is ${maxSizeMB}MB.`
    };
  }

  return { isValid: true };
};

export const getFileSizeMB = (file: File): number => {
  return file.size / (1024 * 1024);
};

export const formatFileSize = (bytes: number): string => {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)}MB`;
};