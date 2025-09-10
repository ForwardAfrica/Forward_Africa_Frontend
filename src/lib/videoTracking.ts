import {
  VideoProgress,
  GranularTrackingData,
  VideoInteraction,
  SmartResumeData,
  RealTimeProgressData
} from '../types';
import getWebSocketService from './websocket';

/**
 * Video Tracking Service
 * Handles granular video tracking, smart resume, and real-time progress visualization
 */
class VideoTrackingService {
  private currentProgress: VideoProgress | null = null;
  private trackingInterval: NodeJS.Timeout | null = null;
  private granularData: GranularTrackingData[] = [];
  private interactions: VideoInteraction[] = [];
  private resumeData: SmartResumeData[] = [];
  private lastActivityTime: number = Date.now();
  private isActive: boolean = true;
  private activityTimeout: NodeJS.Timeout | null = null;
  private bufferTime: number = 10; // 10-second buffer for smart resume

  constructor() {
    this.setupActivityTracking();
  }

  /**
   * Setup activity tracking to detect when user is actively watching
   */
  private setupActivityTracking(): void {
    // Only setup activity tracking in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    events.forEach(event => {
      document.addEventListener(event, () => {
        this.lastActivityTime = Date.now();
        this.isActive = true;
        this.resetActivityTimeout();
      }, { passive: true });
    });

    this.resetActivityTimeout();
  }

  /**
   * Reset activity timeout
   */
  private resetActivityTimeout(): void {
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
    }

    this.activityTimeout = setTimeout(() => {
      this.isActive = false;
    }, 30000); // 30 seconds of inactivity
  }

  /**
   * Start tracking video progress
   */
  public startTracking(
    userId: string,
    courseId: string,
    lessonId: string,
    duration: number
  ): void {
    this.currentProgress = {
      id: `progress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      courseId,
      lessonId,
      currentTime: 0,
      duration,
      progress: 0,
      isPlaying: false,
      isMuted: false,
      playbackRate: 1,
      lastUpdated: new Date().toISOString(),
      deviceId: getWebSocketService().getDeviceId() || 'unknown',
      sessionId: getWebSocketService().getSessionId() || 'unknown',
      isPrimaryDevice: true // Will be updated based on WebSocket messages
    };

    // Start granular tracking every 30 seconds
    this.startGranularTracking();

    console.log('🎬 Started video tracking for:', { courseId, lessonId });
  }

  /**
   * Stop tracking video progress
   */
  public stopTracking(): void {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }

    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
      this.activityTimeout = null;
    }

    // Save final tracking data
    this.saveTrackingData();

    console.log('⏹️ Stopped video tracking');
  }

  /**
   * Update current video progress
   */
  public updateProgress(
    currentTime: number,
    isPlaying: boolean,
    isMuted: boolean = false,
    playbackRate: number = 1
  ): void {
    if (!this.currentProgress) return;

    this.currentProgress.currentTime = currentTime;
    this.currentProgress.isPlaying = isPlaying;
    this.currentProgress.isMuted = isMuted;
    this.currentProgress.playbackRate = playbackRate;
    this.currentProgress.progress = (currentTime / this.currentProgress.duration) * 100;
    this.currentProgress.lastUpdated = new Date().toISOString();

    // Send progress update via WebSocket
    getWebSocketService().sendProgressUpdate(this.currentProgress);

    // Update smart resume data
    this.updateSmartResumeData(currentTime);
  }

  /**
   * Start granular tracking with 30-second intervals
   */
  private startGranularTracking(): void {
    this.trackingInterval = setInterval(() => {
      if (!this.currentProgress) return;

      const now = Date.now();
      const intervalStart = Math.floor(this.currentProgress.currentTime / 30) * 30;
      const intervalEnd = intervalStart + 30;

      const granularData: GranularTrackingData = {
        startTime: intervalStart,
        endTime: intervalEnd,
        timeSpent: Math.min(30, this.currentProgress.currentTime - intervalStart),
        isActive: this.isActive,
        interactions: [...this.interactions],
        timestamp: new Date().toISOString()
      };

      this.granularData.push(granularData);
      this.interactions = []; // Clear interactions for next interval

      // Keep only last 100 intervals to prevent memory issues
      if (this.granularData.length > 100) {
        this.granularData = this.granularData.slice(-100);
      }

      console.log('📊 Granular tracking data:', granularData);
    }, 30000); // Every 30 seconds
  }

  /**
   * Record user interaction with video player
   */
  public recordInteraction(
    type: VideoInteraction['type'],
    data?: VideoInteraction['data']
  ): void {
    const interaction: VideoInteraction = {
      type,
      timestamp: new Date().toISOString(),
      data
    };

    this.interactions.push(interaction);

    // Send play state updates for relevant interactions
    if (type === 'play' || type === 'pause') {
      getWebSocketService().sendPlayStateUpdate(
        this.currentProgress!.courseId,
        this.currentProgress!.lessonId,
        type === 'play'
      );
    }

    console.log('🎯 Recorded interaction:', interaction);
  }

  /**
   * Update smart resume data with buffer
   */
  private updateSmartResumeData(currentTime: number): void {
    if (!this.currentProgress) return;

    const resumeData: SmartResumeData = {
      resumeTime: currentTime,
      bufferTime: this.bufferTime,
      effectiveResumeTime: Math.max(0, currentTime - this.bufferTime),
      timestamp: new Date().toISOString(),
      deviceId: this.currentProgress.deviceId,
      isLatest: true
    };

    // Mark previous resume data as not latest
    this.resumeData.forEach(data => {
      data.isLatest = false;
    });

    this.resumeData.push(resumeData);

    // Keep only last 10 resume points
    if (this.resumeData.length > 10) {
      this.resumeData = this.resumeData.slice(-10);
    }

    // Send resume point via WebSocket
    getWebSocketService().sendResumePoint(
      this.currentProgress.courseId,
      this.currentProgress.lessonId,
      resumeData.effectiveResumeTime
    );
  }

  /**
   * Get smart resume time for a lesson
   */
  public getSmartResumeTime(courseId: string, lessonId: string): number {
    // Check if we're tracking the requested lesson
    if (!this.currentProgress ||
        this.currentProgress.courseId !== courseId ||
        this.currentProgress.lessonId !== lessonId) {
      return 0;
    }

    // Get the most recent resume point for the current lesson
    const latestResume = this.resumeData
      .filter(data => data.isLatest)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    return latestResume ? latestResume.effectiveResumeTime : 0;
  }

  /**
   * Get real-time progress data for visualization
   */
  public getRealTimeProgressData(): RealTimeProgressData | null {
    if (!this.currentProgress) return null;

    const sessionTimeWatched = this.granularData.reduce((total, data) => total + data.timeSpent, 0);
    const totalTimeWatched = sessionTimeWatched; // Could be enhanced with historical data
    const timeRemaining = this.currentProgress.duration - this.currentProgress.currentTime;

    return {
      progress: this.currentProgress.progress,
      sessionTimeWatched,
      totalTimeWatched,
      timeRemaining,
      playbackSpeed: this.currentProgress.playbackRate,
      isActive: this.isActive,
      lastActivity: new Date(this.lastActivityTime).toISOString(),
      deviceInfo: {
        deviceId: this.currentProgress.deviceId,
        deviceType: this.getDeviceType(),
        browser: this.getBrowserInfo(),
        isPrimary: this.currentProgress.isPrimaryDevice
      }
    };
  }

  /**
   * Get device type
   */
  private getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return 'desktop';
    }

    const userAgent = navigator.userAgent.toLowerCase();

    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet';
    }

    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(userAgent)) {
      return 'mobile';
    }

    return 'desktop';
  }

  /**
   * Get browser information
   */
  private getBrowserInfo(): string {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return 'Unknown';
    }

    const userAgent = navigator.userAgent;

    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';

    return 'Unknown';
  }

  /**
   * Save tracking data to localStorage and/or send to server
   */
  private saveTrackingData(): void {
    if (!this.currentProgress) return;

    const trackingData = {
      progress: this.currentProgress,
      granularData: this.granularData,
      interactions: this.interactions,
      resumeData: this.resumeData,
      timestamp: new Date().toISOString()
    };

    // Save to localStorage only in browser environment
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const key = `video_tracking_${this.currentProgress.courseId}_${this.currentProgress.lessonId}`;
      localStorage.setItem(key, JSON.stringify(trackingData));
    }

    // TODO: Send to server via API
    console.log('💾 Saved tracking data:', trackingData);
  }

  /**
   * Load tracking data from localStorage
   */
  public loadTrackingData(courseId: string, lessonId: string): any {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }

    const key = `video_tracking_${courseId}_${lessonId}`;
    const data = localStorage.getItem(key);

    if (data) {
      return JSON.parse(data);
    }

    return null;
  }

  /**
   * Get analytics summary for a video
   */
  public getAnalyticsSummary(courseId: string, lessonId: string): any {
    const trackingData = this.loadTrackingData(courseId, lessonId);

    if (!trackingData) return null;

    const { granularData, interactions } = trackingData;

    // Calculate engagement metrics
    const totalIntervals = granularData.length;
    const activeIntervals = granularData.filter((data: any) => data.isActive).length;
    const engagementRate = totalIntervals > 0 ? (activeIntervals / totalIntervals) * 100 : 0;

    // Calculate average watch time
    const totalWatchTime = granularData.reduce((total: number, data: any) => total + data.timeSpent, 0);
    const averageWatchTime = totalIntervals > 0 ? totalWatchTime / totalIntervals : 0;

    // Find drop-off points
    const dropOffPoints = granularData
      .filter((data: any) => data.timeSpent < 30 && data.isActive)
      .map((data: any) => data.startTime);

    return {
      totalViews: 1, // Could be enhanced with server data
      averageCompletionRate: engagementRate,
      averageWatchTime,
      dropOffPoints,
      totalInteractions: interactions.length,
      engagementRate
    };
  }

  /**
   * Set buffer time for smart resume
   */
  public setBufferTime(seconds: number): void {
    this.bufferTime = Math.max(0, seconds);
  }

  /**
   * Get current progress
   */
  public getCurrentProgress(): VideoProgress | null {
    return this.currentProgress;
  }

  /**
   * Check if tracking is active
   */
  public isTracking(): boolean {
    return this.trackingInterval !== null;
  }
}

// Create singleton instance
const videoTrackingService = new VideoTrackingService();

export default videoTrackingService;