# Frontend Components Documentation

## Overview

This document provides detailed documentation for all reusable components in the Forward Africa Learning Platform frontend application.

## Component Architecture

Components are organized into four main categories:
- **Layout Components**: Header, Footer, Layout wrapper
- **UI Components**: Reusable interface elements
- **Auth Components**: Authentication-related components
- **Admin Components**: Administrative interface components

## Layout Components

### Layout Component

**File**: `src/components/layout/Layout.tsx`

**Purpose**: Main layout wrapper for authenticated pages

**Props**:
```typescript
interface LayoutProps {
  children: React.ReactNode;
}
```

**Features**:
- Fixed header with navigation
- Main content area with proper spacing
- Footer with site information
- Automatic scroll to top on route changes
- Responsive design

### Header Component

**File**: `src/components/layout/Header.tsx`

**Purpose**: Main navigation header with authentication

**Features**:
- Responsive navigation menu
- User authentication status
- Notifications dropdown with unread count
- Profile dropdown with role display
- Mobile menu toggle
- Scroll-based styling
- Role-based navigation items

**Navigation Items**:
- Home
- Courses
- Resources (dropdown)
  - Afri-Sage AI
  - Community
- About

**User Actions**:
- Search
- Notifications
- Profile menu
- Sign out

### Footer Component

**File**: `src/components/layout/Footer.tsx`

**Purpose**: Site footer with links and information

**Features**:
- Company information
- Quick links
- Course categories
- Contact information
- Newsletter signup
- Social media links
- Admin login access

## UI Components

### Button Component

**File**: `src/components/ui/Button.tsx`

**Purpose**: Reusable button with multiple variants and sizes

**Props**:
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  fullWidth?: boolean;
}
```

**Variants**:
- **Primary**: Red background, white text
- **Secondary**: Gray background, white text
- **Outline**: Transparent background with border
- **Ghost**: Transparent background, no border

### VideoPlayer Component

**File**: `src/components/ui/VideoPlayer.tsx`

**Purpose**: Custom video player supporting YouTube and direct video files

**Props**:
```typescript
interface VideoPlayerProps {
  lesson: Lesson;
}
```

**Features**:
- YouTube video embedding with iframe
- Direct video file playback (MP4, WebM, etc.)
- Custom controls overlay for direct videos
- Progress tracking and seeking
- Fullscreen support
- Error handling and retry functionality
- Loading states
- Debug information in development mode

**Video Support**:
- **YouTube URLs**: Automatic embedding with proper parameters
- **Direct Videos**: HTML5 video element with custom controls
- **URL Patterns**: Multiple YouTube URL formats supported

### CourseCard Component

**File**: `src/components/ui/CourseCard.tsx`

**Purpose**: Display course information in card format

**Props**:
```typescript
interface CourseCardProps {
  course: Course;
}
```

**Features**:
- Course thumbnail display
- Hover effects and animations
- Coming soon indicators with release dates
- Instructor information
- Play button overlay
- Responsive design

### PermissionGuard Component

**File**: `src/components/ui/PermissionGuard.tsx`

**Purpose**: Role-based access control for UI elements

**Props**:
```typescript
interface PermissionGuardProps {
  permission: string;
  role: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showError?: boolean;
  onUnauthorized?: () => void;
}
```

**Features**:
- Permission checking based on user role
- Error message display for unauthorized access
- Fallback content support
- Custom unauthorized handlers
- Integration with permission system

### ErrorMessage Component

**File**: `src/components/ui/ErrorMessage.tsx`

**Purpose**: Consistent error message display

**Props**:
```typescript
interface ErrorMessageProps {
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info' | 'success';
  onClose?: () => void;
  actions?: React.ReactNode;
}
```

**Features**:
- Multiple message types with appropriate styling
- Dismissible messages
- Custom action buttons
- Icon indicators

### NotificationsDropdown Component

**File**: `src/components/ui/NotificationsDropdown.tsx`

**Purpose**: Dropdown menu for user notifications

**Props**:
```typescript
interface NotificationsDropdownProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}
```

**Features**:
- Notification list with timestamps
- Mark as read functionality
- Mark all as read option
- Unread indicators
- Empty state handling

### Certificate Component

**File**: `src/components/ui/Certificate.tsx`

**Purpose**: Display and manage course certificates

**Props**:
```typescript
interface CertificateProps {
  certificate: Certificate;
}
```

**Features**:
- Certificate information display
- PDF download functionality
- Verification code display
- Earned date information
- Professional styling

## Admin Components

### AdminPage Component

**File**: `src/pages/AdminPage.tsx`

**Purpose**: Main administrative dashboard

**Features**:
- Multi-tab interface (Dashboard, Courses, Instructors, Analytics, Audit)
- Statistics overview with real-time data
- Course management with CRUD operations
- Instructor management
- Analytics dashboard with charts
- Audit log viewing
- Role-based access control
- Permission error handling

**Tabs**:
1. **Dashboard**: Overview and quick actions
2. **Courses**: Course management interface
3. **Instructors**: Instructor management tools
4. **Analytics**: Platform analytics with charts
5. **Audit**: Security audit logs (admin/super admin only)

### ManageUsersPage Component

**File**: `src/pages/ManageUsersPage.tsx`

**Purpose**: Comprehensive user management interface

**Features**:
- User search and filtering
- Bulk actions (activate, suspend, delete)
- Role management with permission checking
- Individual permission editing
- User statistics and activity tracking
- Permission enforcement with error messages

**User Actions**:
- View user details
- Change user status
- Modify user roles
- Edit individual permissions
- Bulk operations

### SecuritySettingsPage Component

**File**: `src/pages/SecuritySettingsPage.tsx`

**Purpose**: Platform security configuration

**Features**:
- Password policy management
- Session settings configuration
- IP whitelisting
- Two-factor authentication settings
- Role permission management
- Audit log settings
- Real-time settings validation

**Security Policies**:
- Password requirements
- Session timeout and limits
- IP access control
- Authentication requirements

## Component Patterns

### Permission-Based Rendering

Components use the PermissionGuard pattern for access control:

```typescript
<PermissionGuard permission="manage_users" role={userRole}>
  <AdminUserManagement />
