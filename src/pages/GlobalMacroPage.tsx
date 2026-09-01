import { useMemo, useState } from 'react';
import {
  globalMacroCountries,
  globalSummaryCards,
  riskGauges,
  capitalFlows,
  macroOpportunities,
  globalAiSummary,
} from '@/data/extendedData';
import { SeriesChart } from '@/components/Charts';
import { scoreColor, scoreBg, trendColor, heatmapClasses } from '@/utils/format';
import { useApiDataWithFallback } from '@/hooks/useApiData';
import { adaptCurrencies } from '@/lib/adapters';
import { DataStatus } from '@/components/LoadingPlaceholder';
import type { GlobalMacroCountry, GlobalSummaryCard, RiskGauge, MacroOpportunity, Trend, Currency } from '@/types';

const COUNTRY_MAP: Record<string, string> = { USD: 'US', EUR: 'EU', GBP: 'GB', JPY: 'JP', CHF: 'CH', CAD: 'CA', AUD: 'AU', NZD: 'NZ' };

function adaptToGlobalCountries(raw: Currency[]): GlobalMacroCountry[] {
  return raw.map((c) => {
    const mock = globalMacroCountries.find((m) => m.code === c.code);
    return {
      code: c.code,
      name: c.name,
      flag: c.flag,
      interestRate: mock?.interestRate ?? '—',
      inflation: mock?.inflation ?? '—',
      gdp: mock?.gdp ?? '—',
      unemployment: mock?.unemployment ?? '—',
      pmi: mock?.pmi ?? '—',
      retailSales: mock?.retailSales ?? '—',
      tradeBalance: mock?.tradeBalance ?? '—',
      bondYield: mock?.bondYield ?? '—',
      currencyScore: c.score,
      aiConfidence: c.confidence,
      macroBias: mock?.macroBias ?? 'Neutral',
      trend: c.trend,
      signal: c.aiRating,
      confidence: c.confidence,
      mapX: mock?.mapX ?? 50,
      mapY: mock?.mapY ?? 50,
      prevScore: mock?.prevScore ?? c.score,
      miniChart: mock?.miniChart ?? [],
    };
  });
}
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Globe,
  LineChart,
  Minus,
  Shield,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Waves,
} from 'lucide-react';

type SortKey = 'name' | 'code' | 'interestRate' | 'inflation' | 'gdp' | 'unemployment' | 'pmi' | 'bondYield' | 'currencyScore' | 'confidence';
type SortDir = 'asc' | 'desc';

function TrendArrow({ trend }: { trend: Trend }) {
  if (trend === 'up') return <ArrowUp className="h-3.5 w-3.5 text-bull-400" />;
  if (trend === 'down') return <ArrowDown className="h-3.5 w-3.5 text-bear-400" />;
  return <Minus className="h-3.5 w-3.5 text-warn-400" />;
}

function statusColor(status: 'bullish' | 'bearish' | 'neutral') {
  if (status === 'bullish') return 'text-bull-400';
  if (status === 'bearish') return 'text-bear-400';
  return 'text-warn-400';
}

function signalColor(signal: string) {
  if (signal === 'Strong Buy') return 'text-bull-300 bg-bull-500/15 border-bull-500/40';
  if (signal === 'Buy') return 'text-bull-400 bg-bull-500/10 border-bull-500/30';
  if (signal === 'Neutral') return 'text-warn-400 bg-warn-500/10 border-warn-500/30';
  if (signal === 'Sell') return 'text-bear-400 bg-bear-500/10 border-bear-500/30';
  return 'text-bear-300 bg-bear-500/15 border-bear-500/40';
}

function stanceColor(stance: string) {
  if (stance === 'Risk On') return '#10b981';
  if (stance === 'Risk Off') return '#ef4444';
  return '#fbbf24';
}

