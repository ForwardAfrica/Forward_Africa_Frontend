# 🔥 Firebase Migration Guide

## Overview

This guide will help you migrate the Forward Africa Learning Platform from the current MySQL + Custom Auth system to a fully Firebase-based architecture.

## 🎯 Migration Goals

- **Authentication**: Migrate from custom JWT to Firebase Auth
- **Database**: Migrate from MySQL to Firestore
- **Storage**: Migrate from local storage to Firebase Storage
- **Real-time**: Implement Firestore real-time listeners
- **Security**: Implement Firebase Security Rules

## 📋 Prerequisites

1. **Firebase Project Setup**
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication, Firestore, and Storage
   - Generate service account key for backend

2. **Environment Variables**
   - Copy `firebase.env.example` to `.env.local`
   - Fill in your Firebase configuration

3. **Dependencies**
   - Firebase SDK is already installed
   - Firebase Admin SDK is already added

## 🚀 Migration Steps

### Step 1: Firebase Project Configuration

1. **Create Firebase Project**
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools

   # Login to Firebase
   firebase login

   # Initialize Firebase in your project
   firebase init
   ```

2. **Enable Services**
   - Authentication (Email/Password, Google)
   - Firestore Database
   - Storage
   - Analytics (optional)

3. **Configure Authentication**
   - Go to Authentication > Sign-in method
   - Enable Email/Password
   - Enable Google (optional)

### Step 2: Deploy Security Rules

1. **Deploy Firestore Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Deploy Storage Rules**
   ```bash
   firebase deploy --only storage
   ```

### Step 3: Environment Configuration

1. **Frontend Environment** (`.env.local`)
   ```bash
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

2. **Backend Environment** (`.env`)
   ```bash
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
   ```

### Step 4: Data Migration

1. **Export MySQL Data**
   ```bash
   # Export users
   mysqldump -u root -p forward_africa_db users > users.sql

   # Export courses
   mysqldump -u root -p forward_africa_db courses > courses.sql

   # Export other tables...
   ```

2. **Transform and Import to Firestore**
   - Use the migration scripts provided
   - Transform SQL data to Firestore format
   - Import using Firebase Admin SDK

### Step 5: Update Frontend Components

1. **Replace Auth Context**
   - Old: `useAuth()` from `AuthContext`
   - New: `useFirebaseAuth()` from `FirebaseAuthContext`

2. **Update API Calls**
   - Replace custom API calls with Firestore service calls
   - Use `FirestoreService` for database operations

3. **Update Components**
   - Login/Register pages
   - Profile management
   - Course management
   - Progress tracking

### Step 6: Update Backend

1. **Replace Authentication Middleware**
   - Use Firebase Admin SDK for token verification
   - Remove custom JWT handling

2. **Update API Endpoints**
   - Use Firestore instead of MySQL
   - Implement Firebase Admin SDK operations

## 🔧 Implementation Details

### Authentication Flow

**Before (Custom JWT):**
```typescript
// Custom auth service
const response = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify(credentials)
});
```

**After (Firebase Auth):**
```typescript
// Firebase auth service
const { user } = await signInWithEmailAndPassword(auth, email, password);
```

### Database Operations

**Before (MySQL):**
```typescript
// Custom API calls
const response = await fetch('/api/courses');
const courses = await response.json();
```

**After (Firestore):**
```typescript
// Firestore service
const courses = await FirestoreService.getCourses();
```

### Real-time Updates

**Before (Polling):**
```typescript
// Manual polling
setInterval(() => {
  fetchUserProgress();
}, 5000);
```

**After (Firestore Listeners):**
```typescript
// Real-time listener
const unsubscribe = FirestoreService.subscribeToUserProgress(
  userId,
  courseId,
  (progress) => setProgress(progress)
);
```

## 🛡️ Security Implementation

### Firestore Security Rules

```javascript
// Users can only access their own data
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
  allow read: if request.auth != null && isAdmin();
}
```

### Storage Security Rules

