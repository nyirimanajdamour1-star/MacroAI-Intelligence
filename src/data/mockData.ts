import type {
  Currency,
  MacroIndicator,
  CalendarEvent,
  CentralBank,
  NewsItem,
  AIInsight,
  CountryRate,
  WatchlistPair,
  MarketSentiment,
  CurrencySubScores,
} from '@/types';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function genHistory(base: number, vol: number, points = 12): { date: string; score: number }[] {
  let v = base;
  return Array.from({ length: points }, (_, i) => {
    v = Math.max(0, Math.min(100, v + (Math.random() - 0.45) * vol));
    return { date: `${months[i % 12]} ${i + 1}`, score: Math.round(v * 10) / 10 };
  });
}

function genValueHistory(base: number, vol: number, points = 12): { date: string; value: number }[] {
  let v = base;
  return Array.from({ length: points }, (_, i) => {
    v = Math.max(0, v + (Math.random() - 0.45) * vol);
    return { date: `${months[i % 12]} ${i + 1}`, value: Math.round(v * 100) / 100 };
  });
}

export const currencies: Currency[] = [
  {
    code: 'USD',
    name: 'US Dollar',
    flag: '🇺🇸',
    score: 78.4,
    confidence: 86,
    trend: 'up',
    aiRating: 'Strong Buy',
    lastUpdate: '2 min ago',
    color: 'bull',
    summary:
      'The USD is currently the strongest currency because interest rates remain elevated while inflation is moderating and employment remains strong.',
    positiveFactors: [
      'Fed funds rate held at 5.25-5.50%, among the highest of major economies',
      'Core CPI moderating toward 3.2% while headline CPI eases to 3.0%',
      'Nonfarm payrolls averaged 215K over the last three months',
      'Real yields positive across the 2y/10y curve',
      'Safe-haven demand supported by geopolitical risk premium',
    ],
    negativeFactors: [
      'Fed signaling potential rate cuts in H2 2025',
      'Fiscal deficit widening above 6% of GDP',
      'Consumer credit delinquencies ticking higher',
    ],
    recommendedPairs: [
      { pair: 'USD/JPY', direction: 'buy', confidence: 82 },
      { pair: 'USD/CHF', direction: 'buy', confidence: 71 },
      { pair: 'EUR/USD', direction: 'sell', confidence: 76 },
      { pair: 'GBP/USD', direction: 'neutral', confidence: 54 },
    ],
    history: genHistory(72, 6),
  },
  {
    code: 'EUR',
    name: 'Euro',
    flag: '🇪🇺',
    score: 42.1,
    confidence: 72,
    trend: 'down',
    aiRating: 'Sell',
    lastUpdate: '3 min ago',
    color: 'bear',
    summary:
      'The EUR remains weak due to slowing GDP growth and weaker manufacturing, with the ECB cutting rates as the bloc flirts with recession.',
    positiveFactors: [
      'ECB rate cut cycle supporting credit conditions',
      'Services PMI holding above 50 expansion threshold',
      'Energy prices stabilized after 2024 volatility',
    ],
    negativeFactors: [
      'Manufacturing PMI contracting for 18 consecutive months',
      'GDP growth at just 0.4% YoY, near stagnation',
      'German industrial production declining 2.1% MoM',
      'ECB balance sheet still bloated relative to peers',
    ],
    recommendedPairs: [
      { pair: 'EUR/USD', direction: 'sell', confidence: 76 },
      { pair: 'EUR/JPY', direction: 'sell', confidence: 68 },
      { pair: 'EUR/GBP', direction: 'neutral', confidence: 52 },
    ],
    history: genHistory(48, 5),
  },
  {
    code: 'GBP',
    name: 'British Pound',
    flag: '🇬🇧',
    score: 58.7,
    confidence: 68,
    trend: 'flat',
    aiRating: 'Neutral',
    lastUpdate: '5 min ago',
    color: 'neutral',
    summary:
      'GBP is range-bound as the BoE balances sticky services inflation against a softening labor market.',
    positiveFactors: [
      'BoE bank rate at 5.00%, supporting carry',
      'Wage growth elevated at 5.7% YoY',
      'Services inflation above target at 5.0%',
    ],
    negativeFactors: [
      'Unemployment rising to 4.3% from 3.8%',
      'GDP flat in Q1, recession risk elevated',
      'Fiscal tightening planned for autumn statement',
    ],
    recommendedPairs: [
      { pair: 'GBP/USD', direction: 'neutral', confidence: 54 },
      { pair: 'EUR/GBP', direction: 'neutral', confidence: 52 },
      { pair: 'GBP/JPY', direction: 'buy', confidence: 61 },
    ],
    history: genHistory(58, 4),
  },
  {
    code: 'JPY',
    name: 'Japanese Yen',
    flag: '🇯🇵',
    score: 31.2,
    confidence: 79,
    trend: 'down',
    aiRating: 'Strong Sell',
    lastUpdate: '1 min ago',
    color: 'bear',
    summary:
      'The JPY remains the weakest major as the BoJ keeps ultra-low rates while real yields stay deeply negative.',
    positiveFactors: [
      'BoJ slowly normalizing policy, ended NIRP',
      'Wage round strongest in three decades',
      'Current account surplus provides structural support',
    ],
    negativeFactors: [
      'Policy rate still at just 0.25%, widest gap vs Fed',
      'Real yields deeply negative at -1.8%',
      'Persistent intervention needed to slow depreciation',
      'Inflation outpacing wage gains erodes purchasing power',
    ],
    recommendedPairs: [
      { pair: 'USD/JPY', direction: 'buy', confidence: 82 },
      { pair: 'EUR/JPY', direction: 'sell', confidence: 68 },
      { pair: 'GBP/JPY', direction: 'buy', confidence: 61 },
    ],
    history: genHistory(38, 7),
  },
  {
    code: 'CHF',
    name: 'Swiss Franc',
    flag: '🇨🇭',
    score: 64.8,
    confidence: 74,
    trend: 'up',
    aiRating: 'Buy',
    lastUpdate: '4 min ago',
    color: 'bull',
    summary:
      'The CHF benefits from safe-haven flows and a surprise SNB pivot back to hawkish signaling.',
    positiveFactors: [
      'Safe-haven demand amid geopolitical tensions',
      'SNB balance sheet reduction supporting the franc',
      'Low inflation at 1.2%, well within target',
    ],
    negativeFactors: [
      'SNB cut rates to 1.0%, narrowing yield advantage',
      'Export competitiveness concerns at current levels',
    ],
    recommendedPairs: [
      { pair: 'USD/CHF', direction: 'sell', confidence: 65 },
      { pair: 'EUR/CHF', direction: 'sell', confidence: 70 },
      { pair: 'CHF/JPY', direction: 'buy', confidence: 73 },
    ],
    history: genHistory(60, 5),
  },
  {
    code: 'CAD',
    name: 'Canadian Dollar',
    flag: '🇨🇦',
    score: 49.3,
    confidence: 65,
    trend: 'down',
    aiRating: 'Sell',
    lastUpdate: '6 min ago',
    color: 'bear',
    summary:
      'The CAD is pressured by the BoC cutting ahead of the Fed and softening oil prices.',
    positiveFactors: [
      'Oil prices stabilizing above $72/bbl',
      'Labor market resilient, unemployment at 6.0%',
    ],
    negativeFactors: [
      'BoC cut to 4.25%, 50bp below Fed',
      'GDP growth sluggish at 1.1% annualized',
      'Household debt-to-income at record highs',
    ],
    recommendedPairs: [
      { pair: 'USD/CAD', direction: 'buy', confidence: 66 },
      { pair: 'CAD/JPY', direction: 'neutral', confidence: 55 },
    ],
    history: genHistory(52, 5),
  },
  {
    code: 'AUD',
    name: 'Australian Dollar',
    flag: '🇦🇺',
    score: 53.9,
    confidence: 63,
    trend: 'flat',
    aiRating: 'Neutral',
    lastUpdate: '7 min ago',
    color: 'neutral',
    summary:
      'The AUD is mixed as the RBA holds hawkish while China demand softens.',
    positiveFactors: [
      'RBA rate at 4.35%, most hawkish of the majors',
      'Iron ore prices supported by supply discipline',
      'Labor market tight, unemployment at 4.1%',
    ],
    negativeFactors: [
      'China property sector drag on commodity demand',
      'Retail sales softening, -0.3% MoM',
      'RBA expected to cut in Q1 2025',
    ],
    recommendedPairs: [
      { pair: 'AUD/USD', direction: 'neutral', confidence: 58 },
      { pair: 'AUD/JPY', direction: 'buy', confidence: 62 },
      { pair: 'AUD/NZD', direction: 'buy', confidence: 60 },
    ],
    history: genHistory(54, 4),
  },
  {
    code: 'NZD',
    name: 'New Zealand Dollar',
    flag: '🇳🇿',
    score: 46.7,
    confidence: 61,
    trend: 'down',
    aiRating: 'Sell',
    lastUpdate: '8 min ago',
    color: 'bear',
    summary:
      'The NZD weakens as the RBNZ pivots dovish amid a contracting economy.',
    positiveFactors: [
      'Dairy prices (GDT) recovering 3.2%',
      'Tourism sector steady',
    ],
    negativeFactors: [
      'RBNZ cut to 4.75%, aggressive easing path signaled',
      'GDP contracted -0.2% in Q1',
      'Unemployment rising to 4.8%',
    ],
    recommendedPairs: [
      { pair: 'NZD/USD', direction: 'sell', confidence: 64 },
      { pair: 'AUD/NZD', direction: 'buy', confidence: 60 },
    ],
    history: genHistory(50, 5),
  },
];

