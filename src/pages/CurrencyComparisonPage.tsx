import { useState } from 'react';
import { globalMacroCountries, compareCurrenciesLive } from '@/data/extendedData';
import { currencies as mockCurrencies, macroIndicators } from '@/data/mockData';
import { scoreColor, scoreBg, directionColor } from '@/utils/format';
import { ArrowRight, Trophy, Sparkles } from 'lucide-react';
import { useApiDataWithFallback } from '@/hooks/useApiData';
import { adaptCurrencies } from '@/lib/adapters';
import { DataStatus } from '@/components/LoadingPlaceholder';

const countryMap: Record<string, string> = { USD: 'US', EUR: 'EU', GBP: 'GB', JPY: 'JP', CHF: 'CH', CAD: 'CA', AUD: 'AU', NZD: 'NZ' };

export default function CurrencyComparisonPage() {
  const [base, setBase] = useState('USD');
  const [quote, setQuote] = useState('EUR');

  const { data: currencies, lastUpdated, offline, refetch } = useApiDataWithFallback(
    '/api/currencies',
    mockCurrencies,
    30000,
    adaptCurrencies,
  );

  const { data: baseIndicatorsRaw } = useApiDataWithFallback(
    `/api/macro?country=${countryMap[base] ?? 'US'}`,
    [],
    300000,
  );

  const { data: quoteIndicatorsRaw } = useApiDataWithFallback(
    `/api/macro?country=${countryMap[quote] ?? 'US'}`,
    [],
    300000,
  );

  const baseCur = currencies.find((c) => c.code === base) ?? mockCurrencies.find((c) => c.code === base)!;
  const quoteCur = currencies.find((c) => c.code === quote) ?? mockCurrencies.find((c) => c.code === quote)!;

  const baseIndicators = (Array.isArray(baseIndicatorsRaw) && baseIndicatorsRaw.length > 0)
    ? baseIndicatorsRaw.map((i: any) => ({ name: i.name, value: String(i.value) }))
    : (macroIndicators[base] ?? []).map((i) => ({ name: i.name, value: i.value }));

  const quoteIndicators = (Array.isArray(quoteIndicatorsRaw) && quoteIndicatorsRaw.length > 0)
    ? quoteIndicatorsRaw.map((i: any) => ({ name: i.name, value: String(i.value) }))
    : (macroIndicators[quote] ?? []).map((i) => ({ name: i.name, value: i.value }));

  const result = compareCurrenciesLive(base, quote, baseIndicators, quoteIndicators, baseCur, quoteCur);

  const diffs: { label: string; value: string }[] = [
    { label: 'Interest Rate Diff', value: result.interestRateDiff },
    { label: 'Inflation Diff', value: result.inflationDiff },
    { label: 'GDP Diff', value: result.gdpDiff },
    { label: 'Employment Diff', value: result.employmentDiff },
  ];

  return (
    <div className="space-y-5">
      <DataStatus lastUpdated={lastUpdated} offline={offline} onRetry={refetch} />
      <div>
        <h2 className="text-lg font-bold text-slate-100">Smart Currency Comparison</h2>
        <p className="text-sm text-slate-500">Select two currencies for AI head-to-head macro analysis</p>
      </div>

      {/* Selector */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <CurrencySelector label="Base" value={base} onChange={setBase} exclude={quote} />
          <ArrowRight className="h-6 w-6 text-accent-400" />
          <CurrencySelector label="Quote" value={quote} onChange={setQuote} exclude={base} />
        </div>
      </div>

      {/* Comparison header */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div className="text-center">
            <span className="text-4xl">{baseCur.flag}</span>
            <p className="mt-1 text-lg font-bold text-slate-100">{base}</p>
            <p className={`font-mono text-sm ${scoreColor(baseCur.score)}`}>{baseCur.score.toFixed(1)}</p>
          </div>
          <div className="flex-1 px-8 text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <Trophy className="h-5 w-5 text-warn-400" />
              <span className="text-sm font-semibold text-slate-300">Winner: <span className="font-bold text-slate-100">{result.winner}</span></span>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-ink-700">
              <div className="absolute left-0 top-0 h-full rounded-full bg-bull-500" style={{ width: `${result.probability}%` }} />
              <div className="absolute right-0 top-0 h-full rounded-r-full bg-bear-500" style={{ width: `${100 - result.probability}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-500">Probability: <span className="font-mono font-semibold text-slate-300">{result.probability}%</span></p>
          </div>
          <div className="text-center">
            <span className="text-4xl">{quoteCur.flag}</span>
            <p className="mt-1 text-lg font-bold text-slate-100">{quote}</p>
            <p className={`font-mono text-sm ${scoreColor(quoteCur.score)}`}>{quoteCur.score.toFixed(1)}</p>
          </div>
        </div>
      </div>

      {/* Differences */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {diffs.map((d) => {
          const isPositive = d.value.startsWith('+');
          return (
            <div key={d.label} className="card card-hover p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">{d.label}</p>
              <p className={`mt-1 font-mono text-xl font-bold ${isPositive ? 'text-bull-400' : 'text-bear-400'}`}>{d.value}</p>
              <p className="mt-1 text-[10px] text-slate-500">{base} vs {quote}</p>
            </div>
          );
        })}
      </div>

      {/* AI Summary */}
      <div className="card p-5">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent-400" />
          <h3 className="text-sm font-semibold text-slate-200">AI Summary</h3>
        </div>
        <p className="text-sm leading-relaxed text-slate-300">{result.summary}</p>
      </div>

      {/* Both currencies side by side */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[baseCur, quoteCur].map((c) => (
          <div key={c.code} className="card p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-2xl">{c.flag}</span>
              <div>
                <p className="font-bold text-slate-100">{c.code}</p>
                <p className="text-xs text-slate-500">{c.name}</p>
              </div>
              <div className="ml-auto text-right">
                <p className={`font-mono text-lg font-bold ${scoreColor(c.score)}`}>{c.score.toFixed(1)}</p>
                <p className="text-[10px] text-slate-500">{c.aiRating}</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">{c.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CurrencySelector({ label, value, onChange, exclude }: { label: string; value: string; onChange: (v: string) => void; exclude: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-wider text-slate-500">{label}</span>
      <div className="flex flex-wrap justify-center gap-1.5">
        {globalMacroCountries.filter((c) => c.code !== exclude).map((c) => (
          <button
            key={c.code}
            onClick={() => onChange(c.code)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              value === c.code
                ? 'border-accent-500/60 bg-accent-500/10 text-accent-300'
                : 'border-ink-700/60 bg-ink-850 text-slate-400 hover:bg-ink-700'
            }`}
          >
            <span>{c.flag}</span> {c.code}
          </button>
        ))}
      </div>
    </div>
  );
}