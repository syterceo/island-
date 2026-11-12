import { CloudRainIcon, CloudSunIcon, type Icon, SunIcon } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { defineLiveActivity } from '../../define';
import { useNow } from '../../hooks/useNow';
import { T } from '../../i18n';
import { COMPACT_HEIGHT } from '../../metrics';
import { tween } from '../../motion/springs';
import type { ActivityViewProps } from '../../types';
import { cx, Rise, ui } from '../../ui/kit';

type Condition = 'rain' | 'clear' | 'cloudy';

interface WeatherData {
  city: string;
  temp: number;
  condition: Condition;
  /** When the rain starts, for the `rain` condition. */
  rainAt: number;
  /** Chance of rain for the next hours, each 0 to 1. */
  hours: number[];
}

const LOOK: Record<Condition, { icon: Icon; color: string; label: string }> = {
  rain: { icon: CloudRainIcon, color: '#4cc2ff', label: 'Rain' },
  clear: { icon: SunIcon, color: '#ffd60a', label: 'Clear all day' },
  cloudy: { icon: CloudSunIcon, color: '#aab4c8', label: 'Cloudy' },
};

const degrees = (value: number) => `${value > 0 ? '+' : ''}${value}°`;

function headline(data: WeatherData, now: number): string {
  if (data.condition !== 'rain') return LOOK[data.condition].label;
  const minutes = Math.ceil((data.rainAt - now) / 60_000);
  return minutes > 0 ? `Rain in ${minutes} min` : 'Raining now';
}

function Compact({ data }: ActivityViewProps<WeatherData>) {
  const now = useNow(5000);
  const { icon: WeatherIcon, color } = LOOK[data.condition];
  return (
    <div className={ui.compact} style={{ gap: 9, padding: '0 13px 0 10px' }}>
      <WeatherIcon size={19} weight="fill" color={color} style={{ flex: 'none' }} />
      <span className={cx(ui.label, ui.grow)}>
        <T>{headline(data, now)}</T>
      </span>
      <span className={cx(ui.label, ui.num)} style={{ color: 'var(--island-fg-2)' }}>
        {degrees(data.temp)}
      </span>
    </div>
  );
}

function Minimal({ data }: ActivityViewProps<WeatherData>) {
  const { icon: WeatherIcon, color } = LOOK[data.condition];
  return (
    <div className={ui.center}>
      <WeatherIcon size={18} weight="fill" color={color} />
    </div>
  );
}

function Expanded({ data }: ActivityViewProps<WeatherData>) {
  const now = useNow(5000);
  const { icon: WeatherIcon, color } = LOOK[data.condition];
  const hour = new Date(now).getHours();
  return (
    <div className={ui.expanded} style={{ gap: 20, padding: '16px 20px 14px 20px' }}>
      <Rise i={0} className={ui.stack} style={{ gap: 5, width: 150, flex: 'none' }}>
        <span className={ui.row} style={{ gap: 10 }}>
          <WeatherIcon size={30} weight="fill" color={color} />
          <span className={cx(ui.big, ui.num)} style={{ fontSize: 30 }}>
            {degrees(data.temp)}
          </span>
        </span>
        <span className={ui.title}>
          <T>{headline(data, now)}</T>
        </span>
        <span className={ui.sub}>
          <T>{data.city}</T>
        </span>
      </Rise>
      <Rise i={1} className={ui.hours}>
        {data.hours.map((chance, index) => (
          <span key={index}>
            <motion.i
              style={{ height: 46 }}
              initial={{ scaleY: 0.05, opacity: 0.4 }}
              animate={{ scaleY: Math.max(0.08, chance), opacity: 0.35 + chance * 0.65 }}
              transition={tween(0.5, { delay: 0.14 + index * 0.04 })}
            />
            <span className={cx(ui.caption, ui.num)}>{String((hour + index) % 24).padStart(2, '0')}</span>
          </span>
        ))}
      </Rise>
    </div>
  );
}

export default defineLiveActivity<WeatherData>({
  kind: 'weather',
  title: 'Weather',
  description: 'A heads-up before the rain, with the chance of rain for the next hours.',
  icon: CloudRainIcon,
  tint: (data) => LOOK[data.condition].color,
  priority: -2,
  defaultData: () => ({
    city: 'Moscow',
    temp: 7,
    condition: 'rain',
    rainAt: Date.now() + 15 * 60_000,
    hours: [0.2, 0.85, 1, 0.7, 0.35, 0.15, 0.05],
  }),
  compact: { size: { width: 216, height: COMPACT_HEIGHT }, Component: Compact },
  minimal: Minimal,
  expanded: { size: { width: 400, height: 124, radius: 30 }, Component: Expanded },
  demo: {
    presets: [
      {
        label: 'Rain soon',
        data: () => ({
          condition: 'rain' as const,
          temp: 7,
          rainAt: Date.now() + 15 * 60_000,
          hours: [0.2, 0.85, 1, 0.7, 0.35, 0.15, 0.05],
        }),
      },
      { label: 'Clear', data: { condition: 'clear', temp: 21, hours: [0.02, 0.02, 0.05, 0.05, 0.1, 0.05, 0.02] } },
    ],
  },
});
