import { useMemo, useState } from 'react';
import { tradePanelData, tradePanelSymbols, tradeDirectionColor } from '@/data/extendedData';
import { CandlestickChart, VolumeChart } from '@/components/CandlestickChart';
import { scoreColor, scoreBg, trendColor } from '@/utils/format';
import { useApiDataWithFallback } from '@/hooks/useApiData';
import { DataStatus } from '@/components/LoadingPlaceholder';
import type { Candle, MacroFactorCard, Trend, TradeDirection, RiskLevel } from '@/types';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Brain,
  Calendar,
  ChevronRight,
  Clock,
  Crosshair,
  Gauge,
  Globe,
  Landmark,
  Minus,
  Search,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';

function TrendArrow({ trend }: { trend: Trend }) {
  if (trend === 'up') return <ArrowUp className="h-3.5 w-3.5 text-bull-400" />;
  if (trend === 'down') return <ArrowDown className="h-3.5 w-3.5 text-bear-400" />;
  return <Minus className="h-3.5 w-3.5 text-warn-400" />;
}

function biasColor(bias: 'bullish' | 'bearish' | 'neutral') {
  if (bias === 'bullish') return 'text-bull-400';
  if (bias === 'bearish') return 'text-bear-400';
  return 'text-warn-400';
}

function riskColor(level: RiskLevel) {
  if (level === 'Low') return 'text-bull-400 bg-bull-500/10 border-bull-500/30';
  if (level === 'Medium') return 'text-warn-400 bg-warn-500/10 border-warn-500/30';
  if (level === 'High') return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
  return 'text-bear-400 bg-bear-500/10 border-bear-500/30';
}

function gaugeColor(score: number) {
  if (score >= 70) return '#10b981';
  if (score >= 50) return '#fbbf24';
  if (score >= 35) return '#f97316';
  return '#ef4444';
}

function gaugeLabel(score: number) {
  if (score >= 70) return 'Bullish';
  if (score >= 50) return 'Neutral';
  if (score >= 35) return 'Bearish';
  return 'Strong Bear';
}

function ScoreGauge({ score }: { score: number }) {
  const color = gaugeColor(score);
  const radius = 70;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative flex h-44 w-44 items-center justify-center">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#1a2236" strokeWidth="10" />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.4s' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-mono text-4xl font-bold" style={{ color }}>{score}</span>
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color }}>{gaugeLabel(score)}</span>
      </div>
    </div>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="font-mono font-bold" style={{ color }}>{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-ink-700">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function MacroFactorRow({ factor }: { factor: MacroFactorCard }) {
  return (
    <div className="rounded-lg border border-ink-700/60 bg-ink-850 p-2.5 transition-colors hover:border-ink-500/60">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-300">{factor.label}</span>
        <TrendArrow trend={factor.trend} />
      </div>
      <div className="mt-1.5 flex items-end justify-between">
        <div>
          <p className="font-mono text-sm font-bold text-slate-100">{factor.current}</p>
          <p className="font-mono text-[10px] text-slate-500">prev {factor.previous}</p>
        </div>
        <span className={`text-[10px] font-bold uppercase ${biasColor(factor.bias)}`}>{factor.bias}</span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-ink-700">
        <div className={`h-full rounded-full transition-all duration-500 ${scoreBg(factor.score)}`} style={{ width: `${factor.score}%` }} />
      </div>
    </div>
  );
}

function AnalysisSection({ title, text, icon: Icon }: { title: string; text: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-lg border border-ink-700/60 bg-ink-850 p-3">
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-200">
        <Icon className="h-3.5 w-3.5 text-accent-400" /> {title}
      </p>
      <p className="text-xs leading-relaxed text-slate-400">{text}</p>
    </div>
  );
}

function TradeLevel({ label, value, tone }: { label: string; value: string; tone: 'neutral' | 'bull' | 'bear' }) {
  const toneClass = tone === 'bull' ? 'text-bull-400 border-bull-500/30 bg-bull-500/5' : tone === 'bear' ? 'text-bear-400 border-bear-500/30 bg-bear-500/5' : 'text-slate-200 border-ink-700/60 bg-ink-850';
  return (
    <div className={`rounded-lg border p-2.5 ${toneClass}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-0.5 font-mono text-sm font-bold ${tone === 'bull' ? 'text-bull-400' : tone === 'bear' ? 'text-bear-400' : 'text-slate-200'}`}>{value}</p>
    </div>
  );
}

function impactColor(impact: 'high' | 'medium' | 'low') {
  if (impact === 'high') return 'bg-bear-500';
  if (impact === 'medium') return 'bg-warn-500';
  return 'bg-accent-500';
}

function impactText(impact: 'high' | 'medium' | 'low') {
  if (impact === 'high') return 'text-bear-400';
  if (impact === 'medium') return 'text-warn-400';
  return 'text-accent-400';
}

