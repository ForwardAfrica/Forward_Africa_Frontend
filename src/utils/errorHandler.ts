export const handleUploadError = (error: unknown): string => {
  if (error instanceof Error) {
    // Handle specific error types
    if (error.name === 'AbortError') {
      return 'Upload timed out. Please try again with a smaller file or check your connection.';
    }

    // Handle common error messages
    const message = error.message.toLowerCase();
    if (message.includes('file too large')) {
      return 'File is too large. Please compress your file before uploading.';
    }
    if (message.includes('only image and video files are allowed')) {
      return 'Invalid file type. Only images (JPEG, PNG, WebP) and videos (MP4, WebM, OGG, MOV) are allowed.';
    }
    if (message.includes('authentication token not found') || message.includes('invalid or expired token')) {
      return 'Session expired. Please log in again.';
    }
    if (message.includes('insufficient permissions')) {
      return 'You do not have permission to upload files. Contact an administrator.';
    }
    if (message.includes('access token required')) {
      return 'Authentication required. Please log in again.';
    }

    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object' && error !== null) {
    const errorObj = error as any;
    if (errorObj.message) return errorObj.message;
    if (errorObj.error) return errorObj.error;
    if (errorObj.details) return errorObj.details;

    try {
      const stringified = JSON.stringify(errorObj);
      if (stringified !== '{}' && stringified !== '[object Object]') {
        return stringified;
      }
    } catch {
      // Ignore stringify errors
    }
  }

  return 'Upload failed - unknown error occurred';
};

export const parseErrorResponse = async (response: Response): Promise<string> => {
  try {
    const errorData = await response.json();

    if (typeof errorData === 'string') {
      return errorData;
    }

    if (errorData && typeof errorData === 'object') {
      if (errorData.error) return errorData.error;
      if (errorData.message) return errorData.message;
      if (errorData.details) return errorData.details;

      try {
        const stringified = JSON.stringify(errorData);
        if (stringified !== '{}' && stringified !== '[object Object]') {
          return stringified;
        }
      } catch {
        // Ignore stringify errors
      }
    }
  } catch (parseError) {
    console.log('Failed to parse error response:', parseError);
  }

  return response.statusText || `HTTP ${response.status}: Upload failed`;
};