/**
 * Data adapters — transform raw API JSON into the shapes the frontend
 * components expect (matching the TypeScript interfaces in @/types).
 *
 * These adapters are the single point of translation between the backend
 * and frontend, so components don't need to know about API field names.
 */

import type {
  Currency,
  MacroIndicator,
  CalendarEvent,
  CentralBank,
  NewsItem,
  AIInsight,
  Trend,
  Direction,
  FutureInstrument,
  ScanResult,
  Signal,
  AssetClass,
} from '@/types';

// --- Currencies -----------------------------------------------------------

interface ApiCurrency {
  code: string;
  name: string;
  flag: string;
  score: number;
  ai_rating: string;
  confidence: number;
  trend: string;
  momentum: number;
  summary: string;
  last_update: string;
  history?: { date: string; score: number }[];
}

export function adaptCurrency(raw: ApiCurrency): Currency {
  const score = raw.score ?? 50;
  return {
    code: raw.code,
    name: raw.name,
    flag: raw.flag || '',
    score,
    confidence: raw.confidence ?? 0,
    trend: (raw.trend as Trend) ?? 'flat',
    aiRating: (raw.ai_rating as Currency['aiRating']) ?? 'Neutral',
    lastUpdate: raw.last_update ?? '',
    color: score >= 65 ? 'bull' : score <= 40 ? 'bear' : 'neutral',
    summary: raw.summary ?? '',
    positiveFactors: [],
    negativeFactors: [],
    recommendedPairs: [],
    history: raw.history ?? [],
  };
}

export function adaptCurrencies(raw: ApiCurrency[]): Currency[] {
  return raw.map(adaptCurrency);
}

// --- Dashboard -------------------------------------------------------------

interface ApiDashboard {
  currencies: ApiCurrency[];
  markets: ApiMarketPrice[];
  vix: number;
  dxy: number;
  topPairs: ApiPair[];
  news: ApiNewsItem[];
}

export function adaptDashboard(raw: ApiDashboard) {
  return {
    currencies: raw.currencies.map(adaptCurrency),
    markets: raw.markets ?? [],
    vix: raw.vix ?? 14.5,
    dxy: raw.dxy ?? 104.2,
    topPairs: raw.topPairs ?? [],
    news: raw.news ?? [],
  };
}

// --- Markets ---------------------------------------------------------------

interface ApiMarketPrice {
  symbol: string;
  name: string;
  category: string;
  price: number;
  change: number;
  change_pct: number;
  timestamp?: string;
}

export function adaptMarketPrice(raw: ApiMarketPrice) {
  return {
    symbol: raw.symbol,
    name: raw.name,
    category: raw.category,
    price: raw.price,
    change: raw.change,
    changePct: raw.change_pct,
  };
}

// --- Pairs -----------------------------------------------------------------

interface ApiPair {
  pair: string;
  base: string;
  quote: string;
  signal: string;
  confidence: number;
  risk: string;
  expected_direction: string;
  score_diff: number;
  price?: number;
  entry?: number;
  stop_loss?: number;
  take_profit_1?: number;
  take_profit_2?: number;
  risk_reward?: string;
  holding_period?: string;
}

export function adaptPair(raw: ApiPair) {
  return {
    pair: raw.pair,
    base: raw.base,
    quote: raw.quote,
    signal: raw.signal,
    confidence: raw.confidence,
    risk: raw.risk,
    expectedDirection: raw.expected_direction,
    scoreDiff: raw.score_diff,
    price: raw.price,
    entry: raw.entry,
    stopLoss: raw.stop_loss,
    takeProfit1: raw.take_profit_1,
    takeProfit2: raw.take_profit_2,
    riskReward: raw.risk_reward,
    holdingPeriod: raw.holding_period,
  };
}

// --- Macro indicators ------------------------------------------------------

interface ApiMacroIndicator {
  id: number;
  country: string;
  code: string;
  name: string;
  value: number | null;
  unit: string;
  previous: number | null;
  source: string;
  timestamp: string;
}

