import { useState } from 'react';
import { enhancedNewsItems } from '@/data/extendedData';
import { impactColor, impactText } from '@/utils/format';
import { Sparkles, ExternalLink } from 'lucide-react';
import { useApiDataWithFallback } from '@/hooks/useApiData';
import { adaptNewsItems } from '@/lib/adapters';
import { DataStatus } from '@/components/LoadingPlaceholder';

const currencyCategories = ['All', 'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD'];

export default function NewsPage() {
  const [category, setCategory] = useState('All');

  const { data: news, lastUpdated, offline, refetch } = useApiDataWithFallback(
    '/api/news',
    enhancedNewsItems,
    300000,
    adaptNewsItems,
  );

  const filtered = category === 'All'
    ? news
    : news.filter((n) => n.currencies.includes(category));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-100">Market News</h2>
        <p className="text-sm text-slate-500">Macro and FX news categorized by currency with AI summaries</p>
      </div>
      <DataStatus lastUpdated={lastUpdated} offline={offline} onRetry={refetch} />

      {/* Currency filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {currencyCategories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              category === c
                ? 'border-accent-500/60 bg-accent-500/10 text-accent-300'
                : 'border-ink-700/60 bg-ink-850 text-slate-400 hover:bg-ink-700'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {filtered.map((n) => (
          <div key={n.id} className="card card-hover p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px]">
              <span className={`flex items-center gap-1 font-medium capitalize ${impactText(n.impact)}`}>
                <span className={`h-2 w-2 rounded-full ${impactColor(n.impact)}`} />
                {n.impact} impact
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500">{n.source}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500">{n.time}</span>
              <ExternalLink className="ml-auto h-3.5 w-3.5 text-slate-600" />
            </div>
            <h3 className="text-sm font-semibold leading-snug text-slate-100">{n.title}</h3>

            {/* AI Summary */}
            <div className="mt-2 rounded-lg border border-accent-500/15 bg-accent-500/5 p-2.5">
              <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-accent-300">
                <Sparkles className="h-3 w-3" /> AI Summary
              </p>
              <p className="text-xs leading-relaxed text-slate-400">{n.summary}</p>
            </div>

            {/* Affected currencies */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-500">Affected:</span>
              {n.currencies.map((c) => (
                <span key={c} className="rounded-md bg-ink-700/50 px-2 py-0.5 font-mono text-[10px] font-medium text-slate-300">{c}</span>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 py-8 text-center text-sm text-slate-500">No news for this currency.</div>
        )}
      </div>
    </div>
  );
}
