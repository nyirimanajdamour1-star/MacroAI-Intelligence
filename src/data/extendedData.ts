import type {
  GlobalMacroCountry,
  PairOpportunity,
  TradeSetup,
  MarketWidget,
  ComparisonResult,
  MarketSummaryItem,
  CalendarEvent,
  NewsItem,
  WatchlistPair,
  AIPairAnalysis,
  Signal,
  TradePanelData,
  TradeDirection,
  Candle,
  GlobalSummaryCard,
  RiskGauge,
  CapitalFlow,
  MacroOpportunity,
  AIDecisionEngine,
  DecisionIndicator,
  DecisionReasoning,
  DecisionScenario,
  DecisionTradePlan,
  DecisionHistoryEntry,
  DecisionModelPerformance,
  FutureInstrument,
} from '@/types';
import { currencies, currencySubScores } from './mockData';

function genMiniChart(start: number, drift: number, vol: number): { date: string; value: number }[] {
  const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let v = start;
  return months.map((m) => {
    v = Math.max(0, v + drift + (Math.random() - 0.5) * vol);
    return { date: m, value: Number(v.toFixed(1)) };
  });
}

export const globalMacroCountries: GlobalMacroCountry[] = [
  {
    code: 'USD', name: 'United States', flag: '🇺🇸',
    interestRate: '5.50%', inflation: '3.0%', gdp: '2.8%', unemployment: '4.1%',
    pmi: '48.7', retailSales: '+0.6%', tradeBalance: '-$70.2B', bondYield: '4.28%',
    currencyScore: 78.4, aiConfidence: 86, macroBias: 'Hawkish',
    trend: 'up', signal: 'Strong Buy', confidence: 86,
    mapX: 22, mapY: 38, prevScore: 76.1,
    miniChart: genMiniChart(74, 0.8, 2),
  },
  {
    code: 'EUR', name: 'Eurozone', flag: '🇪🇺',
    interestRate: '3.50%', inflation: '2.3%', gdp: '0.4%', unemployment: '6.4%',
    pmi: '45.6', retailSales: '-0.1%', tradeBalance: '€17.8B', bondYield: '2.41%',
    currencyScore: 42.1, aiConfidence: 72, macroBias: 'Dovish',
    trend: 'down', signal: 'Strong Sell', confidence: 72,
    mapX: 49, mapY: 32, prevScore: 45.3,
    miniChart: genMiniChart(48, -1.2, 2),
  },
  {
    code: 'GBP', name: 'United Kingdom', flag: '🇬🇧',
    interestRate: '5.00%', inflation: '2.8%', gdp: '0.1%', unemployment: '4.3%',
    pmi: '49.4', retailSales: '+0.3%', tradeBalance: '-£4.2B', bondYield: '4.12%',
    currencyScore: 58.7, aiConfidence: 68, macroBias: 'Neutral',
    trend: 'flat', signal: 'Neutral', confidence: 64,
    mapX: 47, mapY: 28, prevScore: 59.2,
    miniChart: genMiniChart(59, -0.1, 1.5),
  },
  {
    code: 'JPY', name: 'Japan', flag: '🇯🇵',
    interestRate: '0.25%', inflation: '2.1%', gdp: '0.7%', unemployment: '2.6%',
    pmi: '49.1', retailSales: '+1.2%', tradeBalance: '-¥0.6T', bondYield: '0.97%',
    currencyScore: 31.2, aiConfidence: 79, macroBias: 'Hawkish',
    trend: 'up', signal: 'Buy', confidence: 76,
    mapX: 82, mapY: 40, prevScore: 28.5,
    miniChart: genMiniChart(28, 0.5, 1.5),
  },
  {
    code: 'CAD', name: 'Canada', flag: '🇨🇦',
    interestRate: '4.25%', inflation: '2.5%', gdp: '1.1%', unemployment: '6.0%',
    pmi: '47.2', retailSales: '+0.1%', tradeBalance: '+C$1.2B', bondYield: '3.18%',
    currencyScore: 49.3, aiConfidence: 65, macroBias: 'Dovish',
    trend: 'down', signal: 'Sell', confidence: 65,
    mapX: 20, mapY: 28, prevScore: 52.0,
    miniChart: genMiniChart(53, -0.6, 1.5),
  },
  {
    code: 'AUD', name: 'Australia', flag: '🇦🇺',
    interestRate: '4.35%', inflation: '3.4%', gdp: '1.5%', unemployment: '4.1%',
    pmi: '49.8', retailSales: '-0.3%', tradeBalance: '+A$5.6B', bondYield: '4.22%',
    currencyScore: 53.9, aiConfidence: 63, macroBias: 'Hawkish',
    trend: 'flat', signal: 'Buy', confidence: 63,
    mapX: 83, mapY: 72, prevScore: 54.5,
    miniChart: genMiniChart(54, 0.0, 1.5),
  },
  {
    code: 'NZD', name: 'New Zealand', flag: '🇳🇿',
    interestRate: '4.75%', inflation: '2.9%', gdp: '-0.2%', unemployment: '4.8%',
    pmi: '46.5', retailSales: '-0.5%', tradeBalance: '+NZ$0.9B', bondYield: '4.08%',
    currencyScore: 46.7, aiConfidence: 61, macroBias: 'Dovish',
    trend: 'down', signal: 'Strong Sell', confidence: 61,
    mapX: 92, mapY: 78, prevScore: 50.1,
    miniChart: genMiniChart(52, -1.0, 1.5),
  },
  {
    code: 'CHF', name: 'Switzerland', flag: '🇨🇭',
    interestRate: '1.00%', inflation: '1.2%', gdp: '0.8%', unemployment: '2.6%',
    pmi: '48.3', retailSales: '+0.4%', tradeBalance: '+CHF 4.1B', bondYield: '0.62%',
    currencyScore: 64.8, aiConfidence: 74, macroBias: 'Dovish',
    trend: 'up', signal: 'Buy', confidence: 74,
    mapX: 49, mapY: 35, prevScore: 62.0,
    miniChart: genMiniChart(61, 0.7, 1.5),
  },
  {
    code: 'CNY', name: 'China', flag: '🇨🇳',
    interestRate: '3.10%', inflation: '0.6%', gdp: '4.7%', unemployment: '5.0%',
    pmi: '50.3', retailSales: '+3.0%', tradeBalance: '+$82.3B', bondYield: '2.18%',
    currencyScore: 55.2, aiConfidence: 70, macroBias: 'Dovish',
    trend: 'flat', signal: 'Neutral', confidence: 70,
    mapX: 75, mapY: 40, prevScore: 56.8,
    miniChart: genMiniChart(57, -0.3, 1.5),
  },
];

export const globalSummaryCards: GlobalSummaryCard[] = [
  {
    id: 'risk-sentiment',
    label: 'Global Risk Sentiment',
    value: '62',
    prevValue: '58',
    trend: 'up',
    status: 'bullish',
    miniChart: genMiniChart(55, 1.2, 3),
  },
  {
    id: 'dxy',
    label: 'US Dollar Index',
    value: '104.32',
    prevValue: '103.85',
    trend: 'up',
    status: 'bullish',
    miniChart: genMiniChart(102, 0.5, 2),
  },
  {
    id: 'global-inflation',
    label: 'Global Inflation',
    value: '3.1%',
    prevValue: '3.4%',
    trend: 'down',
    status: 'bullish',
    miniChart: genMiniChart(4.2, -0.2, 0.5),
  },
  {
    id: 'global-growth',
    label: 'Global Growth Score',
    value: '54',
    prevValue: '56',
    trend: 'down',
    status: 'bearish',
    miniChart: genMiniChart(58, -0.5, 2),
  },
  {
    id: 'cb-divergence',
    label: 'Central Bank Divergence',
    value: 'High',
    prevValue: 'Medium',
    trend: 'up',
    status: 'neutral',
    miniChart: genMiniChart(60, 1.0, 3),
  },
  {
    id: 'volatility',
    label: 'Market Volatility',
    value: '14.20',
    prevValue: '15.10',
    trend: 'down',
    status: 'bullish',
    miniChart: genMiniChart(16, -0.3, 1.5),
  },
];

export const riskGauges: RiskGauge[] = [
  { id: 'risk-on-off', label: 'Risk On / Risk Off', value: 62, prevValue: 58, stance: 'Risk On', description: 'Markets in mild risk-on mode; equities bid, VIX low.' },
  { id: 'dollar-strength', label: 'Dollar Strength', value: 78, prevValue: 75, stance: 'Risk On', description: 'DXY elevated on rate differential support.' },
  { id: 'bond-stress', label: 'Bond Market Stress', value: 28, prevValue: 32, stance: 'Neutral', description: 'Yields stable; no stress signals in credit spreads.' },
  { id: 'equity-sentiment', label: 'Equity Sentiment', value: 68, prevValue: 64, stance: 'Risk On', description: 'Equity breadth positive; SPX near highs.' },
  { id: 'commodity-strength', label: 'Commodity Strength', value: 45, prevValue: 48, stance: 'Risk Off', description: 'Oil soft, gold bid; mixed commodity complex.' },
  { id: 'safe-haven', label: 'Safe Haven Demand', value: 42, prevValue: 46, stance: 'Neutral', description: 'CHF and gold see modest demand; JPY weak.' },
];

export const capitalFlows: CapitalFlow[] = [
  { from: 'JPY', to: 'USD', flow: 42, direction: 'outflow' },
  { from: 'EUR', to: 'USD', flow: 35, direction: 'outflow' },
  { from: 'JPY', to: 'CHF', flow: 28, direction: 'outflow' },
  { from: 'CAD', to: 'USD', flow: 22, direction: 'outflow' },
  { from: 'NZD', to: 'USD', flow: 18, direction: 'outflow' },
  { from: 'EUR', to: 'CHF', flow: 15, direction: 'outflow' },
  { from: 'USD', to: 'CHF', flow: 12, direction: 'inflow' },
  { from: 'AUD', to: 'USD', flow: 10, direction: 'outflow' },
  { from: 'GBP', to: 'USD', flow: 8, direction: 'outflow' },
];

export const macroOpportunities: MacroOpportunity[] = [
  { rank: 1, pair: 'USD/JPY', direction: 'buy', score: 92, confidence: 88, volatility: 'Very High', reason: 'Widest rate differential (525bp) drives carry demand.' },
  { rank: 2, pair: 'EUR/USD', direction: 'sell', score: 89, confidence: 84, volatility: 'High', reason: 'ECB easing cycle widens rate gap vs Fed.' },
  { rank: 3, pair: 'CHF/JPY', direction: 'buy', score: 85, confidence: 82, volatility: 'High', reason: 'CHF safe-haven bid vs JPY structural weakness.' },
  { rank: 4, pair: 'USD/CAD', direction: 'buy', score: 81, confidence: 72, volatility: 'Medium', reason: 'BoC easing ahead of Fed; oil softness weighs on CAD.' },
  { rank: 5, pair: 'NZD/USD', direction: 'sell', score: 78, confidence: 76, volatility: 'Medium', reason: 'RBNZ dovish pivot and contracting GDP.' },
  { rank: 6, pair: 'USD/CHF', direction: 'sell', score: 72, confidence: 65, volatility: 'Medium', reason: 'CHF safe-haven demand outpaces USD momentum.' },
  { rank: 7, pair: 'GBP/JPY', direction: 'buy', score: 68, confidence: 61, volatility: 'Medium', reason: 'BoE holds above BoJ; wide carry advantage.' },
  { rank: 8, pair: 'AUD/NZD', direction: 'buy', score: 64, confidence: 60, volatility: 'Low', reason: 'RBA hawkish hold vs RBNZ easing.' },
  { rank: 9, pair: 'EUR/JPY', direction: 'sell', score: 61, confidence: 68, volatility: 'High', reason: 'EUR weakness caps carry-trade upside.' },
  { rank: 10, pair: 'EUR/GBP', direction: 'sell', score: 52, confidence: 62, volatility: 'Low', reason: 'ECB easing more aggressively than BoE.' },
];