function adaptTradePanelSymbols(raw: unknown) {
  const pairs = raw as { pair: string; base: string; quote: string; price?: number; signal?: string; confidence?: number }[];
  if (!pairs?.length) return null;
  return pairs.slice(0, 15).map((p) => ({
    symbol: p.pair,
    display: `${p.base}/${p.quote}`,
    name: `${p.base}/${p.quote}`,
  }));
}

export default function TradePanelPage() {
  const [query, setQuery] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('USDJPY');
  const [searchOpen, setSearchOpen] = useState(false);

  const { data: apiSymbols, lastUpdated, offline, refetch } = useApiDataWithFallback(
    '/api/pairs',
    null as typeof tradePanelSymbols | null,
    30000,
    adaptTradePanelSymbols,
  );

  const symbols = apiSymbols ?? tradePanelSymbols;

  const data = useMemo(
    () => tradePanelData.find((d) => d.symbol === selectedSymbol) ?? tradePanelData[0],
    [selectedSymbol],
  );

  const filteredSymbols = useMemo(() => {
    if (!query) return symbols;
    const q = query.toUpperCase();
    return symbols.filter((s) => s.symbol.includes(q) || s.display.includes(q) || s.name.toUpperCase().includes(q));
  }, [query, symbols]);

  const contributionData = useMemo(() => {
    const s = data.compositeScores;
    const total = s.macro + s.technical + s.sentiment + s.liquidity;
    return [
      { label: 'Macro', value: s.macro, pct: Math.round((s.macro / total) * 100), color: '#3b82f6' },
      { label: 'Technical', value: s.technical, pct: Math.round((s.technical / total) * 100), color: '#10b981' },
      { label: 'Sentiment', value: s.sentiment, pct: Math.round((s.sentiment / total) * 100), color: '#fbbf24' },
      { label: 'Liquidity', value: s.liquidity, pct: Math.round((s.liquidity / total) * 100), color: '#a78bfa' },
    ];
  }, [data]);

  return (
    <div className="space-y-4">
      <DataStatus lastUpdated={lastUpdated} offline={offline} onRetry={refetch} />
      {/* Header */}
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-accent-400" />
        <div>
          <h2 className="text-lg font-bold text-slate-100">AI Trade Panel</h2>
          <p className="text-sm text-slate-500">The brain of MacroAI — institutional-grade trade intelligence</p>
        </div>
      </div>

      {/* Search box */}
      <div className="relative">
        <div className="flex items-center gap-2 rounded-xl border border-ink-700/60 bg-ink-850 px-4 py-2.5">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search any pair: EURUSD, USDJPY, GBPUSD, XAUUSD, BTCUSD..."
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-500 hover:text-slate-300">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {searchOpen && filteredSymbols.length > 0 && (
          <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-ink-700/60 bg-ink-900 shadow-2xl">
            {filteredSymbols.map((s) => (
              <button
                key={s.symbol}
                onClick={() => { setSelectedSymbol(s.symbol); setQuery(''); setSearchOpen(false); }}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-ink-800"
              >
                <div>
                  <span className="font-mono text-sm font-semibold text-slate-200">{s.display}</span>
                  <span className="ml-2 text-xs text-slate-500">{s.name}</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Top: pair summary */}
      <div className="card relative overflow-hidden p-4">
        <div className="absolute inset-x-0 top-0 h-0.5" style={{ backgroundColor: gaugeColor(data.aiScore) }} />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-mono text-2xl font-bold text-slate-100">{data.display}</p>
              <p className="text-xs text-slate-500">{data.name}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-lg border border-ink-700/60 bg-ink-850 px-3 py-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">AI Score</p>
              <p className="font-mono text-xl font-bold" style={{ color: gaugeColor(data.aiScore) }}>{data.aiScore}</p>
            </div>
            <div className="rounded-lg border border-ink-700/60 bg-ink-850 px-3 py-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Recommendation</p>
              <span className={`mt-0.5 inline-block rounded-md border px-2 py-0.5 text-xs font-bold uppercase ${tradeDirectionColor(data.recommendation)}`}>{data.recommendation}</span>
            </div>
            <div className="rounded-lg border border-ink-700/60 bg-ink-850 px-3 py-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Confidence</p>
              <p className={`font-mono text-xl font-bold ${scoreColor(data.confidence)}`}>{data.confidence}%</p>
            </div>
            <div className="rounded-lg border border-ink-700/60 bg-ink-850 px-3 py-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Macro Trend</p>
              <p className={`mt-0.5 flex items-center justify-center gap-1 text-xs font-bold ${trendColor(data.macroTrend)}`}>
                <TrendArrow trend={data.macroTrend} /> {data.macroTrend}
              </p>
            </div>
            <div className="rounded-lg border border-ink-700/60 bg-ink-850 px-3 py-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Technical Trend</p>
              <p className={`mt-0.5 flex items-center justify-center gap-1 text-xs font-bold ${trendColor(data.technicalTrend)}`}>
                <TrendArrow trend={data.technicalTrend} /> {data.technicalTrend}
              </p>
            </div>
            <div className="rounded-lg border border-ink-700/60 bg-ink-850 px-3 py-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Risk Level</p>
              <span className={`mt-0.5 inline-block rounded-md border px-2 py-0.5 text-xs font-bold uppercase ${riskColor(data.riskLevel)}`}>{data.riskLevel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main grid: left / center / right */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* LEFT PANEL: macro factors */}
        <div className="card p-4 lg:col-span-3">
          <div className="mb-3 flex items-center gap-2">
            <Gauge className="h-4 w-4 text-accent-400" />
            <p className="section-title">Macro Factors</p>
          </div>
          <div className="space-y-2">
            {data.macroFactors.map((f) => (
              <MacroFactorRow key={f.label} factor={f} />
            ))}
          </div>
        </div>

        {/* CENTER PANEL: composite score */}
        <div className="card p-4 lg:col-span-5">
          <div className="mb-3 flex items-center gap-2">
            <Brain className="h-4 w-4 text-accent-400" />
            <p className="section-title">AI Composite Score</p>
          </div>
          <div className="flex flex-col items-center">
            <ScoreGauge score={data.aiScore} />
            <div className="mt-4 grid w-full grid-cols-2 gap-3">
              <ScoreBar label="Macro Score" value={data.compositeScores.macro} color="#3b82f6" />
              <ScoreBar label="Technical Score" value={data.compositeScores.technical} color="#10b981" />
              <ScoreBar label="Sentiment Score" value={data.compositeScores.sentiment} color="#fbbf24" />
              <ScoreBar label="Liquidity Score" value={data.compositeScores.liquidity} color="#a78bfa" />
            </div>

            {/* Stacked contribution chart */}
            <div className="mt-5 w-full">
              <p className="section-title mb-2">Category Contribution</p>
              <div className="flex h-6 w-full overflow-hidden rounded-md">
                {contributionData.map((c) => (
                  <div
                    key={c.label}
                    className="flex items-center justify-center text-[10px] font-bold text-white transition-all"
                    style={{ width: `${c.pct}%`, backgroundColor: c.color }}
                    title={`${c.label}: ${c.pct}%`}
                  >
                    {c.pct >= 12 ? `${c.pct}%` : ''}
                  </div>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {contributionData.map((c) => (
                  <div key={c.label} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="text-[10px] text-slate-400">{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: AI analysis */}
        <div className="card p-4 lg:col-span-4">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent-400" />
            <p className="section-title">AI Analysis Report</p>
          </div>
          <div className="space-y-2.5">
            <AnalysisSection title="Market Structure" text={data.analysis.marketStructure} icon={BarChart3} />
            <AnalysisSection title="Macro Environment" text={data.analysis.macroEnvironment} icon={Globe} />
            <AnalysisSection title="Central Bank Outlook" text={data.analysis.centralBankOutlook} icon={Landmark} />
            <AnalysisSection title="Risk Factors" text={data.analysis.riskFactors} icon={AlertTriangle} />
            <AnalysisSection title="Expected Direction" text={data.analysis.expectedDirection} icon={TrendingUp} />
            <AnalysisSection title="Trade Probability" text={data.analysis.tradeProbability} icon={Target} />
          </div>
        </div>
      </div>

      {/* BOTTOM: trade setup */}
      <div className="card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Crosshair className="h-4 w-4 text-accent-400" />
          <p className="section-title">Professional Trade Setup</p>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Levels */}
          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <span className={`rounded-md border px-2.5 py-1 text-xs font-bold uppercase ${tradeDirectionColor(data.tradeSetup.direction)}`}>
                {data.tradeSetup.direction}
              </span>
              <span className="text-xs text-slate-500">Probability</span>
              <span className={`font-mono text-sm font-bold ${scoreColor(data.tradeSetup.probability)}`}>{data.tradeSetup.probability}%</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <TradeLevel label="Entry" value={data.tradeSetup.entry} tone="neutral" />
              <TradeLevel label="Stop Loss" value={data.tradeSetup.stopLoss} tone="bear" />
              <TradeLevel label="Take Profit 1" value={data.tradeSetup.takeProfit1} tone="bull" />
              <TradeLevel label="Take Profit 2" value={data.tradeSetup.takeProfit2} tone="bull" />
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <div className="flex items-center justify-between rounded-lg border border-ink-700/60 bg-ink-850 px-3 py-2">
                <span className="flex items-center gap-1.5 text-xs text-slate-400"><Shield className="h-3.5 w-3.5 text-accent-400" /> Risk/Reward</span>
                <span className="font-mono text-sm font-bold text-accent-300">{data.tradeSetup.riskReward}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-ink-700/60 bg-ink-850 px-3 py-2">
                <span className="flex items-center gap-1.5 text-xs text-slate-400"><Clock className="h-3.5 w-3.5 text-accent-400" /> Hold Time</span>
                <span className="font-mono text-sm font-bold text-slate-200">{data.tradeSetup.holdingTime}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-ink-700/60 bg-ink-850 px-3 py-2">
                <span className="flex items-center gap-1.5 text-xs text-slate-400"><Zap className="h-3.5 w-3.5 text-accent-400" /> Probability</span>
                <span className="font-mono text-sm font-bold text-slate-200">{data.tradeSetup.probability}%</span>
              </div>
            </div>
          </div>

          {/* Why this trade */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <Sparkles className="h-3.5 w-3.5 text-accent-400" /> Why this trade?
            </p>
            <ul className="space-y-1.5">
              {data.whyThisTrade.map((reason, i) => (
                <li key={i} className="flex gap-2 text-[11px] leading-relaxed text-slate-400">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-accent-500" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Chart + events */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Chart */}
        <div className="card p-4 lg:col-span-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-accent-400" />
              <p className="section-title">{data.display} Price Chart</p>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1"><span className="h-0.5 w-3 bg-accent-400" /> EMA 20</span>
              <span className="flex items-center gap-1"><span className="h-0.5 w-3 bg-warn-400" /> EMA 50</span>
              <span className="flex items-center gap-1"><span className="h-0.5 w-3" style={{ backgroundColor: '#a78bfa' }} /> EMA 200</span>
            </div>
          </div>
          <CandlestickChart candles={data.candles} height={300} />
          <div className="mt-2 border-t border-ink-700/60 pt-2">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Volume</p>
            <VolumeChart candles={data.candles} height={70} />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-ink-700/60 pt-2 text-[11px] sm:grid-cols-4">
            <div className="flex items-center justify-between rounded-md border border-ink-700/50 bg-ink-850 px-2.5 py-1.5">
              <span className="text-slate-500">ATR</span>
              <span className="font-mono text-slate-200">{data.candles[data.candles.length - 1].atr.toFixed(4)}</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-ink-700/50 bg-ink-850 px-2.5 py-1.5">
              <span className="text-bull-400">Support</span>
              <span className="font-mono text-bull-400">{data.candles[data.candles.length - 1].support.toFixed(4)}</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-ink-700/50 bg-ink-850 px-2.5 py-1.5">
              <span className="text-bear-400">Resistance</span>
              <span className="font-mono text-bear-400">{data.candles[data.candles.length - 1].resistance.toFixed(4)}</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-ink-700/50 bg-ink-850 px-2.5 py-1.5">
              <span className="text-slate-500">EMA 20/50</span>
              <span className="font-mono text-slate-200">{data.candles[data.candles.length - 1].ema20 > data.candles[data.candles.length - 1].ema50 ? 'Bull' : 'Bear'}</span>
            </div>
          </div>
        </div>

        {/* Economic events */}
        <div className="card p-4 lg:col-span-4">
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-accent-400" />
            <p className="section-title">Today's Economic Events</p>
          </div>
          <div className="space-y-2">
            {data.events.map((ev, i) => (
              <div key={i} className="rounded-lg border border-ink-700/60 bg-ink-850 p-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{ev.flag}</span>
                    <span className="text-xs font-semibold text-slate-200">{ev.country}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] text-slate-500">{ev.time}</span>
                    <span className={`h-1.5 w-1.5 rounded-full ${impactColor(ev.impact)}`} />
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-300">{ev.event}</p>
                <div className="mt-1.5 grid grid-cols-3 gap-1 text-[10px]">
                  <div><span className="text-slate-500">Fcst:</span> <span className="font-mono text-slate-300">{ev.forecast}</span></div>
                  <div><span className="text-slate-500">Prev:</span> <span className="font-mono text-slate-300">{ev.previous}</span></div>
                  <div><span className="text-slate-500">Act:</span> <span className="font-mono text-slate-400">{ev.actual ?? '—'}</span></div>
                </div>
                <p className={`mt-1 text-[10px] font-semibold uppercase ${impactText(ev.impact)}`}>{ev.impact} impact</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Summary */}
      <div className="card relative overflow-hidden p-5">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-accent-500 via-bull-500 to-accent-500" />
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent-400" />
          <p className="section-title">AI Summary</p>
        </div>
        <p className="text-sm leading-relaxed text-slate-300">{data.aiSummary}</p>
      </div>
    </div>
  );
}
