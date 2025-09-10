import React, { useEffect } from 'react';
import Header from './Header';

interface CommunityLayoutProps {
  /** Child components to render in the main content area */
  children: React.ReactNode;
}

/**
 * Community Layout Component
 *
 * Provides layout structure for community pages without footer:
 * - Fixed header with navigation
 * - Main content area with proper spacing
 * - No footer to maximize content space
 *
 * @param {CommunityLayoutProps} props - Component props
 * @param {React.ReactNode} props.children - Child components to render in the main content area
 * @returns {JSX.Element} The community layout component
 */
const CommunityLayout: React.FC<CommunityLayoutProps> = ({ children }) => {
  // Scroll to top when layout mounts (new page loads)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      {/* Fixed header */}
      <Header />

      {/* Main content area with padding for fixed header */}
      <main className="flex-grow pt-16">
        {children}
      </main>
    </div>
  );
};

export default CommunityLayout;