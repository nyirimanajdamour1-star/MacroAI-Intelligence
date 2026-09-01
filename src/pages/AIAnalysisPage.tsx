import { useState } from 'react';
import { aiInsights, currencies as mockCurrencies } from '@/data/mockData';
import { SeriesChart } from '@/components/Charts';
import { Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { scoreColor } from '@/utils/format';
import { useApiDataWithFallback } from '@/hooks/useApiData';
import { adaptCurrencies, adaptAnalyses, adaptAnalysisToInsights } from '@/lib/adapters';
import { DataStatus } from '@/components/LoadingPlaceholder';
import type { Currency } from '@/types';

interface AIPageProps {
  onSelectCurrency: (c: Currency) => void;
}

export default function AIAnalysisPage({ onSelectCurrency }: AIPageProps) {
  const [selected, setSelected] = useState('USD');

  const { data: currencies } = useApiDataWithFallback(
    '/api/currencies',
    mockCurrencies,
    30000,
    adaptCurrencies,
  );

  const { data: analyses, lastUpdated, offline, refetch } = useApiDataWithFallback(
    '/api/analysis',
    [],
    300000,
    adaptAnalyses,
  );

  const { data: insights } = useApiDataWithFallback(
    '/api/analysis',
    aiInsights,
    300000,
    adaptAnalysisToInsights,
  );

  const currency = currencies.find((c) => c.code === selected)!;

  return (
    <div className="space-y-5">
      <DataStatus lastUpdated={lastUpdated} offline={offline} onRetry={refetch} />
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-accent-400" />
        <div>
          <h2 className="text-lg font-bold text-slate-100">AI Analysis</h2>
          <p className="text-sm text-slate-500">AI-generated macro intelligence and currency explanations</p>
        </div>
      </div>

      {/* Currency selector */}
      <div className="flex flex-wrap gap-1.5">
        {currencies.map((c) => (
          <button
            key={c.code}
            onClick={() => { setSelected(c.code); onSelectCurrency(c); }}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              selected === c.code
                ? 'border-accent-500/60 bg-accent-500/10 text-accent-300'
                : 'border-ink-700/60 bg-ink-850 text-slate-400 hover:bg-ink-700'
            }`}
          >
            <span>{c.flag}</span> {c.code}
          </button>
        ))}
      </div>

      {/* Detailed AI breakdown */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-4 lg:col-span-2">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-3xl">{currency.flag}</span>
            <div>
              <h3 className="text-base font-bold text-slate-100">{currency.code} — {currency.name}</h3>
              <p className="text-xs text-slate-500">AI Rating: {currency.aiRating}</p>
            </div>
            <div className="ml-auto text-right">
              <p className={`font-mono text-3xl font-bold ${scoreColor(currency.score)}`}>{currency.score.toFixed(1)}</p>
              <p className="text-[11px] text-slate-500">Confidence {currency.confidence}%</p>
            </div>
          </div>

          <div className="mb-4 rounded-lg border border-accent-500/20 bg-accent-500/5 p-3">
            <p className="text-sm leading-relaxed text-slate-200">{currency.summary}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-bull-400">
                <TrendingUp className="h-3.5 w-3.5" /> Bullish Factors
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
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-bear-400">
                <TrendingDown className="h-3.5 w-3.5" /> Bearish Factors
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
          </div>

          <div className="mt-4 border-t border-ink-700/60 pt-4">
            <p className="section-title mb-2">Recommended Pairs & Direction</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {currency.recommendedPairs.map((p, i) => (
                <div key={i} className="rounded-lg border border-ink-700/60 bg-ink-850 p-3 text-center">
                  <p className="font-mono text-xs font-semibold text-slate-200">{p.pair}</p>
                  <p className={`mt-1 text-xs font-bold uppercase ${p.direction === 'buy' ? 'text-bull-400' : p.direction === 'sell' ? 'text-bear-400' : 'text-warn-400'}`}>
                    {p.direction}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">{p.confidence}% conf.</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">{currency.code} Strength History</h3>
          <SeriesChart data={currency.history} dataKey="score" color="#3b82f6" height={200} />
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Trend</span>
              <span className={`flex items-center gap-1 ${currency.trend === 'up' ? 'text-bull-400' : currency.trend === 'down' ? 'text-bear-400' : 'text-warn-400'}`}>
                {currency.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : currency.trend === 'down' ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                {currency.trend}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Last Update</span>
              <span className="text-slate-300">{currency.lastUpdate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* All AI insights feed */}
      <div className="card p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">AI Insights Feed</h3>
        <div className="space-y-3">
          {insights.map((ins) => (
            <div key={ins.id} className="rounded-lg border border-ink-700/60 bg-ink-850 p-3">
              <div className="mb-1 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${ins.sentiment === 'bullish' ? 'bg-bull-500' : ins.sentiment === 'bearish' ? 'bg-bear-500' : 'bg-warn-500'}`} />
                <span className="text-xs font-semibold text-slate-200">{ins.currency}</span>
                <span className="text-xs text-slate-600">·</span>
                <span className="text-xs text-slate-400">{ins.title}</span>
                <span className="ml-auto text-[10px] text-slate-500">{ins.time}</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">{ins.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}