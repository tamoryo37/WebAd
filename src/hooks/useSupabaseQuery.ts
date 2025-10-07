import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { handleError } from '../utils/errorHandler';
import { logger } from '../utils/logger';

interface UseSupabaseQueryOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
}

export function useSupabaseQuery<T>(
  queryKey: string,
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: UseSupabaseQueryOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { enabled = true, refetchOnMount = true } = options;

  const refetch = async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const result = await queryFn();

      if (result.error) {
        const appError = handleError(result.error);
        setError(appError.message);
        logger.error(`Query error: ${queryKey}`, result.error);
      } else {
        setData(result.data);
      }
    } catch (err) {
      const appError = handleError(err);
      setError(appError.message);
      logger.error(`Query error: ${queryKey}`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (enabled && refetchOnMount) {
      refetch();
    }
  }, [queryKey, enabled]);

  return { data, error, loading, refetch };
}
