# Frontend Pages Documentation

## Overview

This document provides detailed documentation for all pages in the Forward Africa Learning Platform frontend application.

## Page Structure

All pages follow a consistent structure:
- Header with navigation
- Main content area
- Footer (on public pages)
- Loading states and error handling

## Public Pages

### Landing Page (`/`)

**File**: `src/pages/LandingPage.tsx`

**Purpose**: Marketing page and entry point for new users

**Features**:
- Hero section with call-to-action
- Feature highlights
- Statistics showcase
- Authentication integration
- Responsive design

**Components Used**:
- Button component for CTAs
- Feature cards
- Statistics grid
- Background image with overlay

**State Management**:
```typescript
const [isLoading, setIsLoading] = useState(false);
```

**Key Functions**:
- `handleGoogleSignIn()`: Initiates Google OAuth flow
- Responsive design for mobile/desktop
- Development mode detection

**SEO Considerations**:
- Meta tags for social sharing
- Structured data markup
- Optimized images and loading

---

## Authentication Pages

### Onboarding Page (`/onboarding`)

**File**: `src/pages/OnboardingPage.tsx`

**Purpose**: Multi-step user onboarding process

**Features**:
- 3-step wizard interface
- Education level selection
- Job title input
- Topics of interest selection
- Progress tracking
- Form validation

**State Management**:
```typescript
const [currentStep, setCurrentStep] = useState(1);
const [formData, setFormData] = useState({
  education_level: '',
  job_title: '',
  topics_of_interest: [] as string[]
});
```

**Steps**:
1. **Education Level**: Select from predefined options
2. **Job Title**: Free text input for current position
3. **Topics of Interest**: Multi-select from business topics

**Validation**:
- Step 1: Education level must be selected
- Step 2: Job title must not be empty
- Step 3: At least one topic must be selected

**Navigation**:
- Back/Next buttons with validation
- Progress bar showing completion
- Auto-scroll to top on step change

---

## Main Application Pages

### Home Page (`/home`)

**File**: `src/pages/HomePage.tsx`

**Purpose**: Main dashboard for authenticated users

**Features**:
- Hero banner with featured course
- Statistics overview
- Continue learning section
- Category-based course rows
- Real-time data updates

**State Management**:
```typescript
const [inProgressCourses, setInProgressCourses] = useState<CourseProgress[]>([]);
const [allCourses, setAllCourses] = useState(getAllCourses());
const [allCategories, setAllCategories] = useState(getAllCategories());
```

**Data Loading**:
- Loads user progress from localStorage
- Listens for storage changes
- Updates course data dynamically

**Components**:
- `HeroBanner`: Featured course display
- `ContinueLearningRow`: In-progress courses
- `CategoryRow`: Course categories
- Statistics cards

**Performance Optimizations**:
- Lazy loading of course data
- Memoized components
- Efficient re-rendering

### Courses Page (`/courses`)

**File**: `src/pages/CoursesPage.tsx`

**Purpose**: Browse all available courses with filtering

**Features**:
- Course grid layout
- Category filtering
- Responsive design
- Real-time course updates
- Empty state handling

**State Management**:
```typescript
const [selectedCategory, setSelectedCategory] = useState<string>('all');
const [allCourses, setAllCourses] = useState(getAllCourses());
const [allCategories, setAllCategories] = useState(getAllCategories());
```

**Filtering Logic**:
```typescript
const filteredCourses = selectedCategory === 'all'
  ? allCourses
  : allCourses.filter(course => course.category === selectedCategory);
```

**Layout**:
- Responsive grid (2-5 columns based on screen size)
- Filter buttons with active states
- Course cards with hover effects

### Course Detail Page (`/course/:id`)

**File**: `src/pages/CoursePage.tsx`

**Purpose**: Individual course viewing and lesson playback

**Features**:
- Video player with custom controls
- Lesson navigation
- Progress tracking
- Certificate generation
- Instructor information
- Course description

**State Management**:
```typescript
const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
const [progress, setProgress] = useState<number>(0);
const [certificate, setCertificate] = useState<Certificate | undefined>();
```

**Key Functions**:
- `updateProgress()`: Tracks lesson completion
- `handleLessonSelect()`: Changes active lesson
- `handleDownloadCertificate()`: Generates PDF certificate

**Video Player Integration**:
- Supports YouTube and direct video URLs
- Custom controls overlay
- Progress tracking
- Error handling

