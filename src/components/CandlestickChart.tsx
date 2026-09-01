import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import type { Candle } from '@/types';

interface CandlestickChartProps {
  candles: Candle[];
  height?: number;
}

const axisStyle = { fontSize: 11, fill: '#475569' };
const gridStroke = '#1a2236';

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
  candles?: Candle[];
}

function ChartTooltip({ active, payload, label, candles }: TooltipProps) {
  if (!active || !payload || payload.length === 0 || !candles) return null;
  const c = candles.find((x) => x.date === label);
  if (!c) return null;
  const isUp = c.close >= c.open;
  return (
    <div className="rounded-lg border border-ink-600 bg-ink-900 px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-mono font-semibold text-slate-300">{label}</p>
      <div className="space-y-0.5 font-mono">
        <p className="text-slate-400">O: <span className="text-slate-200">{c.open.toFixed(4)}</span></p>
        <p className="text-slate-400">H: <span className="text-bull-400">{c.high.toFixed(4)}</span></p>
        <p className="text-slate-400">L: <span className="text-bear-400">{c.low.toFixed(4)}</span></p>
        <p className="text-slate-400">C: <span className={isUp ? 'text-bull-400' : 'text-bear-400'}>{c.close.toFixed(4)}</span></p>
        <p className="text-slate-400">Vol: <span className="text-slate-300">{c.volume.toLocaleString()}</span></p>
        <p className="text-slate-400">ATR: <span className="text-slate-300">{c.atr.toFixed(4)}</span></p>
      </div>
    </div>
  );
}

interface CandleShapeProps {
  x: number;
  y: number;
  width: number;
  height: number;
  low: number;
  high: number;
  open: number;
  close: number;
}

function CandlestickShape(props: CandleShapeProps) {
  const { x, width, low, high, open, close, y, height } = props;
  const isUp = close >= open;
  const color = isUp ? '#10b981' : '#ef4444';
  const bodyY = Math.min(y, y + height);
  const bodyHeight = Math.max(Math.abs(height), 1);
  const bodyWidth = Math.max(width * 0.6, 1);
  const bodyX = x + (width - bodyWidth) / 2;
  const wickX = x + width / 2;

  return (
    <g>
      <line x1={wickX} x2={wickX} y1={high} y2={low} stroke={color} strokeWidth={1} />
      <rect x={bodyX} y={bodyY} width={bodyWidth} height={bodyHeight} fill={color} fillOpacity={0.9} />
    </g>
  );
}

export function CandlestickChart({ candles, height = 320 }: CandlestickChartProps) {
  const last = candles[candles.length - 1];
  if (!last) return null;
  const support = last.support;
  const resistance = last.resistance;
  const priceDomain = [
    Math.min(...candles.map((c) => c.low)) * 0.998,
    Math.max(...candles.map((c) => c.high)) * 1.002,
  ];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={candles} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
        <XAxis dataKey="date" tick={axisStyle} stroke="#334155" minTickGap={24} />
        <YAxis domain={priceDomain} tick={axisStyle} stroke="#334155" orientation="right" width={56} tickFormatter={(v) => Number(v).toFixed(2)} />
        <Tooltip content={(props: any) => <ChartTooltip {...props} candles={candles} />} />

        <ReferenceLine y={resistance} stroke="#ef4444" strokeDasharray="5 3" strokeOpacity={0.6} label={{ value: 'R', position: 'right', fill: '#ef4444', fontSize: 10 }} />
        <ReferenceLine y={support} stroke="#10b981" strokeDasharray="5 3" strokeOpacity={0.6} label={{ value: 'S', position: 'right', fill: '#10b981', fontSize: 10 }} />

        {/* Candlesticks rendered via custom shape on the high value */}
        <Bar
          dataKey="high"
          shape={(props: unknown) => {
            const p = props as CandleShapeProps & { payload: Candle };
            return (
              <CandlestickShape
                x={p.x}
                y={p.y}
                width={p.width}
                height={p.height}
                low={p.payload.low}
                high={p.payload.high}
                open={p.payload.open}
                close={p.payload.close}
              />
            );
          }}
          isAnimationActive={false}
        />

        {/* EMA overlays */}
        <Line dataKey="ema20" stroke="#60a5fa" strokeWidth={1.5} dot={false} name="EMA 20" isAnimationActive={false} />
        <Line dataKey="ema50" stroke="#fbbf24" strokeWidth={1.5} dot={false} name="EMA 50" isAnimationActive={false} />
        <Line dataKey="ema200" stroke="#a78bfa" strokeWidth={1.5} dot={false} name="EMA 200" isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

interface VolumeChartProps {
  candles: Candle[];
  height?: number;
}

export function VolumeChart({ candles, height = 80 }: VolumeChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={candles} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
        <XAxis dataKey="date" tick={axisStyle} stroke="#334155" minTickGap={24} />
        <YAxis tick={axisStyle} stroke="#334155" orientation="right" width={56} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          contentStyle={{ backgroundColor: '#0d121d', border: '1px solid #1a2236', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#94a3b8' }}
          formatter={(v: any) => [Number(v).toLocaleString(), 'Volume']}
        />
        <Bar dataKey="volume" barSize={4}>
          {candles.map((c, i) => (
            <Cell key={i} fill={c.close >= c.open ? '#10b981' : '#ef4444'} fillOpacity={0.5} />
          ))}
        </Bar>
      </ComposedChart>
    </ResponsiveContainer>
  );
}
