import jwt from 'jsonwebtoken'
import mysql from 'mysql2/promise'

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'forward_africa_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}

// Create database connection pool
const pool = mysql.createPool(dbConfig)

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map()

// Verify JWT token on server side
export async function verifyToken(token: string) {
  try {
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any

    if (!decoded || !decoded.userId) {
      return null
    }

    // Check if token is expired
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return null
    }

    // Get user from database
    const [users] = await pool.execute(
      'SELECT id, email, full_name, role, permissions, is_active FROM users WHERE id = ? AND is_active = 1',
      [decoded.userId]
    )

    if (users.length === 0) {
      return null
    }

    const user = users[0] as any

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      permissions: user.permissions ? JSON.parse(user.permissions) : [],
      is_active: user.is_active
    }
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

// Get user role from database
export async function getUserRole(userId: number): Promise<string | null> {
  try {
    const [users] = await pool.execute(
      'SELECT role FROM users WHERE id = ? AND is_active = 1',
      [userId]
    )

    if (users.length === 0) {
      return null
    }

    const user = users[0] as any
    return user.role
  } catch (error) {
    console.error('Get user role error:', error)
    return null
  }
}

// Check rate limiting
export function checkRateLimit(identifier: string, maxRequests: number = 100, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now()

  if (!rateLimitStore.has(identifier)) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }

  const record = rateLimitStore.get(identifier)!

  if (now > record.resetTime) {
    record.count = 1
    record.resetTime = now + windowMs
    return true
  }

  record.count++

  if (record.count > maxRequests) {
    return false
  }

  return true
}

// Log security event
export async function logSecurityEvent(data: {
  userId: number | null
  ip: string
  userAgent: string
  action: string
  success: boolean
  error?: string
  details?: any
}) {
  try {
    await pool.execute(
      'INSERT INTO security_events (user_id, event_type, ip_address, user_agent, details, severity, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [
        data.userId,
        data.action,
        data.ip,
        data.userAgent,
        data.details ? JSON.stringify(data.details) : null,
        data.success ? 'LOW' : 'HIGH'
      ]
    )
  } catch (error) {
    console.error('Failed to log security event:', error)
  }
}

// Validate CSRF token
export function validateCSRFToken(token: string, storedToken: string): boolean {
  return token === storedToken
}

// Sanitize input
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

// Check for suspicious patterns
export function detectSuspiciousActivity(userAgent: string, ip: string): boolean {
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /perl/i
  ]

  return suspiciousPatterns.some(pattern => pattern.test(userAgent))
}

// Get client IP address
export function getClientIP(req: any): string {
  return (
    req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown'
  ).toString()
}

// Validate user permissions
export function validatePermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.every(permission => userPermissions.includes(permission))
}

// Check if user is admin
export function isAdmin(role: string): boolean {
  return role === 'admin' || role === 'super_admin'
}

// Check if user is super admin
export function isSuperAdmin(role: string): boolean {
  return role === 'super_admin'
}

// Generate secure random token
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Hash sensitive data
export async function hashData(data: string): Promise<string> {
  const crypto = await import('crypto')
  return crypto.createHash('sha256').update(data).digest('hex')
}

// Validate email format
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Check password strength
export function checkPasswordStrength(password: string): {
  strong: boolean
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  if (password.length >= 8) score++
  else feedback.push('Password must be at least 8 characters long')

  if (/[a-z]/.test(password)) score++
  else feedback.push('Password must contain at least one lowercase letter')

  if (/[A-Z]/.test(password)) score++
  else feedback.push('Password must contain at least one uppercase letter')

  if (/[0-9]/.test(password)) score++
  else feedback.push('Password must contain at least one number')

  if (/[^A-Za-z0-9]/.test(password)) score++
  else feedback.push('Password must contain at least one special character')

  return {
    strong: score >= 4,
    score,
    feedback
  }
}