import { useState } from 'react';
import { macroIndicators, currencies as mockCurrencies } from '@/data/mockData';
import { useApiDataWithFallback } from '@/hooks/useApiData';
import { adaptMacroIndicators, adaptCurrencies } from '@/lib/adapters';
import { DataStatus } from '@/components/LoadingPlaceholder';
import { sentimentBg, sentimentColor } from '@/utils/format';
import { SeriesChart } from '@/components/Charts';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

export default function MacroDataPage() {
  const [selected, setSelected] = useState('USD');

  const { data: currencies } = useApiDataWithFallback(
    '/api/currencies',
    mockCurrencies,
    300000,
    adaptCurrencies,
  );

  const countryMap: Record<string, string> = { USD: 'US', EUR: 'EU', GBP: 'GB', JPY: 'JP', CHF: 'CH', CAD: 'CA', AUD: 'AU', NZD: 'NZ' };
  const country = countryMap[selected] ?? 'US';

  const { data: indicators, lastUpdated, offline, refetch } = useApiDataWithFallback(
    `/api/macro?country=${country}`,
    macroIndicators[selected] ?? macroIndicators.USD,
    300000,
    adaptMacroIndicators,
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Macro Data</h2>
          <p className="text-sm text-slate-500">Key economic indicators with AI interpretation</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {currencies.map((c) => (
            <button
              key={c.code}
              onClick={() => setSelected(c.code)}
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
      </div>
      <DataStatus lastUpdated={lastUpdated} offline={offline} onRetry={refetch} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {indicators.map((ind) => {
          const isUp = ind.changePct > 0;
          const isFlat = ind.changePct === 0;
          return (
            <div key={ind.id} className="card card-hover p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{ind.name}</p>
                <span className={`stat-chip ${sentimentBg(ind.sentiment)}`}>{ind.sentiment}</span>
              </div>
              <p className="font-mono text-2xl font-bold text-slate-100">{ind.value}</p>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="text-slate-500">Prev: <span className="font-mono text-slate-400">{ind.previous}</span></span>
                <span className={`flex items-center gap-0.5 font-mono ${isUp ? 'text-bull-400' : isFlat ? 'text-warn-400' : 'text-bear-400'}`}>
                  {isUp ? <ArrowUp className="h-3 w-3" /> : isFlat ? <Minus className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {ind.change}
                </span>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{ind.description}</p>
            </div>
          );
        })}
      </div>

      {/* Chart for first indicator */}
      <div className="card card-hover p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">{indicators[0].name} — {selected} History</h3>
        <SeriesChart data={indicators[0].history} dataKey="value" color="#10b981" height={240} />
      </div>
    </div>
  );
}
