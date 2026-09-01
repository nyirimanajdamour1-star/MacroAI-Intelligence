import { useMemo, useState } from 'react';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Filter,
  Gauge,
  Minus,
  Radar,
  RefreshCw,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
  Coins,
  BarChart3,
  Layers,
  Flame,
} from 'lucide-react';
import type { AssetClass, ScanResult, Signal, Trend } from '@/types';
import { scoreColor, scoreBg, trendColor } from '@/utils/format';
import { signalColor } from '@/data/extendedData';
import { SeriesChart } from '@/components/Charts';
import { useApiDataWithFallback } from '@/hooks/useApiData';
import { adaptScanResults } from '@/lib/adapters';
import { DataStatus } from '@/components/LoadingPlaceholder';

const assetClassMeta: Record<AssetClass, { icon: typeof Activity; color: string; bg: string }> = {
  Forex: { icon: Coins, color: 'text-accent-400', bg: 'bg-accent-500/10' },
  Index: { icon: BarChart3, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  Metal: { icon: Layers, color: 'text-warn-400', bg: 'bg-warn-500/10' },
  Energy: { icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/10' },
};

const signalOrder: Record<Signal, number> = {
  'Strong Buy': 5,
  Buy: 4,
  Neutral: 3,
  Sell: 2,
  'Strong Sell': 1,
};

const trendOrder: Record<Trend, number> = { up: 3, flat: 2, down: 1 };

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === 'up') return <TrendingUp className="h-3.5 w-3.5" />;
  if (trend === 'down') return <TrendingDown className="h-3.5 w-3.5" />;
  return <Minus className="h-3.5 w-3.5" />;
}

function ScoreBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`font-mono text-sm font-bold ${scoreColor(value)}`}>{value}</span>
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-ink-700">
        <div className={`h-full rounded-full ${scoreBg(value)}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Sparkline({ data, trend }: { data: { date: string; value: number }[]; trend: Trend }) {
  const color = trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#fbbf24';
  return (
    <div className="h-8 w-20">
      <SeriesChart data={data} dataKey="value" color={color} height={32} type="area" />
    </div>
  );
}

function volColor(vol: ScanResult['volatility']): string {
  if (vol === 'Very High') return 'text-bear-400 bg-bear-500/10';
  if (vol === 'High') return 'text-orange-400 bg-orange-500/10';
  if (vol === 'Medium') return 'text-warn-400 bg-warn-500/10';
  return 'text-bull-400 bg-bull-500/10';
}

type SortKey = 'rank' | 'symbol' | 'assetClass' | 'aiScore' | 'signal' | 'confidence' | 'trend' | 'momentum' | 'changePct' | 'riskReward' | 'price';
type SortDir = 'asc' | 'desc';
type FilterClass = 'All' | AssetClass;
type FilterSignal = 'All' | Signal;

const FALLBACK: ScanResult[] = [];

export default function AIMarketScannerPage() {
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [filterClass, setFilterClass] = useState<FilterClass>('All');
  const [filterSignal, setFilterSignal] = useState<FilterSignal>('All');
  const [selected, setSelected] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);

  const { data: scanData, lastUpdated, offline, refetch } = useApiDataWithFallback(
    '/api/scan',
    FALLBACK,
    30000,
    adaptScanResults,
  );

  const handleRescan = () => {
    setScanning(true);
    refetch();
    setTimeout(() => setScanning(false), 1200);
  };

  const filtered = useMemo(() => {
    let rows = scanData;
    if (filterClass !== 'All') rows = rows.filter((r) => r.assetClass === filterClass);
    if (filterSignal !== 'All') rows = rows.filter((r) => r.signal === filterSignal);
    return rows;
  }, [scanData, filterClass, filterSignal]);

  const sorted = useMemo(() => {
    const rows = [...filtered];
    rows.sort((a, b) => {
      let av: number | string;
      let bv: number | string;
      if (sortKey === 'signal') {
        av = signalOrder[a.signal];
        bv = signalOrder[b.signal];
      } else if (sortKey === 'trend') {
        av = trendOrder[a.trend];
        bv = trendOrder[b.trend];
      } else {
        av = a[sortKey];
        bv = b[sortKey];
      }
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return rows;
  }, [filtered, sortKey, sortDir]);

  const summary = useMemo(() => {
    const total = scanData.length;
    const buys = scanData.filter((r) => r.signal === 'Strong Buy' || r.signal === 'Buy').length;
    const sells = scanData.filter((r) => r.signal === 'Strong Sell' || r.signal === 'Sell').length;
    const avgScore = total > 0 ? scanData.reduce((s, r) => s + r.aiScore, 0) / total : 0;
    const topPick = [...scanData].sort((a, b) => b.aiScore - a.aiScore)[0];
    return { total, buys, sells, avgScore, topPick };
  }, [scanData]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'rank' || key === 'symbol' ? 'asc' : 'desc');
    }
  };

  const SortHeader = ({ label, k, align = 'left' }: { label: string; k: SortKey; align?: 'left' | 'center' | 'right' }) => {
    const active = sortKey === k;
    return (
      <th
        className={`cursor-pointer select-none px-3 py-2.5 font-medium transition-colors hover:text-slate-300 ${
          align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
        } ${active ? 'text-accent-300' : 'text-slate-500'}`}
        onClick={() => toggleSort(k)}
      >
        <span className={`inline-flex items-center gap-1 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
          {label}
          {active ? (
            sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3 opacity-0" />
          )}
        </span>
      </th>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radar className="h-5 w-5 text-accent-400" />
          <div>
            <h2 className="text-lg font-bold text-slate-100">AI Market Scanner</h2>
            <p className="text-sm text-slate-500">Cross-asset scan ranking every instrument by composite AI opportunity score</p>
          </div>
        </div>
        <button
          onClick={handleRescan}
          disabled={scanning}
          className="flex items-center gap-1.5 rounded-lg border border-accent-500/40 bg-accent-500/10 px-3 py-1.5 text-xs font-semibold text-accent-300 transition-colors hover:bg-accent-500/20 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'Scanning...' : 'Rescan'}
        </button>
      </div>

      <DataStatus lastUpdated={lastUpdated} offline={offline} onRetry={refetch} />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div className="card relative overflow-hidden p-4">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-accent-500" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Instruments Scanned</p>
              <p className="mt-1.5 font-mono text-2xl font-bold text-slate-100">{summary.total}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/10">
              <Activity className="h-4 w-4 text-accent-400" />
            </div>
          </div>
        </div>
        <div className="card relative overflow-hidden p-4">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-bull-500" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Buy Signals</p>
              <p className="mt-1.5 font-mono text-2xl font-bold text-bull-400">{summary.buys}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bull-500/10">
              <ArrowUp className="h-4 w-4 text-bull-400" />
            </div>
          </div>
        </div>
        <div className="card relative overflow-hidden p-4">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-bear-500" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Sell Signals</p>
              <p className="mt-1.5 font-mono text-2xl font-bold text-bear-400">{summary.sells}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bear-500/10">
              <ArrowDown className="h-4 w-4 text-bear-400" />
            </div>
          </div>
        </div>
        <div className="card relative overflow-hidden p-4">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-warn-500" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Avg AI Score</p>
              <p className={`mt-1.5 font-mono text-2xl font-bold ${scoreColor(summary.avgScore)}`}>{summary.avgScore.toFixed(1)}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warn-500/10">
              <Gauge className="h-4 w-4 text-warn-400" />
            </div>
          </div>
        </div>
        <div className="card relative overflow-hidden p-4">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-accent-500" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Top Pick</p>
              <p className="mt-1.5 text-lg font-bold text-slate-100">{summary.topPick?.symbol ?? '—'}</p>
              <p className="text-[10px] text-slate-500">Score {summary.topPick?.aiScore ?? '—'}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/10">
              <Target className="h-4 w-4 text-accent-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-slate-500" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Asset:</span>
        {(['All', 'Forex', 'Index', 'Metal', 'Energy'] as FilterClass[]).map((c) => (
          <button
            key={c}
            onClick={() => setFilterClass(c)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filterClass === c
                ? 'bg-accent-500/20 text-accent-300 border border-accent-500/40'
                : 'border border-ink-700/60 text-slate-400 hover:text-slate-200 hover:border-ink-600'
            }`}
          >
            {c}
          </button>
        ))}
        <span className="ml-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Signal:</span>
        {(['All', 'Strong Buy', 'Buy', 'Neutral', 'Sell', 'Strong Sell'] as FilterSignal[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilterSignal(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filterSignal === s
                ? 'bg-accent-500/20 text-accent-300 border border-accent-500/40'
                : 'border border-ink-700/60 text-slate-400 hover:text-slate-200 hover:border-ink-600'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Scanner table */}
      <div className="card overflow-hidden">
        <div className="border-b border-ink-700/60 px-4 py-2.5">
          <p className="section-title">Scan Results — {sorted.length} Instruments</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-700/60 text-xs uppercase tracking-wider">
                <SortHeader label="Rank" k="rank" align="center" />
                <SortHeader label="Symbol" k="symbol" />
                <SortHeader label="Class" k="assetClass" />
                <SortHeader label="Price" k="price" align="right" />
                <SortHeader label="Chg%" k="changePct" align="right" />
                <SortHeader label="AI Score" k="aiScore" align="center" />
                <SortHeader label="Signal" k="signal" align="center" />
                <SortHeader label="Conf." k="confidence" align="center" />
                <SortHeader label="Trend" k="trend" align="center" />
                <SortHeader label="Mom." k="momentum" align="center" />
                <th className="px-3 py-2.5 text-center font-medium text-slate-500">Volatility</th>
                <th className="px-3 py-2.5 text-center font-medium text-slate-500">Chart</th>
                <th className="px-3 py-2.5 text-center font-medium text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => {
                const isSelected = selected?.symbol === r.symbol;
                const cat = assetClassMeta[r.assetClass];
                const CatIcon = cat.icon;
                const isPositive = r.changePct >= 0;
                return (
                  <tr
                    key={r.symbol}
                    onClick={() => setSelected(r)}
                    className={`cursor-pointer border-b border-ink-700/40 transition-colors hover:bg-ink-800/70 ${isSelected ? 'bg-accent-500/5' : ''}`}
                  >
                    <td className="px-3 py-3 text-center">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-ink-700 font-mono text-xs font-bold text-slate-300">
                        {r.rank}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-mono font-semibold text-slate-200">{r.symbol}</p>
                      <p className="text-[10px] text-slate-500">{r.name}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${cat.bg} ${cat.color}`}>
                        <CatIcon className="h-3 w-3" />
                        {r.assetClass}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-slate-200">
                      {r.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className={`px-3 py-3 text-right font-mono text-xs ${isPositive ? 'text-bull-400' : 'text-bear-400'}`}>
                      {isPositive ? '+' : ''}{r.changePct.toFixed(2)}%
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-center">
                        <ScoreBar value={r.aiScore} />
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-block rounded-md border px-2 py-1 text-[10px] font-bold uppercase ${signalColor(r.signal)}`}>
                        {r.signal}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-slate-300">{r.confidence}%</td>
                    <td className="px-3 py-3">
                      <span className={`flex items-center justify-center gap-1 font-mono text-xs ${trendColor(r.trend)}`}>
                        <TrendIcon trend={r.trend} /> {r.trend}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`font-mono text-xs font-bold ${scoreColor(r.momentum)}`}>{r.momentum}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${volColor(r.volatility)}`}>
                        {r.volatility}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-center">
                        <Sparkline data={r.sparkline} trend={r.trend} />
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(r);
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-accent-500/40 bg-accent-500/10 px-2.5 py-1 text-xs font-semibold text-accent-300 transition-colors hover:bg-accent-500/20"
                      >
                        <Zap className="h-3 w-3" /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-4 py-8 text-center text-sm text-slate-500">No instruments match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-in detail panel */}
      {selected && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <aside className="animate-slide-in fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-ink-600 bg-ink-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink-700/60 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Radar className="h-4 w-4 text-accent-400" />
                <h3 className="text-sm font-bold text-slate-100">Scan Detail · {selected.symbol}</h3>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-md p-1 text-slate-500 transition-colors hover:bg-ink-700 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {/* Score + signal */}
              <div className="mb-4 flex items-center justify-between rounded-xl border border-ink-700/60 bg-ink-850 p-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">AI Score</p>
                  <p className={`mt-1 font-mono text-4xl font-bold ${scoreColor(selected.aiScore)}`}>{selected.aiScore}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">Confidence {selected.confidence}%</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Signal</p>
                  <span className={`mt-1.5 inline-block rounded-md border px-3 py-1.5 text-sm font-bold uppercase ${signalColor(selected.signal)}`}>
                    {selected.signal}
                  </span>
                  <p className="mt-1.5 flex items-center justify-end gap-1 text-xs text-slate-500">
                    <TrendIcon trend={selected.trend} /> {selected.trend} trend
                  </p>
                </div>
              </div>

              {/* Price chart */}
              <div className="mb-4 rounded-xl border border-ink-700/60 bg-ink-850 p-4">
                <p className="mb-2 text-xs font-semibold text-slate-300">{selected.name} — 30-Day Price</p>
                <SeriesChart
                  data={selected.sparkline}
                  dataKey="value"
                  color={selected.trend === 'up' ? '#10b981' : selected.trend === 'down' ? '#ef4444' : '#fbbf24'}
                  height={160}
                  type="area"
                />
              </div>

              {/* Key metrics */}
              <div className="mb-4 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-ink-700/60 bg-ink-850 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Price</p>
                  <p className="mt-0.5 font-mono text-sm font-bold text-slate-200">
                    {selected.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="rounded-lg border border-ink-700/60 bg-ink-850 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Change</p>
                  <p className={`mt-0.5 font-mono text-sm font-bold ${selected.changePct >= 0 ? 'text-bull-400' : 'text-bear-400'}`}>
                    {selected.changePct >= 0 ? '+' : ''}{selected.changePct.toFixed(2)}%
                  </p>
                </div>
                <div className="rounded-lg border border-bull-500/20 bg-bull-500/5 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-bull-400">Support</p>
                  <p className="mt-0.5 font-mono text-sm font-bold text-slate-200">
                    {selected.support.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="rounded-lg border border-bear-500/20 bg-bear-500/5 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-bear-400">Resistance</p>
                  <p className="mt-0.5 font-mono text-sm font-bold text-slate-200">
                    {selected.resistance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="rounded-lg border border-ink-700/60 bg-ink-850 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">ATR</p>
                  <p className="mt-0.5 font-mono text-sm font-bold text-accent-300">{selected.atr.toFixed(2)}</p>
                </div>
                <div className="rounded-lg border border-ink-700/60 bg-ink-850 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Risk/Reward</p>
                  <p className="mt-0.5 font-mono text-sm font-bold text-accent-300">1:{selected.riskReward.toFixed(1)}</p>
                </div>
                <div className="rounded-lg border border-ink-700/60 bg-ink-850 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Momentum</p>
                  <p className={`mt-0.5 font-mono text-sm font-bold ${scoreColor(selected.momentum)}`}>{selected.momentum}</p>
                </div>
                <div className="rounded-lg border border-ink-700/60 bg-ink-850 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Volatility</p>
                  <span className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${volColor(selected.volatility)}`}>
                    {selected.volatility}
                  </span>
                </div>
              </div>

              {/* Catalyst */}
              <div className="mb-4">
                <p className="section-title mb-2 flex items-center gap-1.5">
                  <Crosshair className="h-3.5 w-3.5" /> AI Catalyst
                </p>
                <div className="rounded-xl border border-accent-500/20 bg-accent-500/5 p-3.5">
                  <p className="text-sm leading-relaxed text-slate-300">{selected.catalyst}</p>
                </div>
              </div>

              {/* Bias */}
              <div>
                <p className="section-title mb-2 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" /> Bias & Direction
                </p>
                <div className="flex items-center justify-between rounded-lg border border-ink-700/60 bg-ink-850 px-3 py-2.5">
                  <span className="text-xs text-slate-400">AI Bias</span>
                  <span className={`text-sm font-bold uppercase ${selected.bias === 'buy' ? 'text-bull-400' : selected.bias === 'sell' ? 'text-bear-400' : 'text-warn-400'}`}>
                    {selected.bias}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-ink-700/60 px-5 py-3">
              <button
                onClick={() => setSelected(null)}
                className="w-full rounded-lg border border-accent-500/40 bg-accent-500/15 py-2 text-sm font-semibold text-accent-300 transition-colors hover:bg-accent-500/25"
              >
                Close
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