export const globalAiSummary = {
  regime: 'Transitional — Late-Cycle Tightening',
  bullishEconomies: 'United States, Japan (normalizing), Switzerland (safe-haven bid)',
  weakestEconomies: 'Eurozone (stagnation), New Zealand (contraction), Canada (sluggish growth)',
  centralBankDivergence:
    'Policy divergence is at its widest in a decade. The Fed and RBA hold hawkish, the BoJ slowly normalizes, while the ECB, SNB, BoC, and RBNZ cut aggressively. The BoE is caught in the middle. This divergence is the primary driver of FX flows.',
  largestRisks:
    '1) A hawkish Fed surprise that accelerates EM and commodity currency weakness. 2) BoJ intervention causing a sharp JPY spike across all yen crosses. 3) Eurozone recession deepening, dragging global growth. 4) China property crisis spillover into commodity currencies (AUD, CAD).',
  marketRotation:
    'Capital is rotating from low-yield and dovish currencies (EUR, JPY, CAD, NZD) toward high-yield and hawkish currencies (USD, CHF). We expect this rotation to persist until the Fed signals its first cut, likely in Q2 2026.',
  currencyOutlook:
    'USD remains structurally supported by the rate differential. JPY has asymmetric upside from normalization but structural weakness from the rate gap. EUR and NZD face the most headwinds. CHF is bid on safe-haven but capped by SNB dovishness. GBP is range-bound.',
};

export const pairOpportunities: PairOpportunity[] = [
  { rank: 1, pair: 'USD/JPY', direction: 'buy', strengthScore: 92, confidence: 82, risk: 'Very High', expectedTrend: 'up', reason: 'USD macro stronger than JPY. 525bp rate differential supports carry.' },
  { rank: 2, pair: 'EUR/USD', direction: 'sell', strengthScore: 89, confidence: 76, risk: 'High', expectedTrend: 'down', reason: 'USD macro stronger than EUR. ECB easing while Fed holds.' },
  { rank: 3, pair: 'CHF/JPY', direction: 'buy', strengthScore: 85, confidence: 73, risk: 'High', expectedTrend: 'up', reason: 'CHF safe-haven demand and positive rate differential vs JPY.' },
  { rank: 4, pair: 'USD/CAD', direction: 'buy', strengthScore: 81, confidence: 66, risk: 'Medium', expectedTrend: 'up', reason: 'BoC cutting ahead of Fed; oil softness weighs on CAD.' },
  { rank: 5, pair: 'NZD/USD', direction: 'sell', strengthScore: 78, confidence: 64, risk: 'Medium', expectedTrend: 'down', reason: 'RBNZ dovish pivot and contracting GDP undermine NZD.' },
  { rank: 6, pair: 'USD/CHF', direction: 'sell', strengthScore: 72, confidence: 65, risk: 'Medium', expectedTrend: 'down', reason: 'CHF safe-haven bid stronger than USD momentum.' },
  { rank: 7, pair: 'GBP/JPY', direction: 'buy', strengthScore: 68, confidence: 61, risk: 'Medium', expectedTrend: 'up', reason: 'BoE holds above Fed; JPY remains weakest major.' },
  { rank: 8, pair: 'AUD/NZD', direction: 'buy', strengthScore: 64, confidence: 60, risk: 'Low', expectedTrend: 'up', reason: 'RBA hawkish hold vs RBNZ easing; relative strength favors AUD.' },
  { rank: 9, pair: 'EUR/JPY', direction: 'sell', strengthScore: 61, confidence: 68, risk: 'High', expectedTrend: 'up', reason: 'Carry favors long, but EUR weakness caps upside; range trade.' },
  { rank: 10, pair: 'EUR/GBP', direction: 'neutral', strengthScore: 52, confidence: 52, risk: 'Low', expectedTrend: 'flat', reason: 'Both currencies mixed; no clear macro edge. Range-bound.' },
];

export const tradeSetups: TradeSetup[] = [
  { pair: 'USD/JPY', direction: 'buy', entryZone: '151.40 - 151.80', stopLoss: '150.20', takeProfit: '153.50 / 154.80', riskReward: '1:2.5', confidence: 82, macroExplanation: 'Fed holds at 5.50% while BoJ at 0.25%; 525bp differential drives carry demand. Strong US employment and resilient GDP support USD.', technicalConfirmation: 'Price above 50/200 EMA, bullish flag breakout on 4H, RSI 62 - room to run.' },
  { pair: 'EUR/USD', direction: 'sell', entryZone: '1.0860 - 1.0890', stopLoss: '1.0940', takeProfit: '1.0780 / 1.0720', riskReward: '1:2.2', confidence: 76, macroExplanation: 'ECB cutting cycle, German manufacturing recession, GDP near stagnation. USD rate advantage widening.', technicalConfirmation: 'Below 20 EMA on daily, lower highs pattern, MACD bearish cross on 4H.' },
  { pair: 'CHF/JPY', direction: 'buy', entryZone: '170.50 - 171.00', stopLoss: '169.20', takeProfit: '173.00 / 175.00', riskReward: '1:2.8', confidence: 73, macroExplanation: 'CHF supported by safe-haven flows and SNB balance sheet reduction. JPY weakened by ultra-low rates.', technicalConfirmation: 'Ascending channel intact, higher lows on daily, RSI 58.' },
  { pair: 'USD/CAD', direction: 'buy', entryZone: '1.3540 - 1.3580', stopLoss: '1.3480', takeProfit: '1.3680 / 1.3750', riskReward: '1:2.0', confidence: 66, macroExplanation: 'BoC 50bp below Fed and easing further. Oil prices soft, weighing on CAD. US GDP outpacing Canada.', technicalConfirmation: 'Bullish pennant on daily, support at 1.3520 holding, RSI 55.' },
  { pair: 'NZD/USD', direction: 'sell', entryZone: '0.6020 - 0.6050', stopLoss: '0.6100', takeProfit: '0.5940 / 0.5880', riskReward: '1:2.1', confidence: 64, macroExplanation: 'RBNZ aggressive easing, GDP contracted, unemployment rising. USD strength compounds downside.', technicalConfirmation: 'Below 50 EMA on 4H, bearish divergence on RSI, lower highs.' },
  { pair: 'USD/CHF', direction: 'sell', entryZone: '0.8830 - 0.8860', stopLoss: '0.8920', takeProfit: '0.8740 / 0.8680', riskReward: '1:1.8', confidence: 65, macroExplanation: 'CHF safe-haven demand outpacing USD momentum. SNB balance sheet reduction supports franc.', technicalConfirmation: 'Rejected at 0.8880 resistance, bearish engulfing on daily, RSI 45.' },
  { pair: 'GBP/JPY', direction: 'buy', entryZone: '192.50 - 193.20', stopLoss: '191.00', takeProfit: '195.50 / 198.00', riskReward: '1:2.3', confidence: 61, macroExplanation: 'BoE at 5.00% vs BoJ 0.25%; wide carry advantage. JPY remains weakest major.', technicalConfirmation: 'Above 20/50 EMA, bullish continuation pattern, RSI 59.' },
  { pair: 'AUD/NZD', direction: 'buy', entryZone: '1.0920 - 1.0950', stopLoss: '1.0870', takeProfit: '1.1030 / 1.1100', riskReward: '1:2.0', confidence: 60, macroExplanation: 'RBA hawkish hold vs RBNZ easing. Australian labor market tighter, GDP positive vs NZ contraction.', technicalConfirmation: 'Higher lows on daily, support at 1.0900, RSI 54.' },
  { pair: 'EUR/JPY', direction: 'sell', entryZone: '164.20 - 164.80', stopLoss: '165.80', takeProfit: '162.50 / 161.00', riskReward: '1:1.9', confidence: 68, macroExplanation: 'EUR macro weak despite carry advantage. ECB easing and German recession cap EUR upside vs JPY.', technicalConfirmation: 'Range-bound near 164, bearish RSI divergence on 4H, resistance at 165.50.' },
  { pair: 'EUR/GBP', direction: 'neutral', entryZone: '0.8520 - 0.8550', stopLoss: '0.8490', takeProfit: '0.8590 / 0.8620', riskReward: '1:1.5', confidence: 52, macroExplanation: 'Both currencies mixed; BoE and ECB both easing. No clear macro edge. Range trade only.', technicalConfirmation: 'Consolidation between 0.850-0.857, RSI 50, no directional signal.' },
];

export const marketWidgets: MarketWidget[] = [
  { id: 'dxy', name: 'Dollar Index', symbol: 'DXY', value: '104.32', change: 0.28, changePct: 0.27, trend: 'up', icon: 'DollarSign' },
  { id: 'gold', name: 'Gold', symbol: 'XAU', value: '2,041.50', change: 12.30, changePct: 0.61, trend: 'up', icon: 'CircleDollarSign' },
  { id: 'silver', name: 'Silver', symbol: 'XAG', value: '24.18', change: -0.15, changePct: -0.62, trend: 'down', icon: 'Circle' },
  { id: 'oil', name: 'Crude Oil', symbol: 'WTI', value: '71.82', change: -1.54, changePct: -2.10, trend: 'down', icon: 'Droplet' },
  { id: 'vix', name: 'Volatility', symbol: 'VIX', value: '14.20', change: -0.32, changePct: -2.20, trend: 'down', icon: 'Activity' },
  { id: 'us10y', name: 'US 10Y Yield', symbol: 'US10Y', value: '4.28%', change: 0.05, changePct: 1.18, trend: 'up', icon: 'TrendingUp' },
  { id: 'us2y', name: 'US 2Y Yield', symbol: 'US2Y', value: '4.62%', change: 0.03, changePct: 0.65, trend: 'up', icon: 'TrendingUp' },
  { id: 'sp500', name: 'S&P 500', symbol: 'SPX', value: '5,218.40', change: 18.60, changePct: 0.36, trend: 'up', icon: 'BarChart3' },
  { id: 'nasdaq', name: 'NASDAQ', symbol: 'NDX', value: '18,341.20', change: 92.40, changePct: 0.51, trend: 'up', icon: 'LineChart' },
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', value: '67,842', change: -842, changePct: -1.23, trend: 'down', icon: 'Bitcoin' },
];

