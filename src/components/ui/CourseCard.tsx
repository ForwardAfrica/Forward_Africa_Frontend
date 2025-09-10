/**
 * CourseCard Component
 *
 * Displays a course card with thumbnail, title, and instructor information.
 * Includes hover effects and play button overlay.
 *
 * @component
 * @example
 * ```tsx
 * <CourseCard course={courseData} />
 * ```
 */

import React from 'react';
import { Play, Clock, Star, User, BookOpen, Award, TrendingUp, Users, Calendar, MapPin, Globe, Building2, GraduationCap, Briefcase, Target, Zap, ChevronRight, CheckCircle, AlertTriangle, Info, ExternalLink, Download, Share2, Heart, MessageCircle, Eye, EyeOff, Lock, Unlock, Shield, Crown, Medal, Trophy, Badge, Flag, Rocket, Diamond } from 'lucide-react';
import { Course } from '../../types';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useFavorites } from '../../hooks/useFavorites';

interface CourseCardProps {
  /** Course data to display */
  course: Course;
  showFavoriteButton?: boolean;
  rowId?: number;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, showFavoriteButton = true, rowId }) => {
  const router = useRouter();
  const [isHovered, setIsHovered] = React.useState(false);
  const [hoveredCardId, setHoveredCardId] = React.useState<string | null>(null);

  const {
    favorites,
    addToFavorites,
    removeFromFavorites,
    loading: favoritesLoading,
    error: favoritesError,
    clearError,
    fetchFavorites,
    hasInitialized
  } = useFavorites();
  const isFavorited = favorites.some(fav => fav.id === course.id);

  // Handle card hover with React state
  const handleCardHover = (e: React.MouseEvent) => {
    const card = e.currentTarget as HTMLElement;
    const gridContainer = card.closest('.card-grid-container');
    if (!gridContainer) return;

    // Get the row ID for this card
    const currentRowId = rowId;
    if (currentRowId === undefined) return;

    // Set the row ID on the container for CSS targeting
    gridContainer.setAttribute('data-active-row', currentRowId.toString());

    // Get all cards in this specific row only using CSS selector
    const rowCards = gridContainer.querySelectorAll(`[data-row-id="${currentRowId}"]`);
    const currentIndex = Array.from(rowCards).indexOf(card);
    const isLastCard = currentIndex === rowCards.length - 1;

    console.log(`Row ${currentRowId}: Found ${rowCards.length} cards in this row`);
    console.log(`Current card index: ${currentIndex}, Is last card: ${isLastCard}`);

    // First, reset all cards in this row to ensure clean state
    rowCards.forEach((adjacentCard) => {
      (adjacentCard as HTMLElement).style.transform = 'translateX(0) scale(1)';
      (adjacentCard as HTMLElement).style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    });

    if (isLastCard) {
      // Last card in row: push container to the left and expand card to the left
      // Only apply container push on course pages, not homepage
      const isCoursePage = window.location.pathname.includes('/courses');
      if (isCoursePage) {
        (gridContainer as HTMLElement).style.transform = 'translateX(-12rem)';
        (gridContainer as HTMLElement).style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
      }

      (card as HTMLElement).style.transform = 'scale(1.05) translateX(-4rem)';
      (card as HTMLElement).style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
      (card as HTMLElement).style.width = '200%';
      (card as HTMLElement).classList.add('active');
    } else {
      // Other cards: expand to the right and push adjacent cards in the same row
      (card as HTMLElement).style.transform = 'scale(1.05) translateX(1rem)';
      (card as HTMLElement).style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
      (card as HTMLElement).style.width = '200%';
      (card as HTMLElement).classList.add('active');

      // Push cards to the right of the hovered card (only in this row)
      rowCards.forEach((adjacentCard, index) => {
        if (index > currentIndex) {
          // Different push distance for homepage vs course pages
          const isHomePage = window.location.pathname === '/' || window.location.pathname === '/home';
          const pushDistance = isHomePage ? '14rem' : '18rem';

          console.log(`Pushing card ${index} in row ${currentRowId} to the right by ${pushDistance}`);
          (adjacentCard as HTMLElement).style.transform = `translateX(${pushDistance})`;
          (adjacentCard as HTMLElement).style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        }
      });
    }
  };

  const handleCardLeave = (e: React.MouseEvent) => {
    const card = e.currentTarget as HTMLElement;
    const gridContainer = card.closest('.card-grid-container');
    if (!gridContainer) return;

    // Get the row ID for this card
    const currentRowId = rowId;
    if (currentRowId === undefined) return;

    // Get all cards in this specific row only using CSS selector
    const rowCards = gridContainer.querySelectorAll(`[data-row-id="${currentRowId}"]`);

    // Reset container position only on course pages
    const isCoursePage = window.location.pathname.includes('/courses');
    if (isCoursePage) {
      (gridContainer as HTMLElement).style.transform = 'translateX(0)';
      (gridContainer as HTMLElement).style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    }

    // Immediately reset all cards in this row
    rowCards.forEach((adjacentCard) => {
      (adjacentCard as HTMLElement).style.transform = 'translateX(0) scale(1)';
      (adjacentCard as HTMLElement).style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      (adjacentCard as HTMLElement).style.width = '100%';
      (adjacentCard as HTMLElement).classList.remove('active'); // Remove active border
    });

    // Reset hovered card immediately
    (card as HTMLElement).style.transform = 'translateX(0) scale(1)';
    (card as HTMLElement).style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    (card as HTMLElement).style.width = '100%';
    (card as HTMLElement).classList.remove('active'); // Remove active border

    // Remove the active row attribute
    gridContainer.removeAttribute('data-active-row');
  };

  // Early return for null/undefined course
  if (!course) {
    return (
      <div className="aspect-[2/3] relative rounded-lg overflow-hidden shadow-xl bg-gray-800 animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Validate course structure
  if (typeof course !== 'object') {
    return (
      <div className="aspect-[2/3] relative rounded-lg overflow-hidden shadow-xl bg-gray-800">
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-400">Invalid Course Data</p>
        </div>
      </div>
    );
  }

  // MINIMAL TEST VERSION - just show basic info
  const courseId = course.id || 'unknown-course';
  const title = course.title || 'Untitled Course';
  const thumbnail = course.thumbnail || '/images/placeholder-course.jpg';

  // DUAL FALLBACK instructor handling - same logic as admin page
  let instructorName = 'Unknown Instructor';
  let instructorImage = '/images/placeholder-avatar.jpg';

  try {
    // First: Try to access the transformed instructor object (from useCourses hook)
    if (course.instructor && typeof course.instructor === 'object' && course.instructor !== null) {
      instructorName = (course.instructor as any).name || 'Unknown Instructor';
      instructorImage = (course.instructor as any).image || '/images/placeholder-avatar.jpg';
    }
    // Second: Fall back to raw API field (direct from API)
    else if ((course as any).instructor_name) {
      instructorName = (course as any).instructor_name || 'Unknown Instructor';
      instructorImage = (course as any).instructor_image || '/images/placeholder-avatar.jpg';
    }
    // Third: Handle string instructor (legacy format)
    else if (typeof course.instructor === 'string') {
      instructorName = course.instructor;
      instructorImage = '/images/placeholder-avatar.jpg';
    }
    // Fourth: Final fallback
    else {
      instructorName = 'Unknown Instructor';
      instructorImage = '/images/placeholder-avatar.jpg';
    }
  } catch (error) {
    console.error('Error accessing instructor data:', error);
    instructorName = 'Unknown Instructor';
    instructorImage = '/images/placeholder-avatar.jpg';
  }

  // Check if course is coming soon (only when explicitly marked)
  const isComingSoon = course.comingSoon === true;

  // Check if course is playable (has lessons and not coming soon)
  const isPlayable = course.lessons && course.lessons.length > 0 && !isComingSoon;

  // Handle course card click
  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();



    // Don't navigate if course is coming soon
    if (isComingSoon) {
      console.log('Course is coming soon, no navigation');
      return;
    }

    // Check if course has lessons
    if (course.lessons && course.lessons.length > 0) {
      const firstLessonId = course.lessons[0].id;
      const lessonUrl = `/course/${courseId}/lesson/${firstLessonId}`;

      // Prevent navigation if already on the target route
      if (router.asPath === lessonUrl) {
        console.log('Already on target lesson, skipping navigation');
        return;
      }

      console.log('Navigating to lesson:', lessonUrl);
      // Use replace to prevent navigation loops
      router.replace(lessonUrl);
    } else {
      console.log('No lessons found, navigating to course page');
      const courseUrl = `/course/${courseId}`;

      // Prevent navigation if already on the target route
      if (router.asPath === courseUrl) {
        console.log('Already on course page, skipping navigation');
        return;
      }

      // Navigate to course page if no lessons
      router.replace(courseUrl);
    }
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if user is logged in
    const token = localStorage.getItem('forward_africa_token');
    if (!token) {
      console.log('User not logged in, cannot add to favorites');
      // You could show a login prompt here
      return;
    }

    // Clear any previous errors
    clearError();

    try {
      // If this is the first time clicking a favorite button, fetch favorites first
      if (!hasInitialized) {
        console.log('First time clicking favorite button, fetching favorites...');
        await fetchFavorites();
      }

      if (isFavorited) {
        await removeFromFavorites(course.id);
      } else {
        await addToFavorites(course.id);
      }
    } catch (error) {
      console.error('Error handling favorite action:', error);
    }
  };



  return (
    <div
      className="card-container group cursor-pointer"
      onMouseEnter={handleCardHover}
      onMouseLeave={handleCardLeave}
      onClick={handleCardClick}
      data-row-id={rowId}
    >
      <div className="relative w-full h-80 transition-all duration-500 ease-in-out card-expansion card-landscape-expand">
        {/* Poster Container */}
        <div className="w-full h-full relative rounded-lg overflow-hidden shadow-xl card-orientation-transition">
          {/* Thumbnail */}
          {thumbnail.startsWith('http') ? (
            // Use regular img tag for external URLs to avoid Next.js Image issues
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover card-landscape-image"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src !== '/images/placeholder-course.jpg') {
                  target.src = '/images/placeholder-course.jpg';
                }
              }}
              onLoad={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.opacity = '1';
              }}
              style={{ opacity: 0, transition: 'opacity 0.3s ease-in-out' }}
            />
          ) : (
            // Use Next.js Image for local images
            <Image
              src={thumbnail}
              alt={title}
              width={400}
              height={600}
              className="w-full h-full object-cover card-landscape-image"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src !== '/images/placeholder-course.jpg') {
                  target.src = '/images/placeholder-course.jpg';
                }
              }}
              onLoad={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.opacity = '1';
              }}
              style={{ opacity: 0, transition: 'opacity 0.3s ease-in-out' }}
            />
          )}

          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-100"></div>

          {/* Coming Soon Overlay */}
          {isComingSoon && (
            <div className="absolute inset-0 flex items-center justify-center z-30 bg-black bg-opacity-50">
              <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg border border-yellow-300">
                <Clock className="h-5 w-5 inline mr-2" />
                <span className="font-semibold text-sm">Coming Soon</span>
              </div>
            </div>
          )}

          {/* Red Circular Play Button - Center Overlay */}
          {isPlayable && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="bg-red-600 text-white rounded-full p-4 shadow-2xl transform transition-all duration-300 group-hover:scale-110 opacity-100 border-2 border-white">
                <Play className="h-8 w-8 ml-1" fill="currentColor" />
              </div>
            </div>
          )}

          {/* Coming Soon Badge - Top Left */}
          {isComingSoon && (
            <div className="absolute top-2 left-2 z-20 bg-yellow-500 text-white px-2 py-1 rounded-full shadow-md border border-yellow-300">
              <Clock className="h-3 w-3 inline mr-1" />
              <span className="text-xs font-semibold">SOON</span>
            </div>
          )}

          {/* Favorite Button */}
          {showFavoriteButton && (
            <div className="absolute top-3 right-3 z-20">
              <button
                onClick={handleFavoriteClick}
                disabled={favoritesLoading}
                className={`p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors ${
                  favoritesLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title={
                  favoritesError
                    ? favoritesError
                    : !localStorage.getItem('forward_africa_token')
                      ? 'Please log in to add favorites'
                      : !hasInitialized
                        ? 'Click to load favorites'
                        : isFavorited
                          ? 'Remove from favorites'
                          : 'Add to favorites'
                }
              >
                {favoritesLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Heart
                    className={`h-5 w-5 ${
                      favoritesError
                        ? 'text-yellow-500'
                        : !localStorage.getItem('forward_africa_token')
                          ? 'text-gray-500' // Gray when not logged in
                          : !hasInitialized
                            ? 'text-gray-400' // Gray when not initialized
                            : isFavorited
                              ? 'text-red-500 fill-current'
                              : 'text-white'
                    }`}
                  />
                )}
              </button>
              {/* Error Tooltip */}
              {favoritesError && (
                <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-yellow-500 text-white text-xs rounded-lg shadow-lg z-50 max-w-xs">
                  <div className="font-medium">Favorites Error</div>
                  <div className="text-yellow-100">{favoritesError}</div>
                  <div className="absolute bottom-full right-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-yellow-500"></div>
                </div>
              )}
            </div>
          )}

          {/* Course Information */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className={`font-bold text-base leading-tight mb-1 line-clamp-2 ${isComingSoon ? 'text-yellow-100' : 'text-white'}`}>
              {title}
              {isComingSoon && <span className="text-yellow-300 ml-1">⏳</span>}
            </h3>

            {/* Course Description with Tooltip */}
            <div className="relative group">
              <div className="text-sm text-gray-400 line-clamp-1 mb-2">
                {course.description}
              </div>

              {/* Course Description Tooltip - Limited to 10 characters */}
              <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 max-w-xs">
                <div className="font-medium text-white mb-1">{title}</div>
                <div className="text-gray-300 text-xs leading-relaxed">
                  {course.description && course.description.length > 10
                    ? `${course.description.substring(0, 10)}...`
                    : course.description
                  }
                </div>
                <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>

            <div className="flex items-center space-x-2 mb-2">
              {instructorImage.startsWith('http') ? (
                // Use regular img tag for external URLs
                <img
                  src={instructorImage}
                  alt={instructorName}
                  className="w-5 h-5 rounded-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== '/images/placeholder-avatar.jpg') {
                      target.src = '/images/placeholder-avatar.jpg';
                    }
                  }}
                  onLoad={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.opacity = '1';
                  }}
                  style={{ opacity: 0, transition: 'opacity 0.3s ease-in-out' }}
                />
              ) : (
                // Use Next.js Image for local images
                <Image
                  src={instructorImage}
                  alt={instructorName}
                  width={20}
                  height={20}
                  className="w-5 h-5 rounded-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== '/images/placeholder-avatar.jpg') {
                      target.src = '/images/placeholder-avatar.jpg';
                    }
                  }}
                  onLoad={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.opacity = '1';
                  }}
                  style={{ opacity: 0, transition: 'opacity 0.3s ease-in-out' }}
                />
              )}
              <p className="text-gray-300 text-sm font-medium line-clamp-1">{instructorName}</p>
            </div>

            {/* Course Status Indicator */}
            {isComingSoon ? (
              <div className="flex items-center space-x-1 bg-yellow-500/10 px-2 py-1 rounded">
                <Clock className="h-3 w-3 text-yellow-500" />
                <span className="text-yellow-500 text-xs font-medium">Coming Soon</span>
              </div>
            ) : course.lessons && course.lessons.length > 0 ? (
              <div className="flex items-center space-x-1">
                <Play className="h-3 w-3 text-red-500" />
                <span className="text-red-500 text-xs font-medium">
                  {course.lessons.length} Lesson{course.lessons.length !== 1 ? 's' : ''}
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 bg-gray-500/10 px-2 py-1 rounded">
                <AlertTriangle className="h-3 w-3 text-gray-500" />
                <span className="text-gray-500 text-xs font-medium">No Lessons</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;