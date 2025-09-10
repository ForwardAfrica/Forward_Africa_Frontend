// API Response Standardization Middleware
// Ensures all API responses follow the same format

/**
 * Standard API Response Format
 * @param {boolean} success - Whether the request was successful
 * @param {any} data - Response data (for success) or null (for errors)
 * @param {string} message - Human-readable message
 * @param {string} code - Error code (for errors)
 * @param {any} meta - Additional metadata (pagination, timestamps, etc.)
 * @param {any} errors - Detailed error information (for errors)
 */
class ApiResponse {
  constructor(success, data = null, message = '', code = '', meta = null, errors = null) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.code = code;
    this.meta = meta;
    this.errors = errors;
    this.timestamp = new Date().toISOString();
    this.requestId = this.generateRequestId();
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON() {
    const response = {
      success: this.success,
      timestamp: this.timestamp,
      requestId: this.requestId
    };

    if (this.success) {
      response.data = this.data;
      if (this.message) response.message = this.message;
      if (this.meta) response.meta = this.meta;
    } else {
      response.error = {
        message: this.message,
        code: this.code,
        details: this.errors
      };
    }

    return response;
  }

  static success(data, message = 'Success', meta = null) {
    return new ApiResponse(true, data, message, '', meta);
  }

  static error(message, code = 'UNKNOWN_ERROR', errors = null) {
    return new ApiResponse(false, null, message, code, null, errors);
  }

  static validationError(errors, message = 'Validation failed') {
    return new ApiResponse(false, null, message, 'VALIDATION_ERROR', null, errors);
  }

  static notFound(message = 'Resource not found', code = 'NOT_FOUND') {
    return new ApiResponse(false, null, message, code);
  }

  static unauthorized(message = 'Unauthorized access', code = 'UNAUTHORIZED') {
    return new ApiResponse(false, null, message, code);
  }

  static forbidden(message = 'Access forbidden', code = 'FORBIDDEN') {
    return new ApiResponse(false, null, message, code);
  }

  static serverError(message = 'Internal server error', code = 'INTERNAL_ERROR') {
    return new ApiResponse(false, null, message, code);
  }

  static rateLimitExceeded(message = 'Rate limit exceeded', retryAfter = null) {
    const response = new ApiResponse(false, null, message, 'RATE_LIMIT_EXCEEDED');
    if (retryAfter) {
      response.meta = { retryAfter };
    }
    return response;
  }
}

// Response middleware
const apiResponseMiddleware = (req, res, next) => {
  // Add response methods to res object
  res.apiSuccess = (data, message = 'Success', meta = null) => {
    const response = ApiResponse.success(data, message, meta);
    return res.json(response.toJSON());
  };

  res.apiError = (message, code = 'UNKNOWN_ERROR', errors = null, statusCode = 400) => {
    const response = ApiResponse.error(message, code, errors);
    return res.status(statusCode).json(response.toJSON());
  };

  res.apiValidationError = (errors, message = 'Validation failed') => {
    const response = ApiResponse.validationError(errors, message);
    return res.status(400).json(response.toJSON());
  };

  res.apiNotFound = (message = 'Resource not found', code = 'NOT_FOUND') => {
    const response = ApiResponse.notFound(message, code);
    return res.status(404).json(response.toJSON());
  };

  res.apiUnauthorized = (message = 'Unauthorized access', code = 'UNAUTHORIZED') => {
    const response = ApiResponse.unauthorized(message, code);
    return res.status(401).json(response.toJSON());
  };

  res.apiForbidden = (message = 'Access forbidden', code = 'FORBIDDEN') => {
    const response = ApiResponse.forbidden(message, code);
    return res.status(403).json(response.toJSON());
  };

  res.apiServerError = (message = 'Internal server error', code = 'INTERNAL_ERROR') => {
    const response = ApiResponse.serverError(message, code);
    return res.status(500).json(response.toJSON());
  };

  res.apiRateLimitExceeded = (message = 'Rate limit exceeded', retryAfter = null) => {
    const response = ApiResponse.rateLimitExceeded(message, retryAfter);
    return res.status(429).json(response.toJSON());
  };

  // Add pagination helper
  res.apiPaginated = (data, page, limit, total, message = 'Success') => {
    const totalPages = Math.ceil(total / limit);
    const meta = {
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
    return res.apiSuccess(data, message, meta);
  };

  next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('API Error:', err);

  // Handle different types of errors
  if (err.name === 'ValidationError') {
    return res.apiValidationError(err.errors, 'Validation failed');
  }

  if (err.name === 'CastError') {
    return res.apiError('Invalid ID format', 'INVALID_ID', null, 400);
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return res.apiError('Duplicate entry', 'DUPLICATE_ENTRY', null, 409);
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.apiError('Referenced resource not found', 'FOREIGN_KEY_CONSTRAINT', null, 400);
  }

  if (err.code === 'ER_ACCESS_DENIED_ERROR') {
    return res.apiError('Database access denied', 'DATABASE_ERROR', null, 500);
  }

  if (err.code === 'ECONNREFUSED') {
    return res.apiError('Database connection failed', 'DATABASE_ERROR', null, 500);
  }

  if (err.code === 'ENOTFOUND') {
    return res.apiError('Service unavailable', 'SERVICE_UNAVAILABLE', null, 503);
  }

  // Default error response
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message || 'An unexpected error occurred';

  const code = process.env.NODE_ENV === 'production'
    ? 'INTERNAL_ERROR'
    : err.code || 'UNKNOWN_ERROR';

  return res.apiServerError(message, code);
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Request logging middleware - simplified to avoid conflicts with monitoring
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log request
  console.log(`📥 ${req.method} ${req.path} - ${req.ip} - ${new Date().toISOString()}`);

  // Use res.on('finish') instead of overriding res.end to avoid conflicts
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    // Log response
    const logLevel = statusCode >= 400 ? '❌' : '✅';
    console.log(`${logLevel} ${req.method} ${req.path} - ${statusCode} - ${duration}ms`);
  });

  next();
};

module.exports = {
  ApiResponse,
  apiResponseMiddleware,
  errorHandler,
  asyncHandler,
  requestLogger
};