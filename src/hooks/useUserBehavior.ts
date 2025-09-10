import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserBehavior, PersonalizationContext } from '../lib/personalizationEngine';

export const useUserBehavior = () => {
  const { user } = useAuth();
  const [sessionStartTime] = useState(Date.now());
  const [behavior, setBehavior] = useState<UserBehavior>({
    courseViews: {},
    courseCompletions: {},
    timeSpent: {},
    searchQueries: [],
    clickedCategories: [],
    preferredInstructors: [],
    learningPatterns: {
      preferredTime: 'morning',
      sessionDuration: 0,
      completionRate: 0
    }
  });

  const [context, setContext] = useState<PersonalizationContext>({
    currentTime: new Date(),
    sessionDuration: 0,
    previousActions: []
  });

  // Track course view
  const trackCourseView = useCallback((courseId: string) => {
    setBehavior(prev => ({
      ...prev,
      courseViews: {
        ...prev.courseViews,
        [courseId]: (prev.courseViews[courseId] || 0) + 1
      }
    }));

    setContext(prev => ({
      ...prev,
      previousActions: [...prev.previousActions.slice(-9), 'course_view']
    }));
  }, []);

  // Track course completion
  const trackCourseCompletion = useCallback((courseId: string) => {
    setBehavior(prev => ({
      ...prev,
      courseCompletions: {
        ...prev.courseCompletions,
        [courseId]: (prev.courseCompletions[courseId] || 0) + 1
      }
    }));

    setContext(prev => ({
      ...prev,
      previousActions: [...prev.previousActions.slice(-9), 'course_completion']
    }));
  }, []);

  // Track time spent on course
  const trackTimeSpent = useCallback((courseId: string, timeInSeconds: number) => {
    setBehavior(prev => ({
      ...prev,
      timeSpent: {
        ...prev.timeSpent,
        [courseId]: (prev.timeSpent[courseId] || 0) + timeInSeconds
      }
    }));
  }, []);

  // Track search query
  const trackSearchQuery = useCallback((query: string) => {
    setBehavior(prev => ({
      ...prev,
      searchQueries: [...prev.searchQueries.slice(-19), query] // Keep last 20 queries
    }));

    setContext(prev => ({
      ...prev,
      previousActions: [...prev.previousActions.slice(-9), 'search']
    }));
  }, []);

  // Track category click
  const trackCategoryClick = useCallback((category: string) => {
    setBehavior(prev => ({
      ...prev,
      clickedCategories: [...prev.clickedCategories.slice(-9), category] // Keep last 10 categories
    }));

    setContext(prev => ({
      ...prev,
      previousActions: [...prev.previousActions.slice(-9), 'category_click']
    }));
  }, []);

  // Track instructor preference
  const trackInstructorPreference = useCallback((instructorId: string) => {
    setBehavior(prev => ({
      ...prev,
      preferredInstructors: [...prev.preferredInstructors.slice(-4), instructorId] // Keep last 5 instructors
    }));

    setContext(prev => ({
      ...prev,
      previousActions: [...prev.previousActions.slice(-9), 'instructor_click']
    }));
  }, []);

  // Track page view
  const trackPageView = useCallback((page: string) => {
    setContext(prev => ({
      ...prev,
      previousActions: [...prev.previousActions.slice(-9), `page_${page}`]
    }));
  }, []);

  // Update session duration
  useEffect(() => {
    const interval = setInterval(() => {
      const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
      setContext(prev => ({
        ...prev,
        currentTime: new Date(),
        sessionDuration
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // Detect device type
  useEffect(() => {
    const detectDeviceType = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      if (/mobile|android|iphone|ipad|phone/.test(userAgent)) {
        return 'mobile';
      } else if (/tablet|ipad/.test(userAgent)) {
        return 'tablet';
      } else {
        return 'desktop';
      }
    };

    setContext(prev => ({
      ...prev,
      deviceType: detectDeviceType()
    }));
  }, []);

  // Calculate learning patterns
  useEffect(() => {
    const calculateLearningPatterns = () => {
      const now = new Date();
      const hour = now.getHours();

      let preferredTime: string;
      if (hour >= 6 && hour < 12) preferredTime = 'morning';
      else if (hour >= 12 && hour < 18) preferredTime = 'afternoon';
      else preferredTime = 'evening';

      const totalCompletions = Object.values(behavior.courseCompletions).reduce((sum, count) => sum + count, 0);
      const totalViews = Object.values(behavior.courseViews).reduce((sum, count) => sum + count, 0);
      const completionRate = totalViews > 0 ? totalCompletions / totalViews : 0;

      setBehavior(prev => ({
        ...prev,
        learningPatterns: {
          preferredTime,
          sessionDuration: context.sessionDuration,
          completionRate
        }
      }));
    };

    calculateLearningPatterns();
  }, [behavior.courseCompletions, behavior.courseViews, context.sessionDuration]);

  // Save behavior to localStorage periodically
  useEffect(() => {
    if (!user) return;

    const saveBehavior = () => {
      const key = `user_behavior_${user.id}`;
      localStorage.setItem(key, JSON.stringify({
        behavior,
        context,
        timestamp: Date.now()
      }));
    };

    const interval = setInterval(saveBehavior, 30000); // Save every 30 seconds
    return () => clearInterval(interval);
  }, [user, behavior, context]);

  // Load behavior from localStorage on mount
  useEffect(() => {
    if (!user) return;

    const loadBehavior = () => {
      const key = `user_behavior_${user.id}`;
      const saved = localStorage.getItem(key);

      if (saved) {
        try {
          const data = JSON.parse(saved);
          const ageInHours = (Date.now() - data.timestamp) / (1000 * 60 * 60);

          // Only load if data is less than 24 hours old
          if (ageInHours < 24) {
            setBehavior(data.behavior);
            setContext(data.context);
          }
        } catch (error) {
          console.error('Error loading user behavior:', error);
        }
      }
    };

    loadBehavior();
  }, [user]);

  return {
    behavior,
    context,
    trackCourseView,
    trackCourseCompletion,
    trackTimeSpent,
    trackSearchQuery,
    trackCategoryClick,
    trackInstructorPreference,
    trackPageView
  };
};