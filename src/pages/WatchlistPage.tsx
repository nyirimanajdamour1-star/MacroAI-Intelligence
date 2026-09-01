import Watchlist from '@/components/Watchlist';
import { Star } from 'lucide-react';

export default function WatchlistPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Star className="h-5 w-5 text-warn-400" />
        <div>
          <h2 className="text-lg font-bold text-slate-100">Watchlist</h2>
          <p className="text-sm text-slate-500">Saved favorite currency pairs with macro, technical, and AI scores</p>
        </div>
      </div>
      <div className="mx-auto max-w-3xl">
        <div className="card p-4">
          <Watchlist />
        </div>
      </div>
    </div>
  );
}
