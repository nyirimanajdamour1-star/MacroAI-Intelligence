export type Trend = 'up' | 'down' | 'flat';
export type Direction = 'buy' | 'sell' | 'neutral';
export type Impact = 'high' | 'medium' | 'low';
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Very High';

export interface Currency {
  code: string;
  name: string;
  flag: string;
  score: number;
  confidence: number;
  trend: Trend;
  aiRating: 'Strong Buy' | 'Buy' | 'Neutral' | 'Sell' | 'Strong Sell';
  lastUpdate: string;
  color: 'bull' | 'bear' | 'neutral';
  summary: string;
  positiveFactors: string[];
  negativeFactors: string[];
  recommendedPairs: { pair: string; direction: Direction; confidence: number }[];
  history: { date: string; score: number }[];
}

export interface MacroIndicator {
  id: string;
  name: string;
  value: string;
  previous: string;
  change: string;
  changePct: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  unit: string;
  description: string;
  history: { date: string; value: number }[];
}

export interface CalendarEvent {
  id: string;
  country: string;
  flag: string;
  currency: string;
  time: string;
  event: string;
  forecast: string;
  previous: string;
  impact: Impact;
}

export interface CentralBank {
  id: string;
  name: string;
  country: string;
  flag: string;
  rate: number;
  previousRate: number;
  change: number;
  lastMeeting: string;
  nextMeeting: string;
  expectedDecision: string;
  marketPricing: string;
  stance: 'Hawkish' | 'Dovish' | 'Neutral';
  governor: string;
  confidence: number;
  inflationTrend: Trend;
  employmentTrend: Trend;
  gdpTrend: Trend;
  policySummary: string;
  probabilities: { hold: number; cut: number; hike: number };
  rateHistory: { date: string; rate: number }[];
  recentStatement: string;
  economicConditions: string;
  inflationOutlook: string;
  employmentOutlook: string;
  gdpOutlook: string;
  aiInterpretation: string;
  expectedNextDecision: string;
  expectedCurrencyImpact: string;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  category: string;
  impact: Impact;
  currencies: string[];
  summary: string;
}

export interface AIInsight {
  id: string;
  currency: string;
  title: string;
  body: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  time: string;
}

export interface CountryRate {
  country: string;
  flag: string;
  rate: number;
  previous: number;
  nextMeeting: string;
}

export interface WatchlistPair {
  pair: string;
  base: string;
  quote: string;
  price: number;
  change: number;
  changePct: number;
  trend: Trend;
  aiBias: Direction;
  confidence: number;
}

export interface MarketSentiment {
  mode: 'Risk On' | 'Neutral' | 'Risk Off';
  score: number; // 0-100, 100 = max risk on
  vix: number;
  description: string;
}

export interface CurrencySubScores {
  macro: number;
  technical: number;
  sentiment: number;
}

export interface GlobalMacroCountry {
  code: string;
  name: string;
  flag: string;
  interestRate: string;
  inflation: string;
  gdp: string;
  unemployment: string;
  pmi: string;
  retailSales: string;
  tradeBalance: string;
  bondYield: string;
  currencyScore: number;
  aiConfidence: number;
  macroBias: 'Hawkish' | 'Dovish' | 'Neutral';
  trend: Trend;
  signal: 'Strong Buy' | 'Buy' | 'Neutral' | 'Sell' | 'Strong Sell';
  confidence: number;
  mapX: number;
  mapY: number;
  prevScore: number;
  miniChart: { date: string; value: number }[];
}

export interface GlobalSummaryCard {
  id: string;
  label: string;
  value: string;
  prevValue: string;
  trend: Trend;
  status: 'bullish' | 'bearish' | 'neutral';
  miniChart: { date: string; value: number }[];
}

export interface RiskGauge {
  id: string;
  label: string;
  value: number;
  prevValue: number;
  stance: 'Risk On' | 'Risk Off' | 'Neutral';
  description: string;
}

export interface CapitalFlow {
  from: string;
  to: string;
  flow: number;
  direction: 'inflow' | 'outflow';
}

export interface MacroOpportunity {
  rank: number;
  pair: string;
  direction: 'buy' | 'sell';
  score: number;
  confidence: number;
  volatility: 'Low' | 'Medium' | 'High' | 'Very High';
  reason: string;
}

export type DecisionSignal = 'Strong Buy' | 'Buy' | 'Neutral' | 'Sell' | 'Strong Sell';

export interface DecisionIndicator {
  id: string;
  name: string;
  currentValue: string;
  weight: number;
  impact: 'bullish' | 'bearish' | 'neutral';
  contribution: number;
  confidence: number;
  trend: Trend;
}

export interface DecisionReasoning {
  whyBullish: string;
  whyBearish: string;
  currentRisks: string;
  probabilityOfSuccess: number;
  expectedDirection: string;
  bestTimeHorizon: string;
  expectedVolatility: string;
}

export interface DecisionScenario {
  case: 'Bull' | 'Base' | 'Bear';
  probability: number;
  expectedMove: string;
  catalysts: string[];
  riskLevel: 'Low' | 'Medium' | 'High' | 'Very High';
}

export interface DecisionTradePlan {
  direction: DecisionSignal;
  entry: string;
  stopLoss: string;
  takeProfit1: string;
  takeProfit2: string;
  riskReward: string;
  holdingPeriod: string;
  positionSize: string;
}