export const marketSummary: MarketSummaryItem[] = [
  {
    id: 'usd',
    title: 'US Dollar (USD)',
    body: 'The US Dollar remains the strongest major currency as elevated interest rates, strong employment, and resilient GDP continue to support demand. The Fed\'s cautious stance and positive real yields underpin carry attractiveness. Risks include potential rate cuts in H2 2025 and a widening fiscal deficit.',
    sentiment: 'bullish',
    currency: 'USD',
  },
  {
    id: 'eur',
    title: 'Euro (EUR)',
    body: 'The Euro remains under pressure as slowing GDP growth, a deep manufacturing recession, and an ECB easing cycle weigh on the currency. German industrial production is declining, and the bloc flirts with stagnation. Downside risks dominate unless growth surprises to the upside.',
    sentiment: 'bearish',
    currency: 'EUR',
  },
  {
    id: 'jpy',
    title: 'Japanese Yen (JPY)',
    body: 'The Japanese Yen remains the weakest major currency because of low interest rates and accommodative monetary policy. Despite the BoJ ending negative rates, the 525bp gap with the Fed and deeply negative real yields keep carry trades attractive. Intervention risk is elevated.',
    sentiment: 'bearish',
    currency: 'JPY',
  },
  {
    id: 'gbp',
    title: 'British Pound (GBP)',
    body: 'The Pound is range-bound as the BoE balances sticky services inflation against a softening labor market. GDP was flat in Q1, and fiscal tightening is planned. The BoE is likely to cut slowly, keeping GBP/USD in a range unless data breaks decisively.',
    sentiment: 'neutral',
    currency: 'GBP',
  },
  {
    id: 'chf',
    title: 'Swiss Franc (CHF)',
    body: 'The Swiss Franc benefits from safe-haven flows and SNB balance sheet reduction. Low inflation at 1.2% and geopolitical risk premium support the franc. Further appreciation may draw intervention rhetoric from the SNB.',
    sentiment: 'bullish',
    currency: 'CHF',
  },
  {
    id: 'cad',
    title: 'Canadian Dollar (CAD)',
    body: 'The Canadian Dollar is pressured by the BoC cutting ahead of the Fed and softening oil prices. GDP growth is sluggish and household debt is at record highs. Stabilization in oil could provide a floor, but the rate differential remains a headwind.',
    sentiment: 'bearish',
    currency: 'CAD',
  },
  {
    id: 'aud',
    title: 'Australian Dollar (AUD)',
    body: 'The Australian Dollar is mixed as the RBA holds hawkish while China demand softens. Iron ore prices are supported by supply discipline, but the China property sector remains a drag. The RBA is expected to cut in Q1 2025, capping upside.',
    sentiment: 'neutral',
    currency: 'AUD',
  },
  {
    id: 'nzd',
    title: 'New Zealand Dollar (NZD)',
    body: 'The New Zealand Dollar weakens as the RBNZ pivots dovish amid a contracting economy. GDP contracted in Q1, unemployment is rising, and aggressive easing is signaled. Dairy prices offer a sliver of support but macro headwinds dominate.',
    sentiment: 'bearish',
    currency: 'NZD',
  },
];

