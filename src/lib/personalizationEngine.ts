import { Course, User, UserProgress } from '../types';

export interface PersonalizationScore {
  course: Course;
  score: number;
  confidence: number;
  factors: PersonalizationFactor[];
  type: 'profile_based' | 'behavior_based' | 'collaborative' | 'contextual' | 'hybrid';
}

export interface PersonalizationFactor {
  name: string;
  weight: number;
  score: number;
  description: string;
}

export interface UserBehavior {
  courseViews: Record<string, number>;
  courseCompletions: Record<string, number>;
  timeSpent: Record<string, number>;
  searchQueries: string[];
  clickedCategories: string[];
  preferredInstructors: string[];
  learningPatterns: {
    preferredTime: string;
    sessionDuration: number;
    completionRate: number;
  };
}

export interface PersonalizationContext {
  currentTime: Date;
  userLocation?: string;
  deviceType?: string;
  sessionDuration: number;
  previousActions: string[];
}

class PersonalizationEngine {
  private readonly WEIGHTS = {
    // Profile-based factors
    INTEREST_MATCH: 0.25,
    EDUCATION_LEVEL: 0.15,
    EXPERIENCE_LEVEL: 0.15,
    INDUSTRY_MATCH: 0.10,
    GEOGRAPHIC_RELEVANCE: 0.05,

    // Behavior-based factors
    COMPLETION_PATTERN: 0.20,
    VIEWING_PATTERN: 0.15,
    SEARCH_PATTERN: 0.10,
    TIME_SPENT: 0.10,

    // Collaborative factors
    SIMILAR_USER_PREFERENCE: 0.30,
    POPULARITY: 0.15,

    // Contextual factors
    TIME_OF_DAY: 0.05,
    SESSION_CONTEXT: 0.10,
    DEVICE_CONTEXT: 0.05
  };