export const macroIndicators: Record<string, MacroIndicator[]> = {
  USD: [
    {
      id: 'usd-rate',
      name: 'Interest Rate',
      value: '5.50%',
      previous: '5.25%',
      change: '+0.25',
      changePct: 4.8,
      sentiment: 'bullish',
      unit: '%',
      description: 'Fed funds target range upper bound',
      history: genValueHistory(4.5, 0.3),
    },
    {
      id: 'usd-cpi',
      name: 'Inflation (CPI)',
      value: '3.0%',
      previous: '3.3%',
      change: '-0.3',
      changePct: -9.1,
      sentiment: 'bullish',
      unit: '%',
      description: 'Headline CPI YoY, moderating toward target',
      history: genValueHistory(4, 0.4),
    },
    {
      id: 'usd-gdp',
      name: 'GDP Growth',
      value: '2.8%',
      previous: '1.6%',
      change: '+1.2',
      changePct: 75,
      sentiment: 'bullish',
      unit: '%',
      description: 'Q1 annualized GDP growth',
      history: genValueHistory(2, 0.6),
    },
    {
      id: 'usd-unemp',
      name: 'Unemployment',
      value: '4.1%',
      previous: '4.0%',
      change: '+0.1',
      changePct: 2.5,
      sentiment: 'bearish',
      unit: '%',
      description: 'Nonfarm unemployment rate',
      history: genValueHistory(3.8, 0.2),
    },
    {
      id: 'usd-retail',
      name: 'Retail Sales',
      value: '0.6%',
      previous: '0.4%',
      change: '+0.2',
      changePct: 50,
      sentiment: 'bullish',
      unit: '% MoM',
      description: 'Monthly retail sales change',
      history: genValueHistory(0.3, 0.4),
    },
    {
      id: 'usd-pmi',
      name: 'Manufacturing PMI',
      value: '48.7',
      previous: '47.9',
      change: '+0.8',
      changePct: 1.7,
      sentiment: 'neutral',
      unit: '',
      description: 'ISM manufacturing PMI, below 50 = contraction',
      history: genValueHistory(49, 1.5),
    },
    {
      id: 'usd-trade',
      name: 'Trade Balance',
      value: '-$70.2B',
      previous: '-$68.9B',
      change: '-1.3B',
      changePct: -1.9,
      sentiment: 'bearish',
      unit: 'B USD',
      description: 'Monthly trade balance deficit',
      history: genValueHistory(-70, 5),
    },
    {
      id: 'usd-yield',
      name: '10Y Bond Yield',
      value: '4.28%',
      previous: '4.15%',
      change: '+0.13',
      changePct: 3.1,
      sentiment: 'bullish',
      unit: '%',
      description: '10-year Treasury yield',
      history: genValueHistory(4, 0.2),
    },
  ],
  EUR: [
    {
      id: 'eur-rate',
      name: 'Interest Rate',
      value: '3.50%',
      previous: '4.00%',
      change: '-0.50',
      changePct: -12.5,
      sentiment: 'bearish',
      unit: '%',
      description: 'ECB deposit facility rate',
      history: genValueHistory(4, 0.3),
    },
    {
      id: 'eur-cpi',
      name: 'Inflation (CPI)',
      value: '2.3%',
      previous: '2.6%',
      change: '-0.3',
      changePct: -11.5,
      sentiment: 'neutral',
      unit: '%',
      description: 'Eurozone headline HICP YoY',
      history: genValueHistory(3, 0.4),
    },
    {
      id: 'eur-gdp',
      name: 'GDP Growth',
      value: '0.4%',
      previous: '0.5%',
      change: '-0.1',
      changePct: -20,
      sentiment: 'bearish',
      unit: '%',
      description: 'QoQ GDP growth, near stagnation',
      history: genValueHistory(0.5, 0.3),
    },
    {
      id: 'eur-unemp',
      name: 'Unemployment',
      value: '6.4%',
      previous: '6.3%',
      change: '+0.1',
      changePct: 1.6,
      sentiment: 'neutral',
      unit: '%',
      description: 'Eurozone unemployment rate',
      history: genValueHistory(6.3, 0.1),
    },
    {
      id: 'eur-retail',
      name: 'Retail Sales',
      value: '-0.1%',
      previous: '0.2%',
      change: '-0.3',
      changePct: -150,
      sentiment: 'bearish',
      unit: '% MoM',
      description: 'Monthly retail sales change',
      history: genValueHistory(0.1, 0.3),
    },
    {
      id: 'eur-pmi',
      name: 'Manufacturing PMI',
      value: '45.6',
      previous: '46.1',
      change: '-0.5',
      changePct: -1.1,
      sentiment: 'bearish',
      unit: '',
      description: 'Eurozone manufacturing PMI, deep contraction',
      history: genValueHistory(46, 1.2),
    },
    {
      id: 'eur-trade',
      name: 'Trade Balance',
      value: '€17.8B',
      previous: '€22.1B',
      change: '-4.3B',
      changePct: -19.5,
      sentiment: 'bearish',
      unit: 'B EUR',
      description: 'Monthly trade surplus',
      history: genValueHistory(20, 4),
    },
    {
      id: 'eur-yield',
      name: '10Y Bond Yield',
      value: '2.41%',
      previous: '2.55%',
      change: '-0.14',
      changePct: -5.5,
      sentiment: 'bearish',
      unit: '%',
      description: 'German 10-year Bund yield',
      history: genValueHistory(2.5, 0.2),
    },
  ],
};

