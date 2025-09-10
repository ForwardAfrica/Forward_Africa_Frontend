/**
 * CategoryRow Component
 *
 * Displays a horizontal scrollable row of courses for a specific category.
 * Features smooth scrolling navigation and responsive layout.
 *
 * Features:
 * - Horizontal scrolling with navigation buttons
 * - Responsive grid layout
 * - Dynamic card sizing
 * - Smooth scroll behavior
 * - Show/hide navigation on hover
 *
 * @component
 * @example
 * ```tsx
 * <CategoryRow
 *   title="Featured Courses"
 *   courses={featuredCourses}
 * />
 * ```
 */

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Course } from '../../types';
import CourseCard from './CourseCard';

interface CategoryRowProps {
  /** Title displayed above the course row */
  title: string;
  /** Array of courses to display */
  courses: Course[];
}

const CategoryRow: React.FC<CategoryRowProps> = ({ title, courses }) => {
  const rowRef = useRef<HTMLDivElement>(null);



  /**
   * Handles horizontal scrolling of the course row
   * @param direction - Direction to scroll ('left' or 'right')
   */
  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left'
        ? scrollLeft - clientWidth
        : scrollLeft + clientWidth;

      rowRef.current.scrollTo({
        left: scrollTo,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="mb-6">
      <h2 className="text-white text-lg font-medium mb-3 px-4">{title}</h2>

      <div className="group relative">
        {/* Navigation Buttons */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 z-10 -translate-y-1/2 bg-black/50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 ml-1"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5 text-white" />
        </button>

        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 z-10 -translate-y-1/2 bg-black/50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 mr-1"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5 text-white" />
        </button>

        {/* Scrollable Course Container */}
        <div
          ref={rowRef}
          className="grid grid-flow-col auto-cols-[45%] sm:auto-cols-[30%] md:auto-cols-[22%] lg:auto-cols-[18%] xl:auto-cols-[15%] gap-8 overflow-x-scroll scrollbar-hide px-4 py-1 card-grid-container"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
                  {courses.map((course) => {
          return (
              <div key={course.id}>
                <CourseCard course={course} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryRow;