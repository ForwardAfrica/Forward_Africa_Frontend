import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import { FirebaseAuthProvider } from '../src/contexts/FirebaseAuthContext'
import { PermissionProvider } from '../src/contexts/PermissionContext'
import { TokenStatusIndicator } from '../src/components/ui/TokenStatusIndicator'
import GlobalErrorBoundary from '../src/components/ui/GlobalErrorBoundary'
import '../src/index.css'
// Import console storage utilities for global access
import '../src/utils/consoleStorage'

// Firebase Auth Initializer Component
const FirebaseAuthInitializer = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Firebase Auth handles token management automatically
  // No need for manual token refresh setup

  return null;
};

// Client-side only components to prevent hydration issues
const ClientOnlyComponents = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <>
      {/* Token Status Indicator - Only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50">
          <TokenStatusIndicator
            showDetails={true}
            showRefreshButton={true}
            className=""
          />
        </div>
      )}
    </>
  );
};

export default function App({ Component, pageProps }: AppProps) {
  return (
    <GlobalErrorBoundary>
      <FirebaseAuthProvider>
        <PermissionProvider>
          <FirebaseAuthInitializer />
          <Component {...pageProps} />
          <ClientOnlyComponents />
        </PermissionProvider>
      </FirebaseAuthProvider>
    </GlobalErrorBoundary>
  )
}