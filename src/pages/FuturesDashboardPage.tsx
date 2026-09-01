import { useMemo, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUp,
  ArrowDown,
  Activity,
  BarChart3,
  Target,
  Zap,
  Layers,
  Filter,
} from 'lucide-react';
import type { FutureInstrument } from '@/types';
import { scoreColor, scoreBg, trendColor, directionColor, ratingColor } from '@/utils/format';
import { SeriesChart } from '@/components/Charts';
import Widget from '@/components/Widget';
import { useApiDataWithFallback } from '@/hooks/useApiData';
import { adaptFutureInstruments } from '@/lib/adapters';
import { DataStatus } from '@/components/LoadingPlaceholder';

const FALLBACK_FUTURES: FutureInstrument[] = [];

function signalFromScore(score: number): string {
  if (score >= 75) return 'Strong Buy';
  if (score >= 60) return 'Buy';
  if (score >= 45) return 'Neutral';
  if (score >= 32) return 'Sell';
  return 'Strong Sell';
}

const categoryStyles: Record<FutureInstrument['category'], { icon: typeof Activity; color: string; bg: string }> = {
  Index: { icon: BarChart3, color: 'text-accent-400', bg: 'bg-accent-500/10' },
  Metal: { icon: Layers, color: 'text-warn-400', bg: 'bg-warn-500/10' },
  Energy: { icon: Zap, color: 'text-orange-400', bg: 'bg-orange-500/10' },
};

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toString();
}

