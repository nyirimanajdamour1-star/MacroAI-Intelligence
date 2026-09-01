import { useMemo, useState } from 'react';
import { centralBanks as mockCentralBanks } from '@/data/mockData';
import { useApiDataWithFallback } from '@/hooks/useApiData';
import { adaptCentralBanks } from '@/lib/adapters';
import { DataStatus } from '@/components/LoadingPlaceholder';
import { SeriesChart } from '@/components/Charts';
import { scoreColor, trendColor } from '@/utils/format';
import type { CentralBank, Trend } from '@/types';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Calendar,
  ChevronRight,
  Clock,
  Gauge,
  Globe,
  Landmark,
  Minus,
  Shield,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';

function stanceBadge(stance: CentralBank['stance']) {
  if (stance === 'Hawkish') return 'bg-bull-500/15 text-bull-300 border-bull-500/40';
  if (stance === 'Dovish') return 'bg-bear-500/15 text-bear-300 border-bear-500/40';
  return 'bg-warn-500/15 text-warn-300 border-warn-500/40';
}

function stanceDot(stance: CentralBank['stance']) {
  if (stance === 'Hawkish') return 'bg-bull-500';
  if (stance === 'Dovish') return 'bg-bear-500';
  return 'bg-warn-500';
}

function TrendPill({ trend }: { trend: Trend }) {
  const cls = trendColor(trend);
  const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-[11px] ${cls}`}>
      <Icon className="h-3 w-3" /> {trend}
    </span>
  );
}

function ProbBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-slate-400">{label}</span>
        <span className="font-mono font-semibold text-slate-200">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-ink-700">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${value}%` }} />
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
          <p className="mt-1.5 font-mono text-xl font-bold text-slate-100">{value}</p>
          {sub && <p className="mt-0.5 text-[11px] text-slate-500">{sub}</p>}
        </div>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent} bg-opacity-10`}>
          <Icon className="h-4 w-4 text-slate-200" />
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, trend }: { label: string; value: string; trend?: Trend }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-ink-700/50 bg-ink-850 px-2.5 py-1.5">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className="flex items-center gap-2 font-mono text-xs text-slate-200">
        {value}
        {trend && <TrendPill trend={trend} />}
      </span>
    </div>
  );
}

function OutlookRow({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-xs leading-relaxed text-slate-300">{text}</p>
    </div>
  );
}

export default function CentralBanksPage() {
  const [selected, setSelected] = useState<CentralBank | null>(null);

  const { data: centralBanks, lastUpdated, offline, refetch } = useApiDataWithFallback(
    '/api/central-banks',
    mockCentralBanks,
    3600000,
    adaptCentralBanks,
  );

  const summary = useMemo(() => {
    const sorted = [...centralBanks].sort((a, b) => b.rate - a.rate);
    const highest = sorted[0];
    const lowest = sorted[sorted.length - 1];
    const hawkish = centralBanks.filter((c) => c.stance === 'Hawkish').sort((a, b) => b.confidence - a.confidence);
    const dovish = centralBanks.filter((c) => c.stance === 'Dovish').sort((a, b) => b.confidence - a.confidence);
    const avg = centralBanks.reduce((s, c) => s + c.rate, 0) / centralBanks.length;
    const upcoming = [...centralBanks]
      .sort((a, b) => new Date(a.nextMeeting).getTime() - new Date(b.nextMeeting).getTime());
    return { highest, lowest, hawkish: hawkish[0], dovish: dovish[0], avg, upcoming };
  }, [centralBanks]);

  const hawkishRank = useMemo(
    () =>
      [...centralBanks].sort((a, b) => {
        const order = { Hawkish: 3, Neutral: 2, Dovish: 1 } as const;
        if (order[a.stance] !== order[b.stance]) return order[b.stance] - order[a.stance];
        return b.confidence - a.confidence;
      }),
    [centralBanks],
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Landmark className="h-5 w-5 text-accent-400" />
        <div>
          <h2 className="text-lg font-bold text-slate-100">Central Bank Monitor</h2>
          <p className="text-sm text-slate-500">Global monetary policy tracker with AI stance analysis</p>
        </div>
      </div>
      <DataStatus lastUpdated={lastUpdated} offline={offline} onRetry={refetch} />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <SummaryCard label="Highest Rate" value={`${summary.highest.rate.toFixed(2)}%`} sub={summary.highest.name} icon={ArrowUp} accent="bg-bull-500" />
        <SummaryCard label="Lowest Rate" value={`${summary.lowest.rate.toFixed(2)}%`} sub={summary.lowest.name} icon={ArrowDown} accent="bg-bear-500" />
        <SummaryCard label="Most Hawkish" value={summary.hawkish.name.split(' ').slice(-1)[0]} sub={`${summary.hawkish.confidence}% conf`} icon={TrendingUp} accent="bg-bull-500" />
        <SummaryCard label="Most Dovish" value={summary.dovish.name.split(' ').slice(-1)[0]} sub={`${summary.dovish.confidence}% conf`} icon={TrendingDown} accent="bg-bear-500" />
        <SummaryCard label="Avg Global Rate" value={`${summary.avg.toFixed(2)}%`} sub="8 banks" icon={Globe} accent="bg-accent-500" />
        <SummaryCard label="Meetings This Week" value="3" sub="Dec 10-12" icon={Calendar} accent="bg-warn-500" />
      </div>

      {/* Upcoming meetings timeline */}
      <div className="card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-accent-400" />
          <p className="section-title">Upcoming Meetings Timeline</p>
        </div>
        <div className="relative overflow-x-auto pb-2">
          <div className="flex min-w-max items-start gap-0">
            {summary.upcoming.map((cb, i) => {
              const isNext = i === 0;
              return (
                <div key={cb.id} className="flex items-center">
                  <div className={`flex w-44 flex-col items-center rounded-lg border p-3 transition-all ${isNext ? 'border-accent-500/50 bg-accent-500/10' : 'border-ink-700/60 bg-ink-850'}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg">{cb.flag}</span>
                      <span className="text-xs font-bold text-slate-200">{cb.id.toUpperCase()}</span>
                    </div>
                    <p className="mt-1 font-mono text-sm font-bold text-slate-100">{cb.nextMeeting}</p>
                    <span className={`mt-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${stanceBadge(cb.stance)}`}>
                      {cb.stance}
                    </span>
                    <p className="mt-1 text-[10px] text-slate-500">{cb.expectedDecision}</p>
                    {isNext && <span className="mt-1 text-[10px] font-bold text-accent-300">NEXT</span>}
                  </div>
                  {i < summary.upcoming.length - 1 && (
                    <div className="flex h-px w-6 items-center bg-ink-600">
                      <ChevronRight className="h-3 w-3 text-slate-600" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Central bank cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {centralBanks.map((cb) => {
          const changeColor = cb.change > 0 ? 'text-bull-400' : cb.change < 0 ? 'text-bear-400' : 'text-slate-500';
          return (
            <div
              key={cb.id}
              onClick={() => setSelected(cb)}
              className="card card-hover group cursor-pointer p-4 transition-all hover:shadow-glow"
            >
              {/* Header */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{cb.flag}</span>
                  <div>
                    <p className="text-sm font-bold text-slate-100">{cb.name}</p>
                    <p className="text-[11px] text-slate-500">{cb.governor}</p>
                  </div>
                </div>
                <span className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-bold uppercase ${stanceBadge(cb.stance)}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${stanceDot(cb.stance)}`} />
                  {cb.stance}
                </span>
              </div>

              {/* Rate */}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[11px] text-slate-500">Current Rate</p>
                  <p className="font-mono text-3xl font-bold text-slate-100">{cb.rate.toFixed(2)}%</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-slate-500">Prev</p>
                  <p className="font-mono text-sm text-slate-400">{cb.previousRate.toFixed(2)}%</p>
                  <p className={`font-mono text-xs font-bold ${changeColor}`}>
                    {cb.change > 0 ? '+' : ''}{cb.change.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Rate history chart */}
              <div className="mt-3 -mx-1">
                <SeriesChart data={cb.rateHistory} dataKey="rate" color="#60a5fa" type="area" height={90} />
              </div>

              {/* Meeting info */}
              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-md border border-ink-700/50 bg-ink-850 px-2.5 py-1.5">
                  <p className="text-slate-500">Last Meeting</p>
                  <p className="font-mono text-slate-200">{cb.lastMeeting}</p>
                </div>
                <div className="rounded-md border border-ink-700/50 bg-ink-850 px-2.5 py-1.5">
                  <p className="text-slate-500">Next Meeting</p>
                  <p className="font-mono text-slate-200">{cb.nextMeeting}</p>
                </div>
              </div>

              {/* Expected decision + market pricing */}
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Expected</span>
                  <span className="font-semibold text-slate-200">{cb.expectedDecision}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Market Pricing</span>
                  <span className="font-mono text-slate-400">{cb.marketPricing}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">AI Confidence</span>
                  <span className={`font-mono font-bold ${scoreColor(cb.confidence)}`}>{cb.confidence}%</span>
                </div>
              </div>

              {/* Probability bars */}
              <div className="mt-3 space-y-2 border-t border-ink-700/60 pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Decision Probability</p>
                <ProbBar label="Hold" value={cb.probabilities.hold} color="bg-slate-500" />
                <ProbBar label="Cut" value={cb.probabilities.cut} color="bg-bear-500" />
                <ProbBar label="Hike" value={cb.probabilities.hike} color="bg-bull-500" />
              </div>

              {/* Economic trends */}
              <div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-ink-700/60 pt-3">
                <MiniStat label="Inflation" value="" trend={cb.inflationTrend} />
                <MiniStat label="Employment" value="" trend={cb.employmentTrend} />
                <MiniStat label="GDP" value="" trend={cb.gdpTrend} />
              </div>

              {/* Policy summary */}
              <div className="mt-3 border-t border-ink-700/60 pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Policy Summary</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400 line-clamp-3">{cb.policySummary}</p>
              </div>

              <div className="mt-3 flex items-center justify-end gap-1 text-[11px] font-semibold text-accent-300 opacity-0 transition-opacity group-hover:opacity-100">
                View AI Analysis <ChevronRight className="h-3 w-3" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Global hawkish-dovish ranking */}
      <div className="card p-4">
        <div className="mb-4 flex items-center gap-2">
          <Gauge className="h-4 w-4 text-accent-400" />
          <p className="section-title">Global Hawkish-Dovish Ranking</p>
        </div>
        <div className="space-y-2">
          {hawkishRank.map((cb, i) => {
            const stanceVal = cb.stance === 'Hawkish' ? 100 : cb.stance === 'Neutral' ? 55 : 10;
            return (
              <div key={cb.id} className="flex items-center gap-3">
                <span className="w-5 font-mono text-xs font-bold text-slate-500">{i + 1}</span>
                <span className="text-lg">{cb.flag}</span>
                <div className="w-28 shrink-0">
                  <p className="text-xs font-semibold text-slate-200">{cb.id.toUpperCase()}</p>
                  <p className="text-[10px] text-slate-500">{cb.name}</p>
                </div>
                <div className="flex-1">
                  <div className="h-2.5 overflow-hidden rounded-full bg-ink-700">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${stanceDot(cb.stance)}`}
                      style={{ width: `${stanceVal}%` }}
                    />
                  </div>
                </div>
                <span className={`w-20 text-right font-mono text-xs font-bold ${cb.rate >= 4 ? 'text-bull-400' : cb.rate >= 2 ? 'text-warn-400' : 'text-bear-400'}`}>
                  {cb.rate.toFixed(2)}%
                </span>
                <span className={`hidden w-24 rounded-md border px-2 py-0.5 text-center text-[10px] font-semibold sm:inline-block ${stanceBadge(cb.stance)}`}>
                  {cb.stance}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Global summary */}
      <div className="card relative overflow-hidden p-5">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-bull-500 via-warn-500 to-bear-500" />
        <div className="mb-3 flex items-center gap-2">
          <Globe className="h-4 w-4 text-accent-400" />
          <p className="section-title">Overall Global Central Bank Summary</p>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="text-sm leading-relaxed text-slate-300">
              Global monetary policy is diverging sharply. The Federal Reserve and RBA remain hawkish, holding rates
              elevated as inflation moderates but labor markets stay tight. In contrast, the ECB, SNB, BoC, and RBNZ
              have pivoted decisively dovish, cutting aggressively as growth softens and inflation approaches target.
              The BoJ stands alone in normalization, slowly raising rates from zero. The BoE is caught in the middle,
              balancing sticky services inflation against a softening labor market.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              The net effect is a wide rate-differential landscape that drives FX flows: USD and JPY (on direction)
              are structurally supported, while EUR, CAD, and NZD face policy headwinds. CHF is bid on safe-haven but
              capped by SNB dovishness. The average global rate of {summary.avg.toFixed(2)}% remains restrictive but is
              declining as the easing cycle broadens.
            </p>
          </div>
          <div className="space-y-2">
            <div className="rounded-lg border border-ink-700/60 bg-ink-850 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-bull-400">Hawkish Camp</p>
              <p className="mt-1 text-xs text-slate-300">Fed, RBA, BoJ (normalizing)</p>
            </div>
            <div className="rounded-lg border border-ink-700/60 bg-ink-850 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-warn-400">Neutral</p>
              <p className="mt-1 text-xs text-slate-300">BoE — conflicting signals</p>
            </div>
            <div className="rounded-lg border border-ink-700/60 bg-ink-850 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-bear-400">Dovish Camp</p>
              <p className="mt-1 text-xs text-slate-300">ECB, SNB, BoC, RBNZ</p>
            </div>
          </div>
        </div>
      </div>

      {/* Slide-in AI analysis panel */}
      {selected && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <aside className="animate-slide-in fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-ink-600 bg-ink-900 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ink-700/60 px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{selected.flag}</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">{selected.name}</h3>
                  <p className="text-[11px] text-slate-500">{selected.country} · {selected.governor}</p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-md p-1 text-slate-500 transition-colors hover:bg-ink-700 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {/* Current policy */}
              <div className="mb-4 flex items-center justify-between rounded-xl border border-ink-700/60 bg-ink-850 p-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Current Policy Rate</p>
                  <p className="mt-1 font-mono text-3xl font-bold text-slate-100">{selected.rate.toFixed(2)}%</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Prev {selected.previousRate.toFixed(2)}% ·{' '}
                    <span className={selected.change > 0 ? 'text-bull-400' : selected.change < 0 ? 'text-bear-400' : 'text-slate-400'}>
                      {selected.change > 0 ? '+' : ''}{selected.change.toFixed(2)}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">AI Bias</p>
                  <span className={`mt-1.5 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-bold uppercase ${stanceBadge(selected.stance)}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${stanceDot(selected.stance)}`} />
                    {selected.stance}
                  </span>
                  <p className="mt-1.5 text-[11px] text-slate-500">Confidence {selected.confidence}%</p>
                </div>
              </div>

              {/* Rate history chart */}
              <div className="mb-4">
                <p className="section-title mb-2">Interest Rate History</p>
                <div className="rounded-lg border border-ink-700/60 bg-ink-850 p-2">
                  <SeriesChart data={selected.rateHistory} dataKey="rate" color="#60a5fa" type="area" height={160} />
                </div>
              </div>

              {/* Probability bars */}
              <div className="mb-4 rounded-lg border border-ink-700/60 bg-ink-850 p-3">
                <p className="section-title mb-2">Next Meeting Decision Probability</p>
                <div className="space-y-2.5">
                  <ProbBar label="Hold" value={selected.probabilities.hold} color="bg-slate-500" />
                  <ProbBar label="Cut" value={selected.probabilities.cut} color="bg-bear-500" />
                  <ProbBar label="Hike" value={selected.probabilities.hike} color="bg-bull-500" />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-ink-700/60 pt-2 text-[11px]">
                  <span className="text-slate-500">Next Meeting</span>
                  <span className="font-mono text-slate-200">{selected.nextMeeting}</span>
                </div>
              </div>

              {/* Recent statement */}
              <div className="mb-4">
                <p className="section-title mb-2">Recent Statement</p>
                <div className="rounded-lg border border-ink-700/60 bg-ink-850 p-3">
                  <p className="text-xs italic leading-relaxed text-slate-300">"{selected.recentStatement}"</p>
                </div>
              </div>

              {/* Economic conditions + outlooks */}
              <div className="mb-4 space-y-3">
                <OutlookRow label="Economic Conditions" text={selected.economicConditions} />
                <OutlookRow label="Inflation Outlook" text={selected.inflationOutlook} />
                <OutlookRow label="Employment Outlook" text={selected.employmentOutlook} />
                <OutlookRow label="GDP Outlook" text={selected.gdpOutlook} />
              </div>

              {/* AI interpretation */}
              <div className="mb-4">
                <p className="section-title mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-accent-400" /> AI Interpretation
                </p>
                <div className="rounded-xl border border-accent-500/20 bg-accent-500/5 p-3.5">
                  <p className="text-sm leading-relaxed text-slate-300">{selected.aiInterpretation}</p>
                </div>
              </div>

              {/* Expected decision + currency impact */}
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg border border-ink-700/60 bg-ink-850 px-3 py-2.5">
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Activity className="h-3.5 w-3.5 text-accent-400" /> Expected Next Decision
                  </span>
                  <span className="font-mono text-xs font-bold text-accent-300">{selected.expectedNextDecision}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-ink-700/60 bg-ink-850 px-3 py-2.5">
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Shield className="h-3.5 w-3.5 text-accent-400" /> Expected Currency Impact
                  </span>
                  <span className="text-right text-xs font-semibold text-slate-200">{selected.expectedCurrencyImpact}</span>
                </div>
              </div>
            </div>

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
