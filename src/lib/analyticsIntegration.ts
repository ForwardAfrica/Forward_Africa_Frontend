// Analytics integration for authentication events
import analyticsTracker from './analytics';

// Start analytics tracking when user logs in
export const startAnalyticsOnLogin = () => {
  try {
    analyticsTracker.onUserLogin();
  } catch (error) {
    console.error('Failed to start analytics on login:', error);
  }
};

// End analytics tracking when user logs out
export const endAnalyticsOnLogout = () => {
  try {
    analyticsTracker.onUserLogout();
  } catch (error) {
    console.error('Failed to end analytics on logout:', error);
  }
};