**Progress Tracking**:
- Saves to localStorage
- Calculates completion percentage
- Generates certificates on completion

### Search Page (`/search`)

**File**: `src/pages/SearchPage.tsx`

**Purpose**: Advanced search functionality for courses and instructors

**Features**:
- Real-time search
- Category filtering
- Course and instructor results
- URL query parameter integration
- Empty state handling

**State Management**:
```typescript
const [searchQuery, setSearchQuery] = useState(initialQuery);
const [activeFilter, setActiveFilter] = useState<string>('all');
const [searchResults, setSearchResults] = useState({
  courses: allCourses,
  instructors: instructors,
});
```

**Search Logic**:
```typescript
const performSearch = (query: string, coursesToSearch = allCourses) => {
  const lowercaseQuery = query.toLowerCase();

  const filteredCourses = coursesToSearch.filter(course =>
    course.title.toLowerCase().includes(lowercaseQuery) ||
    course.description.toLowerCase().includes(lowercaseQuery) ||
    // ... other search criteria
  );

  // Update results
};
```

**URL Integration**:
- Reads initial query from URL parameters
- Updates URL on search
- Shareable search results

---

## Community Pages

### Community Page (`/community`)

**File**: `src/pages/CommunityPage.tsx`

**Purpose**: Professional networking and discussion groups

**Features**:
- Network group listings
- Join/leave functionality
- Unread message indicators
- Group statistics
- Responsive cards

**State Management**:
```typescript
const [groups, setGroups] = useState<NetworkGroup[]>([]);
```

**Group Management**:
- Join/leave groups
- Persist joined groups in localStorage
- Update member counts dynamically

**Group Types**:
- SME Network
- Finance Professionals
- Managers Network
- Tech Professionals
- Legal Professionals
- Marketing Professionals
- Job Hunting Support

### Chat Page (`/community/chat/:groupId`)

**File**: `src/pages/ChatPage.tsx`

**Purpose**: Real-time group chat functionality

**Features**:
- Real-time messaging
- File attachments
- Emoji picker
- Link sharing
- Message persistence

**State Management**:
```typescript
const [messages, setMessages] = useState<Message[]>([]);
const [newMessage, setNewMessage] = useState('');
const [showEmojiPicker, setShowEmojiPicker] = useState(false);
```

**Message Types**:
- Text messages
- Image attachments
- Document attachments
- Shared links
- Emoji reactions

**Features**:
- Auto-scroll to new messages
- Message timestamps
- User avatars
- Attachment previews

---

## AI Assistant

### Afrisage Page (`/afri-sage`)

**File**: `src/pages/AfrisagePage.tsx`

**Purpose**: AI-powered business assistant for African markets

**Features**:
- Chat interface
- Suggested questions
- Context-aware responses
- Message history
- Business-focused AI responses

**State Management**:
```typescript
const [messages, setMessages] = useState<Message[]>([]);
const [inputMessage, setInputMessage] = useState('');
const [isLoading, setIsLoading] = useState(false);
```

**AI Response Logic**:
```typescript
const generateAfrisageResponse = (userInput: string): string => {
  const input = userInput.toLowerCase();

  if (input.includes('business') && input.includes('kenya')) {
    return "Kenya offers excellent business opportunities...";
  }
  // ... other response patterns
};
```

**Suggested Questions**:
- "How do I start a business in Nigeria?"
- "What are the best investment opportunities in East Africa?"
- "Tell me about fintech regulations in South Africa"
- "How can I expand my business across African markets?"

---

## User Management

### Profile Page (`/profile`)

**File**: `src/pages/ProfilePage.tsx`

**Purpose**: User account management and settings

**Features**:
- Profile information editing
- Password change with validation
- Security settings
- Activity logs
- Certificate downloads

**Tabs**:
1. **Profile**: Personal information and statistics
2. **Security**: Password and security settings
3. **Settings**: Account preferences

**Password Security**:
- Current password verification
- Strength indicator
- Requirements validation
- Success/error feedback

**Security Features**:
- Password change history
- Login activity tracking
- Two-factor authentication status

---

## Administrative Pages

### Admin Login Page (`/admin/login`)

**File**: `src/pages/AdminLoginPage.tsx`

**Purpose**: Secure admin authentication

**Features**:
- Role-based login
- Demo credentials display
- Security validation
- Audit logging

**Credentials**:
- Admin: `admin@forwardafrica.com / admin123`
- Super Admin: `superadmin@forwardafrica.com / super123`

