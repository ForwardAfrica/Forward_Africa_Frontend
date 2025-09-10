import React from 'react';
import { Trophy } from 'lucide-react';
import { UserLevel } from '../../types';

interface LevelProgressProps {
  level: UserLevel;
}

const LevelProgress: React.FC<LevelProgressProps> = ({ level }) => {
  const progressPercentage = (level.currentXP / level.nextLevelXP) * 100;

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
          <span className="text-white font-medium">Level {level.current}</span>
        </div>
        <span className="text-gray-400 text-sm">
          {level.currentXP} / {level.nextLevelXP} XP
        </span>
      </div>
      
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-yellow-500 to-red-500 transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default LevelProgress;