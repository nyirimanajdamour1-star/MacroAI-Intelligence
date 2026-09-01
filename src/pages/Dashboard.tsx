import { useState, useCallback } from 'react';
import {
  Coins,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Activity,
  CalendarClock,
  Sparkles,
  Gauge,
  Newspaper,
  Star,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';
import {
  currencies as mockCurrencies,
  macroIndicators,
  newsItems as mockNewsItems,
  getStrongestCurrency,
  getWeakestCurrency,
  getMarketRiskLevel,
  getHighImpactEventCountToday,
  getAverageCurrencyStrength,
  getAIMarketBias,
} from '@/data/mockData';
import { adaptGlobalRisk, adaptCalendarEvents } from '@/lib/adapters';
import {
  scoreColor,
  scoreBg,
  trendColor,
  trendIcon,
  ratingColor,
  sentimentBg,
  sentimentColor,
  sentimentModeColor,
  directionColor,
} from '@/utils/format';
import type { Currency } from '@/types';
import { SeriesChart, BarSeries } from '@/components/Charts';
import Heatmap from '@/components/Heatmap';
import SentimentGauge from '@/components/SentimentGauge';
import Watchlist from '@/components/Watchlist';
import Widget from '@/components/Widget';
import { useApiDataWithFallback } from '@/hooks/useApiData';
import { adaptCurrencies, adaptNewsItems, adaptMacroIndicators } from '@/lib/adapters';
import { DataStatus } from '@/components/LoadingPlaceholder';

interface DashboardProps {
  onSelectCurrency: (c: Currency) => void;
  selectedCode: string | null;
}

const widgetIds = [
  'strongest',
  'weakest',
  'risk',
  'avg',
  'events',
  'bias',
  'heatmap',
  'sentiment',
  'strength-chart',
  'macro-chart',
  'rate-chart',
  'inflation-chart',
  'gdp-chart',
  'bond-chart',
  'live-data',
  'watchlist',
  'news',
] as const;
type WidgetId = (typeof widgetIds)[number];

export default function Dashboard({ onSelectCurrency, selectedCode }: DashboardProps) {
  const { data: currencies, loading, lastUpdated, offline, refetch } = useApiDataWithFallback(
    '/api/currencies',
    mockCurrencies,
    30000,
    adaptCurrencies,
  );

  const { data: newsItems } = useApiDataWithFallback(
    '/api/news',
    mockNewsItems,
    300000,
    adaptNewsItems,
  );

  const { data: usIndicators } = useApiDataWithFallback(
    '/api/macro?country=US',
    macroIndicators.USD,
    300000,
    adaptMacroIndicators,
  );

  const { data: globalRisk } = useApiDataWithFallback(
    '/api/global-risk',
    null,
    30000,
    adaptGlobalRisk,
  );

  const { data: calendarEvents } = useApiDataWithFallback(
    '/api/calendar?limit=50',
    [],
    60000,
    adaptCalendarEvents,
  );

  const strongest = currencies[0] ?? getStrongestCurrency();
  const weakest = currencies[currencies.length - 1] ?? getWeakestCurrency();
  const risk = globalRisk
    ? { level: globalRisk.mode === 'Risk On' ? 'Low' : globalRisk.mode === 'Risk Off' ? 'High' : 'Moderate', score: globalRisk.riskScore }
    : getMarketRiskLevel();
  const eventCount = calendarEvents.length > 0
    ? calendarEvents.filter((e) => e.impact === 'high').length
    : getHighImpactEventCountToday();
  const avgStrength = currencies.length > 0 ? currencies.reduce((s, c) => s + c.score, 0) / currencies.length : getAverageCurrencyStrength();
  const aiBias = globalRisk
    ? { bias: globalRisk.mode, score: globalRisk.riskScore, description: globalRisk.description }
    : getAIMarketBias();

  const [order, setOrder] = useState<WidgetId[]>([...widgetIds]);
  const [dragId, setDragId] = useState<WidgetId | null>(null);

  const handleDragStart = useCallback((id: WidgetId) => setDragId(id), []);
  const handleDragEnter = useCallback(
    (id: WidgetId) => {
      if (dragId === null || dragId === id) return;
      setOrder((prev) => {
        const next = [...prev];
        const from = next.indexOf(dragId);
        const to = next.indexOf(id);
        if (from === -1 || to === -1) return prev;
        next.splice(from, 1);
        next.splice(to, 0, dragId);
        return next;
      });
    },
    [dragId],
  );
  const handleDragEnd = useCallback(() => setDragId(null), []);

  const dragProps = (id: WidgetId) => ({
    onDragStart: () => handleDragStart(id),
    onDragEnter: () => handleDragEnter(id),
    onDragEnd: handleDragEnd,
    dragging: dragId === id,
  });

  const renderWidget = (id: WidgetId, draggable = false) => {
    const dp = draggable ? dragProps(id) : {};
    switch (id) {
      case 'strongest':
        return (
          <Widget title="Strongest Currency" subtitle="Highest AI composite score" badge="Bullish" {...dp}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{strongest.flag}</span>
              <div>
                <p className="text-xl font-bold text-slate-100">{strongest.code}</p>
                <p className="text-xs text-slate-500">{strongest.name}</p>
              </div>
              <div className="ml-auto text-right">
                <p className={`font-mono text-2xl font-bold ${scoreColor(strongest.score)}`}>{strongest.score.toFixed(1)}</p>
                <p className="text-[11px] text-slate-500">{strongest.aiRating}</p>
              </div>
            </div>
          </Widget>
        );
      case 'weakest':
        return (
          <Widget title="Weakest Currency" subtitle="Lowest AI composite score" badge="Bearish" {...dp}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{weakest.flag}</span>
              <div>
                <p className="text-xl font-bold text-slate-100">{weakest.code}</p>
                <p className="text-xs text-slate-500">{weakest.name}</p>
              </div>
              <div className="ml-auto text-right">
                <p className={`font-mono text-2xl font-bold ${scoreColor(weakest.score)}`}>{weakest.score.toFixed(1)}</p>
                <p className="text-[11px] text-slate-500">{weakest.aiRating}</p>
              </div>
            </div>
          </Widget>
        );
      case 'risk':
        return (
          <Widget title="Global Risk Sentiment" subtitle="Composite risk indicator" {...dp}>
            <div className="flex items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${risk.level === 'High' ? 'bg-bear-500/10' : risk.level === 'Elevated' ? 'bg-warn-500/10' : 'bg-bull-500/10'}`}>
                <ShieldAlert className={`h-5 w-5 ${risk.level === 'High' ? 'text-bear-400' : risk.level === 'Elevated' ? 'text-warn-400' : 'text-bull-400'}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-100">{risk.level}</p>
                <p className="text-xs text-slate-500">Score {risk.score}/100</p>
              </div>
              <div className="ml-auto h-2 w-20 overflow-hidden rounded-full bg-ink-700">
                <div className={`h-full rounded-full ${risk.level === 'High' ? 'bg-bear-500' : risk.level === 'Elevated' ? 'bg-warn-500' : 'bg-bull-500'}`} style={{ width: `${risk.score}%` }} />
              </div>
            </div>
          </Widget>
        );
      case 'avg':
        return (
          <Widget title="Average Currency Strength" subtitle="Mean across all majors" {...dp}>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent-500/10">
                <Activity className="h-5 w-5 text-accent-400" />
              </div>
              <div>
                <p className="font-mono text-2xl font-bold text-slate-100">{avgStrength.toFixed(1)}</p>
                <p className="text-xs text-slate-500">across {currencies.length} currencies</p>
              </div>
            </div>
          </Widget>
        );
      case 'events':
        return (
          <Widget title="High Impact Events Today" subtitle="Scheduled economic releases" {...dp}>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-warn-500/10">
                <CalendarClock className="h-5 w-5 text-warn-400" />
              </div>
              <div>
                <p className="font-mono text-2xl font-bold text-slate-100">{eventCount}</p>
                <p className="text-xs text-slate-500">high-impact events</p>
              </div>
            </div>
          </Widget>
        );
      case 'bias':
        return (
          <Widget title="AI Market Bias" subtitle="Aggregate AI directional view" {...dp}>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent-500/10">
                <Sparkles className="h-5 w-5 text-accent-400" />
              </div>
              <div>
                <p className={`text-lg font-bold ${sentimentModeColor(aiBias.bias)}`}>{aiBias.bias}</p>
                <p className="text-[11px] text-slate-500">{aiBias.description}</p>
              </div>
            </div>
          </Widget>
        );
      case 'heatmap':
        return (
          <Widget title="Currency Heatmap" subtitle="Click a tile for AI analysis" badge="Live" className="lg:col-span-2" {...dp}>
            <Heatmap onSelect={onSelectCurrency} selectedCode={selectedCode} />
          </Widget>
        );
      case 'sentiment':
        return (
          <Widget title="Market Sentiment Gauge" subtitle="Risk On / Risk Off indicator" {...dp}>
            <SentimentGauge />
          </Widget>
        );
      case 'strength-chart':
        return (
          <Widget title="Currency Strength History" subtitle="12-month AI composite score" className="lg:col-span-2" {...dp}>
            <BarSeries data={currencies.map((c) => ({ name: c.code, value: c.score }))} height={240} />
          </Widget>
        );
      case 'macro-chart':
        return (
          <Widget title="Macro Score History" subtitle="USD macro composite trend" {...dp}>
            <SeriesChart data={currencies[0]?.history ?? []} dataKey="score" color="#3b82f6" height={200} type="area" />
          </Widget>
        );
      case 'rate-chart':
        return (
          <Widget title="Interest Rate Trend" subtitle="Fed funds rate history" {...dp}>
            <SeriesChart data={usIndicators[0]?.history ?? []} dataKey="value" color="#3b82f6" height={200} type="line" />
          </Widget>
        );
      case 'inflation-chart':
        return (
          <Widget title="Inflation Trend" subtitle="US CPI YoY" {...dp}>
            <SeriesChart data={usIndicators[1]?.history ?? []} dataKey="value" color="#f59e0b" height={200} type="area" />
          </Widget>
        );
      case 'gdp-chart':
        return (
          <Widget title="GDP Trend" subtitle="US GDP growth annualized" {...dp}>
            <SeriesChart data={usIndicators[2]?.history ?? []} dataKey="value" color="#10b981" height={200} type="line" />
          </Widget>
        );
      case 'bond-chart':
        return (
          <Widget title="Bond Yield Trend" subtitle="US 10Y Treasury yield" {...dp}>
            <SeriesChart data={usIndicators[7]?.history ?? []} dataKey="value" color="#f97316" height={200} type="area" />
          </Widget>
        );
      case 'live-data':
        return (
          <Widget title="Live Data Widgets" subtitle="Key macro indicators with AI interpretation" className="lg:col-span-2" {...dp}>
            <LiveDataGrid indicators={usIndicators} />
          </Widget>
        );
      case 'watchlist':
        return (
          <Widget title="Watchlist" subtitle="Favorite currency pairs" badge="8 pairs" {...dp}>
            <Watchlist />
          </Widget>
        );
      case 'news':
        return (
          <Widget title="Recent News" subtitle="Latest macro and FX headlines" className="lg:col-span-2" {...dp}>
            <NewsFeed news={newsItems} />
          </Widget>
        );
    }
  };

  // Layout: summary cards in a row, then a responsive grid for the rest
  const summaryIds: WidgetId[] = ['strongest', 'weakest', 'risk', 'avg', 'events', 'bias'];
  const restIds = order.filter((id) => !summaryIds.includes(id));

  return (
    <div className="space-y-5">
      <DataStatus lastUpdated={lastUpdated} offline={offline} loading={loading} onRetry={refetch} />
      {/* Summary cards row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {summaryIds.map((id) => (
          <div key={id} className="animate-fade-in">
            {renderWidget(id)}
          </div>
        ))}
      </div>

      {/* Draggable widget grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {restIds.map((id) => (
          <div
            key={id}
            className={`animate-fade-in ${id === 'heatmap' || id === 'strength-chart' || id === 'live-data' || id === 'news' ? 'lg:col-span-2 xl:col-span-2' : ''}`}
          >
            {renderWidget(id, true)}
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveDataGrid({ indicators }: { indicators: typeof macroIndicators.USD }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {indicators.map((ind) => {
        const isUp = ind.changePct > 0;
        const isFlat = ind.changePct === 0;
        return (
          <div key={ind.id} className="rounded-lg border border-ink-700/60 bg-ink-850 p-3">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{ind.name}</p>
              <span className={`stat-chip ${sentimentBg(ind.sentiment)}`}>{ind.sentiment}</span>
            </div>
            <p className="font-mono text-lg font-bold text-slate-100">{ind.value}</p>
            <div className="mt-1 flex items-center gap-1.5 text-[10px]">
              <span className="text-slate-500">Prev {ind.previous}</span>
              <span className={`flex items-center gap-0.5 font-mono ${isUp ? 'text-bull-400' : isFlat ? 'text-warn-400' : 'text-bear-400'}`}>
                {isUp ? <ArrowUp className="h-2.5 w-2.5" /> : isFlat ? <Minus className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
                {ind.change}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NewsFeed({ news }: { news: typeof mockNewsItems }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {news.slice(0, 6).map((n) => (
        <div key={n.id} className="rounded-lg border border-ink-700/60 bg-ink-850 p-3">
          <div className="mb-1.5 flex items-center gap-2 text-[10px]">
            <span className={`flex items-center gap-1 font-medium capitalize ${n.impact === 'high' ? 'text-bear-400' : n.impact === 'medium' ? 'text-warn-400' : 'text-accent-400'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${n.impact === 'high' ? 'bg-bear-500' : n.impact === 'medium' ? 'bg-warn-500' : 'bg-accent-500'}`} />
              {n.impact}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-500">{n.source}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-500">{n.time}</span>
          </div>
          <h4 className="text-xs font-semibold leading-snug text-slate-200">{n.title}</h4>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{n.summary}</p>
        </div>
      ))}
    </div>
  );
}