export function adaptMacroIndicator(raw: ApiMacroIndicator): MacroIndicator {
  const value = raw.value ?? 0;
  const previous = raw.previous ?? 0;
  const change = value - previous;
  const changePct = previous !== 0 ? ((change / previous) * 100) : 0;
  const sentiment: MacroIndicator['sentiment'] = changePct > 0 ? 'bullish' : changePct < 0 ? 'bearish' : 'neutral';

  return {
    id: `${raw.country}-${raw.name}`.toLowerCase().replace(/\s+/g, '-'),
    name: raw.name,
    value: `${value}${raw.unit || ''}`,
    previous: `${previous}${raw.unit || ''}`,
    change: `${change >= 0 ? '+' : ''}${change.toFixed(2)}`,
    changePct: Math.round(changePct * 10) / 10,
    sentiment,
    unit: raw.unit || '',
    description: `${raw.name} for ${raw.country} (source: ${raw.source})`,
    history: [],
  };
}

export function adaptMacroIndicators(raw: ApiMacroIndicator[]): MacroIndicator[] {
  return raw.map(adaptMacroIndicator);
}

// --- Calendar --------------------------------------------------------------

interface ApiCalendarEvent {
  id: number;
  timestamp: string;
  country: string;
  event: string;
  importance: string;
  actual: number | null;
  forecast: number | null;
  previous: number | null;
  source: string;
}

const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸', EU: '🇪🇺', GB: '🇬🇧', JP: '🇯🇵', CH: '🇨🇭', CA: '🇨🇦', AU: '🇦🇺', NZ: '🇳🇿',
};

const COUNTRY_CURRENCY: Record<string, string> = {
  US: 'USD', EU: 'EUR', GB: 'GBP', JP: 'JPY', CH: 'CHF', CA: 'CAD', AU: 'AUD', NZ: 'NZD',
};

export function adaptCalendarEvent(raw: ApiCalendarEvent): CalendarEvent {
  const dt = new Date(raw.timestamp);
  const time = dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const impact = (raw.importance?.toLowerCase() === 'high' ? 'high' : raw.importance?.toLowerCase() === 'low' ? 'low' : 'medium') as CalendarEvent['impact'];

  return {
    id: String(raw.id),
    country: raw.country,
    flag: COUNTRY_FLAGS[raw.country] ?? '',
    currency: COUNTRY_CURRENCY[raw.country] ?? raw.country,
    time,
    event: raw.event,
    forecast: raw.forecast != null ? String(raw.forecast) : '—',
    previous: raw.previous != null ? String(raw.previous) : '—',
    impact,
  };
}

export function adaptCalendarEvents(raw: ApiCalendarEvent[]): CalendarEvent[] {
  return raw.map(adaptCalendarEvent);
}

// --- Central banks ---------------------------------------------------------

interface ApiCentralBank {
  id: number;
  code: string;
  name: string;
  country: string;
  governor: string;
  rate: number;
  rate_name: string;
  stance: string;
  next_meeting: string;
  last_change: string;
  summary: string;
  updated_at: string;
}

export function adaptCentralBank(raw: ApiCentralBank): CentralBank {
  const stance = raw.stance?.includes('Hawkish') ? 'Hawkish' : raw.stance?.includes('Dovish') || raw.stance?.includes('Easing') ? 'Dovish' : 'Neutral';
  return {
    id: raw.code,
    name: raw.name,
    country: raw.country,
    flag: COUNTRY_FLAGS[raw.country] ?? '',
    rate: raw.rate,
    previousRate: raw.rate,
    change: 0,
    lastMeeting: raw.last_change ?? '',
    nextMeeting: raw.next_meeting ?? '',
    expectedDecision: stance,
    marketPricing: '—',
    stance: stance as CentralBank['stance'],
    governor: raw.governor ?? '',
    confidence: 75,
    inflationTrend: 'flat' as Trend,
    employmentTrend: 'flat' as Trend,
    gdpTrend: 'flat' as Trend,
    policySummary: raw.summary ?? '',
    probabilities: { hold: 60, cut: 25, hike: 15 },
    rateHistory: [],
    recentStatement: raw.summary ?? '',
    economicConditions: '',
    inflationOutlook: '',
    employmentOutlook: '',
    gdpOutlook: '',
    aiInterpretation: raw.summary ?? '',
    expectedNextDecision: stance,
    expectedCurrencyImpact: '—',
  };
}

