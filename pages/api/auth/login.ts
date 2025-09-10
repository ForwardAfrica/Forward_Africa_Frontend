import { NextApiRequest, NextApiResponse } from 'next';

// Enhanced error handling
class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// Validation utilities
const validation = {
  validateEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  validatePassword: (password: string): boolean => {
    return Boolean(password && password.length >= 6);
  },

  validateCredentials: (email: string, password: string): void => {
    if (!email || !password) {
      throw new AuthError('MISSING_CREDENTIALS', 'Email and password are required', 400);
    }

    if (!validation.validateEmail(email)) {
      throw new AuthError('INVALID_EMAIL', 'Please enter a valid email address', 400);
    }

    if (!validation.validatePassword(password)) {
      throw new AuthError('WEAK_PASSWORD', 'Password must be at least 6 characters long', 400);
    }
  }
};

// Rate limiting (simple in-memory implementation)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

const rateLimit = {
  checkRateLimit: (email: string): void => {
    const now = Date.now();
    const attempts = loginAttempts.get(email);

    if (attempts) {
      // Check if lockout period has passed
      if (now - attempts.lastAttempt < LOCKOUT_DURATION) {
        if (attempts.count >= MAX_ATTEMPTS) {
          throw new AuthError(
            'RATE_LIMITED',
            'Too many login attempts. Please try again later.',
            429
          );
        }
      } else {
        // Reset attempts after lockout period
        loginAttempts.delete(email);
      }
    }
  },

  recordAttempt: (email: string, success: boolean): void => {
    const now = Date.now();

    if (success) {
      // Clear attempts on successful login
      loginAttempts.delete(email);
    } else {
      // Record failed attempt
      const attempts = loginAttempts.get(email) || { count: 0, lastAttempt: 0 };
      attempts.count += 1;
      attempts.lastAttempt = now;
      loginAttempts.set(email, attempts);
    }
  }
};

// Enhanced login handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED'
    });
  }

  try {
    const { email, password } = req.body;

    // Validate input
    validation.validateCredentials(email, password);

    // Check rate limiting
    rateLimit.checkRateLimit(email);

    console.log('🔐 API Login: Attempting login for:', email);

    // Forward request to backend
    const backendResponse = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const responseData = await backendResponse.json();

    if (!backendResponse.ok) {
      // Record failed attempt
      rateLimit.recordAttempt(email, false);

      // Handle specific backend errors
      switch (backendResponse.status) {
        case 400:
          throw new AuthError('INVALID_CREDENTIALS', responseData.error || 'Invalid credentials', 400);
        case 401:
          throw new AuthError('UNAUTHORIZED', responseData.error || 'Invalid email or password', 401);
        case 403:
          throw new AuthError('ACCOUNT_SUSPENDED', responseData.error || 'Account is suspended', 403);
        case 429:
          throw new AuthError('RATE_LIMITED', responseData.error || 'Too many login attempts', 429);
        case 500:
          throw new AuthError('SERVER_ERROR', 'Internal server error. Please try again later.', 500);
        default:
          throw new AuthError('LOGIN_FAILED', responseData.error || 'Login failed', backendResponse.status);
      }
    }

    // Validate response data
    if (!responseData.token || !responseData.refreshToken || !responseData.user) {
      throw new AuthError('INVALID_RESPONSE', 'Invalid response from authentication server', 500);
    }

    // Record successful attempt
    rateLimit.recordAttempt(email, true);

    console.log('✅ API Login: Login successful for:', email);

    // Return success response
    return res.status(200).json({
      message: 'Login successful',
      token: responseData.token,
      refreshToken: responseData.refreshToken,
      user: responseData.user
    });

  } catch (error) {
    console.error('❌ API Login Error:', error);

    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code
      });
    }

    // Handle unexpected errors
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
}

// Configure API route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};