function RiskGaugeDial({ gauge }: { gauge: RiskGauge }) {
  const color = stanceColor(gauge.stance);
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (gauge.value / 100) * circ;
  const delta = gauge.value - gauge.prevValue;
  return (
    <div className="flex flex-col items-center rounded-lg border border-ink-700/60 bg-ink-850 p-3">
      <div className="relative flex h-28 w-28 items-center justify-center">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#1a2236" strokeWidth="7" />
          <circle
            cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="font-mono text-xl font-bold" style={{ color }}>{gauge.value}</span>
          <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color }}>{gauge.stance}</span>
        </div>
      </div>
      <p className="mt-1.5 text-xs font-semibold text-slate-200">{gauge.label}</p>
      <p className="mt-0.5 flex items-center gap-1 text-[10px]">
        <span className={delta >= 0 ? 'text-bull-400' : 'text-bear-400'}>
          {delta >= 0 ? '+' : ''}{delta}
        </span>
        <span className="text-slate-600">vs prev</span>
      </p>
      <p className="mt-1 text-center text-[10px] leading-relaxed text-slate-500">{gauge.description}</p>
    </div>
  );
}

function SummaryCard({ card }: { card: GlobalSummaryCard }) {
  const delta = parseFloat(card.value) - parseFloat(card.prevValue);
  const deltaUp = delta >= 0;
  return (
    <div className="card relative overflow-hidden p-4">
      <div className={`absolute inset-x-0 top-0 h-0.5 ${card.status === 'bullish' ? 'bg-bull-500' : card.status === 'bearish' ? 'bg-bear-500' : 'bg-warn-500'}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{card.label}</p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-slate-100">{card.value}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px]">
            <span className={`flex items-center gap-0.5 ${deltaUp ? 'text-bull-400' : 'text-bear-400'}`}>
              {deltaUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {card.prevValue}
            </span>
            <span className={`font-semibold uppercase ${statusColor(card.status)}`}>{card.status}</span>
          </p>
        </div>
        <TrendArrow trend={card.trend} />
      </div>
      <div className="mt-2 -mx-1">
        <SeriesChart data={card.miniChart} dataKey="value" color={card.status === 'bullish' ? '#10b981' : card.status === 'bearish' ? '#ef4444' : '#fbbf24'} type="area" height={50} />
      </div>
    </div>
  );
}

function WorldMap({ countries, hovered, setHovered }: { countries: GlobalMacroCountry[]; hovered: string | null; setHovered: (c: string | null) => void }) {
  const hoveredCountry = countries.find((c) => c.code === hovered);
  return (
    <div className="relative">
      <div className="relative aspect-[2.1/1] w-full overflow-hidden rounded-lg border border-ink-700/60 bg-ink-900">
        {/* Simplified world map background */}
        <svg viewBox="0 0 100 50" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          {/* Continent outlines (simplified blobs) */}
          <g fill="#111726" stroke="#1a2236" strokeWidth="0.15">
            {/* North America */}
            <path d="M10,18 Q14,14 22,16 L26,22 Q24,28 20,30 L14,28 Q10,24 10,18 Z" />
            {/* South America */}
            <path d="M26,32 Q28,30 30,32 L31,40 Q29,44 27,42 L26,36 Z" />
            {/* Europe */}
            <path d="M46,24 Q50,22 54,26 L52,32 Q48,33 46,30 Z" />
            {/* Africa */}
            <path d="M48,34 Q52,32 54,36 L53,44 Q50,46 48,44 L47,38 Z" />
            {/* Asia */}
            <path d="M56,22 Q66,18 78,22 L84,28 Q80,34 70,32 L60,30 Q56,28 56,24 Z" />
            {/* Australia */}
            <path d="M80,40 Q84,38 86,40 L85,44 Q82,45 80,43 Z" />
          </g>
        </svg>

        {/* Country dots */}
        {countries.map((c) => {
          const cls = heatmapClasses(c.currencyScore);
          const isHovered = hovered === c.code;
          return (
            <button
              key={c.code}
              onMouseEnter={() => setHovered(c.code)}
              onMouseLeave={() => setHovered(null)}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-125"
              style={{ left: `${c.mapX}%`, top: `${c.mapY}%` }}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${cls.border} ${cls.bg} ${isHovered ? 'h-7 w-7 shadow-glow' : ''} transition-all`}
                title={`${c.code} — ${c.currencyScore}`}
              >
                <span className="text-[8px] font-bold">{c.flag}</span>
              </span>
            </button>
          );
        })}

        {/* Legend */}
        <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-md bg-ink-900/80 px-2 py-1 text-[9px]">
          <span className="text-slate-500">Score:</span>
          {[
            { label: 'Strong', cls: 'bg-emerald-600' },
            { label: 'Bullish', cls: 'bg-emerald-500/70' },
            { label: 'Neutral', cls: 'bg-slate-600/60' },
            { label: 'Weak', cls: 'bg-orange-500/70' },
            { label: 'Very Weak', cls: 'bg-red-600' },
          ].map((l) => (
            <span key={l.label} className="flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${l.cls}`} />
              <span className="text-slate-400">{l.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {hoveredCountry && (
        <div className="absolute right-2 top-2 z-10 w-48 animate-fade-in rounded-lg border border-ink-600 bg-ink-900 p-3 shadow-2xl">
          <div className="mb-2 flex items-center gap-2 border-b border-ink-700/60 pb-1.5">
            <span className="text-lg">{hoveredCountry.flag}</span>
            <div>
              <p className="text-xs font-bold text-slate-100">{hoveredCountry.code}</p>
              <p className="text-[10px] text-slate-500">{hoveredCountry.name}</p>
            </div>
            <span className={`ml-auto font-mono text-sm font-bold ${scoreColor(hoveredCountry.currencyScore)}`}>{hoveredCountry.currencyScore}</span>
          </div>
          <div className="space-y-1 text-[11px]">
            {[
              ['Interest Rate', hoveredCountry.interestRate],
              ['Inflation', hoveredCountry.inflation],
              ['GDP', hoveredCountry.gdp],
              ['Employment', hoveredCountry.unemployment],
              ['PMI', hoveredCountry.pmi],
              ['Retail Sales', hoveredCountry.retailSales],
              ['Trade Balance', hoveredCountry.tradeBalance],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between">
                <span className="text-slate-500">{label}</span>
                <span className="font-mono text-slate-300">{val}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-ink-700/60 pt-1">
              <span className="text-slate-500">AI Strength</span>
              <span className={`font-mono font-bold ${scoreColor(hoveredCountry.currencyScore)}`}>{hoveredCountry.currencyScore}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MacroTable({ countries }: { countries: GlobalMacroCountry[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('currencyScore');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sorted = useMemo(() => {
    const rows = [...countries];
    rows.sort((a, b) => {
      let av: number | string;
      let bv: number | string;
      if (sortKey === 'interestRate' || sortKey === 'inflation' || sortKey === 'gdp' || sortKey === 'unemployment' || sortKey === 'pmi' || sortKey === 'bondYield') {
        av = parseFloat(a[sortKey]);
        bv = parseFloat(b[sortKey]);
      } else if (sortKey === 'name' || sortKey === 'code') {
        av = a[sortKey];
        bv = b[sortKey];
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
  }, [countries, sortKey, sortDir]);

  const toggle = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortHeader = ({ label, k, align = 'left' }: { label: string; k: SortKey; align?: 'left' | 'center' | 'right' }) => {
    const active = sortKey === k;
    return (
      <th
        onClick={() => toggle(k)}
        className={`cursor-pointer select-none px-3 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors hover:text-slate-300 ${
          align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
        } ${active ? 'text-accent-300' : 'text-slate-500'}`}
      >
        <span className={`inline-flex items-center gap-1 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
          {label}
          {active ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ChevronDown className="h-3 w-3 opacity-0" />}
        </span>
      </th>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink-700/60">
            <SortHeader label="Country" k="name" />
            <SortHeader label="Currency" k="code" />
            <SortHeader label="Interest Rate" k="interestRate" align="right" />
            <SortHeader label="Inflation" k="inflation" align="right" />
            <SortHeader label="GDP" k="gdp" align="right" />
            <SortHeader label="Employment" k="unemployment" align="right" />
            <SortHeader label="PMI" k="pmi" align="right" />
            <SortHeader label="Bond Yield" k="bondYield" align="right" />
            <SortHeader label="Macro Score" k="currencyScore" align="center" />
            <SortHeader label="Trend" k="currencyScore" align="center" />
            <th className="px-3 py-2.5 text-center text-xs font-medium uppercase tracking-wider text-slate-500">Signal</th>
            <SortHeader label="Confidence" k="confidence" align="center" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((c) => (
            <tr key={c.code} className="border-b border-ink-700/40 transition-colors hover:bg-ink-800/70">
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">{c.flag}</span>
                  <span className="text-xs text-slate-300">{c.name}</span>
                </div>
              </td>
              <td className="px-3 py-2.5 font-mono text-xs font-semibold text-slate-200">{c.code}</td>
              <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-300">{c.interestRate}</td>
              <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-300">{c.inflation}</td>
              <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-300">{c.gdp}</td>
              <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-300">{c.unemployment}</td>
              <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-300">{c.pmi}</td>
              <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-300">{c.bondYield}</td>
              <td className="px-3 py-2.5">
                <div className="flex items-center justify-center gap-2">
                  <span className={`font-mono text-sm font-bold ${scoreColor(c.currencyScore)}`}>{c.currencyScore.toFixed(1)}</span>
                  <div className="h-1.5 w-12 overflow-hidden rounded-full bg-ink-700">
                    <div className={`h-full rounded-full ${scoreBg(c.currencyScore)}`} style={{ width: `${c.currencyScore}%` }} />
                  </div>
                </div>
              </td>
              <td className="px-3 py-2.5">
                <span className={`flex items-center justify-center gap-1 font-mono text-xs ${trendColor(c.trend)}`}>
                  <TrendArrow trend={c.trend} /> {c.trend}
                </span>
              </td>
              <td className="px-3 py-2.5 text-center">
                <span className={`inline-block rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase ${signalColor(c.signal)}`}>{c.signal}</span>
              </td>
              <td className="px-3 py-2.5 text-center font-mono text-xs text-slate-300">{c.confidence}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CapitalFlowDiagram() {
  const currencies = ['USD', 'EUR', 'JPY', 'GBP', 'CHF', 'CAD', 'AUD', 'NZD'];
  const inflows: Record<string, number> = {};
  const outflows: Record<string, number> = {};
  currencies.forEach((c) => { inflows[c] = 0; outflows[c] = 0; });
  capitalFlows.forEach((f) => {
    outflows[f.from] += f.flow;
    inflows[f.to] += f.flow;
  });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {currencies.map((c) => {
          const net = (inflows[c] ?? 0) - (outflows[c] ?? 0);
          const isReceiver = net > 0;
          return (
            <div key={c} className={`rounded-lg border p-2 text-center ${isReceiver ? 'border-bull-500/30 bg-bull-500/5' : 'border-bear-500/30 bg-bear-500/5'}`}>
              <p className="font-mono text-sm font-bold text-slate-100">{c}</p>
              <p className={`font-mono text-xs font-semibold ${isReceiver ? 'text-bull-400' : 'text-bear-400'}`}>
                {net >= 0 ? '+' : ''}{net}
              </p>
              <p className="text-[9px] text-slate-500">{isReceiver ? 'Inflow' : 'Outflow'}</p>
            </div>
          );
        })}
      </div>

      {/* Flow bars */}
      <div className="space-y-1.5">
        {capitalFlows.map((f, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-10 font-mono text-xs font-semibold text-bear-400">{f.from}</span>
            <div className="relative flex-1">
              <div className="h-5 overflow-hidden rounded-md bg-ink-850">
                <div
                  className="flex h-full items-center justify-end rounded-md bg-gradient-to-r from-bear-500/40 to-accent-500/40 transition-all duration-500"
                  style={{ width: `${Math.max((f.flow / 42) * 100, 8)}%` }}
                >
                  <span className="px-2 font-mono text-[10px] font-bold text-white">{f.flow}</span>
                </div>
              </div>
            </div>
            <span className="w-10 font-mono text-xs font-semibold text-bull-400">{f.to}</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-500">Flow values represent relative institutional capital movement. Red = source currency, blue = destination currency.</p>
    </div>
  );
}

function OpportunityRow({ opp }: { opp: MacroOpportunity }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-ink-700/60 bg-ink-850 p-2.5">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-ink-700 font-mono text-[10px] font-bold text-slate-300">{opp.rank}</span>
      <span className="font-mono text-xs font-semibold text-slate-200">{opp.pair}</span>
      <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase ${opp.direction === 'buy' ? 'text-bull-400 bg-bull-500/10 border-bull-500/30' : 'text-bear-400 bg-bear-500/10 border-bear-500/30'}`}>{opp.direction}</span>
      <span className={`font-mono text-xs font-bold ${scoreColor(opp.score)}`}>{opp.score}</span>
      <span className="ml-auto text-[10px] text-slate-500">{opp.confidence}% conf</span>
    </div>
  );
}

export default function GlobalMacroPage() {
  const [hovered, setHovered] = useState<string | null>(null);

  const { data: apiCurrencies, lastUpdated, offline, refetch } = useApiDataWithFallback(
    '/api/currencies',
    [],
    30000,
    adaptCurrencies,
  );

  const countries = apiCurrencies.length > 0 ? adaptToGlobalCountries(apiCurrencies) : globalMacroCountries;

  const strongest = useMemo(() => [...countries].sort((a, b) => b.currencyScore - a.currencyScore), [countries]);
  const weakest = useMemo(() => [...countries].sort((a, b) => a.currencyScore - b.currencyScore), [countries]);
  const buyIdeas = useMemo(() => macroOpportunities.filter((o) => o.direction === 'buy').slice(0, 5), []);
  const sellIdeas = useMemo(() => macroOpportunities.filter((o) => o.direction === 'sell').slice(0, 5), []);

  return (
    <div className="space-y-5">
      <DataStatus lastUpdated={lastUpdated} offline={offline} onRetry={refetch} />
      <div className="flex items-center gap-2">
        <Globe className="h-5 w-5 text-accent-400" />
        <div>
          <h2 className="text-lg font-bold text-slate-100">Global Macro Intelligence</h2>
          <p className="text-sm text-slate-500">Command center for the world economy — real-time macro intelligence across all major economies</p>
        </div>
      </div>

      {/* TOP SUMMARY */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {globalSummaryCards.map((card) => (
          <SummaryCard key={card.id} card={card} />
        ))}
      </div>

      {/* WORLD MAP */}
      <div className="card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Globe className="h-4 w-4 text-accent-400" />
          <p className="section-title">Interactive World Map — AI Strength Scores</p>
        </div>
        <WorldMap countries={countries} hovered={hovered} setHovered={setHovered} />
      </div>

      {/* GLOBAL MACRO TABLE */}
      <div className="card overflow-hidden">
        <div className="border-b border-ink-700/60 px-4 py-2.5">
          <p className="section-title">Global Macro Table</p>
        </div>
        <MacroTable countries={countries} />
      </div>

      {/* GLOBAL RISK MONITOR */}
      <div className="card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-accent-400" />
          <p className="section-title">Global Risk Monitor</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {riskGauges.map((g) => (
            <RiskGaugeDial key={g.id} gauge={g} />
          ))}
        </div>
      </div>

      {/* AI GLOBAL SUMMARY */}
      <div className="card relative overflow-hidden p-5">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-accent-500 via-bull-500 to-accent-500" />
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent-400" />
          <p className="section-title">AI Global Summary</p>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-accent-300">Current Global Macro Regime</p>
              <p className="text-sm leading-relaxed text-slate-300">{globalAiSummary.regime}</p>
            </div>
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-bull-400">Most Bullish Economies</p>
              <p className="text-sm leading-relaxed text-slate-300">{globalAiSummary.bullishEconomies}</p>
            </div>
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-bear-400">Weakest Economies</p>
              <p className="text-sm leading-relaxed text-slate-300">{globalAiSummary.weakestEconomies}</p>
            </div>
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-warn-400">Central Bank Divergence</p>
              <p className="text-sm leading-relaxed text-slate-300">{globalAiSummary.centralBankDivergence}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-bear-400">Largest Risks</p>
              <p className="text-sm leading-relaxed text-slate-300">{globalAiSummary.largestRisks}</p>
            </div>
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-accent-300">Expected Market Rotation</p>
              <p className="text-sm leading-relaxed text-slate-300">{globalAiSummary.marketRotation}</p>
            </div>
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-bull-400">Currency Outlook</p>
              <p className="text-sm leading-relaxed text-slate-300">{globalAiSummary.currencyOutlook}</p>
            </div>
          </div>
        </div>
      </div>

      {/* CAPITAL FLOW */}
      <div className="card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Waves className="h-4 w-4 text-accent-400" />
          <p className="section-title">Capital Flow — Institutional Money Movement</p>
        </div>
        <CapitalFlowDiagram />
      </div>

      {/* BOTTOM: OPPORTUNITIES */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <div className="card p-4">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-bull-400" />
            <p className="section-title">Top 10 Strongest Currencies</p>
          </div>
          <div className="space-y-1.5">
            {strongest.map((c, i) => (
              <div key={c.code} className="flex items-center gap-2 rounded-md border border-ink-700/50 bg-ink-850 px-2.5 py-1.5">
                <span className="w-4 font-mono text-[10px] font-bold text-slate-500">{i + 1}</span>
                <span className="text-sm">{c.flag}</span>
                <span className="font-mono text-xs font-semibold text-slate-200">{c.code}</span>
                <div className="flex-1">
                  <div className="h-1.5 overflow-hidden rounded-full bg-ink-700">
                    <div className={`h-full rounded-full ${scoreBg(c.currencyScore)}`} style={{ width: `${c.currencyScore}%` }} />
                  </div>
                </div>
                <span className={`font-mono text-xs font-bold ${scoreColor(c.currencyScore)}`}>{c.currencyScore.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <div className="mb-3 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-bear-400" />
            <p className="section-title">Top 10 Weakest Currencies</p>
          </div>
          <div className="space-y-1.5">
            {weakest.map((c, i) => (
              <div key={c.code} className="flex items-center gap-2 rounded-md border border-ink-700/50 bg-ink-850 px-2.5 py-1.5">
                <span className="w-4 font-mono text-[10px] font-bold text-slate-500">{i + 1}</span>
                <span className="text-sm">{c.flag}</span>
                <span className="font-mono text-xs font-semibold text-slate-200">{c.code}</span>
                <div className="flex-1">
                  <div className="h-1.5 overflow-hidden rounded-full bg-ink-700">
                    <div className={`h-full rounded-full ${scoreBg(c.currencyScore)}`} style={{ width: `${c.currencyScore}%` }} />
                  </div>
                </div>
                <span className={`font-mono text-xs font-bold ${scoreColor(c.currencyScore)}`}>{c.currencyScore.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-bull-400" />
            <p className="section-title">Top Buy Ideas</p>
          </div>
          <div className="space-y-1.5">
            {buyIdeas.map((o) => (
              <OpportunityRow key={o.rank} opp={o} />
            ))}
          </div>
        </div>

        <div className="card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-bear-400" />
            <p className="section-title">Top Sell Ideas</p>
          </div>
          <div className="space-y-1.5">
            {sellIdeas.map((o) => (
              <OpportunityRow key={o.rank} opp={o} />
            ))}
          </div>
        </div>
      </div>

      {/* Expected volatility */}
      <div className="card p-4">
        <div className="mb-3 flex items-center gap-2">
          <LineChart className="h-4 w-4 text-accent-400" />
          <p className="section-title">Expected Volatility</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {macroOpportunities.slice(0, 10).map((o) => (
            <div key={o.rank} className="rounded-lg border border-ink-700/60 bg-ink-850 p-2.5">
              <p className="font-mono text-xs font-semibold text-slate-200">{o.pair}</p>
              <p className={`mt-0.5 text-[10px] font-bold uppercase ${
                o.volatility === 'Very High' ? 'text-bear-400' : o.volatility === 'High' ? 'text-orange-400' : o.volatility === 'Medium' ? 'text-warn-400' : 'text-bull-400'
              }`}>{o.volatility}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