```javascript
// User avatars - public read, user write
match /avatars/{userId}/{allPaths=**} {
  allow read: if true;
  allow write: if request.auth != null && request.auth.uid == userId;
}
```

## 📊 Data Structure Migration

### Users Table → Firestore Users Collection

**MySQL:**
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(191) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin', 'super_admin') DEFAULT 'user'
);
```

**Firestore:**
```javascript
// Collection: users/{userId}
{
  uid: "user123",
  email: "user@example.com",
  displayName: "John Doe",
  role: "user",
  permissions: [],
  onboarding_completed: false,
  created_at: Timestamp,
  updated_at: Timestamp
}
```

### Courses Table → Firestore Courses Collection

**MySQL:**
```sql
CREATE TABLE courses (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100)
);
```

**Firestore:**
```javascript
// Collection: courses/{courseId}
{
  id: "course123",
  title: "Web Development",
  description: "Learn web development",
  category: "programming",
  instructor: {
    id: "instructor123",
    name: "Jane Smith",
    bio: "Expert developer"
  },
  lessons: [...],
  featured: true,
  coming_soon: false,
  created_at: Timestamp,
  updated_at: Timestamp
}
```

## 🧪 Testing the Migration

### 1. Authentication Testing
```bash
# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 2. Database Testing
```bash
# Test Firestore connection
npm run test:firestore
```

### 3. Real-time Testing
```bash
# Test real-time listeners
npm run test:realtime
```

## 🚨 Rollback Plan

If issues arise during migration:

1. **Keep MySQL Running**
   - Don't shut down MySQL during migration
   - Keep both systems running in parallel

2. **Feature Flags**
   - Use environment variables to switch between systems
   - `USE_FIREBASE=true` / `USE_FIREBASE=false`

3. **Gradual Migration**
   - Migrate one feature at a time
   - Test thoroughly before moving to next feature

## 📈 Performance Considerations

### Firestore Optimization

1. **Indexes**
   - Create composite indexes for complex queries
   - Use Firebase Console to identify missing indexes

2. **Pagination**
   - Implement cursor-based pagination
   - Use `startAfter()` for large datasets

3. **Caching**
   - Use Firestore offline persistence
   - Implement client-side caching strategies

### Cost Optimization

1. **Read Operations**
   - Minimize unnecessary reads
   - Use real-time listeners efficiently
   - Implement proper pagination

2. **Write Operations**
   - Batch writes when possible
   - Use transactions for consistency

## 🔍 Monitoring and Debugging

### Firebase Console
- Monitor usage in Firebase Console
- Check Authentication logs
- Review Firestore usage

### Local Development
```bash
# Start Firebase emulators
firebase emulators:start

# Run with emulators
npm run dev:emulator
```

### Production Monitoring
- Set up Firebase Performance Monitoring
- Configure error reporting
- Monitor security rules violations

## ✅ Migration Checklist

- [ ] Firebase project created and configured
- [ ] Authentication providers enabled
- [ ] Security rules deployed
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Data migration completed
- [ ] Frontend components updated
- [ ] Backend API updated
- [ ] Testing completed
- [ ] Performance optimized
- [ ] Monitoring configured
- [ ] Documentation updated

## 🆘 Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check Firebase configuration
   - Verify API keys
   - Check domain configuration

2. **Firestore Permission Errors**
   - Review security rules
   - Check user authentication status
   - Verify user roles

3. **Storage Upload Errors**
   - Check storage rules
   - Verify file size limits
   - Check authentication

### Support Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Auth Guide](https://firebase.google.com/docs/auth)

## 🎉 Post-Migration

After successful migration:

1. **Clean Up**
   - Remove MySQL dependencies
   - Remove custom auth code
   - Update documentation

2. **Optimize**
   - Implement advanced Firestore features
   - Add real-time capabilities
   - Optimize for performance

3. **Monitor**
   - Set up monitoring dashboards
   - Track usage metrics
   - Monitor costs

---

**Note**: This migration should be performed in a staging environment first, with thorough testing before production deployment.
