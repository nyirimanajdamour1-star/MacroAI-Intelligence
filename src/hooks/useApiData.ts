/**
 * useApiData — a data-fetching hook with auto-refresh, caching, and graceful
 * error handling.
 *
 * Features:
 * - Polls the API at a configurable interval (Phase 10)
 * - Falls back to cached data on error (Phase 11)
 * - Exposes loading, error, and retry state (Phase 11)
 * - Never crashes the component (Phase 11)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { api, ApiError } from '@/lib/api';

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  offline: boolean;
  refetch: () => void;
}

export function useApiData<T>(
  path: string | null,
  intervalMs: number = 0,
  transform?: (raw: any) => T,
): ApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const cacheRef = useRef<T | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!path) {
      setLoading(false);
      return;
    }

    try {
      const raw = await api.get<unknown>(path);
      if (!mountedRef.current) return;

      const transformed = transform ? transform(raw) : (raw as T);
      cacheRef.current = transformed;
      setData(transformed);
      setError(null);
      setOffline(false);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      if (!mountedRef.current) return;

      const message = err instanceof ApiError ? err.message : 'Failed to fetch data';
      setError(message);
      setOffline(true);

      // Keep showing cached data if we have it
      if (cacheRef.current) {
        setData(cacheRef.current);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [path, transform]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    let interval: ReturnType<typeof setInterval> | undefined;
    if (intervalMs > 0) {
      interval = setInterval(fetchData, intervalMs);
    }

    return () => {
      mountedRef.current = false;
      if (interval) clearInterval(interval);
    };
  }, [fetchData, intervalMs, retryCount]);

  const refetch = useCallback(() => {
    setLoading(true);
    setRetryCount((c) => c + 1);
  }, []);

  return { data, loading, error, lastUpdated, offline, refetch };
}

/**
 * useApiDataWithFallback — same as useApiData but returns a fallback value
 * (e.g. mock data) when the API is unavailable and no cache exists yet.
 * This ensures the UI always has data to render.
 */
export function useApiDataWithFallback<T>(
  path: string | null,
  fallback: T,
  intervalMs: number = 0,
  transform?: (raw: any) => T,
): ApiState<T> & { data: T } {
  const state = useApiData<T>(path, intervalMs, transform);

  // Use fallback when no data yet (loading or error with no cache)
  const effectiveData = state.data ?? fallback;

  return {
    ...state,
    data: effectiveData,
  };
}
