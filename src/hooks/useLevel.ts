import { useState, useEffect } from 'react';
import { UserLevel } from '../types';

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

export const useLevel = () => {
  const [level, setLevel] = useState<UserLevel>({
    current: 1,
    currentXP: 0,
    nextLevelXP: 100,
    totalXP: 0
  });

  // Initialize level from localStorage on client side only
  useEffect(() => {
    const saved = getLocalStorage('userLevel');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setLevel(parsed);
      } catch (error) {
        console.error('Error parsing user level from localStorage:', error);
      }
    }
  }, []);

  useEffect(() => {
    setLocalStorage('userLevel', JSON.stringify(level));
  }, [level]);

  const addXP = (xp: number) => {
    setLevel(prev => {
      const newTotalXP = prev.totalXP + xp;
      const newCurrentXP = prev.currentXP + xp;

      // Check if level up
      if (newCurrentXP >= prev.nextLevelXP) {
        const newLevel = prev.current + 1;
        const newNextLevelXP = newLevel * 100; // Simple progression
        return {
          current: newLevel,
          currentXP: newCurrentXP - prev.nextLevelXP,
          nextLevelXP: newNextLevelXP,
          totalXP: newTotalXP
        };
      }

      return {
        ...prev,
        currentXP: newCurrentXP,
        totalXP: newTotalXP
      };
    });
  };

  return { level, addXP };
};