import { TrendingUp, TrendingDown, Minus, Sparkles, ArrowUpRight, ArrowDownRight, X, Activity, BarChart3, Gauge } from 'lucide-react';
import type { Currency } from '@/types';
import { currencySubScores } from '@/data/mockData';
import { scoreColor, scoreBg, directionColor } from '@/utils/format';
import { useApiDataWithFallback } from '@/hooks/useApiData';

interface AIPanelProps {
  currency: Currency | null;
  onClose?: () => void;
}

export default function AIPanel({ currency, onClose }: AIPanelProps) {
  if (!currency) {
    return (
      <aside className="hidden w-80 shrink-0 border-l border-ink-700/60 bg-ink-900/80 backdrop-blur-md xl:flex xl:flex-col">
        <div className="flex h-14 items-center gap-2 border-b border-ink-700/60 px-4">
          <Sparkles className="h-4 w-4 text-accent-400" />
          <span className="text-sm font-semibold text-slate-200">AI Analysis</span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-500/10">
            <Sparkles className="h-6 w-6 text-accent-400" />
          </div>
          <p className="text-sm font-medium text-slate-300">Select a currency</p>
          <p className="mt-1 text-xs text-slate-500">Click any currency tile or table row to see AI-generated macro analysis.</p>
        </div>
      </aside>
    );
  }

  const TrendIcon = currency.trend === 'up' ? TrendingUp : currency.trend === 'down' ? TrendingDown : Minus;
  const raw = currencySubScores[currency.code] ?? { macro: 50, technical: 50, sentiment: 50 };
  const subs = {
    macro: raw.macro,
    technical: raw.technical,
    sentiment: raw.sentiment,
  };

  const subScoreBars = [
    { label: 'Macro', value: subs.macro, icon: Activity, color: 'bg-accent-500' },
    { label: 'Technical', value: subs.technical, icon: BarChart3, color: 'bg-bull-500' },
    { label: 'Sentiment', value: subs.sentiment, icon: Gauge, color: 'bg-warn-500' },
  ];

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-ink-700/60 bg-ink-900/80 backdrop-blur-md xl:flex">
      <div className="flex h-14 items-center gap-2 border-b border-ink-700/60 px-4">
        <Sparkles className="h-4 w-4 text-accent-400" />
        <span className="text-sm font-semibold text-slate-200">AI Analysis</span>
        <span className="ml-auto rounded-md bg-accent-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-300">
          Live
        </span>
        {onClose && (
          <button onClick={onClose} className="ml-1 text-slate-500 hover:text-slate-300 xl:hidden">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="animate-fade-in">
          {/* Header */}
          <div className="mb-4 flex items-center gap-3">
            <span className="text-2xl">{currency.flag}</span>
            <div>
              <h3 className="text-base font-bold text-slate-100">{currency.code}</h3>
              <p className="text-xs text-slate-500">{currency.name}</p>
            </div>
            <TrendIcon className={`ml-auto h-5 w-5 ${currency.trend === 'up' ? 'text-bull-400' : currency.trend === 'down' ? 'text-bear-400' : 'text-warn-400'}`} />
          </div>

          {/* Score + confidence */}
          <div className="mb-4 grid grid-cols-2 gap-2.5">
            <div className="card p-3">
              <p className="section-title mb-1">AI Score</p>
              <p className={`font-mono text-2xl font-bold ${scoreColor(currency.score)}`}>{currency.score.toFixed(1)}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-700">
                <div className={`h-full rounded-full ${scoreBg(currency.score)}`} style={{ width: `${currency.score}%` }} />
              </div>
            </div>
            <div className="card p-3">
              <p className="section-title mb-1">Confidence</p>
              <p className="font-mono text-2xl font-bold text-slate-200">{currency.confidence}%</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-700">
                <div className="h-full rounded-full bg-accent-500" style={{ width: `${currency.confidence}%` }} />
              </div>
            </div>
          </div>

          {/* Sub-scores */}
          <div className="mb-4">
            <p className="section-title mb-2">Score Breakdown</p>
            <div className="space-y-2.5">
              {subScoreBars.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Icon className="h-3 w-3" /> {s.label}
                      </span>
                      <span className="font-mono font-semibold text-slate-200">{s.value}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-ink-700">
                      <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.value}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rating badge */}
          <div className="mb-4 flex items-center justify-between rounded-lg border border-ink-700/60 bg-ink-850 px-3 py-2.5">
            <span className="text-xs font-medium text-slate-400">AI Rating</span>
            <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${currency.aiRating.includes('Buy') ? 'bg-bull-500/15 text-bull-400' : currency.aiRating.includes('Sell') ? 'bg-bear-500/15 text-bear-400' : 'bg-warn-500/15 text-warn-400'}`}>
              {currency.aiRating}
            </span>
          </div>

          {/* Summary */}
          <div className="mb-4">
            <p className="section-title mb-1.5">AI Summary</p>
            <p className="text-sm leading-relaxed text-slate-300">{currency.summary}</p>
          </div>

          {/* Positive factors */}
          <div className="mb-4">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-bull-400">
              <ArrowUpRight className="h-3.5 w-3.5" /> Bullish Factors
            </p>
            <ul className="space-y-1.5">
              {currency.positiveFactors.map((f, i) => (
                <li key={i} className="flex gap-2 text-xs leading-relaxed text-slate-400">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-bull-500" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Negative factors */}
          <div className="mb-4">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-bear-400">
              <ArrowDownRight className="h-3.5 w-3.5" /> Bearish Factors
            </p>
            <ul className="space-y-1.5">
              {currency.negativeFactors.map((f, i) => (
                <li key={i} className="flex gap-2 text-xs leading-relaxed text-slate-400">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-bear-500" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Suggested direction */}
          <div className="mb-4 rounded-lg border border-accent-500/20 bg-accent-500/5 p-3">
            <p className="section-title mb-1.5">Suggested Direction</p>
            <div className="flex items-center gap-2">
              <span className={`rounded-md px-3 py-1.5 text-sm font-bold uppercase ${directionColor(currency.recommendedPairs[0]?.direction ?? 'neutral')}`}>
                {currency.recommendedPairs[0]?.direction ?? 'neutral'}
              </span>
              <span className="text-xs text-slate-400">{currency.recommendedPairs[0]?.confidence ?? 50}% confidence</span>
            </div>
          </div>

          {/* Recommended pairs */}
          <div>
            <p className="section-title mb-2">Suggested Pairs</p>
            <div className="space-y-1.5">
              {currency.recommendedPairs.map((p, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-ink-700/60 bg-ink-850 px-3 py-2">
                  <span className="font-mono text-xs font-semibold text-slate-200">{p.pair}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">{p.confidence}%</span>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${directionColor(p.direction)}`}>
                      {p.direction}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