export const calendarEvents: CalendarEvent[] = [
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

export const centralBanks: CentralBank[] = [
  {
    id: 'fed',
    name: 'Federal Reserve',
    country: 'United States',
    flag: '🇺🇸',
    rate: 5.5,
    previousRate: 5.5,
    change: 0,
    lastMeeting: 'Nov 7, 2025',
    nextMeeting: 'Dec 18, 2025',
    expectedDecision: 'Hold',
    marketPricing: '92% hold priced in',
    stance: 'Hawkish',
    governor: 'Jerome Powell',
    confidence: 88,
    inflationTrend: 'down',
    employmentTrend: 'flat',
    gdpTrend: 'up',
    policySummary:
      'The Fed holds rates at a 23-year high, balancing resilient labor markets against moderating inflation. Powell signaled a cautious data-dependent approach, with the first cut now priced for Q2 2026.',
    probabilities: { hold: 68, cut: 22, hike: 10 },
    rateHistory: [
      { date: 'Jan', rate: 4.5 },
      { date: 'Feb', rate: 4.75 },
      { date: 'Mar', rate: 5.0 },
      { date: 'Apr', rate: 5.0 },
      { date: 'May', rate: 5.25 },
      { date: 'Jun', rate: 5.25 },
      { date: 'Jul', rate: 5.5 },
      { date: 'Aug', rate: 5.5 },
      { date: 'Sep', rate: 5.5 },
      { date: 'Oct', rate: 5.5 },
      { date: 'Nov', rate: 5.5 },
      { date: 'Dec', rate: 5.5 },
    ],
    recentStatement:
      'Inflation has eased over the past year but remains elevated. The Committee is highly attentive to inflation risks and will carefully assess incoming data in determining the extent of additional policy firming.',
    economicConditions:
      'The US economy expanded at a 2.8% annualized rate in Q1, well above trend. Consumer spending remains robust, supported by a tight labor market and rising real wages. However, credit delinquencies are ticking higher and savings rates have declined.',
    inflationOutlook:
      'Headline CPI has moderated to 3.0% from a peak of 9.1%, with core CPI at 3.2%. The disinflation trend is expected to continue, but sticky services inflation and resilient demand keep the path to 2% gradual. Energy base effects should help through Q1.',
    employmentOutlook:
      'Nonfarm payrolls averaged 215K over the last three months, well above the breakeven rate. Unemployment ticked up to 4.1% from 3.8%, a slight cooling but still historically tight. Wage growth at 4.3% remains above the 3.5% pace consistent with 2% inflation.',
    gdpOutlook:
      'GDP growth of 2.8% in Q1 surprised to the upside. The Atlanta Fed GDPNow tracker points to 2.1% in Q2. A soft landing remains the base case, though restrictive policy and tighter credit conditions are expected to slow growth toward trend in H2.',
    aiInterpretation:
      'The Fed is the most hawkish major central bank and the primary driver of USD strength. The rate differential versus JPY (525bp) and EUR (200bp) is the key macro force supporting the dollar. AI models assign an 88% confidence to the hawkish stance, with the first cut not priced until Q2 2026. The combination of above-trend growth, moderating inflation, and a still-tight labor market supports continued USD outperformance. The main risk to this view is a faster-than-expected inflation decline that pulls forward cut expectations.',
    expectedNextDecision: 'Hold at 5.50% (Dec 18)',
    expectedCurrencyImpact: 'Bullish for USD — rate differential supports carry trades',
  },
  {
    id: 'ecb',
    name: 'European Central Bank',
    country: 'Eurozone',
    flag: '🇪🇺',
    rate: 3.5,
    previousRate: 4.0,
    change: -0.5,
    lastMeeting: 'Oct 17, 2025',
    nextMeeting: 'Dec 12, 2025',
    expectedDecision: 'Cut',
    marketPricing: '74% cut (25bp) priced in',
    stance: 'Dovish',
    governor: 'Christine Lagarde',
    confidence: 82,
    inflationTrend: 'down',
    employmentTrend: 'up',
    gdpTrend: 'down',
    policySummary:
      'The ECB delivered a 50bp cut as growth stalls and inflation approaches target. Lagarde signaled further easing is likely, with markets pricing additional cuts through 2026.',
    probabilities: { hold: 26, cut: 68, hike: 6 },
    rateHistory: [
      { date: 'Jan', rate: 3.5 },
      { date: 'Feb', rate: 3.75 },
      { date: 'Mar', rate: 4.0 },
      { date: 'Apr', rate: 4.0 },
      { date: 'May', rate: 4.0 },
      { date: 'Jun', rate: 4.25 },
      { date: 'Jul', rate: 4.25 },
      { date: 'Aug', rate: 4.0 },
      { date: 'Sep', rate: 4.0 },
      { date: 'Oct', rate: 4.0 },
      { date: 'Nov', rate: 3.5 },
      { date: 'Dec', rate: 3.5 },
    ],
    recentStatement:
      'Inflation has fallen sharply, reflecting the impact of the ECB monetary policy stance and the decline in energy prices. We are determined to ensure that inflation returns to our 2% medium-term target in a timely manner.',
    economicConditions:
      'Eurozone GDP growth was just 0.4% YoY in Q1, near stagnation. German industrial production is declining 2.1% MoM, and manufacturing PMI has contracted for 18 consecutive months. Services PMI holds above 50 but is softening.',
    inflationOutlook:
      'Headline HICP has fallen to 2.3%, approaching the 2% target. Core inflation at 2.9% remains sticky but is trending down. Energy deflation and soft demand should bring inflation to target by mid-2026.',
    employmentOutlook:
      'Unemployment rose slightly to 6.4% from 6.3%, still historically low. Wage growth is moderating but remains above productivity gains. Labor demand is cooling, particularly in manufacturing.',
    gdpOutlook:
      'GDP is expected to grow just 0.6% in 2025, with downside risks from German industrial weakness and external demand. A technical recession in Germany remains a risk. Recovery is pushed to H2 2026.',
    aiInterpretation:
      'The ECB has pivoted decisively dovish, delivering a 50bp cut and signaling more. The 200bp rate differential with the Fed is the primary drag on the EUR. AI confidence in the dovish stance is 82%. With growth stagnating, inflation near target, and manufacturing in recession, the easing cycle is well-justified. The EUR is expected to remain weak against USD and JPY (on a relative policy basis), though downside may be limited as cuts are already heavily priced.',
    expectedNextDecision: 'Cut 25bp to 3.25% (Dec 12)',
    expectedCurrencyImpact: 'Bearish for EUR — easing cycle widens rate differential vs Fed',
  },
  {
    id: 'boe',
    name: 'Bank of England',
    country: 'United Kingdom',
    flag: '🇬🇧',
    rate: 5.0,
    previousRate: 5.25,
    change: -0.25,
    lastMeeting: 'Nov 7, 2025',
    nextMeeting: 'Dec 19, 2025',
    expectedDecision: 'Hold',
    marketPricing: '58% hold priced in',
    stance: 'Neutral',
    governor: 'Andrew Bailey',
    confidence: 64,
    inflationTrend: 'flat',
    employmentTrend: 'down',
    gdpTrend: 'flat',
    policySummary:
      'The BoE cut 25bp but struck a cautious tone, balancing sticky services inflation against a softening labor market. Further cuts are expected to be slow and gradual.',
    probabilities: { hold: 48, cut: 44, hike: 8 },
    rateHistory: [
      { date: 'Jan', rate: 5.25 },
      { date: 'Feb', rate: 5.25 },
      { date: 'Mar', rate: 5.25 },
      { date: 'Apr', rate: 5.0 },
      { date: 'May', rate: 5.0 },
      { date: 'Jun', rate: 5.0 },
      { date: 'Jul', rate: 5.0 },
      { date: 'Aug', rate: 5.25 },
      { date: 'Sep', rate: 5.25 },
      { date: 'Oct', rate: 5.25 },
      { date: 'Nov', rate: 5.0 },
      { date: 'Dec', rate: 5.0 },
    ],
    recentStatement:
      'Monetary policy will need to remain restrictive for sufficiently long to return inflation to the 2% target sustainably. We will decide the appropriate degree of restriction meeting by meeting.',
    economicConditions:
      'UK GDP was flat in Q1, with recession risk elevated. Unemployment rose to 4.3% from 3.8%. Services inflation remains sticky at 5.0%, complicating the easing path. Fiscal tightening is planned for the autumn statement.',
    inflationOutlook:
      'Headline CPI at 3.2% is above target, with services inflation at 5.0% the key concern. Energy effects should help, but wage growth of 5.7% keeps services inflation sticky. Inflation is expected to reach 2% target by late 2026.',
    employmentOutlook:
      'Unemployment rose to 4.3% from 3.8%, a notable loosening. Wage growth remains elevated at 5.7% YoY. The BoE is watching wage data closely as a key driver of services inflation.',
    gdpOutlook:
      'GDP was flat in Q1, with recession risk elevated. Business investment is softening, and fiscal tightening will be a drag. Growth of just 0.5% is expected in 2025.',
    aiInterpretation:
      'The BoE is caught between two forces: sticky services inflation argues for patience, while a softening labor market and flat GDP argue for easing. AI confidence in the neutral stance is 64%, reflecting genuine ambiguity. The 50bp rate advantage over the ECB provides some GBP support, but the slow easing path caps upside. GBP is likely to remain range-bound against USD, with modest strength against EUR.',
    expectedNextDecision: 'Hold at 5.00% (Dec 19)',
    expectedCurrencyImpact: 'Neutral for GBP — range-bound as conflicting signals persist',
  },
  {
    id: 'boj',
    name: 'Bank of Japan',
    country: 'Japan',
    flag: '🇯🇵',
    rate: 0.25,
    previousRate: 0.1,
    change: 0.15,
    lastMeeting: 'Oct 31, 2025',
    nextMeeting: 'Dec 19, 2025',
    expectedDecision: 'Hold',
    marketPricing: '78% hold priced in',
    stance: 'Hawkish',
    governor: 'Kazuo Ueda',
    confidence: 76,
    inflationTrend: 'up',
    employmentTrend: 'up',
    gdpTrend: 'flat',
    policySummary:
      'The BoJ ended negative rates and raised to 0.25%, beginning a historic normalization. Ueda signaled a gradual, data-dependent path, with the pace constrained by domestic demand and yen volatility.',
    probabilities: { hold: 72, cut: 5, hike: 23 },
    rateHistory: [
      { date: 'Jan', rate: -0.1 },
      { date: 'Feb', rate: -0.1 },
      { date: 'Mar', rate: -0.1 },
      { date: 'Apr', rate: 0.0 },
      { date: 'May', rate: 0.0 },
      { date: 'Jun', rate: 0.1 },
      { date: 'Jul', rate: 0.1 },
      { date: 'Aug', rate: 0.25 },
      { date: 'Sep', rate: 0.25 },
      { date: 'Oct', rate: 0.25 },
      { date: 'Nov', rate: 0.25 },
      { date: 'Dec', rate: 0.25 },
    ],
    recentStatement:
      'If the outlook for economic activity and prices is realized, the Bank will continue to raise the policy rate. We will carefully assess the impact of financial and capital markets on economic activity and prices.',
    economicConditions:
      'Japan GDP was modestly positive, supported by a weaker yen boosting exports. The shunto wage round was the strongest in three decades, supporting consumption. However, real consumption remains sluggish.',
    inflationOutlook:
      'Core CPI (ex-fresh food) is at 2.3%, above the 2% target. The BoJ sees a virtuous cycle forming between wages and prices, but pass-through to services remains uneven. Inflation is expected to stay near target if wage gains persist.',
    employmentOutlook:
      'Unemployment is low at 2.5%, and the labor market is tight. The shunto wage round delivered 5.3% gains, the strongest in 33 years. This is the key driver of the BoJ normalization thesis.',
    gdpOutlook:
      'GDP growth is modest at 0.8% annualized. Domestic consumption is soft, but net exports benefit from yen weakness. Sustained wage growth is needed to support a virtuous cycle.',
    aiInterpretation:
      'The BoJ is the only major central bank hiking, making it uniquely hawkish in direction if not level. The 525bp rate gap with the Fed is the dominant force keeping JPY weak, but the normalization path is the key upside catalyst. AI confidence is 76%. The pace will be slow and data-dependent, but the direction is clear. JPY upside risk is concentrated in two scenarios: faster BoJ hikes or Fed cuts pulling the differential down. The primary risk is intervention, which is a tactical not structural driver.',
    expectedNextDecision: 'Hold at 0.25% (Dec 19)',
    expectedCurrencyImpact: 'Mixed for JPY — structural weakness from rate gap, upside from normalization',
  },
  {
    id: 'snb',
    name: 'Swiss National Bank',
    country: 'Switzerland',
    flag: '🇨🇭',
    rate: 1.0,
    previousRate: 1.5,
    change: -0.5,
    lastMeeting: 'Sep 26, 2025',
    nextMeeting: 'Dec 12, 2025',
    expectedDecision: 'Hold',
    marketPricing: '61% hold priced in',
    stance: 'Dovish',
    governor: 'Martin Schlegel',
    confidence: 70,
    inflationTrend: 'down',
    employmentTrend: 'flat',
    gdpTrend: 'flat',
    policySummary:
      'The SNB cut 50bp to 1.0% as inflation fell to 1.2%, well within target. Schlegel signaled room for further easing if the franc appreciates excessively, keeping a dovish bias.',
    probabilities: { hold: 54, cut: 40, hike: 6 },
    rateHistory: [
      { date: 'Jan', rate: 1.75 },
      { date: 'Feb', rate: 1.75 },
      { date: 'Mar', rate: 1.5 },
      { date: 'Apr', rate: 1.5 },
      { date: 'May', rate: 1.5 },
      { date: 'Jun', rate: 1.25 },
      { date: 'Jul', rate: 1.25 },
      { date: 'Aug', rate: 1.25 },
      { date: 'Sep', rate: 1.0 },
      { date: 'Oct', rate: 1.0 },
      { date: 'Nov', rate: 1.0 },
      { date: 'Dec', rate: 1.0 },
    ],
    recentStatement:
      'Inflation has fallen and is within the range the SNB equates with price stability. We remain willing to intervene in the foreign exchange market if necessary.',
    economicConditions:
      'Swiss inflation is low at 1.2%, well within target. GDP growth is modest at 1.4%. The franc has appreciated to a 9-year high vs EUR, drawing intervention rhetoric. Export competitiveness is a concern.',
    inflationOutlook:
      'Inflation at 1.2% is well within the 0-2% target range. Downside risks from franc appreciation and weak external demand dominate. Inflation is expected to remain low through 2026.',
    employmentOutlook:
      'Unemployment is low at 2.3%. The labor market is stable, but franc strength is a risk to export-sector employment. Wage growth is moderate.',
    gdpOutlook:
      'GDP growth is modest at 1.4% for 2025. Franc strength is a drag on exports. Domestic demand is stable but not strong enough to offset external weakness.',
    aiInterpretation:
      'The SNB is dovish, with low inflation justifying easing and intervention risk capping franc upside. AI confidence is 70%. The 450bp rate gap with the Fed is a structural CHF drag, but safe-haven flows provide a counterbalance. The net effect is a CHF that is bid on risk-off and capped on risk-on. Further cuts are likely if the franc appreciates further, which limits structural CHF upside despite the safe-haven bid.',
    expectedNextDecision: 'Hold at 1.00% (Dec 12)',
    expectedCurrencyImpact: 'Mixed for CHF — safe-haven bid vs dovish policy and intervention risk',
  },
  {
    id: 'boc',
    name: 'Bank of Canada',
    country: 'Canada',
    flag: '🇨🇦',
    rate: 4.25,
    previousRate: 4.5,
    change: -0.25,
    lastMeeting: 'Oct 23, 2025',
    nextMeeting: 'Dec 11, 2025',
    expectedDecision: 'Cut',
    marketPricing: '69% cut (25bp) priced in',
    stance: 'Dovish',
    governor: 'Tiff Macklem',
    confidence: 75,
    inflationTrend: 'down',
    employmentTrend: 'flat',
    gdpTrend: 'down',
    policySummary:
      'The BoC cut 25bp to 4.25%, 50bp below the Fed. Macklem signaled a gradual easing path as inflation approaches target and growth softens, with soft landing the base case.',
    probabilities: { hold: 31, cut: 62, hike: 7 },
    rateHistory: [
      { date: 'Jan', rate: 5.0 },
      { date: 'Feb', rate: 5.0 },
      { date: 'Mar', rate: 4.75 },
      { date: 'Apr', rate: 4.75 },
      { date: 'May', rate: 4.75 },
      { date: 'Jun', rate: 4.5 },
      { date: 'Jul', rate: 4.5 },
      { date: 'Aug', rate: 4.5 },
      { date: 'Sep', rate: 4.5 },
      { date: 'Oct', rate: 4.5 },
      { date: 'Nov', rate: 4.25 },
      { date: 'Dec', rate: 4.25 },
    ],
    recentStatement:
      'Inflation continues to ease, and excess demand in the economy has receded. We are taking our policy decisions one meeting at a time, with a focus on the balance between downward pressure on inflation and economic stability.',
    economicConditions:
      'Canadian GDP growth is sluggish at 1.1% annualized. Unemployment rose to 6.0%. Household debt-to-income is at record highs. Oil prices stabilizing above $72/bbl provide some support.',
    inflationOutlook:
      'Headline CPI at 2.1% is near target. Core measures are trending down. The BoC sees inflation sustainably at target by mid-2026, justifying gradual easing.',
    employmentOutlook:
      'Unemployment rose to 6.0% from 5.5%, a notable loosening. Job creation has slowed. The labor market slack is a key reason the BoC is easing ahead of the Fed.',
    gdpOutlook:
      'GDP growth is sluggish at 1.1% annualized. Per-capita GDP is declining due to population growth. A soft landing is the base case, but recession risk is elevated.',
    aiInterpretation:
      'The BoC is dovish, easing ahead of the Fed and creating a 50bp rate differential drag on CAD. AI confidence is 75%. The combination of near-target inflation, rising unemployment, and sluggish growth justifies the easing path. CAD is pressured by both the rate differential and softening oil prices. The primary upside catalyst for CAD would be a Fed pivot that narrows the differential, or an oil price recovery.',
    expectedNextDecision: 'Cut 25bp to 4.00% (Dec 11)',
    expectedCurrencyImpact: 'Bearish for CAD — easing ahead of Fed widens rate differential',
  },
  {
    id: 'rba',
    name: 'Reserve Bank of Australia',
    country: 'Australia',
    flag: '🇦🇺',
    rate: 4.35,
    previousRate: 4.35,
    change: 0,
    lastMeeting: 'Nov 5, 2025',
    nextMeeting: 'Dec 10, 2025',
    expectedDecision: 'Hold',
    marketPricing: '71% hold priced in',
    stance: 'Hawkish',
    governor: 'Michele Bullock',
    confidence: 68,
    inflationTrend: 'down',
    employmentTrend: 'flat',
    gdpTrend: 'flat',
    policySummary:
      'The RBA holds at 4.35%, the most hawkish major on hold. Bullock emphasized that inflation is not yet sustainably at target, pushing back on market pricing for early cuts.',
    probabilities: { hold: 71, cut: 24, hike: 5 },
    rateHistory: [
      { date: 'Jan', rate: 4.35 },
      { date: 'Feb', rate: 4.35 },
      { date: 'Mar', rate: 4.35 },
      { date: 'Apr', rate: 4.35 },
      { date: 'May', rate: 4.35 },
      { date: 'Jun', rate: 4.35 },
      { date: 'Jul', rate: 4.35 },
      { date: 'Aug', rate: 4.35 },
      { date: 'Sep', rate: 4.35 },
      { date: 'Oct', rate: 4.35 },
      { date: 'Nov', rate: 4.35 },
      { date: 'Dec', rate: 4.35 },
    ],
    recentStatement:
      'Inflation is easing but is still not sustainably at target. The Board needs to see more evidence that inflation is moving sustainably toward target before we can be confident that easing is appropriate.',
    economicConditions:
      'Australian GDP growth is modest at 1.5%. Unemployment is low at 4.1%. Iron ore prices are supported by supply discipline. Retail sales are softening at -0.3% MoM. China property weakness drags on commodity demand.',
    inflationOutlook:
      'Headline CPI at 3.6% is above target, with services inflation sticky. The RBA sees a gradual path to 2% target by end-2026. The key risk is services inflation persistence.',
    employmentOutlook:
      'Unemployment is low at 4.1%, and the labor market is tight. Wage growth is moderate at 4.0%. The RBA sees labor market balance consistent with inflation returning to target.',
    gdpOutlook:
      'GDP growth is modest at 1.5%. China demand softness is a drag on commodity exports. Domestic demand is stable. Growth is expected to pick up to 2.2% in 2026.',
    aiInterpretation:
      'The RBA is the most hawkish central bank on hold, with no cuts priced until Q1 2026. AI confidence is 68%. The 115bp rate advantage over the RBNZ provides structural AUD support, but China demand softness and retail weakness cap upside. AUD is caught between hawkish policy support and external demand drag. The net effect is a range-bound AUD with a modest bullish bias on rate differentials, vulnerable to China downside surprises.',
    expectedNextDecision: 'Hold at 4.35% (Dec 10)',
    expectedCurrencyImpact: 'Mildly bullish for AUD — most hawkish on hold, but China demand caps upside',
  },
  {
    id: 'rbnz',
    name: 'Reserve Bank of NZ',
    country: 'New Zealand',
    flag: '🇳🇿',
    rate: 4.75,
    previousRate: 5.25,
    change: -0.5,
    lastMeeting: 'Oct 9, 2025',
    nextMeeting: 'Feb 19, 2026',
    expectedDecision: 'Cut',
    marketPricing: '80% cut (50bp) priced in',
    stance: 'Dovish',
    governor: 'Adrian Orr',
    confidence: 79,
    inflationTrend: 'down',
    employmentTrend: 'up',
    gdpTrend: 'down',
    policySummary:
      'The RBNZ cut 50bp to 4.75% as the economy contracted and inflation fell. Orr signaled an aggressive easing path, with markets pricing 100bp of further cuts through 2026.',
    probabilities: { hold: 18, cut: 78, hike: 4 },
    rateHistory: [
      { date: 'Jan', rate: 5.5 },
      { date: 'Feb', rate: 5.5 },
      { date: 'Mar', rate: 5.5 },
      { date: 'Apr', rate: 5.5 },
      { date: 'May', rate: 5.25 },
      { date: 'Jun', rate: 5.25 },
      { date: 'Jul', rate: 5.25 },
      { date: 'Aug', rate: 5.25 },
      { date: 'Sep', rate: 5.25 },
      { date: 'Oct', rate: 4.75 },
      { date: 'Nov', rate: 4.75 },
      { date: 'Dec', rate: 4.75 },
    ],
    recentStatement:
      'The Committee agreed that the outlook for inflation has improved, and the restriction level of monetary policy can be eased. The pace of further easing will depend on the economic outlook.',
    economicConditions:
      'NZ GDP contracted -0.2% in Q1, a technical recession risk. Unemployment rose to 4.8%. Dairy prices (GDT) recovered 3.2%, a bright spot. Tourism is steady.',
    inflationOutlook:
      'Headline CPI at 2.5% is approaching target. Core inflation is trending down. The RBNZ sees inflation sustainably at target by mid-2026, justifying aggressive easing.',
    employmentOutlook:
      'Unemployment rose to 4.8% from 4.0%, a significant loosening. Job creation has stalled. The labor market slack is a key driver of the dovish pivot.',
    gdpOutlook:
      'GDP contracted -0.2% in Q1. Per-capita recession is already here. Recovery is pushed to H2 2026. Dairy and tourism provide some support, but domestic demand is weak.',
    aiInterpretation:
      'The RBNZ is the most dovish central bank, with an aggressive easing path and a contracting economy. AI confidence is 79%. The 40bp rate advantage over the RBA is being eroded by the faster RBNZ easing path, which is a structural drag on NZD. NZD is expected to remain the weakest commodity currency, with downside against USD and AUD. The primary upside catalyst would be a dairy price surge or a global risk-on rotation, but the policy path is the dominant driver.',
    expectedNextDecision: 'Cut 50bp to 4.25% (Feb 19)',
    expectedCurrencyImpact: 'Bearish for NZD — aggressive easing path and contracting economy',
  },
];

export const newsItems: NewsItem[] = [
  { id: '1', title: 'Fed Minutes Signal Cautious Approach to Rate Cuts', source: 'Reuters', time: '32 min ago', category: 'Monetary Policy', impact: 'high', currencies: ['USD'], summary: 'FOMC members divided on timing of first cut; majority favor data-dependent approach through Q1 2025.' },
  { id: '2', title: 'ECB Cuts Rates as Eurozone Growth Stalls', source: 'Bloomberg', time: '1 hr ago', category: 'Monetary Policy', impact: 'high', currencies: ['EUR'], summary: 'ECB delivers 50bp cut citing disinflation progress and weakening growth outlook.' },
  { id: '3', title: 'BoJ Ends Negative Rates, Yen Volatility Persists', source: 'FT', time: '2 hr ago', category: 'Monetary Policy', impact: 'high', currencies: ['JPY'], summary: 'Historic policy shift but yen remains under pressure as rate gap with US stays wide.' },
  { id: '4', title: 'US Nonfarm Payrolls Beat Estimates at 227K', source: 'WSJ', time: '3 hr ago', category: 'Employment', impact: 'high', currencies: ['USD'], summary: 'Labor market resilience complicates Fed cut timing; unemployment ticks to 4.1%.' },
  { id: '5', title: 'German Manufacturing Recession Deepens', source: 'Reuters', time: '4 hr ago', category: 'Manufacturing', impact: 'medium', currencies: ['EUR'], summary: 'PMI falls to 43.2, 18th consecutive month of contraction.' },
  { id: '6', title: 'Oil Slides as OPEC+ Considers Production Increase', source: 'Bloomberg', time: '5 hr ago', category: 'Commodities', impact: 'medium', currencies: ['CAD'], summary: 'WTI down 2.1% to $71.80; CAD pressured as oil-linked currency weakens.' },
  { id: '7', title: 'UK Services Inflation Sticky at 5.0%', source: 'FT', time: '6 hr ago', category: 'Inflation', impact: 'medium', currencies: ['GBP'], summary: 'Services component complicates BoE easing path; markets price slower cut cycle.' },
  { id: '8', title: 'Swiss Franc Hits 9-Year High vs Euro', source: 'Reuters', time: '8 hr ago', category: 'FX Markets', impact: 'low', currencies: ['CHF', 'EUR'], summary: 'Safe-haven flows and SNB balance sheet reduction drive CHF strength.' },
];

export const aiInsights: AIInsight[] = [
  { id: '1', currency: 'USD', title: 'USD Strength to Persist on Rate Differential', body: 'The USD is currently the strongest currency because interest rates remain elevated while inflation is moderating and employment remains strong. The rate advantage vs JPY and EUR supports carry trades.', sentiment: 'bullish', time: '12 min ago' },
  { id: '2', currency: 'EUR', title: 'EUR Weakness Driven by Growth, Manufacturing', body: 'The EUR remains weak due to slowing GDP growth and weaker manufacturing. With the ECB in an easing cycle and German industry in recession, downside risks dominate.', sentiment: 'bearish', time: '18 min ago' },
  { id: '3', currency: 'JPY', title: 'JPY Vulnerability Despite BoJ Shift', body: 'The JPY remains the weakest major. Even after ending negative rates, the 525bp gap with the Fed and deeply negative real yields keep carry trades attractive.', sentiment: 'bearish', time: '24 min ago' },
  { id: '4', currency: 'GBP', title: 'GBP Range-Bound on Conflicting Signals', body: 'Sticky services inflation supports the pound, but a softening labor market and flat GDP cap upside. BoE is likely to cut slowly, keeping GBP/USD in a range.', sentiment: 'neutral', time: '31 min ago' },
  { id: '5', currency: 'CHF', title: 'CHF Supported by Safe-Haven Demand', body: 'Geopolitical risk and SNB balance sheet reduction underpin the franc. Downside limited but further appreciation may draw intervention rhetoric.', sentiment: 'bullish', time: '40 min ago' },
];

export const countryRates: CountryRate[] = [
  { country: 'United States', flag: '🇺🇸', rate: 5.5, previous: 5.5, nextMeeting: 'Dec 18' },
  { country: 'Eurozone', flag: '🇪🇺', rate: 3.5, previous: 4.0, nextMeeting: 'Dec 12' },
  { country: 'United Kingdom', flag: '🇬🇧', rate: 5.0, previous: 5.25, nextMeeting: 'Dec 19' },
  { country: 'Japan', flag: '🇯🇵', rate: 0.25, previous: 0.1, nextMeeting: 'Dec 19' },
  { country: 'Switzerland', flag: '🇨🇭', rate: 1.0, previous: 1.5, nextMeeting: 'Dec 12' },
  { country: 'Canada', flag: '🇨🇦', rate: 4.25, previous: 4.5, nextMeeting: 'Dec 11' },
  { country: 'Australia', flag: '🇦🇺', rate: 4.35, previous: 4.35, nextMeeting: 'Dec 10' },
  { country: 'New Zealand', flag: '🇳🇿', rate: 4.75, previous: 5.25, nextMeeting: 'Feb 19' },
];

export function getStrongestCurrency(): Currency {
  return [...currencies].sort((a, b) => b.score - a.score)[0];
}
export function getWeakestCurrency(): Currency {
  return [...currencies].sort((a, b) => a.score - b.score)[0];
}
export function getMarketRiskLevel(): { level: string; score: number } {
  const spread = Math.max(...currencies.map((c) => c.score)) - Math.min(...currencies.map((c) => c.score));
  if (spread > 45) return { level: 'High', score: 78 };
  if (spread > 35) return { level: 'Elevated', score: 64 };
  if (spread > 25) return { level: 'Moderate', score: 48 };
  return { level: 'Low', score: 30 };
}
export function getNextHighImpactEvent(): CalendarEvent {
  return calendarEvents.filter((e) => e.impact === 'high')[0];
}

export function getHighImpactEventCountToday(): number {
  return calendarEvents.filter((e) => e.impact === 'high').length;
}

export function getAverageCurrencyStrength(): number {
  const total = currencies.reduce((sum, c) => sum + c.score, 0);
  return Math.round((total / currencies.length) * 10) / 10;
}

export function getAIMarketBias(): { bias: string; score: number; description: string } {
  const avg = getAverageCurrencyStrength();
  const spread = Math.max(...currencies.map((c) => c.score)) - Math.min(...currencies.map((c) => c.score));
  if (avg > 58 && spread > 35) return { bias: 'Risk On', score: 72, description: 'USD strength dominates; risk assets favored.' };
  if (avg < 48) return { bias: 'Risk Off', score: 28, description: 'Defensive flows into safe-haven currencies.' };
  return { bias: 'Neutral', score: 50, description: 'Mixed signals across major currencies.' };
}

export const marketSentiment: MarketSentiment = {
  mode: 'Risk On',
  score: 68,
  vix: 14.2,
  description: 'Equities bid, defensive currencies under pressure. Volatility subdued.',
};

export const currencySubScores: Record<string, CurrencySubScores> = {
  USD: { macro: 82, technical: 76, sentiment: 71 },
  EUR: { macro: 38, technical: 44, sentiment: 41 },
  GBP: { macro: 55, technical: 60, sentiment: 57 },
  JPY: { macro: 28, technical: 34, sentiment: 30 },
  CHF: { macro: 66, technical: 62, sentiment: 68 },
  CAD: { macro: 47, technical: 50, sentiment: 45 },
  AUD: { macro: 54, technical: 56, sentiment: 52 },
  NZD: { macro: 44, technical: 48, sentiment: 43 },
};

export const watchlist: WatchlistPair[] = [
  { pair: 'EUR/USD', base: 'EUR', quote: 'USD', price: 1.0842, change: -0.0031, changePct: -0.28, trend: 'down', aiBias: 'sell', confidence: 76 },
  { pair: 'GBP/USD', base: 'GBP', quote: 'USD', price: 1.2715, change: 0.0012, changePct: 0.09, trend: 'flat', aiBias: 'neutral', confidence: 54 },
  { pair: 'USD/JPY', base: 'USD', quote: 'JPY', price: 151.82, change: 0.64, changePct: 0.42, trend: 'up', aiBias: 'buy', confidence: 82 },
  { pair: 'AUD/USD', base: 'AUD', quote: 'USD', price: 0.6584, change: -0.0008, changePct: -0.12, trend: 'flat', aiBias: 'neutral', confidence: 58 },
  { pair: 'USD/CAD', base: 'USD', quote: 'CAD', price: 1.3571, change: 0.0021, changePct: 0.15, trend: 'up', aiBias: 'buy', confidence: 66 },
  { pair: 'USD/CHF', base: 'USD', quote: 'CHF', price: 0.8814, change: -0.0019, changePct: -0.21, trend: 'down', aiBias: 'sell', confidence: 65 },
  { pair: 'NZD/USD', base: 'NZD', quote: 'USD', price: 0.6012, change: -0.0024, changePct: -0.40, trend: 'down', aiBias: 'sell', confidence: 64 },
  { pair: 'EUR/JPY', base: 'EUR', quote: 'JPY', price: 164.58, change: 0.31, changePct: 0.19, trend: 'up', aiBias: 'sell', confidence: 68 },
];
