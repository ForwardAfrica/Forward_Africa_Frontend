// Auth Usage Examples
// How to use the enhanced authentication context with token refresh

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTokenRefresh } from '../../hooks/useTokenRefresh';
import { apiClient } from '../../lib/authInterceptor';

// Example 1: Basic Authentication Usage
export const BasicAuthExample: React.FC = () => {
  const { user, isAuthenticated, signIn, signOut, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await signIn({ email, password });
      console.log('✅ Login successful');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      console.log('✅ Logout successful');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading) return <div>Loading...</div>;

  if (isAuthenticated) {
    return (
      <div className="p-4 border rounded">
        <h2 className="text-xl font-bold mb-4">Welcome, {user?.full_name}!</h2>
        <p className="mb-4">Email: {user?.email}</p>
        <p className="mb-4">Role: {user?.role}</p>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded">
      <h2 className="text-xl font-bold mb-4">Login</h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e?.target?.value || '')}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e?.target?.value || '')}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Login
        </button>
      </form>
    </div>
  );
};

interface ProtectedData {
  id: string;
  content: string;
  timestamp: string;
  [key: string]: unknown;
}

// Example 2: Protected Component with Token Refresh
export const ProtectedComponentExample: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { tokenStatus, refreshState, refreshToken } = useTokenRefresh();
  const [data, setData] = useState<ProtectedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Set client flag on mount to prevent hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  const timeUntilExpiry = tokenStatus.expiryTime
    ? Math.max(0, Math.floor((tokenStatus.expiryTime - Date.now()) / 1000))
    : null;

  const fetchProtectedData = async () => {
    if (!isAuthenticated) {
      setError('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'}/protected-data`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('forward_africa_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Don't render anything until client-side hydration is complete
  if (!isClient) {
    return null;
  }

  return (
    <div className="p-4 border rounded">
      <h2 className="text-xl font-bold mb-4">Protected Component Example</h2>

      {/* Authentication Status */}
      <div className="mb-4 p-3 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">Authentication Status:</h3>
        <div className="text-sm space-y-1">
          <div>Is Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
          <div>User: {user?.email || 'Not logged in'}</div>
        </div>
      </div>

      {/* Token Status Display */}
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">Token Status:</h3>
        <div className="text-sm space-y-1">
          <div>Status: {tokenStatus.isExpired ? 'Expired' : tokenStatus.shouldRefresh ? 'Expiring Soon' : 'Valid'}</div>
          <div>Time Until Expiry: {timeUntilExpiry || 'Unknown'}</div>
          <div>Is Refreshing: {refreshState.isRefreshing ? 'Yes' : 'No'}</div>
          <div>Refresh Count: {refreshState.refreshCount}</div>
        </div>

        {tokenStatus.shouldRefresh && !refreshState.isRefreshing && (
          <button
            onClick={refreshToken}
            className="mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            Refresh Token
          </button>
        )}
      </div>

      {/* User Data */}
      <div className="mb-4">
        <h3 className="font-semibold mb-2">User Information:</h3>
        <div className="text-sm space-y-1">
          <div>Name: {user?.full_name}</div>
          <div>Email: {user?.email}</div>
          <div>Role: {user?.role}</div>
        </div>
      </div>

      {/* Protected Data */}
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Protected Data:</h3>
        {loading && <div>Loading...</div>}
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {data && (
          <div className="text-sm">
            <pre className="bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
        <button
          onClick={fetchProtectedData}
          disabled={loading}
          className="mt-2 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh Data'}
        </button>
      </div>
    </div>
  );
};

// Example 3: Token Expiration Handler
export const TokenExpirationHandlerExample: React.FC = () => {
  const { signOut } = useAuth();
  const { tokenStatus, refreshToken } = useTokenRefresh();
  const [lastAction, setLastAction] = useState('');
  const [isClient, setIsClient] = useState(false);

  // Set client flag on mount to prevent hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (tokenStatus.isExpired && tokenStatus.isAuthenticated) {
      console.log('⚠️ Token expired, attempting refresh...');
      setLastAction('Token expired, attempting refresh...');

      refreshToken().then((success) => {
        if (success) {
          setLastAction('Token refreshed successfully');
        } else {
          setLastAction('Token refresh failed, logging out...');
          signOut();
        }
      });
    }
  }, [tokenStatus.isExpired, tokenStatus.isAuthenticated, refreshToken, signOut]);

  // Don't render anything until client-side hydration is complete
  if (!isClient) {
    return null;
  }

  return (
    <div className="p-4 border rounded">
      <h2 className="text-xl font-bold mb-4">Token Expiration Handler</h2>

      <div className="space-y-2">
        <div className="text-sm">
          <strong>Token Status:</strong> {tokenStatus.isExpired ? 'Expired' : 'Valid'}
        </div>
        <div className="text-sm">
          <strong>Should Refresh:</strong> {tokenStatus.shouldRefresh ? 'Yes' : 'No'}
        </div>
        <div className="text-sm">
          <strong>Last Action:</strong> {lastAction || 'None'}
        </div>
      </div>

      {tokenStatus.isExpired && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
          <h3 className="font-semibold text-red-800">Token Expired</h3>
          <p className="text-red-700 text-sm">
            Your session has expired. The system will attempt to refresh your token automatically.
          </p>
        </div>
      )}
    </div>
  );
};

// Example 4: Automatic Token Refresh with API Calls
export const AutomaticTokenRefreshExample: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [apiCalls, setApiCalls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const makeApiCall = async (endpoint: string) => {
    setLoading(true);
    const timestamp = new Date().toLocaleTimeString();

    try {
      const response = await apiClient.get(endpoint);
      setApiCalls(prev => [...(prev || []), `${timestamp}: ${endpoint} - Success`]);
      return response.data;
    } catch (error) {
      setApiCalls(prev => [...(prev || []), `${timestamp}: ${endpoint} - Failed: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleMultipleCalls = async () => {
    setApiCalls([]);

    const calls = ['/auth/me', '/users', '/system/status'];

    for (const endpoint of calls) {
      try {
        await makeApiCall(endpoint);
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to call ${endpoint}:`, error);
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-4 border rounded bg-yellow-50">
        <h2 className="text-lg font-semibold text-yellow-800">Authentication Required</h2>
        <p className="text-yellow-700">Please login to test automatic token refresh.</p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded">
      <h2 className="text-xl font-bold mb-4">Automatic Token Refresh</h2>

      <div className="mb-4">
        <button
          onClick={handleMultipleCalls}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Making API Calls...' : 'Make Multiple API Calls'}
        </button>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold mb-2">Individual API Calls:</h3>
        <div className="space-x-2">
          <button
            onClick={() => makeApiCall('/auth/me')}
            disabled={loading}
            className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50"
          >
            Get Profile
          </button>
          <button
            onClick={() => makeApiCall('/users')}
            disabled={loading}
            className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50"
          >
            Get Users
          </button>
          <button
            onClick={() => makeApiCall('/system/status')}
            disabled={loading}
            className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50"
          >
            Get System Status
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">API Call Log:</h3>
        <div className="bg-gray-100 p-3 rounded max-h-40 overflow-y-auto">
          {apiCalls.length === 0 ? (
            <div className="text-gray-500 text-sm">No API calls made yet.</div>
          ) : (
            <div className="space-y-1">
              {apiCalls?.map((call, index) => (
                <div key={index} className="text-sm font-mono">
                  {call}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main component with navigation
export const AuthUsageExamples: React.FC = () => {
  const [activeExample, setActiveExample] = useState(1);

  const examples = [
    { id: 1, name: 'Basic Authentication', component: BasicAuthExample },
    { id: 2, name: 'Protected Component', component: ProtectedComponentExample },
    { id: 3, name: 'Token Expiration Handler', component: TokenExpirationHandlerExample },
    { id: 4, name: 'Automatic Token Refresh', component: AutomaticTokenRefreshExample },
  ];

  const ActiveComponent = examples?.find(ex => ex.id === activeExample)?.component || BasicAuthExample;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Authentication Usage Examples</h1>

      {/* Navigation */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {examples?.map((example) => (
            <button
              key={example.id}
              onClick={() => setActiveExample(example.id)}
              className={`px-4 py-2 rounded text-sm font-medium ${
                activeExample === example.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {example.name}
            </button>
          ))}
        </div>
      </div>

      {/* Active Example */}
      <div className="border rounded-lg">
        <ActiveComponent />
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">How to Use These Examples:</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
          <li>Import the authentication context: <code>import {'{ useAuth }'} from &apos;../contexts/AuthContext&apos;</code></li>
          <li>Import the token refresh hook: <code>import {'{ useTokenRefresh }'} from &apos;../hooks/useTokenRefresh&apos;</code></li>
          <li>Use the API client for automatic token refresh: <code>import {'{ apiClient }'} from &apos;../lib/authInterceptor&apos;</code></li>
          <li>Wrap your app with AuthProvider in your main App component</li>
          <li>Use the hooks and components as shown in the examples above</li>
        </ol>
      </div>
    </div>
  );
};

export default AuthUsageExamples;