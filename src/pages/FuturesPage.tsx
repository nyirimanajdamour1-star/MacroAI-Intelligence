import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { futuresInstruments } from '@/data/extendedData';
import { scoreColor, scoreBg, directionColor, trendColor } from '@/utils/format';
import { SeriesChart } from '@/components/Charts';
import { DataStatus } from '@/components/LoadingPlaceholder';
import { useApiDataWithFallback } from '@/hooks/useApiData';
import type { FutureInstrument } from '@/types';

type Category = 'All' | 'Index' | 'Metal' | 'Energy';

function adaptFutures(raw: any): FutureInstrument[] {
  if (!Array.isArray(raw)) return futuresInstruments;
  return raw.map((d: any) => ({
    symbol: d.symbol ?? d.ticker ?? '',
    name: d.name ?? d.symbol ?? '',
    category: d.category ?? 'Index',
    price: Number(d.price ?? 0),
    change: Number(d.change ?? 0),
    changePct: Number(d.change_pct ?? d.changePct ?? 0),
    trend: d.trend ?? 'flat',
    aiScore: Number(d.ai_score ?? d.aiScore ?? 50),
    bias: d.bias ?? 'neutral',
    confidence: Number(d.confidence ?? 50),
    support: Number(d.support ?? 0),
    resistance: Number(d.resistance ?? 0),
    atr: Number(d.atr ?? 0),
    volume: Number(d.volume ?? 0),
    high: Number(d.high ?? 0),
    low: Number(d.low ?? 0),
    open: Number(d.open ?? 0),
    prevClose: Number(d.prev_close ?? d.prevClose ?? 0),
    history: d.history ?? [],
  }));
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toLocaleString();
}

function formatPrice(p: number): string {
  if (p >= 10000) return p.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (p >= 100) return p.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  return p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function categoryColor(cat: string): string {
  return cat === 'Index' ? 'text-accent-400 bg-accent-500/10'
    : cat === 'Metal' ? 'text-amber-400 bg-amber-500/10'
    : 'text-orange-400 bg-orange-500/10';
}

export default function FuturesPage() {
  const [category, setCategory] = useState<Category>('All');
  const [selected, setSelected] = useState<FutureInstrument | null>(null);

  const { data: futures, loading, lastUpdated, offline, refetch } = useApiDataWithFallback(
    '/api/futures',
    futuresInstruments,
    30000,
    adaptFutures,
  );

  const filtered = category === 'All'
    ? futures
    : futures.filter((f) => f.category === category);

  const selectedInstrument = selected ?? filtered[0] ?? futures[0];

  return (
    <div className="space-y-5">
      <DataStatus lastUpdated={lastUpdated} offline={offline} loading={loading} onRetry={refetch} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Futures Dashboard</h2>
          <p className="text-sm text-slate-500">Multi-asset futures with AI scoring, bias, and key levels</p>
        </div>
        <div className="flex rounded-lg border border-ink-700/60 bg-ink-850 p-0.5">
          {(['All', 'Index', 'Metal', 'Energy'] as Category[]).map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${category === c ? 'bg-ink-700 text-slate-200' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((f) => {
          const TrendIcon = f.trend === 'up' ? TrendingUp : f.trend === 'down' ? TrendingDown : Minus;
          const isSelected = selectedInstrument?.symbol === f.symbol;
          return (
            <button
              key={f.symbol}
              onClick={() => setSelected(f)}
              className={`card card-hover p-4 text-left ${isSelected ? 'border-accent-500/60 shadow-glow' : ''}`}
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100">{f.symbol}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${categoryColor(f.category)}`}>{f.category}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">{f.name}</p>
                </div>
                <TrendIcon className={`h-4 w-4 shrink-0 ${trendColor(f.trend)}`} strokeWidth={2.5} />
              </div>

              <div className="mb-3 flex items-end justify-between">
                <div>
                  <span className="font-mono text-2xl font-bold text-slate-100">{formatPrice(f.price)}</span>
                  <div className={`text-xs font-mono ${f.change >= 0 ? 'text-bull-400' : 'text-bear-400'}`}>
                    {f.change >= 0 ? '+' : ''}{f.change.toFixed(2)} ({f.changePct >= 0 ? '+' : ''}{f.changePct.toFixed(2)}%)
                  </div>
                </div>
                <div className="text-right">
                  <span className={`font-mono text-2xl font-bold ${scoreColor(f.aiScore)}`}>{f.aiScore.toFixed(0)}</span>
                  <span className={`ml-1.5 rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${directionColor(f.bias)}`}>{f.bias}</span>
                </div>
              </div>

              <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-ink-700">
                <div className={`h-full rounded-full ${scoreBg(f.aiScore)}`} style={{ width: `${f.aiScore}%` }} />
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Support</span>
                  <span className="font-mono text-slate-300">{formatPrice(f.support)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Resistance</span>
                  <span className="font-mono text-slate-300">{formatPrice(f.resistance)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">ATR</span>
                  <span className="font-mono text-slate-300">{formatPrice(f.atr)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Volume</span>
                  <span className="font-mono text-slate-300">{formatVolume(f.volume)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">High</span>
                  <span className="font-mono text-bull-400">{formatPrice(f.high)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Low</span>
                  <span className="font-mono text-bear-400">{formatPrice(f.low)}</span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-ink-700/40 pt-2 text-[11px] text-slate-500">
                <span>Confidence: <span className="text-slate-300">{f.confidence}%</span></span>
                <span>Open: <span className="font-mono text-slate-300">{formatPrice(f.open)}</span></span>
              </div>
            </button>
          );
        })}
      </div>

      {selectedInstrument && (
        <div className="card card-hover p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                {selectedInstrument.symbol} — {selectedInstrument.name}
              </h3>
              <p className="text-[11px] text-slate-500">30-day price history</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-500">AI Score: <span className={`font-mono font-bold ${scoreColor(selectedInstrument.aiScore)}`}>{selectedInstrument.aiScore.toFixed(0)}</span></span>
              <span className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${directionColor(selectedInstrument.bias)}`}>{selectedInstrument.bias}</span>
            </div>
          </div>
          <SeriesChart
            data={selectedInstrument.history}
            dataKey="price"
            color="#3b82f6"
            height={240}
          />
        </div>
      )}
    </div>
  );
}
