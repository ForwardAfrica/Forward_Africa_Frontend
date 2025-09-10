import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Course } from '../types';

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('forward_africa_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }, []);

  const fetchFavorites = useCallback(async (retry = false) => {
    if (!user?.id) {
      console.log('No user ID available, skipping favorites fetch');
      setError('Please log in to view your favorites');
      setLoading(false);
      return;
    }

    // Check if user has a valid token
    const token = localStorage.getItem('forward_africa_token');
    if (!token) {
      console.log('No authentication token found');
      setError('Please log in to view your favorites');
      setLoading(false);
      return;
    }

    if (retry) {
      setRetryCount(prev => prev + 1);
    } else {
      setRetryCount(0);
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching favorites from:', `${API_BASE_URL}/api/favorites`);

      const response = await fetch(`${API_BASE_URL}/api/favorites`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include', // Include cookies if needed
      });

      console.log('Favorites response status:', response.status);
      console.log('Favorites response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Favorites API error response:', errorText);

        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. You may not have permission to view favorites.');
        } else if (response.status === 404) {
          throw new Error('Favorites endpoint not found. Please check the API configuration.');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(`Failed to fetch favorites: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log('Favorites data received:', data);

      if (Array.isArray(data)) {
        setFavorites(data);
      } else {
        console.warn('Unexpected favorites data format:', data);
        setFavorites([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch favorites';
      setError(errorMessage);
      console.error('Error fetching favorites:', err);

      // Only retry on network errors, not server errors or auth errors
      const shouldRetry = retryCount < 2 &&
        !errorMessage.includes('Authentication') &&
        !errorMessage.includes('Access denied') &&
        !errorMessage.includes('Server error') &&
        !errorMessage.includes('endpoint not found') &&
        !errorMessage.includes('Please log in');

      if (shouldRetry) {
        console.log(`Retrying favorites fetch (attempt ${retryCount + 1})...`);
        setTimeout(() => fetchFavorites(true), 1000 * (retryCount + 1));
      } else {
        console.log('Not retrying due to error type or max retries reached');
      }
    } finally {
      setLoading(false);
      setHasInitialized(true);
    }
  }, [user?.id, getAuthHeaders, retryCount]);

  const addToFavorites = useCallback(async (courseId: string) => {
    if (!user?.id) {
      setError('User not authenticated');
      return false;
    }

    try {
      setError(null);
      console.log('Adding course to favorites:', courseId);

      const response = await fetch(`${API_BASE_URL}/api/favorites`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ course_id: courseId }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Add to favorites error response:', errorText);

        if (response.status === 400) {
          throw new Error('Course is already in your favorites');
        } else if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        } else if (response.status === 404) {
          throw new Error('Course not found');
        } else {
          throw new Error(`Failed to add to favorites: ${response.status}`);
        }
      }

      const result = await response.json();
      console.log('Add to favorites success:', result);

      // Refresh favorites list after adding
      await fetchFavorites();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add to favorites';
      setError(errorMessage);
      console.error('Error adding to favorites:', err);
      return false;
    }
  }, [user?.id, getAuthHeaders, fetchFavorites]);

  const removeFromFavorites = useCallback(async (courseId: string) => {
    if (!user?.id) {
      setError('User not authenticated');
      return false;
    }

    try {
      setError(null);
      console.log('Removing course from favorites:', courseId);

      const response = await fetch(`${API_BASE_URL}/api/favorites/${courseId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Remove from favorites error response:', errorText);

        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        } else if (response.status === 404) {
          throw new Error('Course not found in favorites');
        } else {
          throw new Error(`Failed to remove from favorites: ${response.status}`);
        }
      }

      const result = await response.json();
      console.log('Remove from favorites success:', result);

      // Refresh favorites list after removing
      await fetchFavorites();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove from favorites';
      setError(errorMessage);
      console.error('Error removing from favorites:', err);
      return false;
    }
  }, [user?.id, getAuthHeaders, fetchFavorites]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const retryFetch = useCallback(() => {
    fetchFavorites(true);
  }, [fetchFavorites]);

  // Only fetch favorites when user logs in, not on every mount
  useEffect(() => {
    if (user?.id && !hasInitialized) {
      // Don't automatically fetch - wait for user interaction
      console.log('User logged in, but waiting for explicit favorites fetch');
    } else if (!user?.id) {
      // Clear favorites when user logs out
      setFavorites([]);
      setError(null);
      setHasInitialized(false);
    }
  }, [user?.id, hasInitialized]);

  return {
    favorites,
    loading,
    error,
    addToFavorites,
    removeFromFavorites,
    fetchFavorites,
    clearError,
    retryFetch,
    retryCount,
    hasInitialized
  };
};