### Admin Dashboard (`/admin`)

**File**: `src/pages/AdminPage.tsx`

**Purpose**: Main administrative interface

**Features**:
- Multi-tab interface
- Statistics overview
- User management
- Course management
- Analytics dashboard
- Audit logs (admin/super admin only)

**Tabs**:
1. **Dashboard**: Overview and quick actions
2. **Courses**: Course management interface
3. **Users**: User management tools
4. **Analytics**: Platform analytics
5. **Audit**: Security audit logs

**Statistics Tracked**:
- Total students
- Active students
- Total courses
- Total instructors
- Monthly revenue
- Completion rates

### Upload Course Page (`/admin/upload-course`)

**File**: `src/pages/UploadCoursePage.tsx`

**Purpose**: Course creation and editing interface

**Features**:
- Course metadata editing
- Lesson management
- Facilitator assignment
- Category management
- Image upload
- Video URL validation

**Form Sections**:
1. **Basic Information**: Title, description, category
2. **Media**: Thumbnail and banner images
3. **Settings**: Featured, coming soon, facilitator
4. **Lessons**: Video lessons with metadata

**Validation**:
- Required fields validation
- URL format validation
- Image preview
- Form state management

### Add Facilitator Page (`/admin/add-facilitator`)

**File**: `src/pages/AddFacilitatorPage.tsx`

**Purpose**: Facilitator profile management

**Features**:
- Personal information form
- Expertise management
- Social links
- Profile image upload
- Experience tracking

**Form Fields**:
- Name and title
- Contact information
- Professional biography
- Areas of expertise
- Years of experience
- Social media links

### Manage Users Page (`/admin/manage-users`)

**File**: `src/pages/ManageUsersPage.tsx`

**Purpose**: Comprehensive user management

**Features**:
- User search and filtering
- Bulk actions
- Role management
- Permission editing
- User statistics
- Activity tracking

**User Actions**:
- View user details
- Suspend/activate accounts
- Change user roles
- Edit permissions
- Delete users

**Filtering Options**:
- By status (active, suspended, pending)
- By role (user, content manager, admin, super admin)
- By search term (name, email)

### Security Settings Page (`/admin/security-settings`)

**File**: `src/pages/SecuritySettingsPage.tsx`

**Purpose**: Platform security configuration

**Features**:
- Password policy management
- Session settings
- IP whitelisting
- Two-factor authentication
- Role permissions
- Audit settings

**Security Policies**:
- Password requirements
- Session timeout
- Concurrent session limits
- IP access control
- Authentication requirements

---

## Category and Instructor Pages

### Category Page (`/category/:id`)

**File**: `src/pages/CategoryPage.tsx`

**Purpose**: Display courses within a specific category

**Features**:
- Category-specific course listing
- Course grid layout
- Empty state handling
- Navigation breadcrumbs

### Instructor Page (`/instructor/:id`)

**File**: `src/pages/InstructorPage.tsx`

**Purpose**: Instructor profile and course listings

**Features**:
- Instructor biography
- Course listings
- Professional information
- Social links
- Statistics display

---

## About Page

### About Page (`/about`)

**File**: `src/pages/AboutPage.tsx`

**Purpose**: Company information and mission

**Features**:
- Mission statement
- Feature highlights
- Statistics showcase
- Call-to-action sections

**Content Sections**:
- Hero section with mission
- Platform statistics
- Feature explanations
- Contact information

---

## Common Page Patterns

### Loading States
All pages implement consistent loading patterns:
```typescript
if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
    </div>
  );
}
```

### Error Handling
Pages include error boundaries and fallback UI:
```typescript
if (error) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-white text-3xl font-bold mb-6">Page Not Found</h1>
      <button onClick={() => navigate('/')}>Return Home</button>
    </div>
  );
}
```

### Responsive Design
All pages use Tailwind CSS for responsive design:
- Mobile-first approach
- Breakpoint-specific layouts
- Flexible grid systems
- Responsive typography

### Accessibility
Pages implement accessibility best practices:
- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation
- Screen reader support
- Color contrast compliance

### Performance Optimization
- Lazy loading of components
- Image optimization
- Code splitting
- Memoization of expensive operations
- Efficient re-rendering patterns

---

This documentation provides a comprehensive overview of all pages in the Forward Africa Learning Platform. Each page is designed with user experience, performance, and maintainability in mind.