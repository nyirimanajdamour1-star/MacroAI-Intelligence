import { useState } from 'react';
import {
  aiDecisionEngine,
  aiDecisionIndicators,
  aiDecisionReasoning,
  aiDecisionScenarios,
  aiDecisionTradePlan,
  aiDecisionHistory,
  aiDecisionPerformance,
} from '@/data/extendedData';
import { scoreColor, scoreBg, trendColor } from '@/utils/format';
import type { DecisionSignal, DecisionIndicator, DecisionScenario, Trend } from '@/types';
import {
  ArrowDown,
  ArrowUp,
  Brain,
  Calendar,
  CheckCircle2,
  Clock,
  Crosshair,
  Gauge,
  Minus,
  Shield,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';

function signalColorClass(signal: DecisionSignal): string {
  switch (signal) {
    case 'Strong Buy': return 'text-bull-300 bg-bull-500/15 border-bull-500/40';
    case 'Buy': return 'text-bull-400 bg-bull-500/10 border-bull-500/30';
    case 'Neutral': return 'text-warn-400 bg-warn-500/10 border-warn-500/30';
    case 'Sell': return 'text-bear-400 bg-bear-500/10 border-bear-500/30';
    case 'Strong Sell': return 'text-bear-300 bg-bear-500/15 border-bear-500/40';
  }
}

function scoreGradient(score: number): string {
  if (score >= 80) return 'from-emerald-500 to-emerald-400';
  if (score >= 65) return 'from-emerald-500/80 to-emerald-400/80';
  if (score >= 50) return 'from-yellow-500 to-yellow-400';
  if (score >= 35) return 'from-orange-500 to-orange-400';
  return 'from-red-500 to-red-400';
}

function scoreHex(score: number): string {
  if (score >= 80) return '#10b981';
  if (score >= 65) return '#34d399';
  if (score >= 50) return '#fbbf24';
  if (score >= 35) return '#f97316';
  return '#ef4444';
}

function impactBadge(impact: 'bullish' | 'bearish' | 'neutral') {
  if (impact === 'bullish') return 'text-bull-400 bg-bull-500/10 border-bull-500/30';
  if (impact === 'bearish') return 'text-bear-400 bg-bear-500/10 border-bear-500/30';
  return 'text-warn-400 bg-warn-500/10 border-warn-500/30';
}

function TrendArrow({ trend }: { trend: Trend }) {
  if (trend === 'up') return <ArrowUp className="h-3.5 w-3.5 text-bull-400" />;
  if (trend === 'down') return <ArrowDown className="h-3.5 w-3.5 text-bear-400" />;
  return <Minus className="h-3.5 w-3.5 text-warn-400" />;
}

function riskColor(level: string): string {
  if (level === 'Very High' || level === 'High') return 'text-bear-400';
  if (level === 'Medium') return 'text-warn-400';
  return 'text-bull-400';
}

function ConfidenceBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-ink-700/60 bg-ink-850 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 font-mono text-xl font-bold" style={{ color }}>{value}%</p>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-700">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function DecisionScoreDial({ score, signal }: { score: number; signal: DecisionSignal }) {
  const color = scoreHex(score);
  const radius = 80;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative flex h-52 w-52 items-center justify-center">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r={radius} fill="none" stroke="#1a2236" strokeWidth="10" />
        <circle
          cx="100" cy="100" r={radius} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-mono text-5xl font-bold" style={{ color }}>{score}</span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Decision Score</span>
        <span className={`mt-1.5 rounded-md border px-2.5 py-0.5 text-xs font-bold uppercase ${signalColorClass(signal)}`}>{signal}</span>
      </div>
    </div>
  );
}

