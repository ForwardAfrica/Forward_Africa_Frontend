import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Filter, ChevronDown, Clock, Star, Users, BookOpen, TrendingUp } from 'lucide-react';
import { Course, Instructor, Category } from '../../types';

interface SearchFilters {
  category: string;
  instructor: string;
  difficulty: string;
  duration: string;
  rating: number;
  price: string;
  language: string;
  tags: string[];
}

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'course' | 'instructor' | 'category' | 'tag';
  relevance: number;
}

interface AdvancedSearchProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  onSuggestionSelect: (suggestion: SearchSuggestion) => void;
  courses: Course[];
  instructors: Instructor[];
  categories: Category[];
  isLoading?: boolean;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  onSuggestionSelect,
  courses,
  instructors,
  categories,
  isLoading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    category: '',
    instructor: '',
    difficulty: '',
    duration: '',
    rating: 0,
    price: '',
    language: '',
    tags: []
  });
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load recent and popular searches from localStorage
  useEffect(() => {
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    const popular = JSON.parse(localStorage.getItem('popularSearches') || '[]');
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');

    setRecentSearches(recent.slice(0, 5));
    setPopularSearches(popular.slice(0, 5));
    setSearchHistory(history.slice(0, 10));
  }, []);

  // Generate search suggestions based on query
  const generateSuggestions = useCallback((query: string): SearchSuggestion[] => {
    if (!query.trim()) return [];

    const lowercaseQuery = query.toLowerCase();
    const suggestions: SearchSuggestion[] = [];

    // Course title suggestions
    courses.forEach(course => {
      if (course.title.toLowerCase().includes(lowercaseQuery)) {
        suggestions.push({
          id: course.id,
          text: course.title,
          type: 'course',
          relevance: course.title.toLowerCase().indexOf(lowercaseQuery)
        });
      }
    });

    // Instructor name suggestions
    instructors.forEach(instructor => {
      if (instructor.name.toLowerCase().includes(lowercaseQuery)) {
        suggestions.push({
          id: instructor.id,
          text: instructor.name,
          type: 'instructor',
          relevance: instructor.name.toLowerCase().indexOf(lowercaseQuery)
        });
      }
    });

    // Category suggestions
    categories.forEach(category => {
      if (category.name.toLowerCase().includes(lowercaseQuery)) {
        suggestions.push({
          id: category.id,
          text: category.name,
          type: 'category',
          relevance: category.name.toLowerCase().indexOf(lowercaseQuery)
        });
      }
    });

    // Tag suggestions (extract from course descriptions and instructor expertise)
    const allTags = new Set<string>();
    courses.forEach(course => {
      const words = course.description.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 3 && word.includes(lowercaseQuery)) {
          allTags.add(word);
        }
      });
    });

    instructors.forEach(instructor => {
      instructor.expertise.forEach(skill => {
        if (skill.toLowerCase().includes(lowercaseQuery)) {
          allTags.add(skill);
        }
      });
    });

    allTags.forEach(tag => {
      suggestions.push({
        id: `tag-${tag}`,
        text: tag,
        type: 'tag',
        relevance: tag.indexOf(lowercaseQuery)
      });
    });

    // Sort by relevance and limit results
    return suggestions
      .sort((a, b) => a.relevance - b.relevance)
      .slice(0, 8);
  }, [courses, instructors, categories]);

  // Update suggestions when query changes
  useEffect(() => {
    const newSuggestions = generateSuggestions(searchQuery);
    setSuggestions(newSuggestions);
    setShowSuggestions(newSuggestions.length > 0 && searchQuery.length > 0);
  }, [searchQuery, generateSuggestions]);

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Update search history
    const newHistory = [searchQuery, ...searchHistory.filter(s => s !== searchQuery)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));

    // Update recent searches
    const newRecent = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('recentSearches', JSON.stringify(newRecent));

    // Perform search
    onSearch(searchQuery, filters);
    setShowSuggestions(false);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.text);
    onSuggestionSelect(suggestion);
    setShowSuggestions(false);
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof SearchFilters, value: string | number | string[]) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    // Auto-search when filters change
    if (searchQuery.trim()) {
      onSearch(searchQuery, newFilters);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
      category: '',
      instructor: '',
      difficulty: '',
      duration: '',
      rating: 0,
      price: '',
      language: '',
      tags: []
    };
    setFilters(clearedFilters);

    if (searchQuery.trim()) {
      onSearch(searchQuery, clearedFilters);
    }
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get unique tags from courses and instructors
  const getAllTags = () => {
    const tags = new Set<string>();
    courses.forEach(course => {
      const words = course.description.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 3 && /^[a-zA-Z]+$/.test(word)) {
          tags.add(word);
        }
      });
    });
    instructors.forEach(instructor => {
      instructor.expertise.forEach(skill => tags.add(skill));
    });
    return Array.from(tags).slice(0, 20);
  };

  const allTags = getAllTags();

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Search Input */}
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>

          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSuggestions(searchQuery.length > 0)}
            placeholder="Search for courses, instructors, topics, or skills..."
            className="w-full pl-12 pr-20 py-4 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-16 flex items-center pr-3"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-white" />
            </button>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="absolute right-2 top-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Filter Toggle */}
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="mt-3 flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
        >
          <Filter className="h-4 w-4" />
          <span>Advanced Filters</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </form>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="mt-4 p-6 bg-gray-800 rounded-lg border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Instructor Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Instructor</label>
              <select
                value={filters.instructor}
                onChange={(e) => handleFilterChange('instructor', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Instructors</option>
                {instructors.map(instructor => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
              <select
                value={filters.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            {/* Duration Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
              <select
                value={filters.duration}
                onChange={(e) => handleFilterChange('duration', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Any Duration</option>
                <option value="0-1">0-1 hour</option>
                <option value="1-3">1-3 hours</option>
                <option value="3-6">3-6 hours</option>
                <option value="6+">6+ hours</option>
              </select>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Minimum Rating</label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleFilterChange('rating', rating)}
                    className={`p-1 rounded ${filters.rating >= rating ? 'text-yellow-400' : 'text-gray-500'}`}
                  >
                    <Star className="h-5 w-5 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            {/* Language Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
              <select
                value={filters.language}
                onChange={(e) => handleFilterChange('language', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Languages</option>
                <option value="english">English</option>
                <option value="french">French</option>
                <option value="spanish">Spanish</option>
                <option value="arabic">Arabic</option>
              </select>
            </div>

            {/* Tags Filter */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {allTags.slice(0, 10).map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      const newTags = filters.tags.includes(tag)
                        ? filters.tags.filter(t => t !== tag)
                        : [...filters.tags, tag];
                      handleFilterChange('tags', newTags);
                    }}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      filters.tags.includes(tag)
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}

      {/* Search Suggestions */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-96 overflow-y-auto"
        >
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Recent Searches
              </h3>
              <div className="space-y-1">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => setSearchQuery(search)}
                    className="w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-md transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular Searches */}
          {popularSearches.length > 0 && (
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Popular Searches
              </h3>
              <div className="space-y-1">
                {popularSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => setSearchQuery(search)}
                    className="w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-md transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center">
                <Search className="h-4 w-4 mr-2" />
                Suggestions
              </h3>
              <div className="space-y-1">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-md transition-colors flex items-center"
                  >
                    {suggestion.type === 'course' && <BookOpen className="h-4 w-4 mr-2 text-blue-400" />}
                    {suggestion.type === 'instructor' && <Users className="h-4 w-4 mr-2 text-green-400" />}
                    {suggestion.type === 'category' && <Star className="h-4 w-4 mr-2 text-yellow-400" />}
                    {suggestion.type === 'tag' && <TrendingUp className="h-4 w-4 mr-2 text-purple-400" />}
                    {suggestion.text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;