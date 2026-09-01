import { enhancedWatchlist, getWatchlistScores } from '@/data/extendedData';
import { trendColor, trendIcon, directionColor, scoreColor, scoreBg } from '@/utils/format';
import { Star } from 'lucide-react';
import { useApiDataWithFallback } from '@/hooks/useApiData';
import { adaptWatchlist } from '@/lib/adapters';

export default function Watchlist() {
  const { data: items } = useApiDataWithFallback(
    '/api/watchlist',
    enhancedWatchlist,
    10000,
    adaptWatchlist,
  );

  return (
    <div className="space-y-1.5">
      {items.map((w) => {
        const scores = getWatchlistScores(w.pair);
        return (
          <div key={w.pair} className="rounded-lg border border-ink-700/60 bg-ink-850 px-3 py-2 transition-colors hover:bg-ink-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-3.5 w-3.5 text-warn-400" fill="currentColor" />
                <span className="font-mono text-xs font-semibold text-slate-200">{w.pair}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-mono text-xs font-medium text-slate-200">{w.price.toFixed(4)}</p>
                  <p className={`font-mono text-[10px] ${w.change >= 0 ? 'text-bull-400' : 'text-bear-400'}`}>
                    {w.change >= 0 ? '+' : ''}{w.changePct.toFixed(2)}%
                  </p>
                </div>
                <span className={`font-mono text-xs ${trendColor(w.trend)}`}>{trendIcon(w.trend)}</span>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${directionColor(w.aiBias)}`}>
                  {w.aiBias}
                </span>
              </div>
            </div>
            {/* Score bars */}
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[
                { label: 'Macro', value: scores.macro },
                { label: 'Technical', value: scores.technical },
                { label: 'AI', value: scores.ai },
              ].map((s) => (
                <div key={s.label}>
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-slate-500">{s.label}</span>
                    <span className={`font-mono font-semibold ${scoreColor(s.value)}`}>{s.value}</span>
                  </div>
                  <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-ink-700">
                    <div className={`h-full rounded-full ${scoreBg(s.value)}`} style={{ width: `${s.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
