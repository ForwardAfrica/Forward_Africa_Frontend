import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import videoTrackingService from '../lib/videoTracking';
import getWebSocketService from '../lib/websocket';
import { VideoProgress, RealTimeProgressData, CrossDeviceSyncMessage } from '../types';

interface UseVideoTrackingProps {
  courseId: string;
  lessonId: string;
  duration: number;
}

interface UseVideoTrackingReturn {
  // Tracking state
  isTracking: boolean;
  currentProgress: VideoProgress | null;
  realTimeData: RealTimeProgressData | null;
  isConnected: boolean;

  // Tracking methods
  startTracking: () => void;
  stopTracking: () => void;
  updateProgress: (currentTime: number, isPlaying: boolean, isMuted?: boolean, playbackRate?: number) => void;
  recordInteraction: (type: 'play' | 'pause' | 'seek' | 'volume_change' | 'fullscreen' | 'speed_change' | 'video_completed', data?: any) => void;

  // Smart resume
  getSmartResumeTime: () => number;
  setBufferTime: (seconds: number) => void;

  // Cross-device sync
  syncProgress: VideoProgress | null;
  syncPlayState: boolean | null;

  // Analytics
  getAnalyticsSummary: () => any;
}

export const useVideoTracking = ({
  courseId,
  lessonId,
  duration
}: UseVideoTrackingProps): UseVideoTrackingReturn => {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [currentProgress, setCurrentProgress] = useState<VideoProgress | null>(null);
  const [realTimeData, setRealTimeData] = useState<RealTimeProgressData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [syncProgress, setSyncProgress] = useState<VideoProgress | null>(null);
  const [syncPlayState, setSyncPlayState] = useState<boolean | null>(null);

  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Handle incoming progress updates from other devices
  const handleProgressUpdate = useCallback((message: CrossDeviceSyncMessage) => {
    if (message.payload.courseId === courseId && message.payload.lessonId === lessonId) {
      setSyncProgress({
        id: `sync_${message.deviceId}`,
        userId: message.userId,
        courseId: message.payload.courseId!,
        lessonId: message.payload.lessonId!,
        currentTime: message.payload.currentTime || 0,
        duration,
        progress: ((message.payload.currentTime || 0) / duration) * 100,
        isPlaying: message.payload.isPlaying || false,
        isMuted: false,
        playbackRate: 1,
        lastUpdated: message.payload.timestamp,
        deviceId: message.deviceId,
        sessionId: message.sessionId,
        isPrimaryDevice: false
      });
    }
  }, [courseId, lessonId, duration]);

  // Handle incoming play state updates from other devices
  const handlePlayStateUpdate = useCallback((message: CrossDeviceSyncMessage) => {
    if (message.payload.courseId === courseId && message.payload.lessonId === lessonId) {
      setSyncPlayState(message.payload.isPlaying || false);
    }
  }, [courseId, lessonId]);

  // Handle incoming resume point updates from other devices
  const handleResumePointUpdate = useCallback((message: CrossDeviceSyncMessage) => {
    if (message.payload.courseId === courseId && message.payload.lessonId === lessonId) {
      console.log('📱 Received resume point from another device:', message.payload.resumeTime);
    }
  }, [courseId, lessonId]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user) return;

    const connectWebSocket = async () => {
      try {
        // Temporarily disable WebSocket to prevent connection issues
        getWebSocketService().disable();
        console.log('🔌 WebSocket disabled to prevent connection issues');

        // await getWebSocketService().connect(user.id);
        // getWebSocketService().onMessage('progress_update', handleProgressUpdate);
        // getWebSocketService().onMessage('play_state', handlePlayStateUpdate);
        // getWebSocketService().onMessage('resume_point', handleResumePointUpdate);
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
      }
    };

    connectWebSocket();

    return () => {
      // getWebSocketService().offMessage('progress_update');
      // getWebSocketService().offMessage('play_state');
      // getWebSocketService().offMessage('resume_point');
      // getWebSocketService().disconnect();
    };
  }, [user]);

  // Start tracking video progress
  const startTracking = useCallback(() => {
    if (!user?.id || isTracking) return;

    videoTrackingService.startTracking(user.id, courseId, lessonId, duration);
    setIsTracking(true);

    // Set up real-time data updates
    updateIntervalRef.current = setInterval(() => {
      const data = videoTrackingService.getRealTimeProgressData();
      if (data) {
        setRealTimeData(data);
        setCurrentProgress(videoTrackingService.getCurrentProgress());
      }
    }, 1000); // Update every second

    console.log('🎬 Started video tracking');
  }, [user?.id, courseId, lessonId, duration, isTracking]);

  // Stop tracking video progress
  const stopTracking = useCallback(() => {
    if (!isTracking) return;

    videoTrackingService.stopTracking();
    setIsTracking(false);

    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }

    console.log('⏹️ Stopped video tracking');
  }, [isTracking]);

  // Update current progress
  const updateProgress = useCallback((
    currentTime: number,
    isPlaying: boolean,
    isMuted: boolean = false,
    playbackRate: number = 1
  ) => {
    if (!isTracking) return;

    videoTrackingService.updateProgress(currentTime, isPlaying, isMuted, playbackRate);

    // Update local state
    const progress = videoTrackingService.getCurrentProgress();
    if (progress) {
      setCurrentProgress(progress);
    }
  }, [isTracking]);

  // Record user interaction
  const recordInteraction = useCallback((
    type: 'play' | 'pause' | 'seek' | 'volume_change' | 'fullscreen' | 'speed_change' | 'video_completed',
    data?: any
  ) => {
    if (!isTracking) return;

    videoTrackingService.recordInteraction(type, data);
  }, [isTracking]);

  // Get smart resume time
  const getSmartResumeTime = useCallback(() => {
    return videoTrackingService.getSmartResumeTime(courseId, lessonId);
  }, [courseId, lessonId]);

  // Set buffer time for smart resume
  const setBufferTime = useCallback((seconds: number) => {
    videoTrackingService.setBufferTime(seconds);
  }, []);

  // Get analytics summary
  const getAnalyticsSummary = useCallback(() => {
    return videoTrackingService.getAnalyticsSummary(courseId, lessonId);
  }, [courseId, lessonId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      if (isTracking) {
        stopTracking();
      }
    };
  }, [isTracking, stopTracking]);

  // Auto-start tracking when component mounts (if user is authenticated)
  useEffect(() => {
    if (user?.id && !isTracking) {
      startTracking();
    }
  }, [user?.id, startTracking, isTracking]);

  return {
    // Tracking state
    isTracking,
    currentProgress,
    realTimeData,
    isConnected,

    // Tracking methods
    startTracking,
    stopTracking,
    updateProgress,
    recordInteraction,

    // Smart resume
    getSmartResumeTime,
    setBufferTime,

    // Cross-device sync
    syncProgress,
    syncPlayState,

    // Analytics
    getAnalyticsSummary
  };
};