  /**
   * Generate personalized recommendations using multiple algorithms
   */
  generateRecommendations(
    user: User,
    courses: Course[],
    userProgress: UserProgress[],
    userBehavior: UserBehavior,
    context: PersonalizationContext,
    limit: number = 12
  ): PersonalizationScore[] {
    const scores: PersonalizationScore[] = [];

    for (const course of courses) {
      // Skip courses user has already completed
      if (userProgress.some(p => p.courseId === course.id && p.completed)) {
        continue;
      }

      const factors: PersonalizationFactor[] = [];
      let totalScore = 0;
      let totalWeight = 0;

      // 1. Profile-based personalization
      const profileFactors = this.calculateProfileBasedFactors(user, course);
      factors.push(...profileFactors);
      totalScore += profileFactors.reduce((sum, f) => sum + (f.score * f.weight), 0);
      totalWeight += profileFactors.reduce((sum, f) => sum + f.weight, 0);

      // 2. Behavior-based personalization
      const behaviorFactors = this.calculateBehaviorBasedFactors(user, course, userProgress, userBehavior);
      factors.push(...behaviorFactors);
      totalScore += behaviorFactors.reduce((sum, f) => sum + (f.score * f.weight), 0);
      totalWeight += behaviorFactors.reduce((sum, f) => sum + f.weight, 0);

      // 3. Collaborative filtering
      const collaborativeFactors = this.calculateCollaborativeFactors(user, course, userProgress);
      factors.push(...collaborativeFactors);
      totalScore += collaborativeFactors.reduce((sum, f) => sum + (f.score * f.weight), 0);
      totalWeight += collaborativeFactors.reduce((sum, f) => sum + f.weight, 0);

      // 4. Contextual personalization
      const contextualFactors = this.calculateContextualFactors(course, context);
      factors.push(...contextualFactors);
      totalScore += contextualFactors.reduce((sum, f) => sum + (f.score * f.weight), 0);
      totalWeight += contextualFactors.reduce((sum, f) => sum + f.weight, 0);

      // Calculate final score
      const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;
      const confidence = this.calculateConfidence(factors, user);

      // Determine recommendation type
      const type = this.determineRecommendationType(factors);

      scores.push({
        course,
        score: finalScore,
        confidence,
        factors,
        type
      });
    }

    // Sort by score and return top recommendations
    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Calculate profile-based personalization factors
   */
  private calculateProfileBasedFactors(user: User, course: Course): PersonalizationFactor[] {
    const factors: PersonalizationFactor[] = [];

    // Interest match - using role as a proxy for interests
    if (user.role) {
      const interestMatch = this.calculateInterestMatch([user.role], course);
      factors.push({
        name: 'Role Match',
        weight: this.WEIGHTS.INTEREST_MATCH,
        score: interestMatch,
        description: `Matches your ${user.role} role`
      });
    }

    // Basic profile completion score
    const profileCompletion = this.calculateProfileCompletion(user);
    factors.push({
      name: 'Profile Completion',
      weight: this.WEIGHTS.EDUCATION_LEVEL,
      score: profileCompletion,
      description: `Based on your profile completeness`
    });

    // User activity score
    const activityScore = this.calculateUserActivity(user);
    factors.push({
      name: 'User Activity',
      weight: this.WEIGHTS.EXPERIENCE_LEVEL,
      score: activityScore,
      description: `Based on your account activity`
    });

    return factors;
  }

  /**
   * Calculate behavior-based personalization factors
   */
  private calculateBehaviorBasedFactors(
    user: User,
    course: Course,
    userProgress: UserProgress[],
    userBehavior: UserBehavior
  ): PersonalizationFactor[] {
    const factors: PersonalizationFactor[] = [];

    // Completion pattern analysis
    const completionScore = this.analyzeCompletionPattern(userProgress, course);
    factors.push({
      name: 'Completion Pattern',
      weight: this.WEIGHTS.COMPLETION_PATTERN,
      score: completionScore,
      description: 'Based on your course completion history'
    });

    // Viewing pattern analysis
    const viewingScore = this.analyzeViewingPattern(userBehavior, course);
    factors.push({
      name: 'Viewing Pattern',
      weight: this.WEIGHTS.VIEWING_PATTERN,
      score: viewingScore,
      description: 'Based on your viewing behavior'
    });

    // Search pattern analysis
    const searchScore = this.analyzeSearchPattern(userBehavior, course);
    factors.push({
      name: 'Search Pattern',
      weight: this.WEIGHTS.SEARCH_PATTERN,
      score: searchScore,
      description: 'Based on your search history'
    });

    // Time spent analysis
    const timeScore = this.analyzeTimeSpent(userBehavior, course);
    factors.push({
      name: 'Time Spent',
      weight: this.WEIGHTS.TIME_SPENT,
      score: timeScore,
      description: 'Based on your engagement patterns'
    });

    return factors;
  }

  /**
   * Calculate collaborative filtering factors
   */
  private calculateCollaborativeFactors(
    user: User,
    course: Course,
    userProgress: UserProgress[]
  ): PersonalizationFactor[] {
    const factors: PersonalizationFactor[] = [];

    // Similar user preferences (simplified collaborative filtering)
    const similarUserScore = this.calculateSimilarUserPreference(user, course, userProgress);
    factors.push({
      name: 'Similar Users',
      weight: this.WEIGHTS.SIMILAR_USER_PREFERENCE,
      score: similarUserScore,
      description: 'Liked by users similar to you'
    });

    // Course popularity
    const popularityScore = this.calculatePopularity(course);
    factors.push({
      name: 'Popularity',
      weight: this.WEIGHTS.POPULARITY,
      score: popularityScore,
      description: 'Popular among all learners'
    });

    return factors;
  }

  /**
   * Calculate contextual personalization factors
   */
  private calculateContextualFactors(
    course: Course,
    context: PersonalizationContext
  ): PersonalizationFactor[] {
    const factors: PersonalizationFactor[] = [];

    // Time of day relevance
    const timeScore = this.calculateTimeRelevance(context.currentTime, course);
    factors.push({
      name: 'Time Relevance',
      weight: this.WEIGHTS.TIME_OF_DAY,
      score: timeScore,
      description: 'Optimal for current time'
    });

    // Session context
    const sessionScore = this.calculateSessionRelevance(context, course);
    factors.push({
      name: 'Session Context',
      weight: this.WEIGHTS.SESSION_CONTEXT,
      score: sessionScore,
      description: 'Fits your current session'
    });

    // Device context
    const deviceScore = this.calculateDeviceRelevance(context.deviceType, course);
    factors.push({
      name: 'Device Context',
      weight: this.WEIGHTS.DEVICE_CONTEXT,
      score: deviceScore,
      description: 'Optimized for your device'
    });

    return factors;
  }

  // Helper methods for factor calculations
  private calculateInterestMatch(interests: string[], course: Course): number {
    const courseText = `${course.title} ${course.description}`.toLowerCase();
    const matches = interests.filter(interest =>
      courseText.includes(interest.toLowerCase())
    );
    return matches.length / interests.length;
  }

  private calculateEducationCompatibility(educationLevel: string, course: Course): number {
    const educationMap: Record<string, number> = {
      'high-school': 0.3,
      'associate': 0.5,
      'bachelor': 0.7,
      'master': 0.9,
      'phd': 1.0,
      'professional': 0.8,
      'other': 0.6
    };

    // This is a simplified calculation - in a real system, you'd have course difficulty levels
    const courseDifficulty = this.estimateCourseDifficulty(course);
    const userLevel = educationMap[educationLevel] || 0.5;

    return 1 - Math.abs(courseDifficulty - userLevel);
  }

  private calculateExperienceCompatibility(experienceLevel: string, course: Course): number {
    const experienceMap: Record<string, number> = {
      'Entry Level (0-2 years)': 0.3,
      'Mid-Level (3-7 years)': 0.6,
      'Senior (8+ years)': 0.9
    };

    const courseDifficulty = this.estimateCourseDifficulty(course);
    const userLevel = experienceMap[experienceLevel] || 0.5;

    return 1 - Math.abs(courseDifficulty - userLevel);
  }

  private calculateIndustryRelevance(userIndustry: string, course: Course): number {
    const courseText = `${course.title} ${course.description}`.toLowerCase();
    const industryKeywords = this.getIndustryKeywords(userIndustry);

    const matches = industryKeywords.filter(keyword =>
      courseText.includes(keyword.toLowerCase())
    );

    return matches.length / industryKeywords.length;
  }

  private calculateGeographicRelevance(user: User, course: Course): number {
    // Simplified geographic relevance - in a real system, you'd have location-specific content
    // For now, return a default relevance score
    return 0.5; // Default relevance
  }

  private calculateProfileCompletion(user: User): number {
    // Calculate profile completion based on available user data
    let completion = 0;
    if (user.full_name) completion += 0.2;
    if (user.email) completion += 0.2;
    if (user.role) completion += 0.2;
    if (user.permissions && user.permissions.length > 0) completion += 0.2;
    if (user.onboarding_completed) completion += 0.2;
    return completion;
  }

  private calculateUserActivity(user: User): number {
    // Calculate user activity score based on account age and activity
    const accountAge = Date.now() - new Date(user.created_at).getTime();
    const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24);

    // Higher score for older accounts (more established)
    return Math.min(daysSinceCreation / 365, 1.0);
  }

