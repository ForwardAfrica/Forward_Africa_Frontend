import React, { useState, useEffect } from 'react';
import { Play, Clock, Award, TrendingUp, BarChart3, Calendar } from 'lucide-react';
import { Course, UserProgress, VideoAnalytics } from '../../types';
import videoProgressService from '../../lib/videoProgressService';

interface CourseProgressDashboardProps {
  course: Course;
  userProgress: UserProgress;
  onProgressUpdate: (progress: number) => void;
  currentProgress?: number; // Current progress from lesson selection
  selectedLessonId?: string; // Currently selected lesson ID
}

const CourseProgressDashboard: React.FC<CourseProgressDashboardProps> = ({
  course,
  userProgress,
  onProgressUpdate,
  currentProgress = 0,
  selectedLessonId
}) => {
  const [lessonAnalytics, setLessonAnalytics] = useState<Record<string, VideoAnalytics>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLessonAnalytics();
  }, [course]);

  const loadLessonAnalytics = async () => {
    try {
      setLoading(true);
      const analytics: Record<string, VideoAnalytics> = {};

      for (const lesson of course.lessons) {
        const lessonAnalytics = await videoProgressService.getVideoAnalytics(
          course.id,
          lesson.id
        );
        analytics[lesson.id] = lessonAnalytics;
      }

      setLessonAnalytics(analytics);
    } catch (error) {
      console.error('Error loading lesson analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOverallProgress = (): number => {
    if (!course.lessons.length) return 0;

    const completedLessons = course.lessons.filter(lesson =>
      userProgress.completedLessons.includes(lesson.id)
    );

    // Base progress from completed lessons
    const completedProgress = (completedLessons.length / course.lessons.length) * 100;

    // If there's a selected lesson and it's not completed, add partial progress
    if (selectedLessonId && !userProgress.completedLessons.includes(selectedLessonId)) {
      const selectedLessonIndex = course.lessons.findIndex(lesson => lesson.id === selectedLessonId);
      if (selectedLessonIndex !== -1) {
        // Add partial progress for the selected lesson (even if not completed)
        const lessonProgress = ((selectedLessonIndex + 1) / course.lessons.length) * 100;
        // Use the higher of completed progress or lesson selection progress
        return Math.max(completedProgress, lessonProgress);
      }
    }

    // If there's current progress from video playback, consider it
    if (currentProgress > 0) {
      return Math.max(completedProgress, currentProgress);
    }

    return completedProgress;
  };

  const getTotalWatchTime = (): number => {
    return Object.values(lessonAnalytics).reduce(
      (total, analytics) => total + analytics.totalWatchTime,
      0
    );
  };

  const getAverageEngagement = (): number => {
    const analytics = Object.values(lessonAnalytics);
    if (analytics.length === 0) return 0;

    const totalEngagement = analytics.reduce(
      (total, analytics) => total + analytics.engagementScore,
      0
    );

    return totalEngagement / analytics.length;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Progress</h2>

      {/* Overall Progress */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Overall Progress</p>
              <p className="text-2xl font-bold">{getOverallProgress().toFixed(1)}%</p>
            </div>
            <TrendingUp className="w-8 h-8" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Watch Time</p>
              <p className="text-2xl font-bold">{Math.round(getTotalWatchTime() / 60)}m</p>
            </div>
            <Clock className="w-8 h-8" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Lessons Completed</p>
              <p className="text-2xl font-bold">{userProgress.completedLessons.length}</p>
            </div>
            <Award className="w-8 h-8" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Engagement Score</p>
              <p className="text-2xl font-bold">{getAverageEngagement().toFixed(1)}%</p>
            </div>
            <BarChart3 className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Lesson Progress */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Lesson Progress</h3>

        {course.lessons.map((lesson, index) => {
          const analytics = lessonAnalytics[lesson.id];
          const isCompleted = userProgress.completedLessons.includes(lesson.id);
          const progress = analytics ? (analytics.completionRate || 0) : 0;

          return (
            <div key={lesson.id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                    <p className="text-sm text-gray-500">{lesson.duration}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{progress.toFixed(1)}%</p>
                  {analytics && (
                    <p className="text-xs text-gray-500">
                      {Math.round(analytics.totalWatchTime / 60)}m watched
                    </p>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isCompleted ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              {/* Analytics Details */}
              {analytics && (
                <div className="mt-3 grid grid-cols-3 gap-4 text-xs text-gray-500">
                  <div>
                    <span>Sessions:</span>
                    <span className="ml-1 font-medium">{analytics.totalSessions}</span>
                  </div>
                  <div>
                    <span>Engagement:</span>
                    <span className="ml-1 font-medium">{analytics.engagementScore.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span>Avg Duration:</span>
                    <span className="ml-1 font-medium">{Math.round(analytics.averageSessionDuration / 60)}m</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Certificate Section */}
      {getOverallProgress() === 100 && (
        <div className="mt-8 p-4 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">🎉 Course Completed!</h3>
              <p className="text-yellow-100">You've earned a certificate for this course.</p>
            </div>
            <Award className="w-8 h-8 text-white" />
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseProgressDashboard;