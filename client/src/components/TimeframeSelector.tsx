import type { Point } from '../lib/api';

export const TIMEFRAMES = ['24H', '7D', '1M', '3M', 'YTD', '1Y', 'Max'] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];

export interface TimeframeRange {
  start: Date | null;
  end: Date;
}

export function getTimeframeRange(timeframe: Timeframe, now = new Date()): TimeframeRange {
  const end = new Date(now);
  const start = new Date(end);

  switch (timeframe) {
    case '24H': start.setTime(end.getTime() - 24 * 60 * 60 * 1000); break;
    case '7D': start.setTime(end.getTime() - 7 * 24 * 60 * 60 * 1000); break;
    case '1M': start.setTime(end.getTime() - 30 * 24 * 60 * 60 * 1000); break;
    case '3M': start.setTime(end.getTime() - 90 * 24 * 60 * 60 * 1000); break;
    case 'YTD': start.setMonth(0, 1); start.setHours(0, 0, 0, 0); break;
    case '1Y': start.setTime(end.getTime() - 365 * 24 * 60 * 60 * 1000); break;
    case 'Max': return { start: null, end };
  }

  return { start, end };
}

export function filterPointsByTimeframe(points: Point[], timeframe: Timeframe, now = new Date()): Point[] {
  const { start, end } = getTimeframeRange(timeframe, now);
  if (!start) return points;
  const startMs = start.getTime();
  const endMs = end.getTime();
  return points.filter((point) => {
    const timestamp = new Date(point.timestamp).getTime();
    return timestamp >= startMs && timestamp <= endMs;
  });
}

interface TimeframeSelectorProps {
  value: Timeframe;
  onChange: (timeframe: Timeframe) => void;
  className?: string;
}

export function TimeframeSelector({ value, onChange, className = '' }: TimeframeSelectorProps) {
  return (
    <div className={`timeframe-selector ${className}`.trim()} role="group" aria-label="Chart timeframe">
      {TIMEFRAMES.map((timeframe) => (
        <button
          key={timeframe}
          type="button"
          className={value === timeframe ? 'active' : ''}
          aria-pressed={value === timeframe}
          onClick={() => onChange(timeframe)}
        >
          {timeframe}
        </button>
      ))}
    </div>
  );
}
