// Token debugging utility
export const tokenDebugger = {
  // Check if token exists
  checkToken: () => {
    if (typeof window === 'undefined') {
      console.log('🔍 Token Debug: Running on server side');
      return null;
    }

    const token = localStorage.getItem('forward_africa_token');
    const user = localStorage.getItem('forward_africa_user');

    console.log('🔍 Token Debug Info:');
    console.log('  - Token exists:', !!token);
    console.log('  - Token length:', token?.length || 0);
    console.log('  - User data exists:', !!user);

    if (user) {
      try {
        const userData = JSON.parse(user);
        console.log('  - User role:', userData.role);
        console.log('  - User email:', userData.email);
      } catch (error) {
        console.log('  - User data parse error:', error);
      }
    }

    return token;
  },

  // Clear all auth data
  clearAuthData: () => {
    if (typeof window === 'undefined') return;

    localStorage.removeItem('forward_africa_token');
    localStorage.removeItem('forward_africa_user');
    console.log('🧹 Token Debug: Auth data cleared');
  },

  // List all localStorage items
  listAllStorage: () => {
    if (typeof window === 'undefined') return;

    console.log('📋 Token Debug: All localStorage items:');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        console.log(`  - ${key}: ${value?.substring(0, 50)}${value && value.length > 50 ? '...' : ''}`);
      }
    }
  }
};

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).tokenDebugger = tokenDebugger;
}