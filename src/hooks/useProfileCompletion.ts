import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ProfileCompletionState {
  isComplete: boolean;
  completionPercentage: number;
  missingFields: string[];
  shouldPrompt: boolean;
  lastPrompted: Date | null;
  promptCount: number;
}

export const useProfileCompletion = () => {
  const { user } = useAuth();
  const [state, setState] = useState<ProfileCompletionState>({
    isComplete: false,
    completionPercentage: 0,
    missingFields: [],
    shouldPrompt: false,
    lastPrompted: null,
    promptCount: 0
  });

  // Calculate profile completion
  const calculateCompletion = () => {
    if (!user) return { isComplete: false, completionPercentage: 0, missingFields: [] };

    const requiredFields = [
      { key: 'education_level', label: 'Education Level' },
      { key: 'job_title', label: 'Job Title' },
      { key: 'topics_of_interest', label: 'Topics of Interest' },
      { key: 'industry', label: 'Industry' },
      { key: 'experience_level', label: 'Experience Level' },
      { key: 'business_stage', label: 'Business Stage' },
      { key: 'country', label: 'Country' },
      { key: 'state_province', label: 'State/Province' },
      { key: 'city', label: 'City' }
    ];

    const completedFields = requiredFields.filter(field => {
      const value = user[field.key as keyof typeof user];
      if (field.key === 'topics_of_interest') {
        return Array.isArray(value) && value.length > 0;
      }
      return value && value.toString().trim() !== '';
    });

    const missingFields = requiredFields
      .filter(field => {
        const value = user[field.key as keyof typeof user];
        if (field.key === 'topics_of_interest') {
          return !Array.isArray(value) || value.length === 0;
        }
        return !value || value.toString().trim() === '';
      })
      .map(field => field.label);

    const completionPercentage = Math.round((completedFields.length / requiredFields.length) * 100);
    const isComplete = completionPercentage >= 80; // Consider 80% as complete

    return { isComplete, completionPercentage, missingFields };
  };

  // Determine if user should be prompted
  const shouldPromptUser = () => {
    if (!user || user.onboarding_completed) return false;

    const { isComplete } = calculateCompletion();
    if (isComplete) return false;

    // Get stored prompt data
    const storedData = localStorage.getItem(`profile_prompt_${user.id}`);
    if (storedData) {
      const { lastPrompted, promptCount } = JSON.parse(storedData);
      const lastPromptDate = new Date(lastPrompted);
      const daysSinceLastPrompt = (Date.now() - lastPromptDate.getTime()) / (1000 * 60 * 60 * 24);

      // Don't prompt more than 3 times and not more than once per day
      if (promptCount >= 3 || daysSinceLastPrompt < 1) {
        return false;
      }
    }

    return true;
  };

  // Record that user was prompted
  const recordPrompt = () => {
    if (!user) return;

    const storedData = localStorage.getItem(`profile_prompt_${user.id}`);
    const currentData = storedData ? JSON.parse(storedData) : { lastPrompted: null, promptCount: 0 };

    const newData = {
      lastPrompted: new Date().toISOString(),
      promptCount: currentData.promptCount + 1
    };

    localStorage.setItem(`profile_prompt_${user.id}`, JSON.stringify(newData));
    setState(prev => ({
      ...prev,
      lastPrompted: new Date(),
      promptCount: newData.promptCount
    }));
  };

  // Reset prompt count (when user completes profile)
  const resetPromptCount = () => {
    if (!user) return;
    localStorage.removeItem(`profile_prompt_${user.id}`);
    setState(prev => ({
      ...prev,
      lastPrompted: null,
      promptCount: 0
    }));
  };

  // Update state when user changes
  useEffect(() => {
    if (!user) {
      setState({
        isComplete: false,
        completionPercentage: 0,
        missingFields: [],
        shouldPrompt: false,
        lastPrompted: null,
        promptCount: 0
      });
      return;
    }

    const { isComplete, completionPercentage, missingFields } = calculateCompletion();
    const shouldPrompt = shouldPromptUser();

    setState({
      isComplete,
      completionPercentage,
      missingFields,
      shouldPrompt,
      lastPrompted: null,
      promptCount: 0
    });
  }, [user]);

  return {
    ...state,
    recordPrompt,
    resetPromptCount,
    calculateCompletion
  };
};