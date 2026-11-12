import { ChartLineUpIcon, TrendDownIcon, TrendUpIcon } from '@phosphor-icons/react';
import { useEffect } from 'react';
import { defineLiveActivity } from '../../define';
import { COMPACT_HEIGHT } from '../../metrics';
import { scaled } from '../../motion/springs';
import type { ActivityApi, ActivityViewProps } from '../../types';
import { cx, Rise, Swap, ui } from '../../ui/kit';

interface RateData {
  pair: string;
  /** Recent values, oldest first. The last one is current. */
  history: number[];
  /** Value at the start of the day, the base of the change. */
  open: number;
  digits: number;
}

const UP = '#30d158';
const DOWN = '#ff453a';
const POINTS = 24;

const current = (data: RateData) => data.history[data.history.length - 1];
const change = (data: RateData) => (current(data) - data.open) / data.open;
const color = (data: RateData) => (change(data) >= 0 ? UP : DOWN);
const format = (data: RateData) =>
  current(data).toLocaleString('en-US', { minimumFractionDigits: data.digits, maximumFractionDigits: data.digits });
const percent = (data: RateData) => `${change(data) >= 0 ? '+' : ''}${(change(data) * 100).toFixed(2)}%`;

function Trend({ data, size = 14 }: { data: RateData; size?: number }) {
  const up = change(data) >= 0;
  return (
    <Swap id={up ? 'up' : 'down'} dy={0} fit={false}>
      {up ? <TrendUpIcon size={size} weight="bold" color={UP} /> : <TrendDownIcon size={size} weight="bold" color={DOWN} />}
    </Swap>
  );
}

function Compact({ data }: ActivityViewProps<RateData>) {
  return (
    <div className={ui.compact} style={{ gap: 8, padding: '0 13px 0 12px' }}>
      <span className={ui.caption}>{data.pair}</span>
      <span className={cx(ui.label, ui.num)}>{format(data)}</span>
      <span className={ui.grow} />
      <Trend data={data} />
      <span className={cx(ui.label, ui.num)} style={{ width: 50, textAlign: 'right', color: color(data) }}>
        {percent(data)}
      </span>
    </div>
  );
}

function Minimal({ data }: ActivityViewProps<RateData>) {
  return (
    <div className={ui.center}>
      <Trend data={data} size={18} />
    </div>
  );
}

function Sparkline({ data }: { data: RateData }) {
  const width = 170;
  const height = 56;
  const low = Math.min(...data.history);
  const high = Math.max(...data.history);
  const span = high - low || 1;
  const points = data.history.map((value, index) => {
    const x = (index / (data.history.length - 1)) * width;
    const y = height - 4 - ((value - low) / span) * (height - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg width={width} height={height} style={{ flex: 'none', overflow: 'visible' }}>
      <polygon points={`0,${height} ${points.join(' ')} ${width},${height}`} fill={color(data)} opacity={0.12} />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color(data)}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Expanded({ data }: ActivityViewProps<RateData>) {
  return (
    <div className={ui.expanded} style={{ gap: 16, padding: '0 20px 0 22px' }}>
      <Rise i={0} className={cx(ui.stack, ui.grow)} style={{ gap: 6 }}>
        <span className={ui.caption}>{data.pair}</span>
        <span className={cx(ui.big, ui.num)} style={{ fontSize: 28 }}>
          {format(data)}
        </span>
        <span className={ui.row} style={{ gap: 6 }}>
          <Trend data={data} />
          <span className={cx(ui.label, ui.num)} style={{ color: color(data) }}>
            {percent(data)}
          </span>
        </span>
      </Rise>
      <Rise i={1}>
        <Sparkline data={data} />
      </Rise>
    </div>
  );
}

function Controller({ update }: ActivityApi<RateData>) {
  useEffect(() => {
    const timer = setInterval(() => {
      update((data) => {
        const next = current(data) * (1 + (Math.random() - 0.48) * 0.004);
        return { history: [...data.history, next].slice(-POINTS) };
      });
    }, scaled(1800));
    return () => clearInterval(timer);
  }, [update]);
  return null;
}

/** A plausible recent history that ends at `value`. */
function seed(value: number, drift: number): number[] {
  return Array.from({ length: POINTS }, (_, index) => {
    const back = POINTS - 1 - index;
    return value * (1 - drift * (back / POINTS) + Math.sin(index * 0.55) * 0.0012 + Math.sin(index * 1.9) * 0.0004);
  });
}

const pair = (name: string, value: number, drift: number, digits: number) => () => ({
  pair: name,
  history: seed(value, drift),
  open: value * (1 - drift),
  digits,
});

export default defineLiveActivity<RateData>({
  kind: 'rate',
  title: 'Exchange rate',
  description: 'A currency or coin you follow, with the change for the day.',
  icon: ChartLineUpIcon,
  tint: color,
  priority: -2,
  defaultData: pair('USD / RUB', 92.41, 0.006, 2),
  compact: { size: { width: 236, height: COMPACT_HEIGHT }, Component: Compact },
  minimal: Minimal,
  expanded: { size: { width: 380, height: 108, radius: 30 }, Component: Expanded },
  Controller,
  demo: {
    presets: [
      { label: 'USD / RUB', data: pair('USD / RUB', 92.41, 0.006, 2) },
      { label: 'BTC / USD', data: pair('BTC / USD', 67_250, -0.018, 0) },
    ],
  },
});
