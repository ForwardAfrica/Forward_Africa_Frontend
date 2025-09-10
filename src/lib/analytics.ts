// Analytics tracking service for real user data collection
import { authService } from './auth';

interface SessionData {
  sessionId: string;
  startTime: number;
  pagesVisited: string[];
  durationSeconds: number;
}

interface WatchTimeData {
  watchId: string;
  courseId: string;
  lessonId?: string;
  startTime: number;
  durationSeconds: number;
  progressPercentage: number;
}

class AnalyticsTracker {
  private sessionData: SessionData | null = null;
  private watchTimeData: Map<string, WatchTimeData> = new Map();
  private pageStartTime: number = Date.now();
  private currentPage: string = '';

  constructor() {
    try {
      this.initializeTracking();
    } catch (error) {
      console.error('Failed to initialize analytics tracking:', error);
    }
  }

  private initializeTracking() {
    try {
      // Track page visibility changes
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.pauseSession();
        } else {
          this.resumeSession();
        }
      });

      // Track before unload
      window.addEventListener('beforeunload', () => {
        this.endSession();
      });

      // Track page changes (for SPA)
      this.trackPageView(window.location.pathname);
    } catch (error) {
      console.error('Failed to initialize tracking events:', error);
    }
  }

  // Session tracking
  async startSession(deviceType: string = 'desktop'): Promise<string> {
    try {
      const token = authService.getToken();
      if (!token) return '';

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'}/sessions/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ deviceType })
      });

      if (response.ok) {
        const data = await response.json();
        this.sessionData = {
          sessionId: data.sessionId,
          startTime: Date.now(),
          pagesVisited: [],
          durationSeconds: 0
        };
        return data.sessionId;
      }
    } catch (error) {
      console.error('Failed to start session:', error);
    }
    return '';
  }

  async endSession(): Promise<void> {
    if (!this.sessionData) return;

    try {
      const token = authService.getToken();
      if (!token) return;

      const durationSeconds = Math.floor((Date.now() - this.sessionData.startTime) / 1000);

              await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'}/sessions/${this.sessionData.sessionId}/end`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          durationSeconds,
          pagesVisited: this.sessionData.pagesVisited
        })
      });

      this.sessionData = null;
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }

  private pauseSession(): void {
    if (this.sessionData) {
      this.sessionData.durationSeconds += Math.floor((Date.now() - this.sessionData.startTime) / 1000);
    }
  }

  private resumeSession(): void {
    if (this.sessionData) {
      this.sessionData.startTime = Date.now();
    }
  }

  // Watch time tracking
  async startWatchTime(courseId: string, lessonId?: string): Promise<string> {
    try {
      const token = authService.getToken();
      if (!token) return '';

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'}/watch-time/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ courseId, lessonId })
      });

      if (response.ok) {
        const data = await response.json();
        const watchData: WatchTimeData = {
          watchId: data.watchId,
          courseId,
          lessonId,
          startTime: Date.now(),
          durationSeconds: 0,
          progressPercentage: 0
        };
        this.watchTimeData.set(data.watchId, watchData);
        return data.watchId;
      }
    } catch (error) {
      console.error('Failed to start watch time tracking:', error);
    }
    return '';
  }

  async endWatchTime(watchId: string, progressPercentage: number = 0): Promise<void> {
    const watchData = this.watchTimeData.get(watchId);
    if (!watchData) return;

    try {
      const token = authService.getToken();
      if (!token) return;

      const durationSeconds = Math.floor((Date.now() - watchData.startTime) / 1000);

              await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'}/watch-time/${watchId}/end`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          durationSeconds,
          progressPercentage
        })
      });

      this.watchTimeData.delete(watchId);
    } catch (error) {
      console.error('Failed to end watch time tracking:', error);
    }
  }

  // Page view tracking
  async trackPageView(pagePath: string, pageTitle?: string): Promise<void> {
    const token = authService.getToken();
    const sessionId = this.sessionData?.sessionId;
    const timeSpentSeconds = Math.floor((Date.now() - this.pageStartTime) / 1000);

    // Track time spent on previous page
    if (this.currentPage && timeSpentSeconds > 0) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'}/page-views`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({
            pagePath: this.currentPage,
            pageTitle: document.title,
            sessionId,
            timeSpentSeconds,
            referrer: document.referrer
          })
        });
      } catch (error) {
        console.error('Failed to track page view:', error);
      }
    }

    // Update current page
    this.currentPage = pagePath;
    this.pageStartTime = Date.now();

    // Add to session pages visited
    if (this.sessionData && !this.sessionData.pagesVisited.includes(pagePath)) {
      this.sessionData.pagesVisited.push(pagePath);
    }
  }

  // Engagement metrics tracking
  async updateEngagementMetrics(data: {
    dailyActiveMinutes?: number;
    coursesAccessed?: string[];
    lessonsCompleted?: number;
    pagesVisited?: number;
    loginCount?: number;
  }): Promise<void> {
    try {
      const token = authService.getToken();
      if (!token) return;

              await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'}/engagement/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('Failed to update engagement metrics:', error);
    }
  }

  // Utility methods
  getCurrentSessionId(): string | null {
    return this.sessionData?.sessionId || null;
  }

  getActiveWatchTimeIds(): string[] {
    return Array.from(this.watchTimeData.keys());
  }

  // Auto-start session on login
  onUserLogin(): void {
    this.startSession();
  }

  // Auto-end session on logout
  onUserLogout(): void {
    this.endSession();
    this.watchTimeData.clear();
  }
}

// Create singleton instance with error handling
let analyticsTracker: AnalyticsTracker;

try {
  analyticsTracker = new AnalyticsTracker();
} catch (error) {
  console.error('Failed to create analytics tracker:', error);
  // Create a fallback tracker that does nothing
  analyticsTracker = {
    startSession: async () => '',
    endSession: async () => {},
    startWatchTime: async () => '',
    endWatchTime: async () => {},
    trackPageView: async () => {},
    updateEngagementMetrics: async () => {},
    getCurrentSessionId: () => null,
    getActiveWatchTimeIds: () => [],
    onUserLogin: () => {},
    onUserLogout: () => {}
  } as any;
}

export { analyticsTracker };

// Export for use in components
export default analyticsTracker;