export function adaptCentralBanks(raw: ApiCentralBank[]): CentralBank[] {
  return raw.map(adaptCentralBank);
}

// --- News ------------------------------------------------------------------

interface ApiNewsItem {
  id: number;
  timestamp: string;
  source: string;
  headline: string;
  summary: string;
  url: string;
  sentiment: string;
  sentiment_score: number;
  currencies: string;
}

export function adaptNewsItem(raw: ApiNewsItem): NewsItem {
  const dt = new Date(raw.timestamp);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - dt.getTime()) / 60000);
  const time = diffMin < 60 ? `${diffMin}m ago` : `${Math.floor(diffMin / 60)}h ago`;
  const impact = Math.abs(raw.sentiment_score) > 0.5 ? 'high' : Math.abs(raw.sentiment_score) > 0.2 ? 'medium' : 'low';

  return {
    id: String(raw.id),
    title: raw.headline,
    source: raw.source,
    time,
    category: 'Macro',
    impact: impact as NewsItem['impact'],
    currencies: raw.currencies ? raw.currencies.split(',').filter(Boolean) : [],
    summary: raw.summary ?? '',
  };
}

export function adaptNewsItems(raw: ApiNewsItem[]): NewsItem[] {
  return raw.map(adaptNewsItem);
}

// --- AI Analysis -----------------------------------------------------------

interface ApiAnalysis {
  currency: string;
  name: string;
  flag: string;
  score: number;
  signal: string;
  confidence: number;
  executive_summary: string;
  bullish_factors: string;
  bearish_factors: string;
  macro_environment: string;
  central_bank_outlook: string;
  risk_factors: string;
  trade_recommendation: string;
  expected_direction: string;
  probability: number;
  holding_time: string;
  stop_loss: string;
  take_profit: string;
  best_pair: string;
  timestamp: string;
}

export function adaptAnalysis(raw: ApiAnalysis) {
  return {
    currency: raw.currency,
    name: raw.name,
    flag: raw.flag,
    score: raw.score,
    signal: raw.signal,
    confidence: raw.confidence,
    executiveSummary: raw.executive_summary,
    bullishFactors: raw.bullish_factors,
    bearishFactors: raw.bearish_factors,
    macroEnvironment: raw.macro_environment,
    centralBankOutlook: raw.central_bank_outlook,
    riskFactors: raw.risk_factors,
    tradeRecommendation: raw.trade_recommendation,
    expectedDirection: raw.expected_direction,
    probability: raw.probability,
    holdingTime: raw.holding_time,
    stopLoss: raw.stop_loss,
    takeProfit: raw.take_profit,
    bestPair: raw.best_pair,
    timestamp: raw.timestamp,
  };
}

export function adaptAnalyses(raw: ApiAnalysis[]) {
  return raw.map(adaptAnalysis);
}

// --- AI Insights (derived from analysis) -----------------------------------

export function adaptAnalysisToInsights(raw: ApiAnalysis[]): AIInsight[] {
  return raw.map((a) => ({
    id: a.currency,
    currency: a.currency,
    title: `${a.currency} — ${a.signal}`,
    body: a.executive_summary,
    sentiment: a.signal.includes('Buy') ? 'bullish' : a.signal.includes('Sell') ? 'bearish' : 'neutral',
    time: 'just now',
  }));
}

// --- Global risk -----------------------------------------------------------

interface ApiGlobalRisk {
  vix: number;
  dxy: number;
  riskScore: number;
  mode: string;
  description: string;
}

export function adaptGlobalRisk(raw: ApiGlobalRisk) {
  return {
    vix: raw.vix,
    dxy: raw.dxy,
    riskScore: raw.riskScore,
    mode: raw.mode,
    description: raw.description,
  };
}

// --- Forex quotes ----------------------------------------------------------

interface ApiForexQuote {
  symbol: string;
  base: string;
  quote: string;
  price: number;
  change: number;
  change_pct: number;
  timestamp: string;
}

