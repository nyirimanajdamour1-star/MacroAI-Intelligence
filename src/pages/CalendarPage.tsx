import { useState, useEffect } from 'react';
import { enhancedCalendarEvents, calendarActuals } from '@/data/extendedData';
import { impactColor, impactText } from '@/utils/format';
import { useApiDataWithFallback } from '@/hooks/useApiData';
import { adaptCalendarEvents } from '@/lib/adapters';
import { DataStatus } from '@/components/LoadingPlaceholder';
import type { Impact } from '@/types';
import { Clock } from 'lucide-react';

const countries = ['All', 'United States', 'Eurozone', 'United Kingdom', 'Japan', 'Canada', 'Australia', 'Switzerland', 'New Zealand'];
const impacts: (Impact | 'All')[] = ['All', 'high', 'medium', 'low'];

function getCountdown(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);
  if (target.getTime() < now.getTime()) return 'Released';
  const diff = target.getTime() - now.getTime();
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return `${hours}h ${mins}m ${secs}s`;
}

export default function CalendarPage() {
  const [country, setCountry] = useState('All');
  const [impact, setImpact] = useState<Impact | 'All'>('All');
  const [, setTick] = useState(0);

  const { data: events, lastUpdated, offline, refetch } = useApiDataWithFallback(
    '/api/calendar',
    enhancedCalendarEvents,
    60000,
    adaptCalendarEvents,
  );

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const filtered = events.filter((e) => {
    if (country !== 'All' && e.country !== country) return false;
    if (impact !== 'All' && e.impact !== impact) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-100">Economic Calendar</h2>
        <p className="text-sm text-slate-500">Upcoming economic events with forecasts, actuals, and live countdowns</p>
      </div>
      <DataStatus lastUpdated={lastUpdated} offline={offline} onRetry={refetch} />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Country:</span>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="rounded-lg border border-ink-700/60 bg-ink-850 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-accent-500/60"
          >
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Impact:</span>
          <div className="flex rounded-lg border border-ink-700/60 bg-ink-850 p-0.5">
            {impacts.map((i) => (
              <button
                key={i}
                onClick={() => setImpact(i)}
                className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${impact === i ? 'bg-ink-700 text-slate-200' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>
        <span className="ml-auto text-xs text-slate-500">{filtered.length} events</span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-700/60 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-2.5 font-medium">Time</th>
                <th className="px-4 py-2.5 font-medium">Country</th>
                <th className="px-4 py-2.5 font-medium">Currency</th>
                <th className="px-4 py-2.5 font-medium">Event</th>
                <th className="px-4 py-2.5 font-medium">Forecast</th>
                <th className="px-4 py-2.5 font-medium">Previous</th>
                <th className="px-4 py-2.5 font-medium">Actual</th>
                <th className="px-4 py-2.5 font-medium">Impact</th>
                <th className="px-4 py-2.5 font-medium">Countdown</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const actual = calendarActuals[e.id];
                const countdown = getCountdown(e.time);
                const isReleased = countdown === 'Released';
                return (
                  <tr key={e.id} className="border-b border-ink-700/40 transition-colors hover:bg-ink-800/60">
                    <td className="px-4 py-3 font-mono text-slate-300">{e.time}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{e.flag}</span>
                        <span className="text-xs text-slate-400">{e.country}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-ink-700/50 px-2 py-0.5 font-mono text-[10px] font-medium text-slate-300">{e.currency}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-200">{e.event}</td>
                    <td className="px-4 py-3 font-mono text-slate-300">{e.forecast}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{e.previous}</td>
                    <td className="px-4 py-3">
                      {actual ? (
                        <span className={`font-mono font-semibold ${actual === e.forecast ? 'text-warn-400' : 'text-bull-400'}`}>{actual}</span>
                      ) : (
                        <span className="font-mono text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${impactColor(e.impact)}`} />
                        <span className={`text-xs font-medium capitalize ${impactText(e.impact)}`}>{e.impact}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 font-mono text-xs ${isReleased ? 'text-slate-600' : 'text-accent-400'}`}>
                        <Clock className="h-3 w-3" />
                        {countdown}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-500">No events match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
