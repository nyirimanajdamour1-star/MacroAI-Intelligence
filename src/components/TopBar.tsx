import { useEffect, useState } from 'react';
import { Search, RefreshCw, Sun, Moon, Bell, User } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface TopBarProps {
  onRefresh: () => void;
  refreshing: boolean;
}

export default function TopBar({ onRefresh, refreshing }: TopBarProps) {
  const { theme, toggle } = useTheme();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const utcTime = now.toUTCString().split(' ')[4];

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-ink-700/60 bg-ink-900/80 px-4 backdrop-blur-md">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search currencies, indicators, events..."
          className="w-full rounded-lg border border-ink-700/60 bg-ink-850 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition-colors focus:border-accent-500/60 focus:bg-ink-800"
        />
      </div>

      <div className="hidden items-center gap-2 rounded-lg border border-ink-700/60 bg-ink-850 px-3 py-1.5 md:flex">
        <span className="h-2 w-2 animate-pulse-soft rounded-full bg-bull-500" />
        <span className="font-mono text-sm text-slate-300">{utcTime}</span>
        <span className="text-xs text-slate-500">UTC</span>
      </div>

      <button
        onClick={onRefresh}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-700/60 bg-ink-850 text-slate-400 transition-colors hover:bg-ink-700 hover:text-slate-200"
        title="Refresh data"
      >
        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
      </button>

      <button
        onClick={toggle}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-700/60 bg-ink-850 text-slate-400 transition-colors hover:bg-ink-700 hover:text-slate-200"
        title="Toggle theme"
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-ink-700/60 bg-ink-850 text-slate-400 transition-colors hover:bg-ink-700 hover:text-slate-200">
        <Bell className="h-4 w-4" />
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-bear-500" />
      </button>

      <div className="flex items-center gap-2.5 rounded-lg border border-ink-700/60 bg-ink-850 py-1 pl-1 pr-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-accent-500 to-accent-400">
          <User className="h-4 w-4 text-white" />
        </div>
        <div className="hidden leading-tight sm:block">
          <p className="text-xs font-semibold text-slate-200">Institutional</p>
          <p className="text-[10px] text-slate-500">Pro Account</p>
        </div>
      </div>
    </header>
  );
}
