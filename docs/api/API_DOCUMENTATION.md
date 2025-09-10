# Forward Africa API Documentation

## Overview

The Forward Africa Learning Platform API provides a comprehensive set of endpoints for managing courses, users, authentication, and platform features. This API follows RESTful principles and returns standardized JSON responses.

## Base URL

- **Development**: `http://localhost:3002/api`
- **Production**: `https://api.fowardafrica.com/api`

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow a standardized format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Success message",
  "meta": {
    // Additional metadata (pagination, etc.)
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "req_1705312200000_abc123def"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {
      // Additional error details
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "req_1705312200000_abc123def"
}
```

## Rate Limiting

API endpoints are rate-limited based on the environment:

### Development Environment
- **Authentication**: 100 attempts per 15 minutes
- **General API**: 1000 requests per 15 minutes
- **File Uploads**: 50 uploads per 15 minutes
- **Search**: 200 searches per 15 minutes
- **Admin**: 500 admin requests per 15 minutes

### Production Environment
- **Authentication**: 5 attempts per 15 minutes
- **General API**: 100 requests per 15 minutes
- **File Uploads**: 10 uploads per 15 minutes
- **Search**: 50 searches per 15 minutes
- **Admin**: 100 admin requests per 15 minutes

When rate limit is exceeded, the API returns a 429 status code with retry information.

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Input validation failed | 400 |
| `UNAUTHORIZED` | Authentication required | 401 |
| `FORBIDDEN` | Insufficient permissions | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `DUPLICATE_ENTRY` | Resource already exists | 409 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `INTERNAL_ERROR` | Server error | 500 |
| `DATABASE_ERROR` | Database operation failed | 500 |
| `SERVICE_UNAVAILABLE` | Service temporarily unavailable | 503 |

---

## Authentication Endpoints

### POST /auth/register

Register a new user account.

**Request Body:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "student",
  "topics_of_interest": ["business", "technology"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "full_name": "John Doe",
      "email": "john@example.com",
      "role": "student",
      "created_at": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here"
  },
  "message": "User registered successfully"
}
```

### POST /auth/login

Authenticate user and get access token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "full_name": "John Doe",
      "email": "john@example.com",
      "role": "student"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here"
  },
  "message": "Login successful"
}
```

### POST /auth/refresh

Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "new_access_token_here",
    "refreshToken": "new_refresh_token_here"
  },
  "message": "Token refreshed successfully"
}
```

### GET /auth/me

Get current user profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "full_name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "avatar_url": "https://example.com/avatar.jpg",
    "created_at": "2024-01-15T10:30:00.000Z",
    "last_login": "2024-01-15T10:30:00.000Z"
  }
}
```

### POST /auth/logout

Logout user and invalidate tokens.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## User Management Endpoints

### GET /users

Get list of users (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `role` (string): Filter by role
- `search` (string): Search by name or email

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user_123",
      "full_name": "John Doe",
      "email": "john@example.com",
      "role": "student",
      "status": "active",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### GET /users/:id

Get user by ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "full_name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "avatar_url": "https://example.com/avatar.jpg",
    "bio": "Software developer",
    "topics_of_interest": ["business", "technology"],
    "created_at": "2024-01-15T10:30:00.000Z",
    "last_login": "2024-01-15T10:30:00.000Z"
  }
}
```

### PUT /users/:id