export interface DecisionHistoryEntry {
  date: string;
  score: number;
  signal: DecisionSignal;
  result: 'Win' | 'Loss' | 'Pending';
  accuracy: number;
}

export interface DecisionModelPerformance {
  predictionAccuracy: number;
  winRate: number;
  avgConfidence: number;
  avgRiskReward: string;
  correctBullishCalls: number;
  totalBullishCalls: number;
  correctBearishCalls: number;
  totalBearishCalls: number;
}

export interface AIDecisionEngine {
  symbol: string;
  score: number;
  signal: DecisionSignal;
  overallConfidence: number;
  macroConfidence: number;
  technicalConfidence: number;
  sentimentConfidence: number;
  dataFreshness: string;
  indicators: DecisionIndicator[];
  reasoning: DecisionReasoning;
  scenarios: DecisionScenario[];
  tradePlan: DecisionTradePlan;
  history: DecisionHistoryEntry[];
  performance: DecisionModelPerformance;
}

export interface PairOpportunity {
  rank: number;
  pair: string;
  direction: Direction;
  strengthScore: number;
  confidence: number;
  risk: 'Very High' | 'High' | 'Medium' | 'Low';
  expectedTrend: Trend;
  reason: string;
}

export type Signal = 'Strong Buy' | 'Buy' | 'Neutral' | 'Sell' | 'Strong Sell';

export interface AIPairAnalysis {
  rank: number;
  pair: string;
  aiScore: number;
  signal: Signal;
  confidence: number;
  trend: Trend;
  riskReward: string;
  macroScore: number;
  technicalScore: number;
  trendScore: number;
  riskScore: number;
  entryPrice: string;
  stopLoss: string;
  takeProfit1: string;
  takeProfit2: string;
  riskRewardRatio: string;
  explanation: string;
}

export interface TradeSetup {
  pair: string;
  direction: Direction;
  entryZone: string;
  stopLoss: string;
  takeProfit: string;
  riskReward: string;
  confidence: number;
  macroExplanation: string;
  technicalConfirmation: string;
}

export interface MarketWidget {
  id: string;
  name: string;
  symbol: string;
  value: string;
  change: number;
  changePct: number;
  trend: Trend;
  icon: string;
}

export interface ComparisonResult {
  base: string;
  quote: string;
  interestRateDiff: string;
  inflationDiff: string;
  gdpDiff: string;
  employmentDiff: string;
  bondYieldDiff: string;
  winner: string;
  probability: number;
  summary: string;
}

export interface MarketSummaryItem {
  id: string;
  title: string;
  body: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  currency: string;
}

export type TradeDirection = 'Strong Buy' | 'Buy' | 'Neutral' | 'Sell' | 'Strong Sell';

export interface MacroFactorCard {
  label: string;
  current: string;
  previous: string;
  trend: Trend;
  bias: 'bullish' | 'bearish' | 'neutral';
  score: number;
}

export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema20: number;
  ema50: number;
  ema200: number;
  atr: number;
  support: number;
  resistance: number;
}

export interface EconomicEvent {
  country: string;
  flag: string;
  time: string;
  event: string;
  forecast: string;
  previous: string;
  actual: string | null;
  impact: 'high' | 'medium' | 'low';
}

export interface FutureInstrument {
  symbol: string;
  name: string;
  category: 'Index' | 'Metal' | 'Energy';
  price: number;
  change: number;
  changePct: number;
  trend: Trend;
  aiScore: number;
  bias: Direction;
  confidence: number;
  support: number;
  resistance: number;
  atr: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  history: { date: string; price: number }[];
  timestamp?: string;
  source?: string;
  dataStatus?: string;
  providerSymbol?: string | null;
  instrumentType?: 'INDEX' | 'FUTURE' | 'COMMODITY' | 'SPOT' | 'ETF';
}

export type AssetClass = 'Forex' | 'Index' | 'Metal' | 'Energy';

export interface ScanResult {
  rank: number;
  symbol: string;
  name: string;
  assetClass: AssetClass;
  price: number;
  changePct: number;
  aiScore: number;
  signal: Signal;
  confidence: number;
  trend: Trend;
  bias: Direction;
  momentum: number;
  volatility: 'Low' | 'Medium' | 'High' | 'Very High';
  volume: number;
  support: number;
  resistance: number;
  atr: number;
  riskReward: number;
  catalyst: string;
  sparkline: { date: string; value: number }[];
}

export interface TradePanelData {
  symbol: string;
  display: string;
  name: string;
  aiScore: number;
  recommendation: TradeDirection;
  confidence: number;
  macroTrend: Trend;
  technicalTrend: Trend;
  riskLevel: RiskLevel;
  macroFactors: MacroFactorCard[];
  compositeScores: {
    macro: number;
    technical: number;
    sentiment: number;
    liquidity: number;
  };
  analysis: {
    marketStructure: string;
    macroEnvironment: string;
    centralBankOutlook: string;
    riskFactors: string;
    expectedDirection: string;
    tradeProbability: string;
  };
  tradeSetup: {
    direction: TradeDirection;
    entry: string;
    stopLoss: string;
    takeProfit1: string;
    takeProfit2: string;
    riskReward: string;
    holdingTime: string;
    probability: number;
  };
  whyThisTrade: string[];
  candles: Candle[];
  events: EconomicEvent[];
  aiSummary: string;
}
