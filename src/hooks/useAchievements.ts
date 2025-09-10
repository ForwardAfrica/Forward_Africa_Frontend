import { useState, useEffect } from 'react';
import { Achievement, LearningStreak } from '../types';

// Safe localStorage access for SSR
const getLocalStorage = (key: string) => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key);
  }
  return null;
};

const setLocalStorage = (key: string, value: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, value);
  }
};

export const useAchievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [streak, setStreak] = useState<LearningStreak>({
    current: 0,
    longest: 0,
    lastActivityDate: new Date(),
    history: []
  });

  // Initialize achievements and streak from localStorage on client side only
  useEffect(() => {
    const savedAchievements = getLocalStorage('achievements');
    const savedStreak = getLocalStorage('learningStreak');

    if (savedAchievements) {
      try {
        const parsed = JSON.parse(savedAchievements);
        setAchievements(parsed);
      } catch (error) {
        console.error('Error parsing achievements from localStorage:', error);
      }
    }

    if (savedStreak) {
      try {
        const parsed = JSON.parse(savedStreak);
        setStreak(parsed);
      } catch (error) {
        console.error('Error parsing learning streak from localStorage:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (achievements.length > 0) {
      setLocalStorage('achievements', JSON.stringify(achievements));
    }
  }, [achievements]);

  useEffect(() => {
    setLocalStorage('learningStreak', JSON.stringify(streak));
  }, [streak]);

  const addAchievement = (achievement: Achievement) => {
    setAchievements(prev => [...prev, achievement]);
  };

  const updateStreak = (newStreak: LearningStreak) => {
    setStreak(newStreak);
  };

  return { achievements, streak, addAchievement, updateStreak };
};