Update user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "full_name": "John Updated",
  "bio": "Updated bio",
  "topics_of_interest": ["business", "technology", "marketing"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "full_name": "John Updated",
    "email": "john@example.com",
    "bio": "Updated bio",
    "topics_of_interest": ["business", "technology", "marketing"],
    "updated_at": "2024-01-15T10:30:00.000Z"
  },
  "message": "Profile updated successfully"
}
```

---

## Course Management Endpoints

### GET /courses

Get list of courses.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `category` (string): Filter by category
- `instructor` (string): Filter by instructor ID
- `search` (string): Search in title and description
- `featured` (boolean): Filter featured courses only

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "course_123",
      "title": "Business Fundamentals",
      "description": "Learn essential business principles",
      "thumbnail_url": "https://example.com/thumbnail.jpg",
      "banner_url": "https://example.com/banner.jpg",
      "category": "business",
      "instructor": {
        "id": "instructor_123",
        "name": "Dr. Sarah Johnson",
        "title": "Business Professor"
      },
      "rating": 4.8,
      "students_count": 1250,
      "duration": "8 hours",
      "lessons_count": 24,
      "price": 99.99,
      "featured": true,
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### GET /courses/:id

Get course details by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "course_123",
    "title": "Business Fundamentals",
    "description": "Learn essential business principles",
    "thumbnail_url": "https://example.com/thumbnail.jpg",
    "banner_url": "https://example.com/banner.jpg",
    "category": "business",
    "instructor": {
      "id": "instructor_123",
      "name": "Dr. Sarah Johnson",
      "title": "Business Professor",
      "bio": "Expert in business management",
      "avatar_url": "https://example.com/avatar.jpg"
    },
    "rating": 4.8,
    "students_count": 1250,
    "duration": "8 hours",
    "lessons": [
      {
        "id": "lesson_1",
        "title": "Introduction to Business",
        "description": "Overview of business concepts",
        "duration": "30 minutes",
        "video_url": "https://example.com/video1.mp4",
        "thumbnail_url": "https://example.com/lesson1.jpg"
      }
    ],
    "price": 99.99,
    "featured": true,
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### POST /courses

Create a new course (Instructor/Admin only).

**Headers:**
```
Authorization: Bearer <instructor_token>
```

**Request Body:**
```json
{
  "title": "New Course Title",
  "description": "Course description",
  "category": "technology",
  "price": 79.99,
  "featured": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "course_456",
    "title": "New Course Title",
    "description": "Course description",
    "category": "technology",
    "price": 79.99,
    "featured": false,
    "instructor_id": "instructor_123",
    "created_at": "2024-01-15T10:30:00.000Z"
  },
  "message": "Course created successfully"
}
```

---

## Lesson Management Endpoints

### GET /courses/:courseId/lessons

Get lessons for a specific course.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "lesson_1",
      "title": "Introduction to Business",
      "description": "Overview of business concepts",
      "duration": "30 minutes",
      "video_url": "https://example.com/video1.mp4",
      "thumbnail_url": "https://example.com/lesson1.jpg",
      "order": 1,
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### GET /lessons/:id

Get lesson details by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "lesson_1",
    "title": "Introduction to Business",
    "description": "Overview of business concepts",
    "duration": "30 minutes",
    "video_url": "https://example.com/video1.mp4",
    "thumbnail_url": "https://example.com/lesson1.jpg",
    "course": {
      "id": "course_123",
      "title": "Business Fundamentals"
    },
    "order": 1,
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## Search Endpoints

### GET /search

Search across courses, lessons, and instructors.

**Query Parameters:**
- `q` (string): Search query (required)
- `type` (string): Search type (courses, lessons, instructors, all)
- `category` (string): Filter by category
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": "course_123",
        "title": "Business Fundamentals",
        "description": "Learn essential business principles",
        "thumbnail_url": "https://example.com/thumbnail.jpg",
        "instructor": {
          "name": "Dr. Sarah Johnson"
        },
        "rating": 4.8,
        "students_count": 1250
      }
    ],
    "lessons": [
      {
        "id": "lesson_1",
        "title": "Introduction to Business",
        "description": "Overview of business concepts",
        "course": {
          "title": "Business Fundamentals"
        }
      }
    ],
    "instructors": [
      {
        "id": "instructor_123",
        "name": "Dr. Sarah Johnson",
        "title": "Business Professor",
        "bio": "Expert in business management"
      }
    ]
  },
  "meta": {
    "total_results": 25,
    "search_query": "business",
    "search_type": "all"
  }
}
```

---

## File Upload Endpoints

### POST /upload/avatar

Upload user avatar.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `avatar` (file): Image file (JPG, PNG, max 5MB)

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://example.com/uploads/avatars/avatar_123.jpg",
    "filename": "avatar_123.jpg",
    "size": 1024000,
    "mime_type": "image/jpeg"
  },
  "message": "Avatar uploaded successfully"
}
```

### POST /upload/course-media

Upload course media (thumbnail, banner).

**Headers:**
```
Authorization: Bearer <instructor_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `courseThumbnail` (file): Thumbnail image
- `courseBanner` (file): Banner image
- `lessonThumbnail` (file): Lesson thumbnail