export const enhancedCalendarEvents: CalendarEvent[] = [
  { id: '1', country: 'United States', flag: '🇺🇸', currency: 'USD', time: '08:30', event: 'Core CPI (YoY)', forecast: '3.2%', previous: '3.4%', impact: 'high' },
  { id: '2', country: 'United States', flag: '🇺🇸', currency: 'USD', time: '08:30', event: 'Initial Jobless Claims', forecast: '221K', previous: '219K', impact: 'medium' },
  { id: '3', country: 'Eurozone', flag: '🇪🇺', currency: 'EUR', time: '10:00', event: 'ECB Rate Decision', forecast: '3.25%', previous: '3.50%', impact: 'high' },
  { id: '4', country: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', time: '07:00', event: 'GDP (QoQ)', forecast: '0.1%', previous: '0.0%', impact: 'high' },
  { id: '5', country: 'Japan', flag: '🇯🇵', currency: 'JPY', time: '23:50', event: 'BoJ Rate Decision', forecast: '0.25%', previous: '0.25%', impact: 'high' },
  { id: '6', country: 'United States', flag: '🇺🇸', currency: 'USD', time: '14:00', event: 'FOMC Statement', forecast: '-', previous: '-', impact: 'high' },
  { id: '7', country: 'Canada', flag: '🇨🇦', currency: 'CAD', time: '13:30', event: 'BoC Rate Statement', forecast: '4.00%', previous: '4.25%', impact: 'high' },
  { id: '8', country: 'Australia', flag: '🇦🇺', currency: 'AUD', time: '01:30', event: 'Employment Change', forecast: '25.2K', previous: '36.4K', impact: 'medium' },
  { id: '9', country: 'Switzerland', flag: '🇨🇭', currency: 'CHF', time: '08:30', event: 'SNB Rate Decision', forecast: '1.00%', previous: '1.25%', impact: 'high' },
  { id: '10', country: 'New Zealand', flag: '🇳🇿', currency: 'NZD', time: '02:00', event: 'RBNZ Rate Decision', forecast: '4.50%', previous: '4.75%', impact: 'high' },
  { id: '11', country: 'Eurozone', flag: '🇪🇺', currency: 'EUR', time: '10:00', event: 'Manufacturing PMI', forecast: '46.0', previous: '45.6', impact: 'medium' },
  { id: '12', country: 'United States', flag: '🇺🇸', currency: 'USD', time: '10:00', event: 'ISM Manufacturing PMI', forecast: '49.0', previous: '48.7', impact: 'medium' },
  { id: '13', country: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', time: '07:00', event: 'Manufacturing PMI', forecast: '49.8', previous: '49.4', impact: 'low' },
  { id: '14', country: 'Japan', flag: '🇯🇵', currency: 'JPY', time: '23:50', event: 'Trade Balance', forecast: '-¥0.6T', previous: '-¥0.8T', impact: 'low' },
];

export const calendarActuals: Record<string, string | null> = {
  '4': '0.1%',
  '5': '0.25%',
  '8': '31.2K',
  '13': '49.6',
  '14': '-¥0.7T',
};

export const enhancedNewsItems: NewsItem[] = [
  { id: '1', title: 'Fed Minutes Signal Cautious Approach to Rate Cuts', source: 'Reuters', time: '32 min ago', category: 'USD', impact: 'high', currencies: ['USD'], summary: 'FOMC members divided on timing of first cut; majority favor data-dependent approach through Q1 2025. USD supported by hawkish tone.' },
  { id: '2', title: 'ECB Cuts Rates as Eurozone Growth Stalls', source: 'Bloomberg', time: '1 hr ago', category: 'EUR', impact: 'high', currencies: ['EUR'], summary: 'ECB delivers 50bp cut citing disinflation progress and weakening growth outlook. EUR bearish; rate disadvantage widens vs USD.' },
  { id: '3', title: 'BoJ Ends Negative Rates, Yen Volatility Persists', source: 'FT', time: '2 hr ago', category: 'JPY', impact: 'high', currencies: ['JPY'], summary: 'Historic policy shift but yen remains under pressure as rate gap with US stays wide. JPY bearish; carry trades still attractive.' },
  { id: '4', title: 'US Nonfarm Payrolls Beat Estimates at 227K', source: 'WSJ', time: '3 hr ago', category: 'USD', impact: 'high', currencies: ['USD'], summary: 'Labor market resilience complicates Fed cut timing; unemployment ticks to 4.1%. USD bullish; rate cut pricing pushed back.' },
  { id: '5', title: 'German Manufacturing Recession Deepens', source: 'Reuters', time: '4 hr ago', category: 'EUR', impact: 'medium', currencies: ['EUR'], summary: 'PMI falls to 43.2, 18th consecutive month of contraction. EUR bearish; growth outlook deteriorating.' },
  { id: '6', title: 'Oil Slides as OPEC+ Considers Production Increase', source: 'Bloomberg', time: '5 hr ago', category: 'CAD', impact: 'medium', currencies: ['CAD'], summary: 'WTI down 2.1% to $71.80; CAD pressured as oil-linked currency weakens. CAD bearish; BoC may ease further.' },
  { id: '7', title: 'UK Services Inflation Sticky at 5.0%', source: 'FT', time: '6 hr ago', category: 'GBP', impact: 'medium', currencies: ['GBP'], summary: 'Services component complicates BoE easing path; markets price slower cut cycle. GBP neutral; range-bound likely.' },
  { id: '8', title: 'Swiss Franc Hits 9-Year High vs Euro', source: 'Reuters', time: '8 hr ago', category: 'CHF', impact: 'low', currencies: ['CHF', 'EUR'], summary: 'Safe-haven flows and SNB balance sheet reduction drive CHF strength. CHF bullish; intervention risk rising.' },
  { id: '9', title: 'RBA Holds Rates, Signals Hawkish Tilt', source: 'Bloomberg', time: '10 hr ago', category: 'AUD', impact: 'medium', currencies: ['AUD'], summary: 'RBA keeps rate at 4.35% and maintains hawkish guidance. AUD mildly bullish; most hawkish of majors.' },
  { id: '10', title: 'RBNZ Cuts 50bp, Signals More Easing', source: 'Reuters', time: '11 hr ago', category: 'NZD', impact: 'high', currencies: ['NZD'], summary: 'Aggressive cut to 4.75% with dovish forward guidance. NZD bearish; rate disadvantage widening.' },
  { id: '11', title: 'Japan Trade Deficit Widens on Weak Exports', source: 'Nikkei', time: '12 hr ago', category: 'JPY', impact: 'low', currencies: ['JPY'], summary: 'Trade balance misses forecasts as exports to China slow. JPY bearish; structural headwind adds to rate gap.' },
  { id: '12', title: 'Canada GDP Grows 1.1%, Below Expectations', source: 'BNN', time: '14 hr ago', category: 'CAD', impact: 'medium', currencies: ['CAD'], summary: 'Sluggish growth reinforces BoC dovish expectations. CAD bearish; growth lagging US significantly.' },
];

export const enhancedWatchlist: WatchlistPair[] = [
  { pair: 'EUR/USD', base: 'EUR', quote: 'USD', price: 1.0842, change: -0.0031, changePct: -0.28, trend: 'down', aiBias: 'sell', confidence: 76 },
  { pair: 'GBP/USD', base: 'GBP', quote: 'USD', price: 1.2715, change: 0.0012, changePct: 0.09, trend: 'flat', aiBias: 'neutral', confidence: 54 },
  { pair: 'USD/JPY', base: 'USD', quote: 'JPY', price: 151.82, change: 0.64, changePct: 0.42, trend: 'up', aiBias: 'buy', confidence: 82 },
  { pair: 'AUD/USD', base: 'AUD', quote: 'USD', price: 0.6584, change: -0.0008, changePct: -0.12, trend: 'flat', aiBias: 'neutral', confidence: 58 },
  { pair: 'USD/CAD', base: 'USD', quote: 'CAD', price: 1.3571, change: 0.0021, changePct: 0.15, trend: 'up', aiBias: 'buy', confidence: 66 },
  { pair: 'USD/CHF', base: 'USD', quote: 'CHF', price: 0.8814, change: -0.0019, changePct: -0.21, trend: 'down', aiBias: 'sell', confidence: 65 },
  { pair: 'NZD/USD', base: 'NZD', quote: 'USD', price: 0.6012, change: -0.0024, changePct: -0.40, trend: 'down', aiBias: 'sell', confidence: 64 },
  { pair: 'EUR/JPY', base: 'EUR', quote: 'JPY', price: 164.58, change: 0.31, changePct: 0.19, trend: 'up', aiBias: 'sell', confidence: 68 },
];

export function compareCurrencies(baseCode: string, quoteCode: string): ComparisonResult {
  const base = globalMacroCountries.find((c) => c.code === baseCode)!;
  const quote = globalMacroCountries.find((c) => c.code === quoteCode)!;
  const baseCur = currencies.find((c) => c.code === baseCode)!;
  const quoteCur = currencies.find((c) => c.code === quoteCode)!;

  const parseNum = (s: string) => parseFloat(s.replace(/[^0-9.\-]/g, '')) || 0;
  const fmtDiff = (a: string, b: string) => {
    const diff = parseNum(a) - parseNum(b);
    return `${diff >= 0 ? '+' : ''}${diff.toFixed(2)}`;
  };

  const winner = baseCur.score >= quoteCur.score ? baseCode : quoteCode;
  const probability = Math.min(95, Math.round(50 + Math.abs(baseCur.score - quoteCur.score) * 0.6));

  const summary = `${winner} is macro stronger than ${winner === baseCode ? quoteCode : baseCode}. ` +
    `Rate differential: ${fmtDiff(base.interestRate, quote.interestRate)}pp. ` +
    `GDP differential: ${fmtDiff(base.gdp, quote.gdp)}pp. ` +
    `AI favors ${winner === baseCode ? 'long' : 'short'} ${baseCode}/${quoteCode} with ${probability}% probability.`;

  return {
    base: baseCode,
    quote: quoteCode,
    interestRateDiff: fmtDiff(base.interestRate, quote.interestRate) + 'pp',
    inflationDiff: fmtDiff(base.inflation, quote.inflation) + 'pp',
    gdpDiff: fmtDiff(base.gdp, quote.gdp) + 'pp',
    employmentDiff: fmtDiff(base.unemployment, quote.unemployment) + 'pp',
    bondYieldDiff: fmtDiff(base.bondYield, quote.bondYield) + 'pp',
    winner,
    probability,
    summary,
  };
}

export function compareCurrenciesLive(
  baseCode: string,
  quoteCode: string,
  baseIndicators: { name: string; value: string }[],
  quoteIndicators: { name: string; value: string }[],
  baseCur: { score: number },
  quoteCur: { score: number },
): ComparisonResult {
  const getVal = (indicators: { name: string; value: string }[], name: string) => {
    const found = indicators.find((i) => i.name.toLowerCase().includes(name.toLowerCase()));
    return found ? found.value : '0';
  };

  const parseNum = (s: string) => parseFloat(s.replace(/[^0-9.\-]/g, '')) || 0;
  const fmtDiff = (a: string, b: string) => {
    const diff = parseNum(a) - parseNum(b);
    return `${diff >= 0 ? '+' : ''}${diff.toFixed(2)}`;
  };

  const baseRate = getVal(baseIndicators, 'Interest Rate');
  const quoteRate = getVal(quoteIndicators, 'Interest Rate');
  const baseInflation = getVal(baseIndicators, 'Inflation');
  const quoteInflation = getVal(quoteIndicators, 'Inflation');
  const baseGdp = getVal(baseIndicators, 'GDP');
  const quoteGdp = getVal(quoteIndicators, 'GDP');
  const baseEmployment = getVal(baseIndicators, 'Employment');
  const quoteEmployment = getVal(quoteIndicators, 'Employment');

  const winner = baseCur.score >= quoteCur.score ? baseCode : quoteCode;
  const probability = Math.min(95, Math.round(50 + Math.abs(baseCur.score - quoteCur.score) * 0.6));

  const summary = `${winner} is macro stronger than ${winner === baseCode ? quoteCode : baseCode}. ` +
    `Rate differential: ${fmtDiff(baseRate, quoteRate)}pp. ` +
    `GDP differential: ${fmtDiff(baseGdp, quoteGdp)}pp. ` +
    `AI favors ${winner === baseCode ? 'long' : 'short'} ${baseCode}/${quoteCode} with ${probability}% probability.`;

  return {
    base: baseCode,
    quote: quoteCode,
    interestRateDiff: fmtDiff(baseRate, quoteRate) + 'pp',
    inflationDiff: fmtDiff(baseInflation, quoteInflation) + 'pp',
    gdpDiff: fmtDiff(baseGdp, quoteGdp) + 'pp',
    employmentDiff: fmtDiff(baseEmployment, quoteEmployment) + 'pp',
    bondYieldDiff: 'N/A',
    winner,
    probability,
    summary,
  };
}

export function getWatchlistScores(pair: string): { macro: number; technical: number; ai: number } {
  const base = pair.split('/')[0];
  const quote = pair.split('/')[1];
  const baseSub = currencySubScores[base] ?? { macro: 50, technical: 50, sentiment: 50 };
  const quoteSub = currencySubScores[quote] ?? { macro: 50, technical: 50, sentiment: 50 };
  return {
    macro: Math.round((baseSub.macro + quoteSub.macro) / 2),
    technical: Math.round((baseSub.technical + quoteSub.technical) / 2),
    ai: Math.round((baseSub.sentiment + quoteSub.sentiment) / 2),
  };
}

export const aiPairAnalyses: AIPairAnalysis[] = [
  {
    rank: 1,
    pair: 'USD/JPY',
    aiScore: 92,
    signal: 'Strong Buy',
    confidence: 88,
    trend: 'up',
    riskReward: '1:2.8',
    macroScore: 88,
    technicalScore: 94,
    trendScore: 90,
    riskScore: 72,
    entryPrice: '151.80',
    stopLoss: '150.20',
    takeProfit1: '154.50',
    takeProfit2: '156.80',
    riskRewardRatio: '1:2.8',
    explanation:
      'The widest rate differential among majors (525bp) and deeply negative JPY real yields keep carry flows firmly in favor of USD/JPY. The Fed holds at 5.50% while the BoJ remains at just 0.25%, and although the BoJ has begun normalizing policy, the pace is far too slow to close the gap. Technically, price sits in a clean ascending channel with the 50-day EMA acting as dynamic support and RSI at 62 — bullish but not yet overbought. The trend score is elevated by three consecutive higher highs and a positive MACD histogram expansion. Risk is moderate: a sudden MoJ intervention spike is the primary tail risk, so a stop below the 150.20 swing low protects against intervention whipsaw while preserving a 2.8:1 reward profile.',
  },
  {
    rank: 2,
    pair: 'EUR/USD',
    aiScore: 78,
    signal: 'Strong Sell',
    confidence: 84,
    trend: 'down',
    riskReward: '1:2.4',
    macroScore: 74,
    technicalScore: 80,
    trendScore: 76,
    riskScore: 68,
    entryPrice: '1.0845',
    stopLoss: '1.0920',
    takeProfit1: '1.0720',
    takeProfit2: '1.0650',
    riskRewardRatio: '1:2.4',
    explanation:
      'The ECB has entered an aggressive easing cycle (50bp cut) while the Fed remains on hold, widening the rate differential against the EUR. Eurozone manufacturing PMI has contracted for 18 straight months and German industrial production is declining, capping any upside. Price has broken below the 1.0860 support pivot and the 200-day EMA is sloping downward, confirming a bearish technical structure. RSI at 38 leaves room before oversold. The risk score reflects potential short-covering on any hawkish Fed surprise, but the asymmetric setup favors a short with a 2.4:1 reward ratio.',
  },
  {
    rank: 3,
    pair: 'GBP/JPY',
    aiScore: 81,
    signal: 'Buy',
    confidence: 79,
    trend: 'up',
    riskReward: '1:2.1',
    macroScore: 76,
    technicalScore: 84,
    trendScore: 82,
    riskScore: 70,
    entryPrice: '193.25',
    stopLoss: '190.80',
    takeProfit1: '198.40',
    takeProfit2: '201.50',
    riskRewardRatio: '1:2.1',
    explanation:
      'GBP/JPY benefits from a structural carry advantage with the BoE at 5.00% versus the BoJ at 0.25%. While GBP is range-bound against USD, against JPY it continues to grind higher as yen weakness dominates. The technical picture shows a bullish flag breakout on the daily chart with volume confirmation and the 20-day EMA providing support. Trend score is strong with higher lows across five sessions. Risk is moderate given BoJ intervention risk affecting all JPY crosses; the stop below 190.80 sits under the flag low and keeps reward at 2.1:1.',
  },
  {
    rank: 4,
    pair: 'AUD/USD',
    aiScore: 52,
    signal: 'Neutral',
    confidence: 61,
    trend: 'flat',
    riskReward: '1:1.6',
    macroScore: 54,
    technicalScore: 50,
    trendScore: 48,
    riskScore: 58,
    entryPrice: '0.6585',
    stopLoss: '0.6510',
    takeProfit1: '0.6700',
    takeProfit2: '0.6760',
    riskRewardRatio: '1:1.6',
    explanation:
      'Conflicting signals keep AUD/USD neutral. The RBA remains the most hawkish major central bank at 4.35%, supporting the AUD, but softening China demand and declining retail sales cap upside. Technically, price is range-bound between 0.6510 and 0.6700 with no clear directional bias; the 50-day and 200-day EMAs are flat and entangled. RSI at 49 confirms indecision. The risk score is moderate as a China stimulus surprise could break the range either way. The setup offers only 1.6:1 reward and is best treated as a range trade rather than a directional position.',
  },
  {
    rank: 5,
    pair: 'USD/CAD',
    aiScore: 74,
    signal: 'Buy',
    confidence: 72,
    trend: 'up',
    riskReward: '1:2.2',
    macroScore: 70,
    technicalScore: 78,
    trendScore: 74,
    riskScore: 66,
    entryPrice: '1.3570',
    stopLoss: '1.3490',
    takeProfit1: '1.3740',
    takeProfit2: '1.3820',
    riskRewardRatio: '1:2.2',
    explanation:
      'The BoC has cut to 4.25%, 50bp below the Fed, creating a widening rate differential favoring USD/CAD. Softening oil prices further pressure the commodity-linked CAD. Technically, price has reclaimed the 1.3550 pivot and the 20-day EMA is pointing higher with MACD above the signal line. The trend is constructive with three higher lows. Risk is moderate given oil volatility and a potential BoC pause; the stop below 1.3490 protects against a reversal while offering 2.2:1 reward.',
  },
  {
    rank: 6,
    pair: 'NZD/USD',
    aiScore: 38,
    signal: 'Strong Sell',
    confidence: 76,
    trend: 'down',
    riskReward: '1:2.6',
    macroScore: 34,
    technicalScore: 42,
    trendScore: 36,
    riskScore: 62,
    entryPrice: '0.6015',
    stopLoss: '0.6090',
    takeProfit1: '0.5840',
    takeProfit2: '0.5760',
    riskRewardRatio: '1:2.6',
    explanation:
      'The RBNZ has pivoted aggressively dovish, cutting to 4.75% with further easing signaled, while GDP contracted -0.2% in Q1. The fundamental backdrop is bearish with rising unemployment and a deteriorating growth outlook. Technically, price has broken below the 0.6040 support and the 200-day EMA is sloping down; RSI at 35 with room to fall. The trend score reflects a sequence of lower highs. Risk is moderate as a dairy price recovery could provide support, but the asymmetric setup favors a short with 2.6:1 reward.',
  },
  {
    rank: 7,
    pair: 'USD/CHF',
    aiScore: 58,
    signal: 'Sell',
    confidence: 65,
    trend: 'down',
    riskReward: '1:1.9',
    macroScore: 60,
    technicalScore: 54,
    trendScore: 56,
    riskScore: 64,
    entryPrice: '0.8815',
    stopLoss: '0.8880',
    takeProfit1: '0.8690',
    takeProfit2: '0.8620',
    riskRewardRatio: '1:1.9',
    explanation:
      'Safe-haven flows into the CHF and SNB balance sheet reduction have driven the franc to a 9-year high against the euro, with spillover pressure on USD/CHF. While the rate differential still favors USD, the SNB pivot back to hawkish signaling narrows that advantage. Technically, price is below the 50-day EMA with a descending channel structure; RSI at 44 is neutral-bearish. The trend score is modestly negative. Risk reflects potential USD safe-haven demand on geopolitical escalation; the stop above 0.8880 caps risk while offering 1.9:1 reward.',
  },
  {
    rank: 8,
    pair: 'EUR/JPY',
    aiScore: 64,
    signal: 'Sell',
    confidence: 68,
    trend: 'up',
    riskReward: '1:1.8',
    macroScore: 58,
    technicalScore: 66,
    trendScore: 62,
    riskScore: 70,
    entryPrice: '164.60',
    stopLoss: '166.20',
    takeProfit1: '161.00',
    takeProfit2: '158.50',
    riskRewardRatio: '1:1.8',
    explanation:
      'EUR/JPY appears counter-trend: while the carry trade has pushed it higher, the EUR is fundamentally weak with the ECB cutting aggressively while the BoJ slowly normalizes. This sets up a mean-reversion short. Technically, price is extended above the 20-day EMA with bearish RSI divergence on the daily chart, signaling fading momentum. The trend score remains up but is weakening. Risk is elevated due to JPY intervention uncertainty and the counter-trend nature; the stop above 166.20 limits exposure while targeting 1.8:1 reward on a reversal.',
  },
  {
    rank: 9,
    pair: 'GBP/USD',
    aiScore: 48,
    signal: 'Neutral',
    confidence: 54,
    trend: 'flat',
    riskReward: '1:1.5',
    macroScore: 52,
    technicalScore: 46,
    trendScore: 50,
    riskScore: 60,
    entryPrice: '1.2715',
    stopLoss: '1.2650',
    takeProfit1: '1.2810',
    takeProfit2: '1.2860',
    riskRewardRatio: '1:1.5',
    explanation:
      'GBP/USD is range-bound as the BoE balances sticky services inflation (5.0%) against a softening labor market and flat GDP. Neither currency has a decisive macro edge, keeping the pair in a 1.2650-1.2860 range. Technically, the 50-day and 200-day EMAs are flat and overlapping, with RSI at 51 — classic range conditions. The trend score is neutral. Risk is moderate as a BoE surprise could break the range; the setup offers only 1.5:1 reward and is best handled as a range trade with tight management.',
  },
  {
    rank: 10,
    pair: 'AUD/JPY',
    aiScore: 69,
    signal: 'Buy',
    confidence: 66,
    trend: 'up',
    riskReward: '1:2.0',
    macroScore: 64,
    technicalScore: 72,
    trendScore: 70,
    riskScore: 68,
    entryPrice: '99.85',
    stopLoss: '98.20',
    takeProfit1: '103.10',
    takeProfit2: '105.40',
    riskRewardRatio: '1:2.0',
    explanation:
      'AUD/JPY offers a carry trade with the RBA at 4.35% versus the BoJ at 0.25%. While China demand softens, the RBA remains the most hawkish major, and iron ore supply discipline supports the AUD. Technically, price is in an ascending channel with the 50-day EMA as support and a positive MACD crossover. The trend score is strong with consistent higher lows. Risk is elevated due to JPY intervention risk affecting all yen crosses; the stop below 98.20 sits under the channel low and offers 2.0:1 reward.',
  },
  {
    rank: 11,
    pair: 'EUR/GBP',
    aiScore: 44,
    signal: 'Sell',
    confidence: 62,
    trend: 'down',
    riskReward: '1:1.7',
    macroScore: 40,
    technicalScore: 48,
    trendScore: 42,
    riskScore: 58,
    entryPrice: '0.8525',
    stopLoss: '0.8570',
    takeProfit1: '0.8450',
    takeProfit2: '0.8400',
    riskRewardRatio: '1:1.7',
    explanation:
      'The ECB is easing more aggressively than the BoE, pressuring EUR/GBP lower. Eurozone growth stagnation contrasts with the UK sticky services inflation, keeping the rate differential in GBP favor. Technically, price is below the 50-day EMA with a descending structure; RSI at 42 supports further downside. The trend score is negative. Risk is moderate as a BoE dovish surprise could reverse the differential; the stop above 0.8570 caps risk while targeting 1.7:1 reward.',
  },
  {
    rank: 12,
    pair: 'CHF/JPY',
    aiScore: 85,
    signal: 'Strong Buy',
    confidence: 82,
    trend: 'up',
    riskReward: '1:2.5',
    macroScore: 80,
    technicalScore: 88,
    trendScore: 86,
    riskScore: 74,
    entryPrice: '172.40',
    stopLoss: '169.80',
    takeProfit1: '178.50',
    takeProfit2: '182.00',
    riskRewardRatio: '1:2.5',
    explanation:
      'CHF/JPY combines two powerful themes: CHF safe-haven strength from SNB balance sheet reduction and geopolitical risk, against JPY weakness from ultra-low rates. The SNB at 1.00% still holds a 75bp advantage over the BoJ. Technically, price is in a strong ascending channel with the 20-day EMA as dynamic support and RSI at 65 — bullish with room to run. The trend score is the highest in the set with five consecutive higher highs. Risk is elevated due to potential JPY intervention and CHF overvaluation rhetoric; the stop below 169.80 protects the channel while offering 2.5:1 reward.',
  },
];

export const lastScanUpdate = '14:32:08 UTC';

export function signalColor(signal: Signal): string {
  if (signal === 'Strong Buy') return 'text-bull-300 bg-bull-500/20 border-bull-500/40';
  if (signal === 'Buy') return 'text-bull-400 bg-bull-500/10 border-bull-500/30';
  if (signal === 'Neutral') return 'text-warn-400 bg-warn-500/10 border-warn-500/30';
  if (signal === 'Sell') return 'text-bear-400 bg-bear-500/10 border-bear-500/30';
  return 'text-bear-300 bg-bear-500/20 border-bear-500/40';
}

export function tradeDirectionColor(dir: TradeDirection): string {
  if (dir === 'Strong Buy') return 'text-bull-300 bg-bull-500/20 border-bull-500/40';
  if (dir === 'Buy') return 'text-bull-400 bg-bull-500/10 border-bull-500/30';
  if (dir === 'Neutral') return 'text-warn-400 bg-warn-500/10 border-warn-500/30';
  if (dir === 'Sell') return 'text-bear-400 bg-bear-500/10 border-bear-500/30';
  return 'text-bear-300 bg-bear-500/20 border-bear-500/40';
}

function genCandles(
  count: number,
  startPrice: number,
  drift: number,
  volatility: number,
  baseVolume: number,
): Candle[] {
  const candles: Candle[] = [];
  let price = startPrice;
  const ema20Arr: number[] = [];
  const ema50Arr: number[] = [];
  const ema200Arr: number[] = [];
  const closes: number[] = [];

  for (let i = 0; i < count; i++) {
    const open = price;
    const change = drift + (Math.sin(i / 3) * volatility * 0.5) + ((i % 7) - 3) * volatility * 0.3;
    const close = Math.max(0.0001, open + change);
    const high = Math.max(open, close) + Math.abs(change) * 0.6 + volatility * 0.4;
    const low = Math.min(open, close) - Math.abs(change) * 0.6 - volatility * 0.4;
    const volume = Math.round(baseVolume * (0.7 + Math.random() * 0.6));
    price = close;
    closes.push(close);

    ema20Arr.push(closes.slice(Math.max(0, closes.length - 20)).reduce((a, b) => a + b, 0) / Math.min(20, closes.length));
    ema50Arr.push(closes.slice(Math.max(0, closes.length - 50)).reduce((a, b) => a + b, 0) / Math.min(50, closes.length));
    ema200Arr.push(closes.slice(Math.max(0, closes.length - 200)).reduce((a, b) => a + b, 0) / Math.min(200, closes.length));

    const atr = volatility * (0.8 + Math.sin(i / 5) * 0.2) + Math.abs(change) * 0.3;
    const support = Math.min(...closes.slice(Math.max(0, closes.length - 20))) - atr * 0.5;
    const resistance = Math.max(...closes.slice(Math.max(0, closes.length - 20))) + atr * 0.5;

    const day = ((i % 30) + 1).toString().padStart(2, '0');
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Math.floor(i / 30) % 12];

    candles.push({
      date: `${month} ${day}`,
      open: Number(open.toFixed(4)),
      high: Number(high.toFixed(4)),
      low: Number(low.toFixed(4)),
      close: Number(close.toFixed(4)),
      volume,
      ema20: Number(ema20Arr[i].toFixed(4)),
      ema50: Number(ema50Arr[i].toFixed(4)),
      ema200: Number(ema200Arr[i].toFixed(4)),
      atr: Number(atr.toFixed(4)),
      support: Number(support.toFixed(4)),
      resistance: Number(resistance.toFixed(4)),
    });
  }
  return candles;
}

export const tradePanelData: TradePanelData[] = [
  {
    symbol: 'EURUSD',
    display: 'EUR/USD',
    name: 'Euro / US Dollar',
    aiScore: 22,
    recommendation: 'Strong Sell',
    confidence: 84,
    macroTrend: 'down',
    technicalTrend: 'down',
    riskLevel: 'High',
    macroFactors: [
      { label: 'Interest Rate', current: '3.50%', previous: '4.00%', trend: 'down', bias: 'bearish', score: 28 },
      { label: 'Inflation', current: '2.3%', previous: '2.7%', trend: 'down', bias: 'bearish', score: 35 },
      { label: 'GDP', current: '0.4%', previous: '0.8%', trend: 'down', bias: 'bearish', score: 18 },
      { label: 'Employment', current: '6.4%', previous: '6.3%', trend: 'up', bias: 'bearish', score: 32 },
      { label: 'Retail Sales', current: '-0.1%', previous: '+0.2%', trend: 'down', bias: 'bearish', score: 25 },
      { label: 'PMI', current: '45.6', previous: '46.8', trend: 'down', bias: 'bearish', score: 20 },
      { label: 'Trade Balance', current: '€17.8B', previous: '€15.2B', trend: 'up', bias: 'neutral', score: 48 },
      { label: 'Bond Yield', current: '2.41%', previous: '2.68%', trend: 'down', bias: 'bearish', score: 30 },
      { label: 'Central Bank', current: 'Dovish', previous: 'Neutral', trend: 'down', bias: 'bearish', score: 15 },
    ],
    compositeScores: { macro: 18, technical: 24, sentiment: 20, liquidity: 26 },
    analysis: {
      marketStructure:
        'EUR/USD has broken decisively below the 1.0860 pivot and is now trading beneath the 50-day EMA, confirming a bearish market structure. Lower highs and lower lows define the short-term pattern, with the 200-day EMA sloping downward as dynamic resistance. Volume on down-days exceeds up-days, indicating distribution by institutional sellers.',
      macroEnvironment:
        'The macro environment is decisively bearish for the EUR. The ECB has delivered a 50bp cut and signaled further easing, while the Fed remains on hold, widening the rate differential to 200bp. Eurozone GDP is near stagnation at 0.4%, German manufacturing is in an 18-month recession, and retail sales contracted. The only support is a modest trade surplus.',
      centralBankOutlook:
        'The ECB is in an active easing cycle with markets pricing 75bp of additional cuts through 2026. Lagarde has explicitly signaled further easing is likely. In contrast, the Fed is on hold with the first cut not priced until Q2 2026. This policy divergence is the primary structural drag on the EUR.',
      riskFactors:
        'Key risks include a hawkish Fed surprise that could accelerate EUR downside, or conversely a soft US data print that narrows the differential and triggers short-covering. Geopolitical escalation in Eastern Europe could provide safe-haven EUR bid. A faster-than-expected Eurozone growth recovery would invalidate the bearish thesis.',
      expectedDirection:
        'The expected direction is downward. The combination of policy divergence, weak growth, and bearish technical structure points to continued EUR underperformance. The next support zone is 1.0720, with a deeper target at 1.0650 if momentum persists.',
      tradeProbability:
        'The AI model assigns a 78% probability to downward price action over the next 5-10 trading sessions. The short setup offers a 2.4:1 reward-to-risk ratio, with the primary risk being a short-covering rally on unexpected hawkish ECB rhetoric.',
    },
    tradeSetup: {
      direction: 'Strong Sell',
      entry: '1.0845',
      stopLoss: '1.0920',
      takeProfit1: '1.0720',
      takeProfit2: '1.0650',
      riskReward: '1:2.4',
      holdingTime: '5-10 days',
      probability: 78,
    },
    whyThisTrade: [
      'ECB easing cycle (50bp cut) widens the rate differential against the Fed from 150bp to 200bp, structurally pressuring the EUR.',
      'Eurozone GDP near stagnation (0.4%) and German manufacturing in an 18-month recession cap any EUR upside.',
      'Price has broken below the 1.0860 pivot and the 50-day EMA, confirming a bearish technical structure with lower highs.',
      'MACD bearish cross on the 4H timeframe and RSI at 38 leave room before oversold, supporting further downside.',
      'Volume on down-days exceeds up-days, indicating institutional distribution and seller conviction.',
    ],
    candles: genCandles(120, 1.105, -0.0018, 0.0025, 85000),
    events: [
      { country: 'Eurozone', flag: '🇪🇺', time: '10:00', event: 'ECB Rate Decision', forecast: '3.25%', previous: '3.50%', actual: null, impact: 'high' },
      { country: 'Eurozone', flag: '🇪🇺', time: '10:00', event: 'Manufacturing PMI', forecast: '46.0', previous: '45.6', actual: null, impact: 'medium' },
      { country: 'United States', flag: '🇺🇸', time: '08:30', event: 'Core CPI (YoY)', forecast: '3.2%', previous: '3.4%', actual: null, impact: 'high' },
      { country: 'United States', flag: '🇺🇸', time: '14:00', event: 'FOMC Statement', forecast: '-', previous: '-', actual: null, impact: 'high' },
    ],
    aiSummary:
      'MacroAI recommends a STRONG SELL on EUR/USD with 84% confidence. The trade is anchored by a widening rate differential as the ECB eases aggressively while the Fed holds firm, creating a 200bp structural drag on the euro. Eurozone growth is near stagnation with German manufacturing in a deep recession, and the technical structure confirms the bearish macro thesis with price below key moving averages and a bearish MACD cross. The setup offers a 2.4:1 reward-to-risk ratio targeting 1.0720 and 1.0650, with a stop above 1.0920 protecting against short-covering. The primary risk is a hawkish ECB surprise or soft US data that narrows the policy differential.',
  },
  {
    symbol: 'USDJPY',
    display: 'USD/JPY',
    name: 'US Dollar / Japanese Yen',
    aiScore: 92,
    recommendation: 'Strong Buy',
    confidence: 88,
    macroTrend: 'up',
    technicalTrend: 'up',
    riskLevel: 'Very High',
    macroFactors: [
      { label: 'Interest Rate', current: '5.50%', previous: '5.50%', trend: 'flat', bias: 'bullish', score: 92 },
      { label: 'Inflation', current: '3.0%', previous: '3.4%', trend: 'down', bias: 'neutral', score: 68 },
      { label: 'GDP', current: '2.8%', previous: '2.4%', trend: 'up', bias: 'bullish', score: 85 },
      { label: 'Employment', current: '4.1%', previous: '3.8%', trend: 'up', bias: 'neutral', score: 72 },
      { label: 'Retail Sales', current: '+0.6%', previous: '+0.4%', trend: 'up', bias: 'bullish', score: 78 },
      { label: 'PMI', current: '48.7', previous: '47.9', trend: 'up', bias: 'neutral', score: 55 },
      { label: 'Trade Balance', current: '-$70.2B', previous: '-$68.1B', trend: 'down', bias: 'bearish', score: 42 },
      { label: 'Bond Yield', current: '4.28%', previous: '4.23%', trend: 'up', bias: 'bullish', score: 86 },
      { label: 'Central Bank', current: 'Hawkish', previous: 'Hawkish', trend: 'flat', bias: 'bullish', score: 90 },
    ],
    compositeScores: { macro: 88, technical: 94, sentiment: 86, liquidity: 82 },
    analysis: {
      marketStructure:
        'USD/JPY trades in a clean ascending channel with the 50-day EMA acting as dynamic support. Three consecutive higher highs and a positive MACD histogram expansion confirm bullish momentum. Price sits comfortably above the 200-day EMA, which is sloping upward. RSI at 62 is bullish but not yet overbought, leaving room for further upside.',
      macroEnvironment:
        'The macro environment is strongly bullish for USD/JPY. The 525bp rate differential between the Fed (5.50%) and BoJ (0.25%) is the widest among majors, driving persistent carry demand. US GDP growth of 2.8% far outpaces Japan\'s 0.7%, and resilient US employment supports the dollar. The BoJ\'s normalization pace is too slow to close the gap.',
      centralBankOutlook:
        'The Fed remains on hold at 5.50% with a cautious data-dependent stance, while the BoJ has only reached 0.25% after ending negative rates. The BoJ signals gradual normalization, but the pace is far too slow to meaningfully narrow the differential. Markets do not price a meaningful narrowing until late 2026.',
      riskFactors:
        'The primary risk is MoJ intervention, which has historically caused sharp JPY spikes. Geopolitical escalation could trigger safe-haven JPY bid. A US recession that forces rapid Fed cuts would narrow the differential. BoJ hawkish surprises at meetings could cause temporary volatility.',
      expectedDirection:
        'The expected direction is upward. The carry differential and bullish technical structure support continued USD/JPY appreciation. The next resistance zone is 154.50, with an extended target at 156.80 if the channel holds.',
      tradeProbability:
        'The AI model assigns an 85% probability to upward price action over the next 5-10 trading sessions. The long setup offers a 2.8:1 reward-to-risk ratio, with the primary risk being sudden intervention-driven JPY spikes.',
    },
    tradeSetup: {
      direction: 'Strong Buy',
      entry: '151.80',
      stopLoss: '150.20',
      takeProfit1: '154.50',
      takeProfit2: '156.80',
      riskReward: '1:2.8',
      holdingTime: '5-10 days',
      probability: 85,
    },
    whyThisTrade: [
      'The 525bp rate differential between the Fed (5.50%) and BoJ (0.25%) is the widest among majors, driving persistent carry demand.',
      'US GDP growth of 2.8% far outpaces Japan\'s 0.7%, supporting relative USD strength.',
      'Price trades in a clean ascending channel with the 50-day EMA as dynamic support and RSI at 62 — bullish with room to run.',
      'Three consecutive higher highs and a positive MACD histogram expansion confirm bullish momentum.',
      'BoJ normalization is too slow to meaningfully narrow the differential, keeping the structural carry trade intact.',
    ],
    candles: genCandles(120, 148, 0.032, 0.45, 72000),
    events: [
      { country: 'Japan', flag: '🇯🇵', time: '23:50', event: 'BoJ Rate Decision', forecast: '0.25%', previous: '0.25%', actual: null, impact: 'high' },
      { country: 'Japan', flag: '🇯🇵', time: '23:50', event: 'Trade Balance', forecast: '-¥0.6T', previous: '-¥0.8T', actual: null, impact: 'low' },
      { country: 'United States', flag: '🇺🇸', time: '08:30', event: 'Initial Jobless Claims', forecast: '221K', previous: '219K', actual: null, impact: 'medium' },
      { country: 'United States', flag: '🇺🇸', time: '14:00', event: 'FOMC Statement', forecast: '-', previous: '-', actual: null, impact: 'high' },
    ],
    aiSummary:
      'MacroAI recommends a STRONG BUY on USD/JPY with 88% confidence. The trade is anchored by the widest rate differential among majors (525bp), which drives persistent carry demand for the dollar against the yen. US growth at 2.8% far outpaces Japan\'s 0.7%, and the BoJ\'s normalization pace is too slow to meaningfully narrow the gap. Technically, price sits in a clean ascending channel with the 50-day EMA as support and RSI at 62, leaving room before overbought. The setup offers a 2.8:1 reward-to-risk ratio targeting 154.50 and 156.80, with a stop below 150.20 protecting against MoJ intervention spikes. The primary risk is sudden intervention-driven JPY volatility.',
  },
  {
    symbol: 'GBPUSD',
    display: 'GBP/USD',
    name: 'British Pound / US Dollar',
    aiScore: 48,
    recommendation: 'Neutral',
    confidence: 54,
    macroTrend: 'flat',
    technicalTrend: 'flat',
    riskLevel: 'Medium',
    macroFactors: [
      { label: 'Interest Rate', current: '5.00%', previous: '5.25%', trend: 'down', bias: 'neutral', score: 58 },
      { label: 'Inflation', current: '2.8%', previous: '3.1%', trend: 'down', bias: 'neutral', score: 52 },
      { label: 'GDP', current: '0.1%', previous: '0.0%', trend: 'up', bias: 'neutral', score: 48 },
      { label: 'Employment', current: '4.3%', previous: '4.0%', trend: 'up', bias: 'bearish', score: 42 },
      { label: 'Retail Sales', current: '+0.3%', previous: '+0.1%', trend: 'up', bias: 'bullish', score: 56 },
      { label: 'PMI', current: '49.4', previous: '48.8', trend: 'up', bias: 'neutral', score: 50 },
      { label: 'Trade Balance', current: '-£4.2B', previous: '-£3.8B', trend: 'down', bias: 'bearish', score: 40 },
      { label: 'Bond Yield', current: '4.12%', previous: '4.18%', trend: 'down', bias: 'neutral', score: 54 },
      { label: 'Central Bank', current: 'Neutral', previous: 'Hawkish', trend: 'down', bias: 'neutral', score: 50 },
    ],
    compositeScores: { macro: 52, technical: 46, sentiment: 50, liquidity: 44 },
    analysis: {
      marketStructure:
        'GBP/USD is range-bound between 1.2650 and 1.2860, with the 50-day and 200-day EMAs flat and entangled. RSI at 51 confirms indecision, and MACD is near the zero line. There is no clear directional bias, with price respecting the range boundaries. A break of either level is needed to establish a trend.',
      macroEnvironment:
        'The macro environment is mixed for GBP/USD. The BoE cut 25bp but struck a cautious tone due to sticky services inflation at 5.0%. UK GDP was flat in Q1, and unemployment rose to 4.3%. The Fed remains on hold, keeping the rate differential roughly stable. Neither currency has a decisive macro edge.',
      centralBankOutlook:
        'The BoE is expected to cut slowly, with markets pricing a gradual easing path. Sticky services inflation and wage growth at 5.7% keep the BoE cautious. The Fed is on hold with the first cut priced for Q2 2026. The differential is expected to narrow only gradually, limiting directional catalysts.',
      riskFactors:
        'Risks include a BoE hawkish surprise on persistent services inflation, which would boost GBP. Conversely, a soft UK labor market print could accelerate BoE easing. A Fed pivot would affect both currencies. Fiscal tightening from the autumn statement is a domestic drag.',
      expectedDirection:
        'The expected direction is neutral/range-bound. With conflicting macro signals and a flat technical structure, GBP/USD is likely to remain in its 1.2650-1.2860 range. A range-trading approach is preferred over a directional bet.',
      tradeProbability:
        'The AI model assigns only a 54% probability to any directional move, reflecting genuine ambiguity. The range setup offers a 1.5:1 reward-to-risk ratio and requires tight management.',
    },
    tradeSetup: {
      direction: 'Neutral',
      entry: '1.2715',
      stopLoss: '1.2650',
      takeProfit1: '1.2810',
      takeProfit2: '1.2860',
      riskReward: '1:1.5',
      holdingTime: '3-7 days',
      probability: 54,
    },
    whyThisTrade: [
      'The BoE is caught between sticky services inflation (5.0%) and a softening labor market, producing a neutral policy stance.',
      'GDP was flat in Q1 and unemployment rose to 4.3%, but retail sales ticked up, giving mixed growth signals.',
      'The 50-day and 200-day EMAs are flat and entangled, with RSI at 51 — classic range-bound conditions.',
      'Neither the GBP nor USD has a decisive macro edge, keeping the pair in a 1.2650-1.2860 range.',
      'A range-trading approach with tight management is preferred over a directional bet given the conflicting signals.',
    ],
    candles: genCandles(120, 1.275, 0.0002, 0.003, 60000),
    events: [
      { country: 'United Kingdom', flag: '🇬🇧', time: '07:00', event: 'GDP (QoQ)', forecast: '0.1%', previous: '0.0%', actual: null, impact: 'high' },
      { country: 'United Kingdom', flag: '🇬🇧', time: '07:00', event: 'Manufacturing PMI', forecast: '49.8', previous: '49.4', actual: null, impact: 'low' },
      { country: 'United States', flag: '🇺🇸', time: '08:30', event: 'Core CPI (YoY)', forecast: '3.2%', previous: '3.4%', actual: null, impact: 'high' },
    ],
    aiSummary:
      'MacroAI assigns a NEUTRAL rating to GBP/USD with 54% confidence, reflecting genuinely conflicting signals. The BoE is caught between sticky services inflation at 5.0% and a softening labor market with unemployment at 4.3%, producing a cautious, slow-easing policy stance. UK GDP was flat in Q1, and the technical structure is range-bound with flat moving averages and RSI at 51. Neither currency has a decisive macro edge, and the pair is likely to remain in its 1.2650-1.2860 range. A range-trading approach with a 1.5:1 reward-to-risk ratio is recommended, requiring tight management. The primary risk is a BoE or Fed surprise that breaks the range.',
  },
  {
    symbol: 'XAUUSD',
    display: 'XAU/USD',
    name: 'Gold / US Dollar',
    aiScore: 76,
    recommendation: 'Buy',
    confidence: 72,
    macroTrend: 'up',
    technicalTrend: 'up',
    riskLevel: 'Medium',
    macroFactors: [
      { label: 'Interest Rate', current: '5.50%', previous: '5.50%', trend: 'flat', bias: 'neutral', score: 55 },
      { label: 'Inflation', current: '3.0%', previous: '3.4%', trend: 'down', bias: 'bullish', score: 72 },
      { label: 'GDP', current: '2.8%', previous: '2.4%', trend: 'up', bias: 'neutral', score: 60 },
      { label: 'Employment', current: '4.1%', previous: '3.8%', trend: 'up', bias: 'neutral', score: 58 },
      { label: 'Retail Sales', current: '+0.6%', previous: '+0.4%', trend: 'up', bias: 'neutral', score: 62 },
      { label: 'PMI', current: '48.7', previous: '47.9', trend: 'up', bias: 'neutral', score: 54 },
      { label: 'Trade Balance', current: '-$70.2B', previous: '-$68.1B', trend: 'down', bias: 'bullish', score: 70 },
      { label: 'Bond Yield', current: '4.28%', previous: '4.33%', trend: 'down', bias: 'bullish', score: 74 },
      { label: 'Central Bank', current: 'Hawkish', previous: 'Hawkish', trend: 'flat', bias: 'neutral', score: 58 },
    ],
    compositeScores: { macro: 72, technical: 78, sentiment: 80, liquidity: 74 },
    analysis: {
      marketStructure:
        'Gold is in a bullish uptrend, trading above all three key EMAs (20, 50, 200) which are stacked in bullish order. The 50-day EMA is acting as dynamic support, and price recently broke above the $2,040 resistance pivot. RSI at 65 is bullish with room before overbought. Volume on up-days confirms buyer conviction.',
      macroEnvironment:
        'The macro environment is supportive for gold. Declining real yields (nominal yields falling while inflation eases) reduce the opportunity cost of holding non-yielding gold. Geopolitical tensions and central bank buying provide a structural bid. The fiscal deficit widening supports gold as a hedge against fiat debasement.',
      centralBankOutlook:
        'The Fed is on hold but markets price cuts in 2026, which would further reduce real yields and boost gold. Global central bank buying, particularly from EM central banks diversifying reserves, provides a structural floor. The BoJ normalization is a minor headwind via JPY-denominated gold.',
      riskFactors:
        'A hawkish Fed surprise that pushes real yields higher would pressure gold. A sharp USD rally would weigh on dollar-denominated gold. Risk-on sentiment could reduce safe-haven demand. Physical demand softness in India/China seasonally could cap upside.',
      expectedDirection:
        'The expected direction is upward. Declining real yields, central bank buying, and a bullish technical structure support continued appreciation. The next resistance is $2,080, with an extended target at $2,100.',
      tradeProbability:
        'The AI model assigns a 72% probability to upward price action over the next 5-10 trading sessions. The long setup offers a 2.0:1 reward-to-risk ratio.',
    },
    tradeSetup: {
      direction: 'Buy',
      entry: '2,041.50',
      stopLoss: '2,018.00',
      takeProfit1: '2,080.00',
      takeProfit2: '2,100.00',
      riskReward: '1:2.0',
      holdingTime: '7-14 days',
      probability: 72,
    },
    whyThisTrade: [
      'Declining real yields (nominal yields falling while inflation eases) reduce the opportunity cost of holding gold.',
      'Geopolitical tensions and record central bank buying provide a structural bid under gold.',
      'Price trades above all three key EMAs in bullish order, with the 50-day EMA as dynamic support.',
      'RSI at 65 is bullish with room before overbought, and volume on up-days confirms buyer conviction.',
      'Markets pricing Fed cuts in 2026 would further reduce real yields, providing a forward catalyst.',
    ],
    candles: genCandles(120, 1980, 0.55, 8, 95000),
    events: [
      { country: 'United States', flag: '🇺🇸', time: '08:30', event: 'Core CPI (YoY)', forecast: '3.2%', previous: '3.4%', actual: null, impact: 'high' },
      { country: 'United States', flag: '🇺🇸', time: '14:00', event: 'FOMC Statement', forecast: '-', previous: '-', actual: null, impact: 'high' },
      { country: 'United States', flag: '🇺🇸', time: '08:30', event: 'Initial Jobless Claims', forecast: '221K', previous: '219K', actual: null, impact: 'medium' },
    ],
    aiSummary:
      'MacroAI recommends a BUY on XAU/USD (Gold) with 72% confidence. The trade is supported by declining real yields as nominal yields fall while inflation eases, reducing the opportunity cost of holding non-yielding gold. Record central bank buying and geopolitical tensions provide a structural bid. Technically, gold trades above all three key EMAs in bullish order with RSI at 65, leaving room before overbought. The setup offers a 2.0:1 reward-to-risk ratio targeting $2,080 and $2,100, with a stop at $2,018. The primary risk is a hawkish Fed surprise that pushes real yields higher or a sharp USD rally.',
  },
  {
    symbol: 'BTCUSD',
    display: 'BTC/USD',
    name: 'Bitcoin / US Dollar',
    aiScore: 68,
    recommendation: 'Buy',
    confidence: 65,
    macroTrend: 'up',
    technicalTrend: 'up',
    riskLevel: 'Very High',
    macroFactors: [
      { label: 'Interest Rate', current: '5.50%', previous: '5.50%', trend: 'flat', bias: 'neutral', score: 55 },
      { label: 'Inflation', current: '3.0%', previous: '3.4%', trend: 'down', bias: 'bullish', score: 70 },
      { label: 'GDP', current: '2.8%', previous: '2.4%', trend: 'up', bias: 'neutral', score: 60 },
      { label: 'Employment', current: '4.1%', previous: '3.8%', trend: 'up', bias: 'neutral', score: 58 },
      { label: 'Retail Sales', current: '+0.6%', previous: '+0.4%', trend: 'up', bias: 'neutral', score: 62 },
      { label: 'PMI', current: '48.7', previous: '47.9', trend: 'up', bias: 'neutral', score: 54 },
      { label: 'Trade Balance', current: '-$70.2B', previous: '-$68.1B', trend: 'down', bias: 'bullish', score: 68 },
      { label: 'Bond Yield', current: '4.28%', previous: '4.33%', trend: 'down', bias: 'bullish', score: 72 },
      { label: 'Central Bank', current: 'Hawkish', previous: 'Hawkish', trend: 'flat', bias: 'bearish', score: 48 },
    ],
    compositeScores: { macro: 62, technical: 72, sentiment: 78, liquidity: 70 },
    analysis: {
      marketStructure:
        'BTC/USD has reclaimed the 50-day EMA and is testing the $68,000 resistance zone. The 200-day EMA is sloping upward, and the broader structure is bullish. RSI at 58 is neutral-bullish. However, the $68,000 level has rejected price twice, forming a short-term double-top. A break above is needed to confirm continuation.',
      macroEnvironment:
        'The macro environment is mixed-to-supportive for BTC. Declining inflation and the prospect of Fed cuts in 2026 reduce the opportunity cost of holding risk assets. However, elevated rates and a hawkish Fed stance currently cap speculative flows. The fiscal deficit and fiat debasement concerns support BTC as a store of value.',
      centralBankOutlook:
        'The Fed is on hold but markets price cuts in 2026, which would be bullish for risk assets including BTC. The current hawkish stance is a headwind, but the direction of travel is toward easier policy. Global liquidity is expected to improve as multiple central banks ease.',
      riskFactors:
        'BTC is highly volatile and subject to regulatory risk. A hawkish Fed surprise would pressure risk assets. Exchange outages or security incidents could cause flash crashes. Sentiment shifts rapidly in crypto markets. Position sizing must account for Very High risk.',
      expectedDirection:
        'The expected direction is upward, contingent on a break above $68,000. The technical structure is bullish, and macro tailwinds from eventual Fed cuts support upside. The target is $72,000, with an extended target at $75,000.',
      tradeProbability:
        'The AI model assigns a 65% probability to upward price action, reflecting the high volatility and binary nature of the $68,000 resistance break. The setup offers a 1.8:1 reward-to-risk ratio.',
    },
    tradeSetup: {
      direction: 'Buy',
      entry: '67,842',
      stopLoss: '64,500',
      takeProfit1: '72,000',
      takeProfit2: '75,000',
      riskReward: '1:1.8',
      holdingTime: '7-14 days',
      probability: 65,
    },
    whyThisTrade: [
      'Declining inflation and the prospect of Fed cuts in 2026 reduce the opportunity cost of holding risk assets like BTC.',
      'Price has reclaimed the 50-day EMA with the 200-day EMA sloping upward, confirming a bullish technical structure.',
      'The fiscal deficit and fiat debasement concerns support BTC as a store of value hedge.',
      'Global liquidity is expected to improve as multiple central banks ease, providing a forward catalyst.',
      'A break above the $68,000 resistance would confirm continuation toward $72,000.',
    ],
    candles: genCandles(120, 62000, 48, 1800, 120000),
    events: [
      { country: 'United States', flag: '🇺🇸', time: '08:30', event: 'Core CPI (YoY)', forecast: '3.2%', previous: '3.4%', actual: null, impact: 'high' },
      { country: 'United States', flag: '🇺🇸', time: '14:00', event: 'FOMC Statement', forecast: '-', previous: '-', actual: null, impact: 'high' },
    ],
    aiSummary:
      'MacroAI recommends a BUY on BTC/USD with 65% confidence, acknowledging the Very High risk profile. The trade is supported by declining inflation and the prospect of Fed cuts in 2026, which reduce the opportunity cost of holding risk assets. BTC has reclaimed the 50-day EMA with the 200-day EMA sloping upward, and fiscal deficit concerns support its role as a store of value. The setup offers a 1.8:1 reward-to-risk ratio targeting $72,000 and $75,000, with a stop at $64,500. The primary risk is a hawkish Fed surprise or a failure to break the $68,000 resistance, which has rejected price twice. Position sizing must account for the Very High risk.',
  },
];

export const tradePanelSymbols = tradePanelData.map((d) => ({ symbol: d.symbol, display: d.display, name: d.name }));

export const aiDecisionIndicators: DecisionIndicator[] = [
  { id: 'interest-rate', name: 'Interest Rate', currentValue: '5.50%', weight: 14, impact: 'bullish', contribution: 11.2, confidence: 92, trend: 'up' },
  { id: 'inflation', name: 'Inflation', currentValue: '3.0%', weight: 12, impact: 'bullish', contribution: 8.4, confidence: 88, trend: 'down' },
  { id: 'gdp', name: 'GDP', currentValue: '2.8%', weight: 10, impact: 'bullish', contribution: 7.1, confidence: 84, trend: 'up' },
  { id: 'employment', name: 'Employment', currentValue: '4.1%', weight: 8, impact: 'neutral', contribution: 3.8, confidence: 80, trend: 'flat' },
  { id: 'retail-sales', name: 'Retail Sales', currentValue: '+0.6%', weight: 7, impact: 'bullish', contribution: 4.9, confidence: 76, trend: 'up' },
  { id: 'pmi', name: 'PMI', currentValue: '48.7', weight: 7, impact: 'bearish', contribution: -2.1, confidence: 72, trend: 'down' },
  { id: 'trade-balance', name: 'Trade Balance', currentValue: '-$70.2B', weight: 6, impact: 'bearish', contribution: -1.8, confidence: 70, trend: 'down' },
  { id: 'bond-yield', name: 'Bond Yield', currentValue: '4.28%', weight: 8, impact: 'bullish', contribution: 5.6, confidence: 86, trend: 'up' },
  { id: 'central-bank', name: 'Central Bank', currentValue: 'Hawkish Hold', weight: 10, impact: 'bullish', contribution: 7.8, confidence: 90, trend: 'up' },
  { id: 'news-sentiment', name: 'News Sentiment', currentValue: '+0.34', weight: 6, impact: 'bullish', contribution: 3.6, confidence: 68, trend: 'up' },
  { id: 'market-sentiment', name: 'Market Sentiment', currentValue: 'Risk On', weight: 5, impact: 'bullish', contribution: 3.2, confidence: 74, trend: 'up' },
  { id: 'technical-trend', name: 'Technical Trend', currentValue: 'Bullish', weight: 4, impact: 'bullish', contribution: 2.8, confidence: 82, trend: 'up' },
  { id: 'liquidity', name: 'Liquidity', currentValue: 'Adequate', weight: 3, impact: 'neutral', contribution: 1.4, confidence: 78, trend: 'flat' },
];

export const aiDecisionReasoning: DecisionReasoning = {
  whyBullish:
    'The US dollar remains structurally supported by the widest rate differential in the G10 universe. The Fed\'s hawkish hold, coupled with sticky core inflation above the 2% target, keeps real yields elevated and attracts carry-seeking capital. GDP growth of 2.8% continues to outpace developed-market peers, while retail sales momentum confirms resilient consumer demand. Bond yields at 4.28% reinforce USD attractiveness versus JPY (0.97%), CHF (0.62%), and EUR (2.41%). Technical structure is bullish with price trading above both the 50- and 200-day EMAs.',
  whyBearish:
    'Manufacturing PMI at 48.7 signals contraction in the goods sector, a leading indicator that has historically preceded growth slowdowns. The trade deficit at $70.2B reflects structural dollar overvaluation and could pressure the currency if export competitiveness deteriorates further. Market pricing for 2026 Fed cuts creates asymmetric risk: any dovish pivot would compress the rate differential that underpins USD strength. News sentiment, while positive, has plateaued, suggesting diminishing bullish catalysts.',
  currentRisks:
    '1) A hawkish Fed surprise in either direction — a cut would narrow differentials abruptly; a hold extension risks growth deceleration. 2) Geopolitical escalation could trigger safe-haven flows that paradoxically benefit both USD and CHF, compressing relative advantage. 3) PMI deterioration spreading to services would signal broader economic slowing. 4) A fiscal-driven term premium spike could destabilize bond markets and spill into FX volatility.',
  probabilityOfSuccess: 71,
  expectedDirection: 'Long USD against JPY, EUR, and NZD; neutral vs CHF and GBP.',
  bestTimeHorizon: '4–8 weeks (medium-term carry trade horizon)',
  expectedVolatility: 'Medium — elevated around FOMC meetings and CPI releases.',
};

export const aiDecisionScenarios: DecisionScenario[] = [
  {
    case: 'Bull',
    probability: 35,
    expectedMove: '+2.8% DXY over 8 weeks',
    catalysts: ['Fed holds hawkish through Q1 2026', 'Core CPI re-accelerates above 3.2%', 'BoJ intervention fails to sustain JPY bid'],
    riskLevel: 'Medium',
  },
  {
    case: 'Base',
    probability: 45,
    expectedMove: '+1.2% DXY over 8 weeks',
    catalysts: ['Fed signals first cut for Q2 2026', 'Inflation drifts toward 2.5%', 'Divergence persists but narrows modestly'],
    riskLevel: 'Medium',
  },
  {
    case: 'Bear',
    probability: 20,
    expectedMove: '-1.8% DXY over 8 weeks',
    catalysts: ['Fed pivots dovish earlier than priced', 'PMI contraction spreads to services', 'Safe-haven demand rotates to CHF and gold'],
    riskLevel: 'High',
  },
];

export const aiDecisionTradePlan: DecisionTradePlan = {
  direction: 'Buy',
  entry: '104.20 (DXY)',
  stopLoss: '102.80',
  takeProfit1: '105.60',
  takeProfit2: '106.40',
  riskReward: '2.0 : 1',
  holdingPeriod: '4–8 weeks',
  positionSize: '2% portfolio risk',
};

export const aiDecisionHistory: DecisionHistoryEntry[] = [
  { date: '2026-07-24', score: 71, signal: 'Buy', result: 'Win', accuracy: 73 },
  { date: '2026-07-17', score: 64, signal: 'Buy', result: 'Win', accuracy: 68 },
  { date: '2026-07-10', score: 58, signal: 'Neutral', result: 'Win', accuracy: 61 },
  { date: '2026-07-03', score: 52, signal: 'Neutral', result: 'Loss', accuracy: 54 },
  { date: '2026-06-26', score: 44, signal: 'Sell', result: 'Win', accuracy: 67 },
  { date: '2026-06-19', score: 38, signal: 'Sell', result: 'Win', accuracy: 71 },
  { date: '2026-06-12', score: 46, signal: 'Sell', result: 'Loss', accuracy: 49 },
  { date: '2026-06-05', score: 55, signal: 'Neutral', result: 'Win', accuracy: 58 },
  { date: '2026-05-29', score: 63, signal: 'Buy', result: 'Win', accuracy: 66 },
  { date: '2026-05-22', score: 69, signal: 'Buy', result: 'Win', accuracy: 72 },
  { date: '2026-05-15', score: 74, signal: 'Strong Buy', result: 'Win', accuracy: 78 },
  { date: '2026-05-08', score: 66, signal: 'Buy', result: 'Loss', accuracy: 60 },
];

export const aiDecisionPerformance: DecisionModelPerformance = {
  predictionAccuracy: 68,
  winRate: 72,
  avgConfidence: 71,
  avgRiskReward: '1.9 : 1',
  correctBullishCalls: 14,
  totalBullishCalls: 19,
  correctBearishCalls: 9,
  totalBearishCalls: 13,
};

export const aiDecisionEngine: AIDecisionEngine = {
  symbol: 'USD',
  score: 71,
  signal: 'Buy',
  overallConfidence: 71,
  macroConfidence: 78,
  technicalConfidence: 82,
  sentimentConfidence: 68,
  dataFreshness: '12 min ago',
  indicators: aiDecisionIndicators,
  reasoning: aiDecisionReasoning,
  scenarios: aiDecisionScenarios,
  tradePlan: aiDecisionTradePlan,
  history: aiDecisionHistory,
  performance: aiDecisionPerformance,
};

function genHistory(base: number, points: number, vol: number): { date: string; price: number }[] {
  const out: { date: string; price: number }[] = [];
  let price = base;
  const now = Date.now();
  for (let i = points - 1; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    price = price + (Math.random() - 0.48) * vol;
    out.push({ date: d.toISOString().slice(0, 10), price: Number(price.toFixed(2)) });
  }
  return out;
}

export const futuresInstruments: FutureInstrument[] = [
  {
    symbol: 'SPX500',
    name: 'S&P 500 Index Futures',
    category: 'Index',
    price: 5638.25,
    change: 42.75,
    changePct: 0.76,
    trend: 'up',
    aiScore: 68,
    bias: 'buy',
    confidence: 72,
    support: 5590.0,
    resistance: 5675.0,
    atr: 28.5,
    volume: 1_850_000,
    high: 5645.5,
    low: 5598.0,
    open: 5598.0,
    prevClose: 5595.5,
    history: genHistory(5600, 30, 25),
  },
  {
    symbol: 'US100',
    name: 'Nasdaq 100 Index Futures',
    category: 'Index',
    price: 20118.5,
    change: -85.25,
    changePct: -0.42,
    trend: 'down',
    aiScore: 41,
    bias: 'sell',
    confidence: 64,
    support: 19950.0,
    resistance: 20250.0,
    atr: 95.0,
    volume: 1_420_000,
    high: 20230.0,
    low: 20085.0,
    open: 20200.0,
    prevClose: 20203.75,
    history: genHistory(20100, 30, 80),
  },
  {
    symbol: 'US30',
    name: 'Dow Jones Index Futures',
    category: 'Index',
    price: 41250.75,
    change: 185.5,
    changePct: 0.45,
    trend: 'up',
    aiScore: 62,
    bias: 'buy',
    confidence: 68,
    support: 40950.0,
    resistance: 41500.0,
    atr: 210.0,
    volume: 980_000,
    high: 41280.0,
    low: 41050.0,
    open: 41065.0,
    prevClose: 41065.25,
    history: genHistory(41100, 30, 180),
  },
  {
    symbol: 'XAUUSD',
    name: 'Gold Futures',
    category: 'Metal',
    price: 2685.4,
    change: 12.8,
    changePct: 0.48,
    trend: 'up',
    aiScore: 74,
    bias: 'buy',
    confidence: 78,
    support: 2665.0,
    resistance: 2710.0,
    atr: 18.5,
    volume: 2_350_000,
    high: 2690.0,
    low: 2670.5,
    open: 2672.6,
    prevClose: 2672.6,
    history: genHistory(2670, 30, 15),
  },
  {
    symbol: 'XAGUSD',
    name: 'Silver Futures',
    category: 'Metal',
    price: 31.82,
    change: -0.35,
    changePct: -1.09,
    trend: 'down',
    aiScore: 44,
    bias: 'sell',
    confidence: 58,
    support: 31.2,
    resistance: 32.5,
    atr: 0.65,
    volume: 1_650_000,
    high: 32.18,
    low: 31.65,
    open: 32.17,
    prevClose: 32.17,
    history: genHistory(32, 30, 0.5),
  },
  {
    symbol: 'WTI',
    name: 'WTI Crude Oil Futures',
    category: 'Energy',
    price: 71.85,
    change: 1.42,
    changePct: 2.01,
    trend: 'up',
    aiScore: 66,
    bias: 'buy',
    confidence: 70,
    support: 69.5,
    resistance: 73.5,
    atr: 1.85,
    volume: 1_980_000,
    high: 72.15,
    low: 70.6,
    open: 70.43,
    prevClose: 70.43,
    history: genHistory(70, 30, 1.5),
  },
  {
    symbol: 'BRENT',
    name: 'Brent Crude Oil Futures',
    category: 'Energy',
    price: 75.6,
    change: 1.18,
    changePct: 1.58,
    trend: 'up',
    aiScore: 63,
    bias: 'buy',
    confidence: 66,
    support: 73.2,
    resistance: 77.0,
    atr: 1.7,
    volume: 1_540_000,
    high: 75.88,
    low: 74.5,
    open: 74.42,
    prevClose: 74.42,
    history: genHistory(74.5, 30, 1.4),
  },
];