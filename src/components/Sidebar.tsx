import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Coins,
  Database,
  CalendarDays,
  Percent,
  TrendingUp,
  Briefcase,
  ShoppingBag,
  Factory,
  Scale,
  Landmark,
  Building2,
  Newspaper,
  Sparkles,
  Brain,
  Settings,
  ChevronLeft,
  Activity,
  Globe,
  GitCompare,
  Trophy,
  Crosshair,
  LineChart,
  FileText,
  Star,
  Flame,
  Radar,
} from 'lucide-react';

export type PageId =
  | 'dashboard'
  | 'currencies'
  | 'macro'
  | 'global-macro'
  | 'comparison'
  | 'calendar'
  | 'interest'
  | 'inflation'
  | 'gdp'
  | 'employment'
  | 'retail'
  | 'manufacturing'
  | 'trade'
  | 'bonds'
  | 'central-banks'
  | 'opportunities'
  | 'trade-panel'
  | 'live'
  | 'news'
  | 'ai'
  | 'decision-engine'
  | 'market-summary'
  | 'watchlist'
  | 'futures'
  | 'scanner'
  | 'settings';

interface NavGroup {
  label: string;
  items: { id: PageId; label: string; icon: typeof LayoutDashboard; path: string }[];
}

export const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
      { id: 'currencies', label: 'Currencies', icon: Coins, path: '/currencies' },
      { id: 'macro', label: 'Macro Data', icon: Database, path: '/macro' },
      { id: 'global-macro', label: 'Global Macro', icon: Globe, path: '/global-macro' },
      { id: 'comparison', label: 'Currency Comparison', icon: GitCompare, path: '/comparison' },
      { id: 'calendar', label: 'Economic Calendar', icon: CalendarDays, path: '/calendar' },
    ],
  },
  {
    label: 'Indicators',
    items: [
      { id: 'interest', label: 'Interest Rates', icon: Percent, path: '/interest' },
      { id: 'inflation', label: 'Inflation', icon: TrendingUp, path: '/inflation' },
      { id: 'gdp', label: 'GDP', icon: Activity, path: '/gdp' },
      { id: 'employment', label: 'Employment', icon: Briefcase, path: '/employment' },
      { id: 'retail', label: 'Retail Sales', icon: ShoppingBag, path: '/retail' },
      { id: 'manufacturing', label: 'Manufacturing', icon: Factory, path: '/manufacturing' },
      { id: 'trade', label: 'Trade Balance', icon: Scale, path: '/trade' },
      { id: 'bonds', label: 'Bond Yields', icon: Landmark, path: '/bonds' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { id: 'central-banks', label: 'Central Banks', icon: Building2, path: '/central-banks' },
      { id: 'opportunities', label: 'AI Pair Opportunities', icon: Trophy, path: '/opportunities' },
      { id: 'scanner', label: 'AI Market Scanner', icon: Radar, path: '/scanner' },
      { id: 'trade-panel', label: 'AI Trade Panel', icon: Crosshair, path: '/trade-panel' },
      { id: 'news', label: 'News', icon: Newspaper, path: '/news' },
      { id: 'ai', label: 'AI Analysis', icon: Sparkles, path: '/ai' },
      { id: 'decision-engine', label: 'AI Decision Engine', icon: Brain, path: '/decision-engine' },
      { id: 'market-summary', label: 'AI Market Summary', icon: FileText, path: '/market-summary' },
    ],
  },
  {
    label: 'Futures',
    items: [
      { id: 'futures', label: 'Futures Dashboard', icon: Flame, path: '/futures' },
    ],
  },
  {
    label: 'Markets',
    items: [
      { id: 'live', label: 'Live Dashboard', icon: LineChart, path: '/live' },
      { id: 'watchlist', label: 'Watchlist', icon: Star, path: '/watchlist' },
    ],
  },
  {
    label: 'System',
    items: [{ id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }],
  },
];

const pathToPage: Record<string, PageId> = {
  '/': 'dashboard',
  '/currencies': 'currencies',
  '/macro': 'macro',
  '/global-macro': 'global-macro',
  '/comparison': 'comparison',
  '/calendar': 'calendar',
  '/interest': 'interest',
  '/inflation': 'inflation',
  '/gdp': 'gdp',
  '/employment': 'employment',
  '/retail': 'retail',
  '/manufacturing': 'manufacturing',
  '/trade': 'trade',
  '/bonds': 'bonds',
  '/central-banks': 'central-banks',
  '/opportunities': 'opportunities',
  '/trade-panel': 'trade-panel',
  '/live': 'live',
  '/news': 'news',
  '/ai': 'ai',
  '/decision-engine': 'decision-engine',
  '/market-summary': 'market-summary',
  '/watchlist': 'watchlist',
  '/futures': 'futures',
  '/scanner': 'scanner',
  '/settings': 'settings',
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const current: PageId = pathToPage[location.pathname] ?? 'dashboard';

  return (
    <aside
      className={`${
        collapsed ? 'w-[68px]' : 'w-60'
      } shrink-0 border-r border-ink-700/60 bg-ink-900/90 backdrop-blur-md flex flex-col transition-all duration-200`}
    >
      <div className="flex h-14 items-center gap-2.5 border-b border-ink-700/60 px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500 to-accent-400 shadow-glow">
          <Activity className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-tight text-slate-100">MacroAI</span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Macro Intelligence</span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 py-3">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            {!collapsed && <p className="section-title mb-1.5 px-2">{group.label}</p>}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = current === item.id;
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    title={collapsed ? item.label : undefined}
                    className={`nav-item w-full ${active ? 'nav-item-active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
                  >
                    <Icon className={`h-4.5 w-4.5 shrink-0 ${active ? 'text-accent-400' : ''}`} strokeWidth={2} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-ink-700/60 p-2.5">
        <button
          onClick={onToggle}
          className="nav-item w-full justify-center"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