export function adaptForexQuote(raw: ApiForexQuote) {
  return {
    symbol: raw.symbol,
    base: raw.base,
    quote: raw.quote,
    price: raw.price,
    change: raw.change,
    changePct: raw.change_pct,
  };
}

// --- Watchlist -------------------------------------------------------------

interface ApiWatchlistItem {
  id: number;
  symbol: string;
  kind: string;
  added_at: string;
  price?: number;
  change?: number;
  change_pct?: number;
}

export function adaptWatchlistItem(raw: ApiWatchlistItem) {
  return {
    pair: raw.symbol,
    base: raw.symbol.slice(0, 3),
    quote: raw.symbol.slice(3),
    price: raw.price ?? 0,
    change: raw.change ?? 0,
    changePct: raw.change_pct ?? 0,
    trend: 'flat' as Trend,
    aiBias: 'neutral' as Direction,
    confidence: 0,
  };
}

export function adaptWatchlist(raw: ApiWatchlistItem[]) {
  return raw.map(adaptWatchlistItem);
}

interface ApiFutureInstrument {
  symbol: string;
  name: string;
  category: string;
  price: number;
  change: number;
  change_pct: number;
  trend: string;
  ai_score: number;
  bias: string;
  confidence: number;
  support: number;
  resistance: number;
  atr: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  prev_close: number;
  history: { date: string; price: number }[];
  timestamp?: string;
  source?: string;
  data_status?: string;
  provider_symbol?: string | null;
  instrument_type?: string;
}

export function adaptFutureInstrument(raw: ApiFutureInstrument): FutureInstrument {
  return {
    symbol: raw.symbol,
    name: raw.name,
    category: raw.category as FutureInstrument['category'],
    price: raw.price,
    change: raw.change,
    changePct: raw.change_pct,
    trend: raw.trend as Trend,
    aiScore: raw.ai_score,
    bias: raw.bias as Direction,
    confidence: raw.confidence,
    support: raw.support,
    resistance: raw.resistance,
    atr: raw.atr,
    volume: raw.volume,
    high: raw.high,
    low: raw.low,
    open: raw.open,
    prevClose: raw.prev_close,
    history: raw.history ?? [],
    timestamp: raw.timestamp ?? '',
    source: raw.source ?? 'seed',
    dataStatus: raw.data_status ?? 'OFFLINE',
    providerSymbol: raw.provider_symbol ?? null,
    instrumentType: (raw.instrument_type as FutureInstrument['instrumentType']) ?? 'INDEX',
  };
}

export function adaptFutureInstruments(raw: ApiFutureInstrument[]): FutureInstrument[] {
  return raw.map(adaptFutureInstrument);
}

// --- Market Scanner --------------------------------------------------------

interface ApiScanResult {
  rank: number;
  symbol: string;
  name: string;
  asset_class: string;
  price: number;
  change_pct: number;
  ai_score: number;
  signal: string;
  confidence: number;
  trend: string;
  bias: string;
  momentum: number;
  volume: number;
  support: number;
  resistance: number;
  atr: number;
  risk_reward: number;
  catalyst: string;
  sparkline: { date: string; value: number }[];
  volatility: string;
}

export function adaptScanResult(raw: ApiScanResult): ScanResult {
  return {
    rank: raw.rank,
    symbol: raw.symbol,
    name: raw.name,
    assetClass: raw.asset_class as AssetClass,
    price: raw.price,
    changePct: raw.change_pct,
    aiScore: raw.ai_score,
    signal: raw.signal as Signal,
    confidence: raw.confidence,
    trend: raw.trend as Trend,
    bias: raw.bias as Direction,
    momentum: raw.momentum,
    volume: raw.volume,
    support: raw.support,
    resistance: raw.resistance,
    atr: raw.atr,
    riskReward: raw.risk_reward,
    catalyst: raw.catalyst,
    sparkline: raw.sparkline ?? [],
    volatility: raw.volatility as ScanResult['volatility'],
  };
}

export function adaptScanResults(raw: ApiScanResult[]): ScanResult[] {
  return raw.map(adaptScanResult);
}