**Response:**
```json
{
  "success": true,
  "data": {
    "thumbnail_url": "https://example.com/uploads/course-media/thumbnail_123.jpg",
    "banner_url": "https://example.com/uploads/course-media/banner_123.jpg"
  },
  "message": "Course media uploaded successfully"
}
```

---

## System Endpoints

### GET /health

Health check endpoint.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "1.0.0",
    "environment": "production"
  }
}
```

### GET /system/status

Get system status and statistics.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_users": 1250,
    "total_courses": 45,
    "total_lessons": 320,
    "active_users": 89,
    "completion_rate": 78.5,
    "average_rating": 4.6,
    "total_revenue": 12500,
    "monthly_growth": 12.5,
    "system_uptime": "99.9%",
    "database_status": "connected",
    "last_backup": "2024-01-15T10:30:00.000Z"
  }
}
```

### GET /system/rate-limits

Get current rate limit status.

**Response:**
```json
{
  "success": true,
  "data": {
    "environment": "production",
    "limits": {
      "auth": { "windowMs": 900000, "max": 5 },
      "api": { "windowMs": 900000, "max": 100 },
      "upload": { "windowMs": 900000, "max": 10 },
      "search": { "windowMs": 900000, "max": 50 },
      "admin": { "windowMs": 900000, "max": 100 }
    },
    "current_ip": "192.168.1.100",
    "user_agent": "Mozilla/5.0..."
  }
}
```

---

## WebSocket Endpoints

### WebSocket Connection

Connect to real-time updates:

```
ws://localhost:3002/ws
```

**Authentication:**
Send authentication message after connection:

```json
{
  "type": "auth",
  "token": "your_jwt_token"
}
```

**Message Types:**
- `course_progress`: Real-time course progress updates
- `notification`: System notifications
- `chat_message`: Real-time chat messages

---

## SDKs and Libraries

### JavaScript/TypeScript

```javascript
import { ForwardAfricaAPI } from '@fowardafrica/api-client';

const api = new ForwardAfricaAPI({
  baseURL: 'http://localhost:3002/api',
  token: 'your_jwt_token'
});

// Get courses
const courses = await api.courses.list();

// Create course
const course = await api.courses.create({
  title: 'New Course',
  description: 'Course description'
});
```

### Python

```python
from fowardafrica import API

api = API(
    base_url='http://localhost:3002/api',
    token='your_jwt_token'
)

# Get courses
courses = api.courses.list()

# Create course
course = api.courses.create({
    'title': 'New Course',
    'description': 'Course description'
})
```

---

## Best Practices

### Error Handling

Always check the `success` field in responses and handle errors appropriately:

```javascript
const response = await fetch('/api/courses');
const data = await response.json();

if (!data.success) {
  console.error('API Error:', data.error.message);
  // Handle error appropriately
} else {
  // Process successful response
  console.log('Courses:', data.data);
}
```

### Rate Limiting

Handle rate limiting by checking for 429 status codes and implementing exponential backoff:

```javascript
const makeRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return makeRequest(url, options); // Retry
    }

    return response;
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
};
```

### Authentication

Always include the JWT token in requests that require authentication:

```javascript
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};

const response = await fetch('/api/courses', { headers });
```

### File Uploads

Use FormData for file uploads and include proper headers:

```javascript
const formData = new FormData();
formData.append('avatar', file);

const response = await fetch('/api/upload/avatar', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

---

## Support

For API support and questions:

- **Email**: api-support@fowardafrica.com
- **Documentation**: https://docs.fowardafrica.com/api
- **Status Page**: https://status.fowardafrica.com
- **GitHub**: https://github.com/fowardafrica/api

---

## Changelog

### Version 1.0.0 (2024-01-15)
- Initial API release
- Authentication endpoints
- Course and lesson management
- File upload functionality
- Search capabilities
- Real-time WebSocket support