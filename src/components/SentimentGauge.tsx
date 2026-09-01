import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import { marketSentiment } from '@/data/mockData';
import { sentimentModeColor } from '@/utils/format';
import { useApiDataWithFallback } from '@/hooks/useApiData';

interface RiskData { vix: number; dxy: number; riskScore: number; mode: string; description: string; }

function adaptRisk(raw: unknown): RiskData {
  const r = raw as RiskData;
  return { vix: r.vix ?? 14.5, dxy: r.dxy ?? 104.2, riskScore: r.riskScore ?? 72, mode: r.mode ?? 'Risk On', description: r.description ?? '' };
}

const fallbackRisk: RiskData = {
  vix: marketSentiment.vix,
  dxy: 104.2,
  riskScore: marketSentiment.score,
  mode: marketSentiment.mode,
  description: marketSentiment.description,
};

export default function SentimentGauge() {
  const { data } = useApiDataWithFallback<RiskData>('/api/global-risk', fallbackRisk, 30000, adaptRisk);

  const { riskScore: score, mode, vix, description } = data;
  const typedMode = mode as 'Risk On' | 'Risk Off' | 'Neutral';
  const angle = 180 + (score / 100) * 180;

  const Icon = typedMode === 'Risk On' ? ShieldCheck : typedMode === 'Risk Off' ? ShieldAlert : Shield;
  const arcColor = typedMode === 'Risk On' ? '#10b981' : typedMode === 'Risk Off' ? '#ef4444' : '#f59e0b';

  const segments = [
    { from: 0, to: 33, color: '#ef4444' },
    { from: 33, to: 67, color: '#f59e0b' },
    { from: 67, to: 100, color: '#10b981' },
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-32 w-48">
        <svg viewBox="0 0 200 110" className="h-full w-full">
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#1a2236" strokeWidth="14" strokeLinecap="round" />
          {segments.map((seg, i) => {
            const startAngle = 180 + (seg.from / 100) * 180;
            const endAngle = 180 + (seg.to / 100) * 180;
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;
            const x1 = 100 + 80 * Math.cos(startRad);
            const y1 = 100 + 80 * Math.sin(startRad);
            const x2 = 100 + 80 * Math.cos(endRad);
            const y2 = 100 + 80 * Math.sin(endRad);
            return (
              <path key={i} d={`M ${x1} ${y1} A 80 80 0 0 1 ${x2} ${y2}`} fill="none" stroke={seg.color} strokeWidth="14" strokeLinecap="round" opacity="0.85" />
            );
          })}
          <line x1="100" y1="100" x2={100 + 70 * Math.cos((angle * Math.PI) / 180)} y2={100 + 70 * Math.sin((angle * Math.PI) / 180)} stroke={arcColor} strokeWidth="3" strokeLinecap="round" style={{ transition: 'all 0.6s ease-out' }} />
          <circle cx="100" cy="100" r="6" fill={arcColor} />
          <circle cx="100" cy="100" r="3" fill="#0a0e16" />
        </svg>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <Icon className={`h-5 w-5 ${sentimentModeColor(typedMode)}`} />
        <span className={`text-lg font-bold ${sentimentModeColor(typedMode)}`}>{typedMode}</span>
      </div>
      <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
        <span>Score: <span className="font-mono text-slate-300">{score}</span></span>
        <span className="text-slate-700">·</span>
        <span>VIX: <span className="font-mono text-slate-300">{typeof vix === 'number' ? vix.toFixed(1) : vix}</span></span>
      </div>
      <p className="mt-2 text-center text-[11px] leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}
