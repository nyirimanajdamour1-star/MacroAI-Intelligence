import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface SeriesChartProps {
  data: { date: string; score?: number; value?: number }[];
  color?: string;
  type?: 'line' | 'area';
  height?: number;
  dataKey?: string;
}

export function SeriesChart({ data, color = '#3b82f6', type = 'area', height = 220, dataKey = 'value' }: SeriesChartProps) {
  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2236" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#334155" />
          <YAxis tick={{ fontSize: 11 }} stroke="#334155" />
          <Tooltip
            contentStyle={{ backgroundColor: '#0d121d', border: '1px solid #1a2236', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#94a3b8' }}
          />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a2236" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#334155" />
        <YAxis tick={{ fontSize: 11 }} stroke="#334155" />
        <Tooltip
          contentStyle={{ backgroundColor: '#0d121d', border: '1px solid #1a2236', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#94a3b8' }}
        />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#grad-${color})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface MultiSeriesChartProps {
  data: { date: string; [key: string]: string | number }[];
  series: { key: string; color: string; name: string }[];
  height?: number;
}

export function MultiSeriesChart({ data, series, height = 260 }: MultiSeriesChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a2236" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#334155" />
        <YAxis tick={{ fontSize: 11 }} stroke="#334155" />
        <Tooltip
          contentStyle={{ backgroundColor: '#0d121d', border: '1px solid #1a2236', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#94a3b8' }}
        />
        {series.map((s) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

interface BarSeriesProps {
  data: { name: string; value: number }[];
  height?: number;
  color?: string;
}

export function BarSeries({ data, height = 260, color = '#3b82f6' }: BarSeriesProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a2236" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#334155" />
        <YAxis tick={{ fontSize: 11 }} stroke="#334155" />
        <Tooltip
          contentStyle={{ backgroundColor: '#0d121d', border: '1px solid #1a2236', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#94a3b8' }}
          cursor={{ fill: 'rgba(59,130,246,0.08)' }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.value >= 50 ? '#10b981' : d.value >= 35 ? '#f59e0b' : '#ef4444'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
