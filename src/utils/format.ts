import type { Trend, Direction, Impact, Signal, TradeDirection } from '@/types';

export function trendColor(trend: Trend): string {
  return trend === 'up' ? 'text-bull-400' : trend === 'down' ? 'text-bear-400' : 'text-warn-400';
}

export function trendIcon(trend: Trend): string {
  return trend === 'up' ? '▲' : trend === 'down' ? '▼' : '▬';
}

export function directionColor(dir: Direction): string {
  return dir === 'buy' ? 'text-bull-400 bg-bull-500/10' : dir === 'sell' ? 'text-bear-400 bg-bear-500/10' : 'text-warn-400 bg-warn-500/10';
}

export function ratingColor(rating: string): string {
  if (rating.includes('Strong Buy')) return 'text-bull-400 bg-bull-500/15';
  if (rating === 'Buy') return 'text-bull-300 bg-bull-500/10';
  if (rating === 'Neutral') return 'text-warn-400 bg-warn-500/10';
  if (rating === 'Sell') return 'text-bear-300 bg-bear-500/10';
  return 'text-bear-400 bg-bear-500/15';
}

export function scoreColor(score: number): string {
  if (score >= 65) return 'text-bull-400';
  if (score >= 45) return 'text-warn-400';
  return 'text-bear-400';
}

export function scoreBg(score: number): string {
  if (score >= 65) return 'bg-bull-500';
  if (score >= 45) return 'bg-warn-500';
  return 'bg-bear-500';
}

export function impactColor(impact: Impact): string {
  return impact === 'high' ? 'bg-bear-500' : impact === 'medium' ? 'bg-warn-500' : 'bg-accent-500';
}

export function impactText(impact: Impact): string {
  return impact === 'high' ? 'text-bear-400' : impact === 'medium' ? 'text-warn-400' : 'text-accent-400';
}

export function sentimentColor(s: string): string {
  return s === 'bullish' ? 'text-bull-400' : s === 'bearish' ? 'text-bear-400' : 'text-warn-400';
}

export function sentimentBg(s: string): string {
  return s === 'bullish' ? 'bg-bull-500/10 text-bull-400' : s === 'bearish' ? 'bg-bear-500/10 text-bear-400' : 'bg-warn-500/10 text-warn-400';
}

// Heatmap color ramp: dark green -> light green -> gray -> orange -> red
export function heatmapClasses(score: number): { bg: string; border: string; text: string; label: string } {
  if (score >= 70) return { bg: 'bg-emerald-600/90', border: 'border-emerald-500', text: 'text-white', label: 'Very Strong' };
  if (score >= 58) return { bg: 'bg-emerald-500/70', border: 'border-emerald-400/60', text: 'text-white', label: 'Strong' };
  if (score >= 42) return { bg: 'bg-slate-600/60', border: 'border-slate-500/50', text: 'text-slate-100', label: 'Neutral' };
  if (score >= 32) return { bg: 'bg-orange-500/70', border: 'border-orange-400/60', text: 'text-white', label: 'Weak' };
  return { bg: 'bg-red-600/85', border: 'border-red-500', text: 'text-white', label: 'Very Weak' };
}

export function heatmapColor(score: number): string {
  if (score >= 70) return '#059669';
  if (score >= 58) return '#10b981';
  if (score >= 42) return '#475569';
  if (score >= 32) return '#f97316';
  return '#dc2626';
}

export function sentimentModeColor(mode: string): string {
  return mode === 'Risk On' ? 'text-bull-400' : mode === 'Risk Off' ? 'text-bear-400' : 'text-warn-400';
}

export function sentimentModeBg(mode: string): string {
  return mode === 'Risk On' ? 'bg-bull-500/15' : mode === 'Risk Off' ? 'bg-bear-500/15' : 'bg-warn-500/15';
}
