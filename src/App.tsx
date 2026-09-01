import { useState, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import Sidebar, { type PageId, navGroups } from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import AIPanel from '@/components/AIPanel';
import Dashboard from '@/pages/Dashboard';
import CurrenciesPage from '@/pages/CurrenciesPage';
import MacroDataPage from '@/pages/MacroDataPage';
import GlobalMacroPage from '@/pages/GlobalMacroPage';
import CurrencyComparisonPage from '@/pages/CurrencyComparisonPage';
import CalendarPage from '@/pages/CalendarPage';
import IndicatorPage from '@/pages/IndicatorPage';
import CentralBanksPage from '@/pages/CentralBanksPage';
import PairOpportunitiesPage from '@/pages/PairOpportunitiesPage';
import TradePanelPage from '@/pages/TradePanelPage';
import LiveDashboardPage from '@/pages/LiveDashboardPage';
import NewsPage from '@/pages/NewsPage';
import AIAnalysisPage from '@/pages/AIAnalysisPage';
import AIDecisionEnginePage from '@/pages/AIDecisionEnginePage';
import MarketSummaryPage from '@/pages/MarketSummaryPage';
import FuturesDashboardPage from '@/pages/FuturesDashboardPage';
import AIMarketScannerPage from '@/pages/AIMarketScannerPage';
import WatchlistPage from '@/pages/WatchlistPage';
import SettingsPage from '@/pages/SettingsPage';
import type { Currency } from '@/types';

const pageTitles: Record<PageId, string> = {
  dashboard: 'Dashboard',
  currencies: 'Currencies',
  macro: 'Macro Data',
  'global-macro': 'Global Macro',
  comparison: 'Currency Comparison',
  calendar: 'Economic Calendar',
  interest: 'Interest Rates',
  inflation: 'Inflation',
  gdp: 'GDP',
  employment: 'Employment',
  retail: 'Retail Sales',
  manufacturing: 'Manufacturing',
  trade: 'Trade Balance',
  bonds: 'Bond Yields',
  'central-banks': 'Central Banks',
  opportunities: 'AI Pair Opportunities',
  'trade-panel': 'AI Trade Panel',
  live: 'Live Dashboard',
  news: 'News',
  ai: 'AI Analysis',
  'decision-engine': 'AI Decision Engine',
  'market-summary': 'AI Market Summary',
  watchlist: 'Watchlist',
  futures: 'Futures Dashboard',
  scanner: 'AI Market Scanner',
  settings: 'Settings',
};

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

function App() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  const handleSelectCurrency = useCallback((c: Currency) => {
    setSelectedCurrency(c);
  }, []);

  const currentPage: PageId = pathToPage[location.pathname] ?? 'dashboard';

  return (
    <ThemeProvider>
      <div className="flex h-screen overflow-hidden bg-ink-950">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar onRefresh={handleRefresh} refreshing={refreshing} />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[1600px] px-5 py-5">
              <div className="mb-4">
                <h1 className="text-xl font-bold text-slate-100">
                  {pageTitles[currentPage] ?? 'Dashboard'}
                </h1>
              </div>
              <Routes>
                <Route
                  path="/"
                  element={
                    <Dashboard
                      onSelectCurrency={handleSelectCurrency}
                      selectedCode={selectedCurrency?.code ?? null}
                    />
                  }
                />
                <Route
                  path="/currencies"
                  element={
                    <CurrenciesPage
                      onSelectCurrency={handleSelectCurrency}
                      selectedCode={selectedCurrency?.code ?? null}
                    />
                  }
                />
                <Route path="/macro" element={<MacroDataPage />} />
                <Route path="/global-macro" element={<GlobalMacroPage />} />
                <Route path="/comparison" element={<CurrencyComparisonPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route
                  path="/interest"
                  element={
                    <IndicatorPage
                      indicatorKey="rate"
                      title="Interest Rates"
                      description="Central bank policy rates across major economies"
                      unit="%"
                      color="#3b82f6"
                    />
                  }
                />
                <Route
                  path="/inflation"
                  element={
                    <IndicatorPage
                      indicatorKey="cpi"
                      title="Inflation (CPI)"
                      description="Consumer price index year-over-year"
                      unit="%"
                      color="#f59e0b"
                    />
                  }
                />
                <Route
                  path="/gdp"
                  element={
                    <IndicatorPage
                      indicatorKey="gdp"
                      title="GDP Growth"
                      description="Gross domestic product growth rates"
                      unit="%"
                      color="#10b981"
                    />
                  }
                />
                <Route
                  path="/employment"
                  element={
                    <IndicatorPage
                      indicatorKey="unemp"
                      title="Employment"
                      description="Unemployment rates across major economies"
                      unit="%"
                      color="#8b5cf6"
                    />
                  }
                />
                <Route
                  path="/retail"
                  element={
                    <IndicatorPage
                      indicatorKey="retail"
                      title="Retail Sales"
                      description="Monthly retail sales changes"
                      unit="% MoM"
                      color="#06b6d4"
                    />
                  }
                />
                <Route
                  path="/manufacturing"
                  element={
                    <IndicatorPage
                      indicatorKey="pmi"
                      title="Manufacturing PMI"
                      description="Purchasing managers index — above 50 = expansion"
                      unit=""
                      color="#ec4899"
                    />
                  }
                />
                <Route
                  path="/trade"
                  element={
                    <IndicatorPage
                      indicatorKey="trade"
                      title="Trade Balance"
                      description="Monthly trade balance by country"
                      unit="B"
                      color="#84cc16"
                    />
                  }
                />
                <Route
                  path="/bonds"
                  element={
                    <IndicatorPage
                      indicatorKey="yield"
                      title="Bond Yields"
                      description="10-year government bond yields"
                      unit="%"
                      color="#f97316"
                    />
                  }
                />
                <Route path="/central-banks" element={<CentralBanksPage />} />
                <Route path="/opportunities" element={<PairOpportunitiesPage />} />
                <Route path="/trade-panel" element={<TradePanelPage />} />
                <Route path="/live" element={<LiveDashboardPage />} />
                <Route path="/news" element={<NewsPage />} />
                <Route
                  path="/ai"
                  element={<AIAnalysisPage onSelectCurrency={handleSelectCurrency} />}
                />
                <Route path="/decision-engine" element={<AIDecisionEnginePage />} />
                <Route path="/market-summary" element={<MarketSummaryPage />} />
                <Route path="/futures" element={<FuturesDashboardPage />} />
                <Route path="/scanner" element={<AIMarketScannerPage />} />
                <Route path="/watchlist" element={<WatchlistPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </main>
        </div>
        <AIPanel currency={selectedCurrency} />
      </div>
    </ThemeProvider>
  );
}

export default App;
