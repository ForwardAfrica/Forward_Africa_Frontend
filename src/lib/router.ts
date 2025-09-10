// Routing utility for Next.js migration
// This provides a compatible interface for React Router hooks

import { useRouter } from 'next/router';
import { useCallback } from 'react';

// Hook to replace useNavigate
export const useNavigate = () => {
  const router = useRouter();

  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    console.log('Router navigate called with:', to, options);
    if (options?.replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }, [router]);

  return navigate;
};

// Hook to replace useParams
export const useParams = <T = Record<string, string>>() => {
  const router = useRouter();
  return router.query as T;
};

// Hook to replace useLocation
export const useLocation = () => {
  const router = useRouter();
  return {
    pathname: router.pathname,
    search: router.asPath.split('?')[1] || '',
    hash: '',
    state: null
  };
};

// Hook to replace useSearchParams
export const useSearchParams = (): [{
  get: (key: string) => string | null;
}, (params: Record<string, string>) => void] => {
  const router = useRouter();

  const searchParams = {
    get: (key: string) => {
      return router.query[key] as string || null;
    }
  };

  const setSearchParams = (params: Record<string, string>) => {
    const newQuery = { ...router.query, ...params };
    router.push({
      pathname: router.pathname,
      query: newQuery
    });
  };

  return [searchParams, setSearchParams];
};