  private analyzeCompletionPattern(userProgress: UserProgress[], course: Course): number {
    const completedCourses = userProgress.filter(p => p.completed);
    if (completedCourses.length === 0) return 0.5;

    const completedCategories = completedCourses.map(p => {
      // This would need to be enhanced to get actual course categories
      return 'business'; // Simplified
    });

    const courseCategory = 'business'; // Simplified
    const categoryMatch = completedCategories.includes(courseCategory);

    return categoryMatch ? 0.8 : 0.3;
  }

  private analyzeViewingPattern(userBehavior: UserBehavior, course: Course): number {
    const courseViews = userBehavior.courseViews[course.id] || 0;
    const totalViews = Object.values(userBehavior.courseViews).reduce((sum, views) => sum + views, 0);

    if (totalViews === 0) return 0.5;
    return Math.min(courseViews / totalViews * 2, 1); // Normalize and cap at 1
  }

  private analyzeSearchPattern(userBehavior: UserBehavior, course: Course): number {
    const courseText = `${course.title} ${course.description}`.toLowerCase();
    const searchMatches = userBehavior.searchQueries.filter(query =>
      courseText.includes(query.toLowerCase())
    );

    return Math.min(searchMatches.length * 0.3, 1);
  }

  private analyzeTimeSpent(userBehavior: UserBehavior, course: Course): number {
    const timeSpent = userBehavior.timeSpent[course.id] || 0;
    const avgTimeSpent = Object.values(userBehavior.timeSpent).reduce((sum, time) => sum + time, 0) /
                        Object.keys(userBehavior.timeSpent).length || 1;

    return Math.min(timeSpent / avgTimeSpent, 1);
  }

  private calculateSimilarUserPreference(user: User, course: Course, userProgress: UserProgress[]): number {
    // Simplified collaborative filtering - in a real system, you'd have actual user similarity data
    const userCompletedCourses = userProgress.filter(p => p.completed).length;

    // Mock similarity score based on user activity level
    if (userCompletedCourses > 5) return 0.8;
    if (userCompletedCourses > 2) return 0.6;
    return 0.4;
  }

  private calculatePopularity(course: Course): number {
    // Simplified popularity calculation - in a real system, you'd have actual popularity metrics
    return 0.5 + Math.random() * 0.5; // Mock popularity between 0.5 and 1.0
  }

