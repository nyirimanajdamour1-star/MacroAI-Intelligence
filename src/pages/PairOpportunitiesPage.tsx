import { useMemo, useState } from 'react';
import { aiPairAnalyses, lastScanUpdate, signalColor } from '@/data/extendedData';
import { scoreColor, scoreBg, trendColor } from '@/utils/format';
import { useApiDataWithFallback } from '@/hooks/useApiData';
import { DataStatus } from '@/components/LoadingPlaceholder';
import type { AIPairAnalysis, Signal, Trend } from '@/types';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Clock,
  Crosshair,
  Gauge,
  Minus,
  Shield,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';

type SortKey = 'rank' | 'pair' | 'aiScore' | 'signal' | 'confidence' | 'trend' | 'riskReward';
type SortDir = 'asc' | 'desc';

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
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-ink-700">
        <div className={`h-full rounded-full ${scoreBg(value)}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <div className="card relative overflow-hidden p-4">
      <div className={`absolute inset-x-0 top-0 h-0.5 ${accent}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-slate-100">{value}</p>
          {sub && <p className="mt-0.5 text-[11px] text-slate-500">{sub}</p>}
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent} bg-opacity-10`}>
          <Icon className="h-4.5 w-4.5 text-slate-200" />
        </div>
      </div>
    </div>
  );
}

function ScoreRow({ label, value, icon: Icon }: { label: string; value: number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <Icon className="h-3.5 w-3.5 text-slate-500" />
          {label}
        </span>
        <span className={`font-mono text-sm font-bold ${scoreColor(value)}`}>{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-ink-700">
        <div className={`h-full rounded-full ${scoreBg(value)} transition-all`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function TradeLevel({ label, value, tone }: { label: string; value: string; tone: 'neutral' | 'bull' | 'bear' }) {
  const toneClass = tone === 'bull' ? 'text-bull-400' : tone === 'bear' ? 'text-bear-400' : 'text-slate-300';
  return (
    <div className="rounded-lg border border-ink-700/60 bg-ink-850 p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-0.5 font-mono text-sm font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

function adaptPairsToAnalyses(raw: unknown): AIPairAnalysis[] {
  const pairs = raw as Record<string, unknown>[];
  return pairs.map((p, i) => ({
    rank: i + 1,
    pair: (p.pair as string) ?? '',
    aiScore: Math.round((p.pair_score as number) ?? 50),
    signal: (p.signal as Signal) ?? 'Neutral',
    confidence: (p.confidence as number) ?? 50,
    trend: ((p.score_diff as number) > 0 ? 'up' : (p.score_diff as number) < 0 ? 'down' : 'flat') as Trend,
    riskReward: (p.risk_reward as string) ?? '2.0 : 1',
    macroScore: Math.round((p.base_score as number) ?? 50),
    technicalScore: Math.round((p.confidence as number) ?? 50),
    trendScore: Math.round((p.confidence as number) ?? 50),
    riskScore: Math.round(Math.abs((p.score_diff as number) ?? 0)),
    entryPrice: (p.entry as string) ?? '—',
    stopLoss: (p.stop_loss as string) ?? '—',
    takeProfit1: (p.take_profit_1 as string) ?? '—',
    takeProfit2: (p.take_profit_2 as string) ?? '—',
    riskRewardRatio: (p.risk_reward as string) ?? '2.0 : 1',
    explanation: (p.expected_direction as string) ?? '—',
  }));
}

export default function PairOpportunitiesPage() {
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selected, setSelected] = useState<AIPairAnalysis | null>(null);

  const { data: pairData, lastUpdated, offline, refetch } = useApiDataWithFallback(
    '/api/pairs',
    aiPairAnalyses,
    30000,
    adaptPairsToAnalyses,
  );

  const sorted = useMemo(() => {
    const rows = [...pairData];
    rows.sort((a, b) => {
      let av: number | string;
      let bv: number | string;
      if (sortKey === 'signal') {
        av = signalOrder[a.signal];
        bv = signalOrder[b.signal];
      } else if (sortKey === 'trend') {
        av = trendOrder[a.trend];
        bv = trendOrder[b.trend];
      } else if (sortKey === 'riskReward') {
        av = parseFloat(a.riskReward.split(':')[1] ?? '0');
        bv = parseFloat(b.riskReward.split(':')[1] ?? '0');
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
  }, [sortKey, sortDir]);

  const summary = useMemo(() => {
    const total = pairData.length;
    const strongBuys = pairData.filter((p) => p.signal === 'Strong Buy').length;
    const strongSells = pairData.filter((p) => p.signal === 'Strong Sell').length;
    const avgConf = total > 0 ? Math.round(pairData.reduce((s, p) => s + p.confidence, 0) / total) : 0;
    return { total, strongBuys, strongSells, avgConf };
  }, [pairData]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const SortHeader = ({ label, k, align = 'left' }: { label: string; k: SortKey; align?: 'left' | 'center' | 'right' }) => {
    const active = sortKey === k;
    return (
      <th
        className={`cursor-pointer select-none px-4 py-2.5 font-medium transition-colors hover:text-slate-300 ${
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
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-accent-400" />
        <div>
          <h2 className="text-lg font-bold text-slate-100">AI Pair Opportunities</h2>
          <p className="text-sm text-slate-500">Institutional AI scan ranking all major pairs by composite opportunity score</p>
        </div>
      </div>
      <DataStatus lastUpdated={lastUpdated} offline={offline} onRetry={refetch} />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <SummaryCard label="Pairs Scanned" value={String(summary.total)} icon={Activity} accent="bg-accent-500" />
        <SummaryCard label="Strong Buy" value={String(summary.strongBuys)} icon={ArrowUp} accent="bg-bull-500" />
        <SummaryCard label="Strong Sell" value={String(summary.strongSells)} icon={ArrowDown} accent="bg-bear-500" />
        <SummaryCard label="Avg AI Confidence" value={`${summary.avgConf}%`} icon={Gauge} accent="bg-warn-500" />
        <SummaryCard label="Last Update" value={lastScanUpdate} sub="Live scan" icon={Clock} accent="bg-accent-500" />
      </div>

      {/* Sortable table */}
      <div className="card overflow-hidden">
        <div className="border-b border-ink-700/60 px-4 py-2.5">
          <p className="section-title">Ranked Opportunity Matrix</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-700/60 text-xs uppercase tracking-wider">
                <SortHeader label="Rank" k="rank" align="center" />
                <SortHeader label="Pair" k="pair" />
                <SortHeader label="AI Score" k="aiScore" align="center" />
                <SortHeader label="Signal" k="signal" align="center" />
                <SortHeader label="Confidence" k="confidence" align="center" />
                <SortHeader label="Trend" k="trend" align="center" />
                <SortHeader label="Risk/Reward" k="riskReward" align="center" />
                <th className="px-4 py-2.5 text-center font-medium text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => {
                const isSelected = selected?.rank === p.rank;
                return (
                  <tr
                    key={p.rank}
                    onClick={() => setSelected(p)}
                    className={`cursor-pointer border-b border-ink-700/40 transition-colors hover:bg-ink-800/70 ${
                      isSelected ? 'bg-accent-500/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-center">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-ink-700 font-mono text-xs font-bold text-slate-300">
                        {p.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-200">{p.pair}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <ScoreBar value={p.aiScore} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block rounded-md border px-2 py-1 text-[10px] font-bold uppercase ${signalColor(p.signal)}`}>
                        {p.signal}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-slate-300">{p.confidence}%</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center justify-center gap-1 font-mono text-xs ${trendColor(p.trend)}`}>
                        <TrendIcon trend={p.trend} /> {p.trend}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-xs text-slate-300">{p.riskReward}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(p);
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-accent-500/40 bg-accent-500/10 px-2.5 py-1 text-xs font-semibold text-accent-300 transition-colors hover:bg-accent-500/20"
                      >
                        <Zap className="h-3 w-3" /> Analyze
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-in AI analysis panel */}
      {selected && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />
          <aside className="animate-slide-in fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-ink-600 bg-ink-900 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ink-700/60 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent-400" />
                <h3 className="text-sm font-bold text-slate-100">AI Analysis · {selected.pair}</h3>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-md p-1 text-slate-500 transition-colors hover:bg-ink-700 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {/* Overall score + recommendation */}
              <div className="mb-4 flex items-center justify-between rounded-xl border border-ink-700/60 bg-ink-850 p-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Overall AI Score</p>
                  <p className={`mt-1 font-mono text-4xl font-bold ${scoreColor(selected.aiScore)}`}>{selected.aiScore}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">Confidence {selected.confidence}%</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Recommendation</p>
                  <span className={`mt-1.5 inline-block rounded-md border px-3 py-1.5 text-sm font-bold uppercase ${signalColor(selected.signal)}`}>
                    {selected.signal}
                  </span>
                  <p className="mt-1.5 flex items-center justify-end gap-1 text-xs text-slate-500">
                    <TrendIcon trend={selected.trend} /> {selected.trend} trend
                  </p>
                </div>
              </div>

              {/* Sub-scores */}
              <div className="mb-4 space-y-3">
                <p className="section-title">Composite Score Breakdown</p>
                <ScoreRow label="Macro Score" value={selected.macroScore} icon={Gauge} />
                <ScoreRow label="Technical Score" value={selected.technicalScore} icon={Activity} />
                <ScoreRow label="Trend Score" value={selected.trendScore} icon={TrendingUp} />
                <ScoreRow label="Risk Score" value={selected.riskScore} icon={Shield} />
              </div>

              {/* Trade levels */}
              <div className="mb-4">
                <p className="section-title mb-2 flex items-center gap-1.5">
                  <Crosshair className="h-3.5 w-3.5" /> Trade Setup
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <TradeLevel label="Entry Price" value={selected.entryPrice} tone="neutral" />
                  <TradeLevel label="Stop Loss" value={selected.stopLoss} tone="bear" />
                  <TradeLevel label="Take Profit 1" value={selected.takeProfit1} tone="bull" />
                  <TradeLevel label="Take Profit 2" value={selected.takeProfit2} tone="bull" />
                </div>
                <div className="mt-2 flex items-center justify-between rounded-lg border border-ink-700/60 bg-ink-850 px-3 py-2">
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Target className="h-3.5 w-3.5 text-accent-400" /> Risk/Reward Ratio
                  </span>
                  <span className="font-mono text-sm font-bold text-accent-300">{selected.riskRewardRatio}</span>
                </div>
              </div>

              {/* AI explanation */}
              <div>
                <p className="section-title mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> AI Reasoning
                </p>
                <div className="rounded-xl border border-accent-500/20 bg-accent-500/5 p-3.5">
                  <p className="text-sm leading-relaxed text-slate-300">{selected.explanation}</p>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="border-t border-ink-700/60 px-5 py-3">
              <button
                onClick={() => setSelected(null)}
                className="w-full rounded-lg border border-accent-500/40 bg-accent-500/15 py-2 text-sm font-semibold text-accent-300 transition-colors hover:bg-accent-500/25"
              >
                Close Analysis
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
