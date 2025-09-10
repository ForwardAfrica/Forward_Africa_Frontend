import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
  writeBatch,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  banner: string;
  instructor: {
    id: string;
    name: string;
    bio: string;
    avatar: string;
    social_links: {
      linkedin?: string;
      twitter?: string;
      website?: string;
    };
  };
  facilitator_id?: string;
  lessons: Lesson[];
  featured: boolean;
  coming_soon: boolean;
  release_date?: Date;
  total_xp: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  video_url: string;
  duration: number;
  order: number;
  is_completed: boolean;
  xp_reward: number;
}

export interface UserProgress {
  id: string;
  user_id: string;
  course_id: string;
  lesson_id: string;
  completed: boolean;
  progress_percentage: number;
  time_spent: number;
  last_accessed: Timestamp;
  completed_at?: Timestamp;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  created_at: Timestamp;
}

export interface Instructor {
  id: string;
  name: string;
  bio: string;
  avatar: string;
  social_links: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  courses_count: number;
  created_at: Timestamp;
}

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  course_title: string;
  issued_at: Timestamp;
  pdf_url?: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string;
  icon: string;
  earned_at: Timestamp;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: Timestamp;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  details: string;
  ip_address: string;
  user_agent?: string;
  timestamp: Timestamp;
  resource_type?: string;
  resource_id?: string;
}

export class FirestoreService {
  // ============================================================================
  // COURSES
  // ============================================================================

