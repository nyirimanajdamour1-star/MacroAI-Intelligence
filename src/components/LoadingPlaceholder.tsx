/**
 * LoadingPlaceholder — shows a skeleton/spinner while data loads, and an
 * error/offline banner when the API is unreachable. Used across all pages
 * to keep the UI consistent and never blank.
 */

import { Loader2, WifiOff, RefreshCw, Inbox, AlertCircle, Radio, AlertTriangle } from 'lucide-react';

interface LoadingPlaceholderProps {
  loading: boolean;
  error: string | null;
  offline: boolean;
  lastUpdated: string | null;
  onRetry: () => void;
  height?: string;
}

export function LoadingPlaceholder({
  loading,
  error,
  offline,
  lastUpdated,
  onRetry,
  height = 'h-64',
}: LoadingPlaceholderProps) {
  if (loading && !lastUpdated) {
    return (
      <div className={`flex ${height} items-center justify-center`}>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-accent-400" />
          <p className="text-xs text-slate-500">Loading live data…</p>
        </div>
      </div>
    );
  }

  if (offline && error && lastUpdated) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-warn-500/30 bg-warn-500/5 px-3 py-2">
        <WifiOff className="h-3.5 w-3.5 shrink-0 text-warn-400" />
        <span className="text-xs text-warn-300">
          Offline — showing cached data from {lastUpdated}
        </span>
        <button
          onClick={onRetry}
          className="ml-auto flex items-center gap-1 rounded-md border border-warn-500/30 px-2 py-0.5 text-[10px] font-semibold text-warn-300 transition-colors hover:bg-warn-500/10"
        >
          <RefreshCw className="h-3 w-3" /> Retry
        </button>
      </div>
    );
  }

  return null;
}

/**
 * EmptyState — shown when an API call succeeds but returns no data.
 */
export function EmptyState({ message = 'No data available.' }: { message?: string }) {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-2">
      <Inbox className="h-6 w-6 text-slate-600" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

/**
 * ErrorState — shown when an API call fails and no cached data exists.
 */
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-3">
      <AlertCircle className="h-6 w-6 text-bear-400" />
      <p className="text-sm text-slate-400">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 rounded-lg border border-accent-500/40 bg-accent-500/10 px-3 py-1.5 text-xs font-semibold text-accent-300 transition-colors hover:bg-accent-500/20"
      >
        <RefreshCw className="h-3.5 w-3.5" /> Retry
      </button>
    </div>
  );
}

/**
 * LoadingSpinner — inline spinner for smaller loading areas.
 */
export function LoadingSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex h-40 items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-accent-400" />
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

/**
 * DataStatus — inline status indicator for live data.
 * Renders inline without taking vertical space when everything is fine.
 */
export function DataStatus({
  lastUpdated,
  offline,
  loading,
  onRetry,
}: {
  lastUpdated: string | null;
  offline: boolean;
  loading?: boolean;
  onRetry: () => void;
}) {
  if (loading && !lastUpdated) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-accent-500/30 bg-accent-500/5 px-3 py-1.5">
        <Loader2 className="h-3 w-3 shrink-0 animate-spin text-accent-400" />
        <span className="text-[10px] text-accent-300">Loading — requesting data…</span>
      </div>
    );
  }

  if (offline && lastUpdated) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-warn-500/30 bg-warn-500/5 px-3 py-1.5">
        <AlertTriangle className="h-3 w-3 shrink-0 text-warn-400" />
        <span className="text-[10px] text-warn-300">Stale data — showing last update from {lastUpdated}</span>
        <button
          onClick={onRetry}
          className="ml-auto flex items-center gap-1 rounded-md border border-warn-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-warn-300 transition-colors hover:bg-warn-500/10"
        >
          <RefreshCw className="h-2.5 w-2.5" /> Retry
        </button>
      </div>
    );
  }

  if (offline) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-bear-500/30 bg-bear-500/5 px-3 py-1.5">
        <WifiOff className="h-3 w-3 shrink-0 text-bear-400" />
        <span className="text-[10px] text-bear-300">Offline — backend unavailable</span>
        <button
          onClick={onRetry}
          className="ml-auto flex items-center gap-1 rounded-md border border-bear-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-bear-300 transition-colors hover:bg-bear-500/10"
        >
          <RefreshCw className="h-2.5 w-2.5" /> Retry
        </button>
      </div>
    );
  }

  if (lastUpdated) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
        <Radio className="h-3 w-3 text-bull-400" />
        <span className="h-1.5 w-1.5 rounded-full bg-bull-500 animate-pulse" />
        Live · Updated {lastUpdated}
      </div>
    );
  }

  return null;
}
