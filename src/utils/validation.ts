// Validation utilities for form validation

export interface ValidationResult {
  isValid: boolean;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return {
      isValid: false,
      message: 'Email is required',
      type: 'error'
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      message: 'Please enter a valid email address',
      type: 'error'
    };
  }

  return {
    isValid: true,
    message: 'Email looks good',
    type: 'success'
  };
};

export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return {
      isValid: false,
      message: 'Password is required',
      type: 'error'
    };
  }

  if (password.length < 6) {
    return {
      isValid: false,
      message: 'Password should be at least 6 characters',
      type: 'error'
    };
  }

  if (password.length < 8) {
    return {
      isValid: true,
      message: 'Password strength: Weak (recommend 8+ characters)',
      type: 'warning'
    };
  }

  // Check for complexity
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const complexity = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

  if (complexity >= 3) {
    return {
      isValid: true,
      message: 'Password strength: Strong',
      type: 'success'
    };
  } else if (complexity >= 2) {
    return {
      isValid: true,
      message: 'Password strength: Good',
      type: 'success'
    };
  } else {
    return {
      isValid: true,
      message: 'Password strength: Fair (add numbers/symbols for better security)',
      type: 'warning'
    };
  }
};

export const validatePasswordMatch = (password: string, confirmPassword: string): ValidationResult => {
  if (!confirmPassword) {
    return {
      isValid: false,
      message: 'Please confirm your password',
      type: 'error'
    };
  }

  if (password !== confirmPassword) {
    return {
      isValid: false,
      message: 'Passwords do not match',
      type: 'error'
    };
  }

  return {
    isValid: true,
    message: 'Passwords match',
    type: 'success'
  };
};

export const validateFullName = (name: string): ValidationResult => {
  if (!name) {
    return {
      isValid: false,
      message: 'Full name is required',
      type: 'error'
    };
  }

  if (name.trim().length < 2) {
    return {
      isValid: false,
      message: 'Full name must be at least 2 characters',
      type: 'error'
    };
  }

  if (name.trim().length > 50) {
    return {
      isValid: false,
      message: 'Full name must be less than 50 characters',
      type: 'error'
    };
  }

  return {
    isValid: true,
    message: 'Name looks good',
    type: 'success'
  };
};

export const validateRequired = (value: string, fieldName: string): ValidationResult => {
  if (!value || value.trim().length === 0) {
    return {
      isValid: false,
      message: `${fieldName} is required`,
      type: 'error'
    };
  }

  return {
    isValid: true,
    message: `${fieldName} looks good`,
    type: 'success'
  };
};

export const validateTopicsOfInterest = (topics: string[]): ValidationResult => {
  if (!topics || topics.length === 0) {
    return {
      isValid: false,
      message: 'Please select at least one topic of interest',
      type: 'error'
    };
  }

  if (topics.length > 5) {
    return {
      isValid: false,
      message: 'Please select no more than 5 topics',
      type: 'warning'
    };
  }

  return {
    isValid: true,
    message: `${topics.length} topic(s) selected`,
    type: 'success'
  };
};

// Error message mapping for authentication errors
export const getAuthErrorMessage = (errorCode: string, defaultMessage: string): string => {
  const errorMessages: Record<string, string> = {
    'EMAIL_EXISTS': 'This email is already registered. Please try logging in instead.',
    'USER_ALREADY_EXISTS': 'This email is already registered. Please try logging in instead.',
    'INVALID_EMAIL': 'Please enter a valid email address.',
    'WEAK_PASSWORD': 'Password should be at least 6 characters.',
    'MISSING_CREDENTIALS': 'Email and password are required.',
    'INVALID_CREDENTIALS': 'Invalid email or password.',
    'UNAUTHORIZED': 'Invalid email or password.',
    'ACCOUNT_SUSPENDED': 'Your account has been suspended. Please contact support.',
    'RATE_LIMITED': 'Too many attempts. Please wait a moment before trying again.',
    'NETWORK_ERROR': 'Network error. Please check your connection.',
    'SERVER_ERROR': 'Server error. Please try again later.',
    'INVALID_DATA': 'Please check your information and try again.',
    'MISSING_DATA': 'Please fill in all required fields.',
    'INVALID_NAME': 'Please enter a valid name.',
    'INVALID_TOKEN': 'Session expired. Please log in again.',
    'TOKEN_EXPIRED': 'Session expired. Please log in again.',
    'REFRESH_FAILED': 'Session expired. Please log in again.',
  };

  return errorMessages[errorCode] || defaultMessage;
};

// Helper function to extract error code from error message
export const extractErrorCode = (errorMessage: string): string => {
  // Common patterns for error codes
  const patterns = [
    /AuthError: (\w+)/,
    /(\w+):/,
    /error code: (\w+)/i,
  ];

  for (const pattern of patterns) {
    const match = errorMessage.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return '';
};