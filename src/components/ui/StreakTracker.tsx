import React from 'react';
import { Flame } from 'lucide-react';
import { LearningStreak } from '../../types';

interface StreakTrackerProps {
  streak: LearningStreak;
}

const StreakTracker: React.FC<StreakTrackerProps> = ({ streak }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Flame className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-white font-medium">Learning Streak</span>
        </div>
        <div className="text-gray-400 text-sm">
          Longest: {streak.longest} days
        </div>
      </div>

      <div className="flex items-center space-x-1">
        {streak.history.slice(0, 7).map((day, index) => (
          <div
            key={index}
            className={`flex-1 h-8 rounded ${
              day.completed
                ? 'bg-red-500'
                : 'bg-gray-700'
            }`}
          />
        ))}
      </div>
      
      <div className="mt-4 text-center">
        <div className="text-2xl font-bold text-white mb-1">
          {streak.current}
        </div>
        <div className="text-gray-400 text-sm">
          Day Streak
        </div>
      </div>
    </div>
  );
};

export default StreakTracker;