function IndicatorRow({ ind }: { ind: DecisionIndicator }) {
  return (
    <div className="grid grid-cols-12 items-center gap-2 border-b border-ink-700/40 px-3 py-2.5 transition-colors hover:bg-ink-800/50">
      <div className="col-span-3">
        <p className="text-xs font-semibold text-slate-200">{ind.name}</p>
      </div>
      <div className="col-span-2 font-mono text-xs text-slate-300">{ind.currentValue}</div>
      <div className="col-span-2">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs text-slate-400">{ind.weight}%</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-700">
            <div className="h-full rounded-full bg-accent-500/60" style={{ width: `${ind.weight * 5}%` }} />
          </div>
        </div>
      </div>
      <div className="col-span-2">
        <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase ${impactBadge(ind.impact)}`}>{ind.impact}</span>
      </div>
      <div className="col-span-1 text-center">
        <span className={`font-mono text-xs font-bold ${ind.contribution >= 0 ? 'text-bull-400' : 'text-bear-400'}`}>
          {ind.contribution >= 0 ? '+' : ''}{ind.contribution}
        </span>
      </div>
      <div className="col-span-1 text-center">
        <span className="font-mono text-xs text-slate-300">{ind.confidence}%</span>
      </div>
      <div className="col-span-1 flex justify-center">
        <TrendArrow trend={ind.trend} />
      </div>
    </div>
  );
}

function ScenarioCard({ scenario }: { scenario: DecisionScenario }) {
  const color = scenario.case === 'Bull' ? '#10b981' : scenario.case === 'Base' ? '#fbbf24' : '#ef4444';
  return (
    <div className="rounded-lg border border-ink-700/60 bg-ink-850 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-bold" style={{ color }}>{scenario.case} Case</span>
        <span className="font-mono text-lg font-bold" style={{ color }}>{scenario.probability}%</span>
      </div>
      <div className="mb-2 h-2 overflow-hidden rounded-full bg-ink-700">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${scenario.probability}%`, backgroundColor: color }} />
      </div>
      <p className="mb-2 text-xs text-slate-300">{scenario.expectedMove}</p>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Main Catalysts</p>
      <ul className="mb-2 space-y-1">
        {scenario.catalysts.map((c, i) => (
          <li key={i} className="flex gap-1.5 text-[11px] leading-relaxed text-slate-400">
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            {c}
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-ink-700/60 pt-2">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">Risk Level</span>
        <span className={`text-xs font-bold ${riskColor(scenario.riskLevel)}`}>{scenario.riskLevel}</span>
      </div>
    </div>
  );
}

function HistoryRow({ entry }: { entry: { date: string; score: number; signal: DecisionSignal; result: 'Win' | 'Loss' | 'Pending'; accuracy: number } }) {
  return (
    <div className="flex items-center gap-3 border-b border-ink-700/40 px-3 py-2 transition-colors hover:bg-ink-800/50">
      <div className="flex w-24 items-center gap-1.5 text-xs text-slate-400">
        <Calendar className="h-3 w-3 text-slate-600" />
        {entry.date.slice(5)}
      </div>
      <span className={`w-12 font-mono text-sm font-bold ${scoreColor(entry.score)}`}>{entry.score}</span>
      <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase ${signalColorClass(entry.signal)}`}>{entry.signal}</span>
      <span className="ml-auto flex items-center gap-1 text-xs">
        {entry.result === 'Win' ? <CheckCircle2 className="h-3.5 w-3.5 text-bull-400" /> : entry.result === 'Loss' ? <XCircle className="h-3.5 w-3.5 text-bear-400" /> : <Clock className="h-3.5 w-3.5 text-warn-400" />}
        <span className={entry.result === 'Win' ? 'text-bull-400' : entry.result === 'Loss' ? 'text-bear-400' : 'text-warn-400'}>{entry.result}</span>
      </span>
      <span className="w-12 text-right font-mono text-xs text-slate-400">{entry.accuracy}%</span>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-lg border border-ink-700/60 bg-ink-850 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 font-mono text-xl font-bold" style={{ color: color ?? '#e2e8f0' }}>{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-slate-500">{sub}</p>}
    </div>
  );
}

export default function AIDecisionEnginePage() {
  const [activeScenario, setActiveScenario] = useState<number>(0);
  const d = aiDecisionEngine;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-accent-400" />
        <div>
          <h2 className="text-lg font-bold text-slate-100">AI Decision Engine</h2>
          <p className="text-sm text-slate-500">Institutional intelligence layer — every macro indicator fused into one final trading decision</p>
        </div>
      </div>

      {/* TOP SECTION */}
      <div className="card relative overflow-hidden p-5">
        <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${scoreGradient(d.score)}`} />
        <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-center">
          <DecisionScoreDial score={d.score} signal={d.signal} />
          <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <ConfidenceBar label="Overall Confidence" value={d.overallConfidence} color={scoreHex(d.overallConfidence)} />
            <ConfidenceBar label="Macro Confidence" value={d.macroConfidence} color={scoreHex(d.macroConfidence)} />
            <ConfidenceBar label="Technical Confidence" value={d.technicalConfidence} color={scoreHex(d.technicalConfidence)} />
            <ConfidenceBar label="Sentiment Confidence" value={d.sentimentConfidence} color={scoreHex(d.sentimentConfidence)} />
            <div className="rounded-lg border border-ink-700/60 bg-ink-850 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Data Freshness</p>
              <p className="mt-1 flex items-center gap-1.5 font-mono text-lg font-bold text-accent-400">
                <Clock className="h-4 w-4" />
                {d.dataFreshness}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">All indicators synced</p>
            </div>
          </div>
        </div>
      </div>

      {/* DECISION BREAKDOWN */}
      <div className="card overflow-hidden">
        <div className="border-b border-ink-700/60 px-4 py-2.5">
          <p className="section-title">Decision Breakdown — Indicator Contributions</p>
        </div>
        <div className="grid grid-cols-12 gap-2 border-b border-ink-700/60 bg-ink-900/50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          <div className="col-span-3">Indicator</div>
          <div className="col-span-2">Current Value</div>
          <div className="col-span-2">Weight</div>
          <div className="col-span-2">Impact</div>
          <div className="col-span-1 text-center">Contrib.</div>
          <div className="col-span-1 text-center">Conf.</div>
          <div className="col-span-1 text-center">Trend</div>
        </div>
        {aiDecisionIndicators.map((ind) => (
          <IndicatorRow key={ind.id} ind={ind} />
        ))}
        <div className="flex items-center justify-between border-t border-ink-700/60 bg-ink-900/50 px-3 py-2.5">
          <span className="text-xs font-semibold text-slate-400">Total Weighted Contribution</span>
          <span className={`font-mono text-sm font-bold ${d.score >= 50 ? 'text-bull-400' : 'text-bear-400'}`}>+{d.score.toFixed(1)}</span>
        </div>
      </div>

      {/* AI REASONING */}
      <div className="card relative overflow-hidden p-5">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-accent-500 via-bull-500 to-accent-500" />
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent-400" />
          <p className="section-title">AI Reasoning — Institutional Macro Strategist Report</p>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div>
              <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-bull-400">
                <TrendingUp className="h-3.5 w-3.5" /> Why Bullish
              </p>
              <p className="text-sm leading-relaxed text-slate-300">{aiDecisionReasoning.whyBullish}</p>
            </div>
            <div>
              <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-bear-400">
                <TrendingDown className="h-3.5 w-3.5" /> Why Bearish
              </p>
              <p className="text-sm leading-relaxed text-slate-300">{aiDecisionReasoning.whyBearish}</p>
            </div>
            <div>
              <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-warn-400">
                <Shield className="h-3.5 w-3.5" /> Current Risks
              </p>
              <p className="text-sm leading-relaxed text-slate-300">{aiDecisionReasoning.currentRisks}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Probability of Success" value={`${aiDecisionReasoning.probabilityOfSuccess}%`} color={scoreHex(aiDecisionReasoning.probabilityOfSuccess)} />
            <StatCard label="Expected Direction" value={aiDecisionReasoning.expectedDirection} />
            <StatCard label="Best Time Horizon" value={aiDecisionReasoning.bestTimeHorizon} />
            <StatCard label="Expected Volatility" value={aiDecisionReasoning.expectedVolatility} />
          </div>
        </div>
      </div>

      {/* SCENARIO ANALYSIS */}
      <div className="card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Gauge className="h-4 w-4 text-accent-400" />
          <p className="section-title">Scenario Analysis</p>
        </div>
        <div className="mb-3 flex gap-1.5">
          {aiDecisionScenarios.map((s, i) => (
            <button
              key={s.case}
              onClick={() => setActiveScenario(i)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeScenario === i
                  ? s.case === 'Bull' ? 'border-bull-500/50 bg-bull-500/15 text-bull-300' : s.case === 'Base' ? 'border-warn-500/50 bg-warn-500/15 text-warn-300' : 'border-bear-500/50 bg-bear-500/15 text-bear-300'
                  : 'border-ink-700/60 bg-ink-850 text-slate-400 hover:bg-ink-800'
              }`}
            >
              {s.case} Case
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {aiDecisionScenarios.map((s, i) => (
            <div key={s.case} className={activeScenario === i ? 'opacity-100' : 'opacity-50 transition-opacity'}>
              <ScenarioCard scenario={s} />
            </div>
          ))}
        </div>
      </div>

      {/* AI TRADE PLAN */}
      <div className="card relative overflow-hidden p-5">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-accent-500 to-bull-500" />
        <div className="mb-3 flex items-center gap-2">
          <Crosshair className="h-4 w-4 text-accent-400" />
          <p className="section-title">AI Trade Plan</p>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="flex flex-col items-center justify-center rounded-lg border border-ink-700/60 bg-ink-850 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Direction</p>
            <span className={`mt-2 rounded-lg border px-4 py-2 text-lg font-bold uppercase ${signalColorClass(aiDecisionTradePlan.direction)}`}>{aiDecisionTradePlan.direction}</span>
            <p className="mt-3 text-center text-xs text-slate-400">{d.symbol} — Decision Score {d.score}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:col-span-2">
            <StatCard label="Entry" value={aiDecisionTradePlan.entry} color="#e2e8f0" />
            <StatCard label="Stop Loss" value={aiDecisionTradePlan.stopLoss} color="#ef4444" />
            <StatCard label="Take Profit 1" value={aiDecisionTradePlan.takeProfit1} color="#10b981" />
            <StatCard label="Take Profit 2" value={aiDecisionTradePlan.takeProfit2} color="#10b981" />
            <StatCard label="Risk / Reward" value={aiDecisionTradePlan.riskReward} color="#fbbf24" />
            <StatCard label="Holding Period" value={aiDecisionTradePlan.holdingPeriod} />
            <StatCard label="Position Size" value={aiDecisionTradePlan.positionSize} sub="Based on 2% portfolio risk" color="#3b82f6" />
          </div>
        </div>
      </div>

      {/* DECISION HISTORY */}
      <div className="card overflow-hidden">
        <div className="border-b border-ink-700/60 px-4 py-2.5">
          <p className="section-title">Decision History — Previous AI Recommendations</p>
        </div>
        <div className="grid grid-cols-12 gap-2 border-b border-ink-700/60 bg-ink-900/50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          <div className="col-span-3">Date</div>
          <div className="col-span-2">Score</div>
          <div className="col-span-3">Signal</div>
          <div className="col-span-2 text-right">Result</div>
          <div className="col-span-2 text-right">Accuracy</div>
        </div>
        {aiDecisionHistory.map((entry, i) => (
          <HistoryRow key={i} entry={entry} />
        ))}
      </div>

      {/* MODEL PERFORMANCE */}
      <div className="card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-accent-400" />
          <p className="section-title">Model Performance Dashboard</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Prediction Accuracy" value={`${aiDecisionPerformance.predictionAccuracy}%`} color={scoreHex(aiDecisionPerformance.predictionAccuracy)} />
          <StatCard label="Win Rate" value={`${aiDecisionPerformance.winRate}%`} color={scoreHex(aiDecisionPerformance.winRate)} />
          <StatCard label="Avg Confidence" value={`${aiDecisionPerformance.avgConfidence}%`} color={scoreHex(aiDecisionPerformance.avgConfidence)} />
          <StatCard label="Avg Risk / Reward" value={aiDecisionPerformance.avgRiskReward} color="#fbbf24" />
          <StatCard
            label="Correct Bullish Calls"
            value={`${aiDecisionPerformance.correctBullishCalls}/${aiDecisionPerformance.totalBullishCalls}`}
            sub={`${Math.round((aiDecisionPerformance.correctBullishCalls / aiDecisionPerformance.totalBullishCalls) * 100)}% hit rate`}
            color="#10b981"
          />
          <StatCard
            label="Correct Bearish Calls"
            value={`${aiDecisionPerformance.correctBearishCalls}/${aiDecisionPerformance.totalBearishCalls}`}
            sub={`${Math.round((aiDecisionPerformance.correctBearishCalls / aiDecisionPerformance.totalBearishCalls) * 100)}% hit rate`}
            color="#ef4444"
          />
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-bull-500/20 bg-bull-500/5 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-bull-400">
              <TrendingUp className="h-3.5 w-3.5" /> Bullish Call Accuracy
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-ink-700">
              <div className="h-full rounded-full bg-bull-500 transition-all duration-700" style={{ width: `${(aiDecisionPerformance.correctBullishCalls / aiDecisionPerformance.totalBullishCalls) * 100}%` }} />
            </div>
          </div>
          <div className="rounded-lg border border-bear-500/20 bg-bear-500/5 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-bear-400">
              <TrendingDown className="h-3.5 w-3.5" /> Bearish Call Accuracy
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-ink-700">
              <div className="h-full rounded-full bg-bear-500 transition-all duration-700" style={{ width: `${(aiDecisionPerformance.correctBearishCalls / aiDecisionPerformance.totalBearishCalls) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