  static async getCourses(limitCount: number = 20, lastDoc?: any): Promise<Course[]> {
    try {
      let q = query(
        collection(db, 'courses'),
        orderBy('created_at', 'desc'),
        limit(limitCount)
      );

      if (lastDoc) {
        q = query(
          collection(db, 'courses'),
          orderBy('created_at', 'desc'),
          startAfter(lastDoc),
          limit(limitCount)
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
    } catch (error) {
      console.error('❌ Error fetching courses:', error);
      throw error;
    }
  }

  static async getCourseById(courseId: string): Promise<Course | null> {
    try {
      const docRef = doc(db, 'courses', courseId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Course;
      }
      return null;
    } catch (error) {
      console.error('❌ Error fetching course:', error);
      throw error;
    }
  }

  static async getCoursesByCategory(category: string): Promise<Course[]> {
    try {
      const q = query(
        collection(db, 'courses'),
        where('category', '==', category),
        where('coming_soon', '==', false),
        orderBy('created_at', 'desc'),
        limit(20)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
    } catch (error) {
      console.error('❌ Error fetching courses by category:', error);
      throw error;
    }
  }

  static async getFeaturedCourses(): Promise<Course[]> {
    try {
      const q = query(
        collection(db, 'courses'),
        where('featured', '==', true),
        where('coming_soon', '==', false),
        orderBy('created_at', 'desc'),
        limit(6)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
    } catch (error) {
      console.error('❌ Error fetching featured courses:', error);
      throw error;
    }
  }

  static async createCourse(courseData: Omit<Course, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const docRef = doc(collection(db, 'courses'));
      const course: Course = {
        ...courseData,
        id: docRef.id,
        created_at: serverTimestamp() as Timestamp,
        updated_at: serverTimestamp() as Timestamp
      };

      await setDoc(docRef, course);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating course:', error);
      throw error;
    }
  }

  static async updateCourse(courseId: string, courseData: Partial<Course>): Promise<void> {
    try {
      const docRef = doc(db, 'courses', courseId);
      await updateDoc(docRef, {
        ...courseData,
        updated_at: serverTimestamp()
      });
    } catch (error) {
      console.error('❌ Error updating course:', error);
      throw error;
    }
  }

  static async deleteCourse(courseId: string): Promise<void> {
    try {
      const docRef = doc(db, 'courses', courseId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('❌ Error deleting course:', error);
      throw error;
    }
  }

  // ============================================================================
  // USER PROGRESS
  // ============================================================================

  static async getUserProgress(userId: string, courseId: string): Promise<UserProgress[]> {
    try {
      const q = query(
        collection(db, 'progress', userId, 'courses', courseId, 'lessons'),
        orderBy('order', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProgress));
    } catch (error) {
      console.error('❌ Error fetching user progress:', error);
      throw error;
    }
  }

  static async updateUserProgress(
    userId: string,
    courseId: string,
    lessonId: string,
    progressData: Partial<UserProgress>
  ): Promise<void> {
    try {
      const docRef = doc(db, 'progress', userId, 'courses', courseId, 'lessons', lessonId);
      await setDoc(docRef, {
        ...progressData,
        user_id: userId,
        course_id: courseId,
        lesson_id: lessonId,
        last_accessed: serverTimestamp(),
        updated_at: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('❌ Error updating user progress:', error);
      throw error;
    }
  }

  static async markLessonComplete(
    userId: string,
    courseId: string,
    lessonId: string
  ): Promise<void> {
    try {
      const docRef = doc(db, 'progress', userId, 'courses', courseId, 'lessons', lessonId);
      await setDoc(docRef, {
        user_id: userId,
        course_id: courseId,
        lesson_id: lessonId,
        completed: true,
        progress_percentage: 100,
        completed_at: serverTimestamp(),
        last_accessed: serverTimestamp(),
        updated_at: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('❌ Error marking lesson complete:', error);
      throw error;
    }
  }

  // ============================================================================
  // CATEGORIES
  // ============================================================================

  static async getCategories(): Promise<Category[]> {
    try {
      const q = query(
        collection(db, 'categories'),
        orderBy('name', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      throw error;
    }
  }

  // ============================================================================
  // INSTRUCTORS
  // ============================================================================

  static async getInstructors(): Promise<Instructor[]> {
    try {
      const q = query(
        collection(db, 'instructors'),
        orderBy('name', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Instructor));
    } catch (error) {
      console.error('❌ Error fetching instructors:', error);
      throw error;
    }
  }

  static async getInstructorById(instructorId: string): Promise<Instructor | null> {
    try {
      const docRef = doc(db, 'instructors', instructorId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Instructor;
      }
      return null;
    } catch (error) {
      console.error('❌ Error fetching instructor:', error);
      throw error;
    }
  }

  // ============================================================================
  // CERTIFICATES
  // ============================================================================

  static async getUserCertificates(userId: string): Promise<Certificate[]> {
    try {
      const q = query(
        collection(db, 'certificates'),
        where('user_id', '==', userId),
        orderBy('issued_at', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Certificate));
    } catch (error) {
      console.error('❌ Error fetching certificates:', error);
      throw error;
    }
  }

  static async createCertificate(certificateData: Omit<Certificate, 'id' | 'issued_at'>): Promise<string> {
    try {
      const docRef = doc(collection(db, 'certificates'));
      const certificate: Certificate = {
        ...certificateData,
        id: docRef.id,
        issued_at: serverTimestamp() as Timestamp
      };

      await setDoc(docRef, certificate);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating certificate:', error);
      throw error;
    }
  }

  // ============================================================================
  // ACHIEVEMENTS
  // ============================================================================

  static async getUserAchievements(userId: string): Promise<Achievement[]> {
    try {
      const q = query(
        collection(db, 'achievements', userId, 'user_achievements'),
        orderBy('earned_at', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Achievement));
    } catch (error) {
      console.error('❌ Error fetching achievements:', error);
      throw error;
    }
  }

  // ============================================================================
  // NOTIFICATIONS
  // ============================================================================

  static async getUserNotifications(userId: string): Promise<Notification[]> {
    try {
      const q = query(
        collection(db, 'notifications', userId, 'user_notifications'),
        orderBy('created_at', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      throw error;
    }
  }

  static async markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      const docRef = doc(db, 'notifications', userId, 'user_notifications', notificationId);
      await updateDoc(docRef, { read: true });
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      throw error;
    }
  }

  // ============================================================================
  // AUDIT LOGS
  // ============================================================================

  static async createAuditLog(auditData: Omit<AuditLog, 'id' | 'timestamp'>): Promise<string> {
    try {
      const docRef = doc(collection(db, 'audit_logs'));
      const auditLog: AuditLog = {
        ...auditData,
        id: docRef.id,
        timestamp: serverTimestamp() as Timestamp
      };

      await setDoc(docRef, auditLog);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating audit log:', error);
      throw error;
    }
  }

  static async getAuditLogs(limitCount: number = 100): Promise<AuditLog[]> {
    try {
      const q = query(
        collection(db, 'audit_logs'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
    } catch (error) {
      console.error('❌ Error fetching audit logs:', error);
      throw error;
    }
  }

  // ============================================================================
  // REAL-TIME LISTENERS
  // ============================================================================

  static subscribeToUserProgress(
    userId: string,
    courseId: string,
    callback: (progress: UserProgress[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'progress', userId, 'courses', courseId, 'lessons'),
      orderBy('order', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const progress = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProgress));
      callback(progress);
    });
  }

  static subscribeToNotifications(
    userId: string,
    callback: (notifications: Notification[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'notifications', userId, 'user_notifications'),
      orderBy('created_at', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      callback(notifications);
    });
  }

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  static async batchUpdateUserProgress(
    userId: string,
    courseId: string,
    progressUpdates: { lessonId: string; progressData: Partial<UserProgress> }[]
  ): Promise<void> {
    try {
      const batch = writeBatch(db);

      progressUpdates.forEach(({ lessonId, progressData }) => {
        const docRef = doc(db, 'progress', userId, 'courses', courseId, 'lessons', lessonId);
        batch.set(docRef, {
          ...progressData,
          user_id: userId,
          course_id: courseId,
          lesson_id: lessonId,
          last_accessed: serverTimestamp(),
          updated_at: serverTimestamp()
        }, { merge: true });
      });

      await batch.commit();
    } catch (error) {
      console.error('❌ Error batch updating user progress:', error);
      throw error;
    }
  }
}
