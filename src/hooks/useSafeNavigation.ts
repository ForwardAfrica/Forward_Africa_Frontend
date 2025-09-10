import { useRouter } from 'next/router';
import { useCallback } from 'react';

export const useSafeNavigation = () => {
  const router = useRouter();

  const safeNavigate = useCallback((url: string, options?: { replace?: boolean }) => {
    // Prevent navigation if already on the target route
    if (router.asPath === url) {
      console.log('🚫 Navigation blocked - already on target route:', url);
      return;
    }

    console.log('🔄 Safe navigation:', {
      from: router.asPath,
      to: url,
      method: options?.replace ? 'replace' : 'push'
    });

    if (options?.replace) {
      router.replace(url);
    } else {
      router.push(url);
    }
  }, [router]);

  const safeReplace = useCallback((url: string) => {
    safeNavigate(url, { replace: true });
  }, [safeNavigate]);

  const safePush = useCallback((url: string) => {
    safeNavigate(url, { replace: false });
  }, [safeNavigate]);

  return {
    safeNavigate,
    safeReplace,
    safePush,
    currentPath: router.asPath,
    isReady: router.isReady
  };
};