function FutureCard({ future, onSelect }: { future: FutureInstrument; onSelect: (f: FutureInstrument) => void }) {
  const TrendIcon = future.trend === 'up' ? TrendingUp : future.trend === 'down' ? TrendingDown : Minus;
  const cat = categoryStyles[future.category];
  const CatIcon = cat.icon;
  const isPositive = future.change >= 0;
  const signal = signalFromScore(future.aiScore);

  return (
    <div
      onClick={() => onSelect(future)}
      className="group cursor-pointer rounded-xl border border-ink-700/60 bg-ink-850 p-4 transition-all duration-200 hover:border-accent-500/40 hover:shadow-glow"
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${cat.bg}`}>
            <CatIcon className={`h-4 w-4 ${cat.color}`} strokeWidth={2} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-100">{future.symbol}</p>
            <p className="text-[11px] text-slate-500">{future.name}</p>
          </div>
        </div>
        <span className={`stat-chip ${ratingColor(signal)}`}>{signal}</span>
      </div>

      {/* Price */}
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="font-mono text-2xl font-bold text-slate-100">
            {future.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs">
            <span className={`flex items-center gap-0.5 font-mono ${isPositive ? 'text-bull-400' : 'text-bear-400'}`}>
              {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {Math.abs(future.change).toFixed(2)}
            </span>
            <span className={`font-mono ${isPositive ? 'text-bull-400' : 'text-bear-400'}`}>
              {isPositive ? '+' : ''}{future.changePct.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1">
            <TrendIcon className={`h-4 w-4 ${trendColor(future.trend)}`} />
            <span className={`text-xs font-medium ${trendColor(future.trend)}`}>
              {future.trend === 'up' ? 'Uptrend' : future.trend === 'down' ? 'Downtrend' : 'Sideways'}
            </span>
          </div>
          <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${directionColor(future.bias)}`}>
            {future.bias}
          </span>
        </div>
      </div>

      {/* AI Score Bar */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-[10px]">
          <span className="font-medium uppercase tracking-wider text-slate-500">AI Score</span>
          <span className={`font-mono font-bold ${scoreColor(future.aiScore)}`}>{future.aiScore.toFixed(0)}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
          <div
            className={`h-full rounded-full transition-all duration-500 ${scoreBg(future.aiScore)}`}
            style={{ width: `${future.aiScore}%` }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
          <span>Confidence {future.confidence}%</span>
          <span>ATR {future.atr.toFixed(2)}</span>
        </div>
      </div>

      {/* Support / Resistance */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-bull-500/20 bg-bull-500/5 px-2.5 py-1.5">
          <p className="text-[9px] font-medium uppercase tracking-wider text-bull-400">Support</p>
          <p className="font-mono text-sm font-semibold text-slate-200">
            {future.support.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-lg border border-bear-500/20 bg-bear-500/5 px-2.5 py-1.5">
          <p className="text-[9px] font-medium uppercase tracking-wider text-bear-400">Resistance</p>
          <p className="font-mono text-sm font-semibold text-slate-200">
            {future.resistance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* OHLC + Volume */}
      <div className="grid grid-cols-4 gap-2 border-t border-ink-700/60 pt-2.5 text-[10px]">
        <div>
          <p className="text-slate-600">Open</p>
          <p className="font-mono text-slate-400">{future.open.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-slate-600">High</p>
          <p className="font-mono text-bull-400">{future.high.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-slate-600">Low</p>
          <p className="font-mono text-bear-400">{future.low.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-slate-600">Vol</p>
          <p className="font-mono text-slate-400">{formatVolume(future.volume)}</p>
        </div>
      </div>
    </div>
  );
}

type FilterCategory = 'All' | 'Index' | 'Metal' | 'Energy';

export default function FuturesDashboardPage() {
  const [filter, setFilter] = useState<FilterCategory>('All');
  const [selected, setSelected] = useState<FutureInstrument | null>(null);

  const { data: futures, loading, lastUpdated, offline, refetch } = useApiDataWithFallback(
    '/api/futures',
    FALLBACK_FUTURES,
    30000,
    adaptFutureInstruments,
  );

  const filtered = useMemo(() => {
    if (filter === 'All') return futures;
    return futures.filter((f) => f.category === filter);
  }, [futures, filter]);

  const avgScore = futures.length > 0 ? futures.reduce((s, f) => s + f.aiScore, 0) / futures.length : 0;
  const buyCount = futures.filter((f) => f.bias === 'buy').length;
  const sellCount = futures.filter((f) => f.bias === 'sell').length;
  const topFuture = futures.length > 0
    ? [...futures].sort((a, b) => b.aiScore - a.aiScore)[0]
    : null;

  return (
    <div className="space-y-5">
      <DataStatus lastUpdated={lastUpdated} offline={offline} loading={loading} onRetry={refetch} />

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-ink-700/60 bg-ink-850 p-3.5">
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-slate-500">
            <Activity className="h-3.5 w-3.5 text-accent-400" />
            Avg AI Score
          </div>
          <p className={`mt-1 font-mono text-2xl font-bold ${scoreColor(avgScore)}`}>{avgScore.toFixed(1)}</p>
        </div>
        <div className="rounded-xl border border-ink-700/60 bg-ink-850 p-3.5">
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-slate-500">
            <TrendingUp className="h-3.5 w-3.5 text-bull-400" />
            Buy Bias
          </div>
          <p className="mt-1 font-mono text-2xl font-bold text-bull-400">{buyCount}</p>
        </div>
        <div className="rounded-xl border border-ink-700/60 bg-ink-850 p-3.5">
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-slate-500">
            <TrendingDown className="h-3.5 w-3.5 text-bear-400" />
            Sell Bias
          </div>
          <p className="mt-1 font-mono text-2xl font-bold text-bear-400">{sellCount}</p>
        </div>
        <div className="rounded-xl border border-ink-700/60 bg-ink-850 p-3.5">
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-slate-500">
            <Target className="h-3.5 w-3.5 text-accent-400" />
            Top Pick
          </div>
          {topFuture ? (
            <>
              <p className="mt-1 text-lg font-bold text-slate-100">{topFuture.symbol}</p>
              <p className="text-[10px] text-slate-500">Score {topFuture.aiScore}</p>
            </>
          ) : (
            <p className="mt-1 text-lg font-bold text-slate-500">—</p>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-slate-500" />
        {(['All', 'Index', 'Metal', 'Energy'] as FilterCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === cat
                ? 'bg-accent-500/20 text-accent-300 border border-accent-500/40'
                : 'border border-ink-700/60 text-slate-400 hover:text-slate-200 hover:border-ink-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((f) => (
          <FutureCard key={f.symbol} future={f} onSelect={setSelected} />
        ))}
      </div>

      {/* Detail chart */}
      {selected && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Widget
            title={`${selected.symbol} Price Chart`}
            subtitle={selected.name}
            className="lg:col-span-2"
          >
            <SeriesChart
              data={selected.history}
              dataKey="price"
              color={selected.trend === 'up' ? '#10b981' : '#ef4444'}
              height={260}
              type="area"
            />
          </Widget>
          <Widget title="Key Levels" subtitle="Support, resistance & ATR">
            <div className="space-y-2.5">
              <LevelRow label="Current Price" value={selected.price} color="text-slate-100" />
              <LevelRow label="Support" value={selected.support} color="text-bull-400" />
              <LevelRow label="Resistance" value={selected.resistance} color="text-bear-400" />
              <LevelRow label="ATR (14)" value={selected.atr} color="text-accent-400" />
              <LevelRow label="Volume" value={selected.volume} color="text-slate-400" isVolume />
              <LevelRow label="Open" value={selected.open} color="text-slate-400" />
              <LevelRow label="Previous Close" value={selected.prevClose} color="text-slate-400" />
              <LevelRow label="AI Confidence" value={selected.confidence} color="text-accent-400" isPct />
            </div>
          </Widget>
        </div>
      )}
    </div>
  );
}

function LevelRow({
  label,
  value,
  color,
  isVolume,
  isPct,
}: {
  label: string;
  value: number;
  color: string;
  isVolume?: boolean;
  isPct?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-ink-700/60 bg-ink-850 px-3 py-2">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`font-mono text-sm font-semibold ${color}`}>
        {isVolume
          ? formatVolume(value)
          : isPct
            ? `${value}%`
            : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </div>
  );
}