  private calculateTimeRelevance(currentTime: Date, course: Course): number {
    const hour = currentTime.getHours();

    // Morning courses (6-12)
    if (hour >= 6 && hour < 12) {
      return course.title.toLowerCase().includes('morning') || course.title.toLowerCase().includes('start') ? 0.8 : 0.5;
    }
    // Afternoon courses (12-18)
    else if (hour >= 12 && hour < 18) {
      return course.title.toLowerCase().includes('afternoon') || course.title.toLowerCase().includes('work') ? 0.8 : 0.5;
    }
    // Evening courses (18-24)
    else {
      return course.title.toLowerCase().includes('evening') || course.title.toLowerCase().includes('relax') ? 0.8 : 0.5;
    }
  }

  private calculateSessionRelevance(context: PersonalizationContext, course: Course): number {
    // Session duration relevance
    if (context.sessionDuration < 300) { // Less than 5 minutes
      return course.title.toLowerCase().includes('quick') || course.title.toLowerCase().includes('intro') ? 0.8 : 0.4;
    } else if (context.sessionDuration > 1800) { // More than 30 minutes
      return course.title.toLowerCase().includes('advanced') || course.title.toLowerCase().includes('comprehensive') ? 0.8 : 0.4;
    }
    return 0.6; // Default for medium sessions
  }

  private calculateDeviceRelevance(deviceType: string | undefined, course: Course): number {
    if (!deviceType) return 0.5;

    if (deviceType === 'mobile') {
      return course.title.toLowerCase().includes('mobile') || course.title.toLowerCase().includes('quick') ? 0.8 : 0.4;
    } else if (deviceType === 'desktop') {
      return course.title.toLowerCase().includes('desktop') || course.title.toLowerCase().includes('comprehensive') ? 0.8 : 0.4;
    }
    return 0.6;
  }

  private calculateConfidence(factors: PersonalizationFactor[], user: User): number {
    // Higher confidence when we have more user data
    const hasProfileData = user.role && user.permissions && user.permissions.length > 0;
    const hasBehaviorData = factors.some(f => f.name.includes('Pattern') || f.name.includes('Behavior'));

    let confidence = 0.5; // Base confidence

    if (hasProfileData) confidence += 0.2;
    if (hasBehaviorData) confidence += 0.2;
    if (factors.length > 5) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  private determineRecommendationType(factors: PersonalizationFactor[]): PersonalizationScore['type'] {
    const profileFactors = factors.filter(f => f.name.includes('Interest') || f.name.includes('Education') || f.name.includes('Industry'));
    const behaviorFactors = factors.filter(f => f.name.includes('Pattern') || f.name.includes('Behavior'));
    const collaborativeFactors = factors.filter(f => f.name.includes('Similar') || f.name.includes('Popularity'));
    const contextualFactors = factors.filter(f => f.name.includes('Time') || f.name.includes('Session') || f.name.includes('Device'));

    if (profileFactors.length > 0 && behaviorFactors.length > 0 && collaborativeFactors.length > 0) {
      return 'hybrid';
    } else if (profileFactors.length > 0) {
      return 'profile_based';
    } else if (behaviorFactors.length > 0) {
      return 'behavior_based';
    } else if (collaborativeFactors.length > 0) {
      return 'collaborative';
    } else if (contextualFactors.length > 0) {
      return 'contextual';
    }

    return 'hybrid';
  }

  private estimateCourseDifficulty(course: Course): number {
    // Simplified difficulty estimation based on course title and description
    const text = `${course.title} ${course.description}`.toLowerCase();

    if (text.includes('advanced') || text.includes('expert') || text.includes('master')) {
      return 0.9;
    } else if (text.includes('intermediate') || text.includes('intermediate')) {
      return 0.6;
    } else if (text.includes('beginner') || text.includes('intro') || text.includes('basic')) {
      return 0.3;
    }

    return 0.5; // Default difficulty
  }

  private getIndustryKeywords(industry: string): string[] {
    const industryKeywords: Record<string, string[]> = {
      'Technology & Digital Innovation': ['technology', 'digital', 'innovation', 'software', 'tech'],
      'Financial Services & Fintech': ['finance', 'financial', 'fintech', 'banking', 'investment'],
      'Healthcare & Pharmaceuticals': ['healthcare', 'medical', 'pharmaceutical', 'health', 'medicine'],
      'Manufacturing & Industrial': ['manufacturing', 'industrial', 'production', 'factory', 'automation'],
      'Agriculture & Agribusiness': ['agriculture', 'farming', 'agribusiness', 'crop', 'livestock'],
      'Education & Training': ['education', 'training', 'learning', 'teaching', 'academic']
    };

    return industryKeywords[industry] || [industry.toLowerCase()];
  }
}

export const personalizationEngine = new PersonalizationEngine();