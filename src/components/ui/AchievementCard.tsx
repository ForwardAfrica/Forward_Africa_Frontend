import React from 'react';
import { Achievement } from '../../types';
import { Award, Flame, Users, Trophy } from 'lucide-react';

interface AchievementCardProps {
  achievement: Achievement;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => {
  const icons = {
    award: Award,
    flame: Flame,
    users: Users,
    trophy: Trophy
  };

  const Icon = icons[achievement.icon as keyof typeof icons] || Award;

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-full ${
          achievement.earnedDate 
            ? 'bg-red-500/20 text-red-500' 
            : 'bg-gray-700/50 text-gray-400'
        }`}>
          <Icon className="h-6 w-6" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-white font-medium mb-1">{achievement.title}</h3>
          <p className="text-gray-400 text-sm mb-2">{achievement.description}</p>
          
          {achievement.earnedDate ? (
            <span className="text-gray-500 text-xs">
              Earned on {achievement.earnedDate.toLocaleDateString()}
            </span>
          ) : (
            <div className="space-y-1">
              <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-600 transition-all duration-300"
                  style={{ width: `${achievement.progress}%` }}
                ></div>
              </div>
              <span className="text-gray-500 text-xs">
                Progress: {achievement.progress}%
              </span>
            </div>
          )}
        </div>
        
        <div className="text-yellow-500 font-medium text-sm">
          +{achievement.xpPoints} XP
        </div>
      </div>
    </div>
  );
};

export default AchievementCard;