</PermissionGuard>
```

### Error Handling

Components implement consistent error handling:

```typescript
const ErrorFallback = ({ error, retry }: { error: Error; retry: () => void }) => (
  <ErrorMessage
    title="Something went wrong"
    message={error.message}
    type="error"
    actions={<Button onClick={retry}>Try Again</Button>}
  />
);
```

### Loading States

All components implement consistent loading patterns:

```typescript
if (loading) {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
    </div>
  );
}
```

### Responsive Design

Components use Tailwind CSS responsive utilities:

```typescript
className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
```

### Accessibility

Components implement accessibility features:

```typescript
<button
  aria-label="Play video"
  role="button"
  tabIndex={0}
  onKeyPress={(e) => e.key === 'Enter' && handlePlay()}
>
  <Play className="h-5 w-5" />
</button>
```

### Performance Optimization

Components use React optimization techniques:

```typescript
// Memoization for expensive operations
const MemoizedComponent = React.memo(Component);

// Callback memoization
const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies]);
```

## Component Testing

### Unit Tests

Components should include unit tests for:
- Rendering with different props
- User interactions
- State changes
- Error conditions
- Permission scenarios

### Integration Tests

Components are tested in context:
- With real data
- User workflows
- API interactions
- Permission enforcement

### Accessibility Tests

Components are tested for:
- Screen reader compatibility
- Keyboard navigation
- Color contrast
- ARIA compliance

## Component Guidelines

### Development Standards

1. **TypeScript**: All components use TypeScript with proper typing
2. **Props Interface**: Define clear interfaces for all props
3. **Permission Checking**: Implement proper access control
4. **Error Handling**: Include comprehensive error boundaries
5. **Loading States**: Show appropriate loading indicators

### Design Principles

1. **Consistency**: Follow design system guidelines
2. **Responsiveness**: Support all screen sizes
3. **Accessibility**: Meet WCAG 2.1 AA standards
4. **Performance**: Optimize for speed and efficiency
5. **Security**: Implement proper permission checks

### Best Practices

1. **Single Responsibility**: Each component has one clear purpose
2. **Composition**: Build complex UIs from simple components
3. **Reusability**: Design for reuse across the application
4. **Permission Awareness**: Always check user permissions
5. **Error Resilience**: Handle errors gracefully

---

This documentation provides a comprehensive overview of all components in the Forward Africa Learning Platform, with special emphasis on the role-based permission system and administrative functionality.