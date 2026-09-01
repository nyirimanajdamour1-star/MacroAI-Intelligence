import { useState, useEffect } from 'react';
import { currencies as mockCurrencies, macroIndicators } from '@/data/mockData';
import { sentimentBg } from '@/utils/format';
import { SeriesChart, MultiSeriesChart } from '@/components/Charts';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { useApiDataWithFallback } from '@/hooks/useApiData';
import { adaptCurrencies } from '@/lib/adapters';

interface IndicatorPageProps {
  indicatorKey: string; // e.g. 'rate', 'cpi', 'gdp', 'unemp', 'retail', 'pmi', 'trade', 'yield'
  title: string;
  description: string;
  unit: string;
  color?: string;
}

// Build a cross-currency comparison dataset
function buildComparison(key: string) {
  const all = Object.entries(macroIndicators).map(([code, inds]) => {
    const ind = inds.find((i) => i.id.endsWith(`-${key}`));
    return { code, ind };
  }).filter((x) => x.ind);

  const first = all[0];
  if (!first || !first.ind) return [];
  const dates = first.ind.history.map((h) => h.date);
  return dates.map((date, i) => {
    const row: { date: string; [k: string]: string | number } = { date };
    all.forEach(({ code, ind }) => {
      if (ind) row[code] = ind.history[i]?.value ?? 0;
    });
    return row;
  });
}

// Fetch real bond yield data for USD only (from FRED via /api/markets)
function useLiveBondYield(indicatorKey: string) {
  const [liveYield, setLiveYield] = useState<{ value: string; previous: string; change: string; changePct: number } | null>(null);

  useEffect(() => {
    if (indicatorKey !== 'yield') return;

    let cancelled = false;
    async function fetchBondYield() {
      try {
        const res = await fetch('/api/markets');
        if (!res.ok) return;
        const data = await res.json();
        const bonds = data?.bonds ?? data?.bond_yields ?? [];
        const us10y = Array.isArray(bonds)
          ? bonds.find((b: any) => b.country === 'US' && b.maturity === '10Y')
          : null;
        if (us10y && !cancelled) {
          const value = Number(us10y.value);
          const change = Number(us10y.change ?? 0);
          const previous = value - change;
          const changePct = previous !== 0 ? (change / previous) * 100 : 0;
          setLiveYield({
            value: `${value.toFixed(2)}%`,
            previous: `${previous.toFixed(2)}%`,
            change: `${change >= 0 ? '+' : ''}${change.toFixed(2)}`,
            changePct,
          });
        }
      } catch {
        // Silently keep mock fallback on any fetch error
      }
    }

    fetchBondYield();
    const interval = setInterval(fetchBondYield, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [indicatorKey]);

  return liveYield;
}

export default function IndicatorPage({ indicatorKey, title, description, unit, color = '#3b82f6' }: IndicatorPageProps) {
  const [selected, setSelected] = useState('USD');
  const liveBondYield = useLiveBondYield(indicatorKey);

  const { data: currencies } = useApiDataWithFallback(
    '/api/currencies',
    mockCurrencies,
    300000,
    adaptCurrencies,
  );
  const allForIndicator = Object.entries(macroIndicators).map(([code, inds]) => ({
    code,
    ind: inds.find((i) => i.id.endsWith(`-${indicatorKey}`)),
  })).filter((x) => x.ind);

  // Override USD's yield values with live data if available
  const displayForIndicator = allForIndicator.map((x) => {
    if (indicatorKey === 'yield' && x.code === 'USD' && liveBondYield && x.ind) {
      return {
        ...x,
        ind: {
          ...x.ind,
          value: liveBondYield.value,
          previous: liveBondYield.previous,
          change: liveBondYield.change,
          changePct: liveBondYield.changePct,
        },
      };
    }
    return x;
  });

  const current = displayForIndicator.find((x) => x.code === selected)?.ind ?? displayForIndicator[0]?.ind;
  if (!current) return null;
  const comparisonData = buildComparison(indicatorKey);
  const seriesColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];
  const series = displayForIndicator.map((x, i) => ({ key: x.code, color: seriesColors[i % seriesColors.length], name: x.code }));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-100">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>

      {/* Currency selector */}
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

      {/* Current value cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {displayForIndicator.map(({ code, ind }) => {
          if (!ind) return null;
          const i = ind;
          const isUp = i.changePct > 0;
          const isFlat = i.changePct === 0;
          return (
            <div key={code} className={`card card-hover p-4 ${selected === code ? 'border-accent-500/60' : ''}`}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{code}</span>
                <span className={`stat-chip ${sentimentBg(i.sentiment)}`}>{i.sentiment}</span>
              </div>
              <p className="font-mono text-2xl font-bold text-slate-100">{i.value}</p>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="text-slate-500">Prev: <span className="font-mono text-slate-400">{i.previous}</span></span>
                <span className={`flex items-center gap-0.5 font-mono ${isUp ? 'text-bull-400' : isFlat ? 'text-warn-400' : 'text-bear-400'}`}>
                  {isUp ? <ArrowUp className="h-3 w-3" /> : isFlat ? <Minus className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {i.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* History chart for selected */}
      <div className="card card-hover p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">{title} — {selected} ({current.unit || unit})</h3>
        <SeriesChart data={current.history} dataKey="value" color={color} height={240} />
      </div>

      {/* Cross-currency comparison */}
      <div className="card card-hover p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">{title} — Cross-Currency Comparison</h3>
        <MultiSeriesChart data={comparisonData} series={series} height={280} />
      </div>
    </div>
  );
}