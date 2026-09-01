/**
 * Centralized API client for the MacroAI FastAPI backend.
 *
 * All requests go through this module so we have a single place for:
 * - Base URL configuration via VITE_API_URL
 * - Error handling
 * - Request timeouts
 * - Typed service methods consumed by every page
 */

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || '';

const DEFAULT_TIMEOUT = 10000;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const resp = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    });

    if (!resp.ok) {
      throw new ApiError(`API error ${resp.status}`, resp.status);
    }

    return await resp.json() as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError('Request timeout', 408);
    }
    throw new ApiError(
      err instanceof Error ? err.message : 'Network error',
      0,
    );
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  delete: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'DELETE', body: JSON.stringify(body) }),
};

export { API_BASE };
