import { marketWidgets } from '@/data/extendedData';
import { trendColor, trendIcon } from '@/utils/format';
import { useApiDataWithFallback } from '@/hooks/useApiData';
import { DataStatus } from '@/components/LoadingPlaceholder';
import {
  DollarSign,
  CircleDollarSign,
  Circle,
  Droplet,
  Activity,
  TrendingUp,
  BarChart3,
  LineChart,
  Bitcoin,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';
import type { ComponentType } from 'react';

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  DollarSign,
  CircleDollarSign,
  Circle,
  Droplet,
  Activity,
  TrendingUp,
  BarChart3,
  LineChart,
  Bitcoin,
};

interface ApiMarket {
  symbol: string;
  name: string;
  category: string;
  price: number;
  change: number;
  change_pct: number;
}

function adaptMarketWidgets(raw: unknown) {
  const markets = raw as { markets: ApiMarket[] };
  if (!markets?.markets?.length) return null;
  return markets.markets.map((m) => ({
    id: m.symbol,
    name: m.name,
    symbol: m.symbol,
    icon: m.category === 'crypto' ? 'Bitcoin' : m.category === 'commodity' ? 'Droplet' : m.category === 'bond' ? 'LineChart' : 'Activity',
    value: m.price.toFixed(m.price > 1000 ? 0 : 2),
    change: m.change,
    changePct: m.change_pct,
    trend: m.change_pct > 0 ? 'up' as const : m.change_pct < 0 ? 'down' as const : 'flat' as const,
  sparkline: [],
  category: m.category,
  high: m.price,
    low: m.price,
  volume: 0,
  sparklineData: [],
  categoryColor: '',
  iconColor: '',
  sparkColor: '',
  description: '',
  aiScore: 0,
    aiBias: '',
    confidence: 0,
  }));
}

export default function LiveDashboardPage() {
  const { data: widgets, lastUpdated, offline, refetch } = useApiDataWithFallback(
    '/api/markets',
    marketWidgets,
    30000,
    adaptMarketWidgets,
  );

  const displayWidgets = widgets ?? marketWidgets;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Live Market Dashboard</h2>
          <p className="text-sm text-slate-500">Real-time market widgets across indices, commodities, and rates</p>
        </div>
        <DataStatus lastUpdated={lastUpdated} offline={offline} onRetry={refetch} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {displayWidgets.map((w) => {
          const Icon = iconMap[w.icon] ?? Activity;
          const TrendIcon = w.trend === 'up' ? ArrowUp : w.trend === 'down' ? ArrowDown : Minus;
          const isUp = w.change >= 0;
          return (
            <div key={w.id} className="card card-hover p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-700/50">
                    <Icon className="h-4 w-4 text-slate-300" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{w.name}</p>
                    <p className="text-[10px] text-slate-500">{w.symbol}</p>
                  </div>
                </div>
                <TrendIcon className={`h-4 w-4 ${trendColor(w.trend)}`} />
              </div>
              <p className="font-mono text-xl font-bold text-slate-100">{w.value}</p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className={`font-mono text-xs ${isUp ? 'text-bull-400' : 'text-bear-400'}`}>
                  {isUp ? '+' : ''}{w.change}
                </span>
                <span className={`font-mono text-xs ${isUp ? 'text-bull-400' : 'text-bear-400'}`}>
                  ({isUp ? '+' : ''}{w.changePct.toFixed(2)}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
