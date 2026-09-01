import { useState } from 'react';
import { currencies as mockCurrencies } from '@/data/mockData';
import { scoreColor, scoreBg, trendColor, trendIcon, ratingColor } from '@/utils/format';
import { SeriesChart } from '@/components/Charts';
import { useApiDataWithFallback } from '@/hooks/useApiData';
import { adaptCurrencies } from '@/lib/adapters';
import { DataStatus } from '@/components/LoadingPlaceholder';
import type { Currency } from '@/types';

interface CurrenciesPageProps {
  onSelectCurrency: (c: Currency) => void;
  selectedCode: string | null;
}

export default function CurrenciesPage({ onSelectCurrency, selectedCode }: CurrenciesPageProps) {
  const [view, setView] = useState<'grid' | 'table'>('grid');

  const { data: currencies, lastUpdated, offline, refetch } = useApiDataWithFallback(
    '/api/currencies',
    mockCurrencies,
    30000,
    adaptCurrencies,
  );

  return (
    <div className="space-y-5">
      <DataStatus lastUpdated={lastUpdated} offline={offline} onRetry={refetch} />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Major Currencies</h2>
          <p className="text-sm text-slate-500">AI composite scores across all tracked currencies</p>
        </div>
        <div className="flex rounded-lg border border-ink-700/60 bg-ink-850 p-0.5">
          <button onClick={() => setView('grid')} className={`rounded-md px-3 py-1.5 text-xs font-medium ${view === 'grid' ? 'bg-ink-700 text-slate-200' : 'text-slate-500'}`}>Grid</button>
          <button onClick={() => setView('table')} className={`rounded-md px-3 py-1.5 text-xs font-medium ${view === 'table' ? 'bg-ink-700 text-slate-200' : 'text-slate-500'}`}>Table</button>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {currencies.map((c) => (
            <button
              key={c.code}
              onClick={() => onSelectCurrency(c)}
              className={`card card-hover p-4 text-left ${selectedCode === c.code ? 'border-accent-500/60 shadow-glow' : ''}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{c.flag}</span>
                  <div>
                    <p className="font-bold text-slate-100">{c.code}</p>
                    <p className="text-[11px] text-slate-500">{c.name}</p>
                  </div>
                </div>
                <span className={`font-mono ${trendColor(c.trend)}`}>{trendIcon(c.trend)}</span>
              </div>
              <div className="mb-2 flex items-end justify-between">
                <span className={`font-mono text-3xl font-bold ${scoreColor(c.score)}`}>{c.score.toFixed(1)}</span>
                <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${ratingColor(c.aiRating)}`}>{c.aiRating}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-ink-700">
                <div className={`h-full rounded-full ${scoreBg(c.score)}`} style={{ width: `${c.score}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                <span>Confidence: <span className="text-slate-300">{c.confidence}%</span></span>
                <span>{c.lastUpdate}</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-700/60 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-2.5 font-medium">Currency</th>
                  <th className="px-4 py-2.5 font-medium">Score</th>
                  <th className="px-4 py-2.5 font-medium">Confidence</th>
                  <th className="px-4 py-2.5 font-medium">Trend</th>
                  <th className="px-4 py-2.5 font-medium">AI Rating</th>
                  <th className="px-4 py-2.5 font-medium">Last Update</th>
                </tr>
              </thead>
              <tbody>
                {currencies.map((c) => (
                  <tr key={c.code} onClick={() => onSelectCurrency(c)} className="cursor-pointer border-b border-ink-700/40 hover:bg-ink-800/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{c.flag}</span>
                        <div>
                          <p className="font-semibold text-slate-200">{c.code}</p>
                          <p className="text-[11px] text-slate-500">{c.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className={`font-mono font-bold ${scoreColor(c.score)}`}>{c.score.toFixed(1)}</span></td>
                    <td className="px-4 py-3 font-mono text-slate-300">{c.confidence}%</td>
                    <td className="px-4 py-3"><span className={`font-mono ${trendColor(c.trend)}`}>{trendIcon(c.trend)} {c.trend}</span></td>
                    <td className="px-4 py-3"><span className={`rounded-md px-2 py-1 text-xs font-semibold ${ratingColor(c.aiRating)}`}>{c.aiRating}</span></td>
                    <td className="px-4 py-3 text-xs text-slate-500">{c.lastUpdate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Strength history for selected */}
      <div className="card card-hover p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">
          {selectedCode ?? currencies[0].code} Strength History
        </h3>
        <SeriesChart data={(currencies.find((c) => c.code === selectedCode) ?? currencies[0]).history} dataKey="score" color="#3b82f6" height={220} />
      </div>
    </div>
  );
}
