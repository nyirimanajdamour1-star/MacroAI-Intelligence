import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { currencies as mockCurrencies } from '@/data/mockData';
import { heatmapClasses } from '@/utils/format';
import { useApiDataWithFallback } from '@/hooks/useApiData';
import { adaptCurrencies } from '@/lib/adapters';
import type { Currency } from '@/types';

interface HeatmapProps {
  onSelect: (c: Currency) => void;
  selectedCode?: string | null;
}

export default function Heatmap({ onSelect, selectedCode }: HeatmapProps) {
  const { data: currencies } = useApiDataWithFallback(
    '/api/currencies',
    mockCurrencies,
    30000,
    adaptCurrencies,
  );

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {currencies.map((c) => {
        const hm = heatmapClasses(c.score);
        const TrendIcon = c.trend === 'up' ? TrendingUp : c.trend === 'down' ? TrendingDown : Minus;
        const active = selectedCode === c.code;
        return (
          <button
            key={c.code}
            onClick={() => onSelect(c)}
            className={`group relative overflow-hidden rounded-xl border p-3 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${hm.bg} ${hm.border} ${active ? 'ring-2 ring-accent-400 ring-offset-2 ring-offset-ink-900' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-base">{c.flag}</span>
                <span className={`text-sm font-bold ${hm.text}`}>{c.code}</span>
              </div>
              <TrendIcon className={`h-4 w-4 ${hm.text} opacity-90`} />
            </div>
            <div className="mt-2 flex items-end justify-between">
              <span className={`font-mono text-2xl font-bold leading-none ${hm.text}`}>{c.score.toFixed(1)}</span>
              <span className={`text-[10px] font-medium uppercase tracking-wide ${hm.text} opacity-80`}>{hm.label}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className={`text-[10px] ${hm.text} opacity-70`}>Conf {c.confidence}%</span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-black/20">
              <div className={`h-full rounded-full ${c.trend === 'up' ? 'bg-white/80' : c.trend === 'down' ? 'bg-black/40' : 'bg-white/50'}`} style={{ width: `${c.score}%` }} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
